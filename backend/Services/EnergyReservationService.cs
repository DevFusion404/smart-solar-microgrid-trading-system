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

    private readonly IMongoCollection<EnergyReservation> _reservations;
    private readonly IMongoCollection<EnergyBookingSlot> _slots;
    private readonly IMongoCollection<UserDetails> _users;

    public EnergyReservationService(MongoDbContext context)
    {
        _reservations = context.Reservations;
        _slots = context.Database.GetCollection<EnergyBookingSlot>("EnergyBookingSlot");
        _users = context.Users;
    }

    public async Task<EnergyReservation> CreateAsync(string username, CreateReservationDto request)
    {
        if (string.IsNullOrWhiteSpace(request.SlotId) || request.RequestedCapacity <= 0)
        {
            throw new BadRequestException("INVALID_RESERVATION", "A slot and a positive requested capacity are required.");
        }

        var user = await _users.Find(x => x.Username == username).FirstOrDefaultAsync();
        if (user is null || user.Role != UserRole.Prosumer || user.Status != AccountStatus.Active)
        {
            throw new ForbiddenException("RESERVATION_NOT_ALLOWED", "Only active prosumer accounts can reserve energy.");
        }

        var today = DateTime.UtcNow.Date;
        var lastReservableDate = today.AddDays(ReservationWindowDays - 1);
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
            & Builders<EnergyBookingSlot>.Filter.Gte(x => x.Date, today)
            & Builders<EnergyBookingSlot>.Filter.Lt(x => x.Date, lastReservableDate.AddDays(1));

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

        var reservation = new EnergyReservation
        {
            ReservationId = $"RES-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            StationId = reservedSlot.StationId,
            SlotId = reservedSlot.SlotId,
            UserId = user.Username,
            ProsumerNic = user.Nic,
            ProsumerName = user.FullName,
            SlotDate = reservedSlot.Date.Date,
            StartTime = reservedSlot.StartTime,
            EndTime = reservedSlot.EndTime,
            ReservedCapacity = requestedCapacity,
            Status = "Confirmed",
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

    public async Task<IReadOnlyList<EnergyReservation>> GetCurrentForUserAsync(string username, DateTime? date)
    {
        var today = DateTime.UtcNow.Date;
        var filter = Builders<EnergyReservation>.Filter.Eq(x => x.UserId, username)
            & Builders<EnergyReservation>.Filter.Ne(x => x.Status, "Cancelled")
            & Builders<EnergyReservation>.Filter.Gte(x => x.SlotDate, today);

        if (date.HasValue)
        {
            filter &= DateFilter(date.Value);
        }

        return await _reservations.Find(filter)
            .SortBy(x => x.SlotDate)
            .ThenBy(x => x.StartTime)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<EnergyReservation>> GetHistoryForUserAsync(string username, DateTime? date)
    {
        var today = DateTime.UtcNow.Date;
        var filter = Builders<EnergyReservation>.Filter.Eq(x => x.UserId, username)
            & Builders<EnergyReservation>.Filter.Or(
                Builders<EnergyReservation>.Filter.Lt(x => x.SlotDate, today),
                Builders<EnergyReservation>.Filter.Eq(x => x.Status, "Cancelled"),
                Builders<EnergyReservation>.Filter.Eq(x => x.Status, "Completed"));

        if (date.HasValue)
        {
            filter &= DateFilter(date.Value);
        }

        return await _reservations.Find(filter)
            .SortByDescending(x => x.SlotDate)
            .ThenByDescending(x => x.StartTime)
            .ToListAsync();
    }

    public async Task<EnergyReservation> CancelAsync(string username, string reservationId, CancelReservationDto request)
    {
        var reservation = await _reservations.FindOneAndUpdateAsync(
            Builders<EnergyReservation>.Filter.Eq(x => x.ReservationId, reservationId)
                & Builders<EnergyReservation>.Filter.Eq(x => x.UserId, username)
                & Builders<EnergyReservation>.Filter.Eq(x => x.Status, "Confirmed")
                & Builders<EnergyReservation>.Filter.Gte(x => x.SlotDate, DateTime.UtcNow.Date),
            Builders<EnergyReservation>.Update
                .Set(x => x.Status, "Cancelled")
                .Set(x => x.CancelledAt, DateTime.UtcNow)
                .Set(x => x.CancellationReason, request.Reason?.Trim()),
            new FindOneAndUpdateOptions<EnergyReservation>
            {
                ReturnDocument = ReturnDocument.After
            });

        if (reservation is null)
        {
            throw new ConflictException("RESERVATION_NOT_CANCELLABLE", "The reservation was not found, is already cancelled, or has already passed.");
        }

        var capacityRestored = await _slots.UpdateOneAsync(
            x => x.SlotId == reservation.SlotId,
            Builders<EnergyBookingSlot>.Update.Inc(x => x.AvailableCapacity, reservation.ReservedCapacity));

        if (capacityRestored.ModifiedCount == 0)
        {
            // Restore the original status so a retry is possible and capacity is never silently lost.
            await _reservations.UpdateOneAsync(
                x => x.Id == reservation.Id && x.Status == "Cancelled",
                Builders<EnergyReservation>.Update
                    .Set(x => x.Status, "Confirmed")
                    .Set(x => x.CancelledAt, null)
                    .Set(x => x.CancellationReason, null));
            throw new ConflictException("SLOT_NOT_FOUND", "The related energy slot no longer exists, so this reservation cannot be cancelled.");
        }

        return reservation;
    }

    private static FilterDefinition<EnergyReservation> DateFilter(DateTime date)
    {
        var start = date.Date;
        return Builders<EnergyReservation>.Filter.Gte(x => x.SlotDate, start)
            & Builders<EnergyReservation>.Filter.Lt(x => x.SlotDate, start.AddDays(1));
    }
}
