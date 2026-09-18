using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Middleware;
using backend.Models;
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

    public EnergyReservationService(MongoDbContext context)
    {
        _reservations = context.Reservations;
        _slots = context.Database.GetCollection<EnergyBookingSlot>("EnergyBookingSlot");
        _stations = context.Database.GetCollection<SolarStationInfo>("SolarStationInfo");
    }

    public async Task<EnergyReservation> CreateAsync(CreateReservationDto request)
    {
        if (string.IsNullOrWhiteSpace(request.SlotId) || request.RequestedCapacity <= 0)
        {
            throw new BadRequestException("INVALID_RESERVATION", "A slot and a positive requested capacity are required.");
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

        var reservation = new EnergyReservation
        {
            ReservationId = $"RES-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            StationId = reservedSlot.StationId,
            StationName = station?.StationName ?? reservedSlot.StationId,
            SlotId = reservedSlot.SlotId,
            UserId = string.Empty,
            ProsumerNic = null,
            ProsumerName = string.Empty,
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

    public async Task<IReadOnlyList<EnergyReservation>> GetAllAsync(DateTime? date)
    {
        var filter = Builders<EnergyReservation>.Filter.Empty;

        if (date.HasValue)
        {
            filter &= DateFilter(date.Value);
        }

        return await _reservations.Find(filter)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<EnergyReservation> UpdateAsync(string reservationId, UpdateReservationDto request)
    {
        if (string.IsNullOrWhiteSpace(reservationId) || request.RequestedCapacity <= 0)
        {
            throw new BadRequestException("INVALID_RESERVATION", "A reservation id and positive requested capacity are required.");
        }

        var reservation = await _reservations.Find(EditableReservationFilter(reservationId)).FirstOrDefaultAsync();

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
            EditableReservationFilter(reservationId),
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

    public async Task DeleteAsync(string reservationId)
    {
        if (string.IsNullOrWhiteSpace(reservationId))
        {
            throw new BadRequestException("INVALID_RESERVATION", "A reservation id is required.");
        }

        var reservation = await _reservations.FindOneAndDeleteAsync(EditableReservationFilter(reservationId));
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

    private static FilterDefinition<EnergyReservation> EditableReservationFilter(string reservationId) =>
        Builders<EnergyReservation>.Filter.Eq(x => x.ReservationId, reservationId)
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
