using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Middleware;
using backend.Models;
using backend.Repositories;
using MongoDB.Bson;
using MongoDB.Driver;

namespace backend.Services;

/// <summary>
/// Coordinates reservation records with slot capacity changes.
/// </summary>
public class EnergyReservationService : IEnergyReservationService
{
    private const int ReservationWindowDays = 7;
    private static readonly TimeZoneInfo ReservationTimeZone = GetReservationTimeZone();

    private readonly IMongoCollection<EnergyReservation> _reservations;
    private readonly IMongoCollection<EnergyBookingSlot> _slots;
    private readonly IMongoCollection<SolarStationInfo> _stations;
    private readonly IUserRepository _userRepository;

    public EnergyReservationService(MongoDbContext context, IUserRepository userRepository)
    {
        _reservations = context.Reservations;
        _slots = context.Database.GetCollection<EnergyBookingSlot>("EnergyBookingSlot");
        _stations = context.Database.GetCollection<SolarStationInfo>("SolarStationInfo");
        _userRepository = userRepository;
    }

    public async Task<EnergyReservation> CreateAsync(string userId, CreateReservationDto request)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(request.SlotId) || request.RequestedCapacity <= 0)
        {
            throw new BadRequestException("INVALID_RESERVATION", "A user, slot, and positive requested capacity are required.");
        }

        // Slot dates are calendar dates in Sri Lanka. Their UTC storage value can be the
        // previous evening, so the reservation window must use Sri Lanka day boundaries.
        var reservationWindowStart = GetReservationDayStartUtc();
        var reservationWindowEnd = reservationWindowStart.AddDays(ReservationWindowDays);
        var requestedCapacity = Math.Round(request.RequestedCapacity, 2, MidpointRounding.AwayFromZero);

        var idFilter = Builders<EnergyBookingSlot>.Filter.Eq(x => x.SlotId, request.SlotId);
        if (ObjectId.TryParse(request.SlotId, out _))
        {
            idFilter |= Builders<EnergyBookingSlot>.Filter.Eq(x => x.Id, request.SlotId);
        }

        // This conditional decrement is atomic. Concurrent bookings cannot consume more than is available.
        var reservableSlotFilter = idFilter
            & Builders<EnergyBookingSlot>.Filter.Eq(x => x.Status, "Available")
            & Builders<EnergyBookingSlot>.Filter.Gte(x => x.AvailableCapacity, requestedCapacity)
            & Builders<EnergyBookingSlot>.Filter.Gte(x => x.Date, reservationWindowStart)
            & Builders<EnergyBookingSlot>.Filter.Lt(x => x.Date, reservationWindowEnd);

        var reservedSlot = await _slots.FindOneAndUpdateAsync(
            reservableSlotFilter,
            Builders<EnergyBookingSlot>.Update.Inc(x => x.AvailableCapacity, -requestedCapacity),
            new FindOneAndUpdateOptions<EnergyBookingSlot>
            {
                ReturnDocument = ReturnDocument.Before
            });

        if (reservedSlot is null)
        {
            throw new ConflictException(
                "SLOT_UNAVAILABLE",
                "This slot is unavailable, outside the seven-day reservation window, or no longer has enough capacity.");
        }

        var station = await _stations
            .Find(x => x.StationId == reservedSlot.StationId)
            .FirstOrDefaultAsync();
        var prosumer = await _userRepository.GetByUsernameAsync(userId);

        var reservation = new EnergyReservation
        {
            ReservationId = $"RES-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            StationId = reservedSlot.StationId,
            StationName = station?.StationName ?? reservedSlot.StationId,
            SlotId = reservedSlot.SlotId,
            UserId = userId,
            ProsumerNic = prosumer?.Nic,
            ProsumerName = prosumer?.FullName ?? userId,
            SlotDate = reservedSlot.Date,
            StartTime = reservedSlot.StartTime,
            EndTime = reservedSlot.EndTime,
            ReservedCapacity = requestedCapacity,
            Status = "Reviewing",
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            await _reservations.InsertOneAsync(reservation);
            return reservation;
        }
        catch
        {
            // Keep capacity consistent if MongoDB rejects the reservation record.
            await _slots.UpdateOneAsync(
                x => x.Id == reservedSlot.Id,
                Builders<EnergyBookingSlot>.Update.Inc(x => x.AvailableCapacity, requestedCapacity));
            throw;
        }
    }

    public async Task<IReadOnlyList<EnergyReservation>> GetAllAsync(string userId, DateTime? date)
    {
        var filter = Builders<EnergyReservation>.Filter.Eq(x => x.UserId, userId);

        if (date.HasValue)
        {
            filter &= DateFilter(date.Value);
        }

        return await _reservations.Find(filter)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<EnergyReservation>> GetHistoryAsync(string userId, DateTime? date)
    {
        // A history record belongs to a completed calendar day in Sri Lanka.
        // The optional date is applied after this boundary so future bookings
        // cannot appear in the history screen.
        var todayStart = GetReservationDayStartUtc();
        var filter = Builders<EnergyReservation>.Filter.Eq(x => x.UserId, userId)
            & Builders<EnergyReservation>.Filter.Lt(x => x.SlotDate, todayStart);

        if (date.HasValue)
        {
            filter &= DateFilter(date.Value);
        }

        return await _reservations.Find(filter)
            .SortByDescending(x => x.SlotDate)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<EnergyReservation> UpdateAsync(string userId, string reservationId, UpdateReservationDto request)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(reservationId) || request.RequestedCapacity <= 0)
        {
            throw new BadRequestException("INVALID_RESERVATION", "A user, reservation id, and positive requested capacity are required.");
        }

        var reservation = await _reservations.Find(EditableReservationFilter(userId, reservationId)).FirstOrDefaultAsync();

        if (reservation is null)
        {
            throw new ConflictException("RESERVATION_NOT_EDITABLE", "The reservation was not found or its 12-hour update period has ended.");
        }

        var requestedCapacity = Math.Round(request.RequestedCapacity, 2, MidpointRounding.AwayFromZero);
        var capacityDifference = requestedCapacity - reservation.ReservedCapacity;
        if (capacityDifference == 0)
        {
            return reservation;
        }

        var slotFilter = SlotIdFilter(reservation.SlotId);
        if (capacityDifference > 0)
        {
            slotFilter &= Builders<EnergyBookingSlot>.Filter.Gte(x => x.AvailableCapacity, capacityDifference);
        }

        var capacityUpdated = await _slots.UpdateOneAsync(
            slotFilter,
            Builders<EnergyBookingSlot>.Update.Inc(x => x.AvailableCapacity, -capacityDifference));

        if (capacityUpdated.ModifiedCount == 0)
        {
            throw new ConflictException("SLOT_UNAVAILABLE", "The slot no longer has enough available capacity for this update.");
        }

        var updatedReservation = await _reservations.FindOneAndUpdateAsync(
            EditableReservationFilter(userId, reservationId),
            Builders<EnergyReservation>.Update.Set(x => x.ReservedCapacity, requestedCapacity),
            new FindOneAndUpdateOptions<EnergyReservation> { ReturnDocument = ReturnDocument.After });

        if (updatedReservation is not null)
        {
            return updatedReservation;
        }

        await _slots.UpdateOneAsync(
            SlotIdFilter(reservation.SlotId),
            Builders<EnergyBookingSlot>.Update.Inc(x => x.AvailableCapacity, capacityDifference));
        throw new ConflictException("RESERVATION_NOT_EDITABLE", "The reservation was changed before the update could be completed.");
    }

    public async Task DeleteAsync(string userId, string reservationId)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(reservationId))
        {
            throw new BadRequestException("INVALID_RESERVATION", "A user and reservation id are required.");
        }

        var reservation = await _reservations.FindOneAndDeleteAsync(EditableReservationFilter(userId, reservationId));
        if (reservation is null)
        {
            throw new ConflictException("RESERVATION_NOT_EDITABLE", "The reservation was not found or its 12-hour delete period has ended.");
        }

        var capacityRestored = await _slots.UpdateOneAsync(
            SlotIdFilter(reservation.SlotId),
            Builders<EnergyBookingSlot>.Update.Inc(x => x.AvailableCapacity, reservation.ReservedCapacity));

        if (capacityRestored.ModifiedCount > 0)
        {
            return;
        }

        await _reservations.InsertOneAsync(reservation);
        throw new ConflictException("SLOT_NOT_FOUND", "The related energy slot no longer exists, so this reservation was not deleted.");
    }

    public async Task<IReadOnlyList<EnergyReservation>> GetAllForBackofficeAsync()
    {
        return await _reservations.Find(Builders<EnergyReservation>.Filter.Empty)
            .SortByDescending(x => x.SlotDate)
            .ThenByDescending(x => x.StartTime)
            .ToListAsync();
    }

    public async Task<EnergyReservation> UpdateStatusForBackofficeAsync(
        string reservationId,
        UpdateReservationStatusDto request)
    {
        if (string.IsNullOrWhiteSpace(reservationId) || string.IsNullOrWhiteSpace(request.Status))
        {
            throw new BadRequestException("INVALID_RESERVATION_STATUS", "A reservation id and status are required.");
        }

        var status = NormalizeBackofficeStatus(request.Status);
        var reservation = await _reservations
            .Find(Builders<EnergyReservation>.Filter.Eq(x => x.ReservationId, reservationId))
            .FirstOrDefaultAsync();

        if (reservation is null)
        {
            throw new NotFoundException("RESERVATION_NOT_FOUND", "The reservation was not found.");
        }

        if (reservation.Status.Equals(status, StringComparison.OrdinalIgnoreCase))
        {
            return reservation;
        }

        if (reservation.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictException("RESERVATION_CANCELLED", "A cancelled reservation cannot be moved to another status.");
        }

        if (status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            var restoredCapacity = await _slots.UpdateOneAsync(
                SlotIdFilter(reservation.SlotId),
                Builders<EnergyBookingSlot>.Update.Inc(x => x.AvailableCapacity, reservation.ReservedCapacity));

            if (restoredCapacity.ModifiedCount == 0)
            {
                throw new ConflictException("SLOT_NOT_FOUND", "The related energy slot no longer exists, so this reservation cannot be cancelled.");
            }

            var cancelledReservation = await _reservations.FindOneAndUpdateAsync(
                Builders<EnergyReservation>.Filter.Eq(x => x.ReservationId, reservationId)
                    & Builders<EnergyReservation>.Filter.Ne(x => x.Status, "Cancelled"),
                Builders<EnergyReservation>.Update
                    .Set(x => x.Status, "Cancelled")
                    .Set(x => x.CancelledAt, DateTime.UtcNow),
                new FindOneAndUpdateOptions<EnergyReservation> { ReturnDocument = ReturnDocument.After });

            if (cancelledReservation is not null)
            {
                return cancelledReservation;
            }

            await _slots.UpdateOneAsync(
                SlotIdFilter(reservation.SlotId),
                Builders<EnergyBookingSlot>.Update.Inc(x => x.AvailableCapacity, -reservation.ReservedCapacity));
            throw new ConflictException("RESERVATION_STATUS_CHANGED", "The reservation status changed before cancellation could be completed.");
        }

        return await _reservations.FindOneAndUpdateAsync(
                   Builders<EnergyReservation>.Filter.Eq(x => x.ReservationId, reservationId)
                       & Builders<EnergyReservation>.Filter.Ne(x => x.Status, "Cancelled"),
                   Builders<EnergyReservation>.Update
                       .Set(x => x.Status, status)
                       .Set(x => x.CancelledAt, null),
                   new FindOneAndUpdateOptions<EnergyReservation> { ReturnDocument = ReturnDocument.After })
               ?? throw new ConflictException("RESERVATION_STATUS_CHANGED", "The reservation status changed before the update could be completed.");
    }

    private static FilterDefinition<EnergyReservation> EditableReservationFilter(string userId, string reservationId) =>
        Builders<EnergyReservation>.Filter.Eq(x => x.ReservationId, reservationId)
        & Builders<EnergyReservation>.Filter.Eq(x => x.UserId, userId)
        & Builders<EnergyReservation>.Filter.Eq(x => x.Status, "Confirmed")
        & Builders<EnergyReservation>.Filter.Gte(x => x.CreatedAt, DateTime.UtcNow.AddHours(-12));

    private static FilterDefinition<EnergyBookingSlot> SlotIdFilter(string slotId)
    {
        var filter = Builders<EnergyBookingSlot>.Filter.Eq(x => x.SlotId, slotId);
        if (ObjectId.TryParse(slotId, out _))
        {
            filter |= Builders<EnergyBookingSlot>.Filter.Eq(x => x.Id, slotId);
        }

        return filter;
    }

    private static string NormalizeBackofficeStatus(string value)
    {
        var allowedStatuses = new[] { "Reviewing", "Pending", "Approved", "Completed", "Cancelled" };
        var status = allowedStatuses.FirstOrDefault(candidate =>
            candidate.Equals(value.Trim(), StringComparison.OrdinalIgnoreCase));

        return status ?? throw new BadRequestException(
            "INVALID_RESERVATION_STATUS",
            "Status must be Reviewing, Pending, Approved, Completed, or Cancelled.");
    }

    private static FilterDefinition<EnergyReservation> DateFilter(DateTime date)
    {
        var start = GetReservationDayStartUtc(date);
        return Builders<EnergyReservation>.Filter.Gte(x => x.SlotDate, start)
            & Builders<EnergyReservation>.Filter.Lt(x => x.SlotDate, start.AddDays(1));
    }

    private static DateTime GetReservationDayStartUtc(DateTime? date = null)
    {
        var localDate = date?.Date
            ?? TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ReservationTimeZone).Date;
        var localMidnight = DateTime.SpecifyKind(localDate, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(localMidnight, ReservationTimeZone);
    }

    private static TimeZoneInfo GetReservationTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Sri Lanka Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Colombo");
        }
    }
}
