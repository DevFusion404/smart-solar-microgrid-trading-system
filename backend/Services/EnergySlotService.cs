/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : EnergySlotService.cs
Description   : Handles business logic and MongoDB
                operations related to energy booking slots
Author        : Sithmaka
=====================================================
*/


using backend.Data;
using backend.Interfaces;
using backend.Models;

using MongoDB.Bson;
using MongoDB.Driver;

namespace backend.Services;

public class EnergySlotService : IEnergySlotService
{
    private readonly IMongoCollection<EnergyBookingSlot> _slots;
    private readonly IMongoCollection<SolarStationInfo> _stations;
    private readonly IMongoCollection<EnergyReservation> _reservations;

    // Constructor initializes MongoDB collection
    public EnergySlotService(MongoDbContext context)
    {
        _slots = context.Database
            .GetCollection<EnergyBookingSlot>("EnergyBookingSlot");
        _stations = context.Database
            .GetCollection<SolarStationInfo>("SolarStationInfo");
        _reservations = context.Reservations;
    }

    /// <summary>
    /// Creates a new energy booking slot after validating
    /// time range, capacity, and uniqueness.
    /// AvailableCapacity starts equal to TotalCapacity.
    /// </summary>
    public async Task<EnergyBookingSlot> CreateSlot(
        EnergyBookingSlot slot)
    {
        // Normalize slot.Date to UTC midnight preserving calendar year, month, and day
        slot.Date = new DateTime(slot.Date.Year, slot.Date.Month, slot.Date.Day, 0, 0, 0, DateTimeKind.Utc);

        // Validate that start time is before end time
        if(slot.StartTime >= slot.EndTime)
        {
            throw new Exception(
                "Start time must be before end time");
        }

        // Validate total capacity is a positive value
        if(slot.TotalCapacity <= 0)
        {
            throw new Exception(
                "Total capacity must be greater than zero");
        }

        // Rule: totalCapacity is set once, availableCapacity starts equal to it
        if(slot.AvailableCapacity <= 0)
        {
            slot.AvailableCapacity = slot.TotalCapacity;
        }
        else if(slot.AvailableCapacity > slot.TotalCapacity)
        {
            throw new Exception(
                "Available capacity cannot exceed total capacity");
        }

        // Validate that the station exists and is active
        if(_stations != null)
        {
            var station = await _stations
                .Find(x => x.StationId == slot.StationId)
                .FirstOrDefaultAsync();

            if(station == null && ObjectId.TryParse(slot.StationId, out _))
            {
                station = await _stations
                    .Find(x => x.Id == slot.StationId)
                    .FirstOrDefaultAsync();
            }

            if(station == null)
            {
                throw new Exception("Station not found");
            }

            if(station.Status == "Deactivated")
            {
                throw new Exception("Cannot create slots for a deactivated station");
            }

            // Standardize StationId to business StationId
            if(!string.IsNullOrEmpty(station.StationId))
            {
                slot.StationId = station.StationId;
            }
        }

        // Prevent duplicate slot identifiers
        var existingSlot =
            await _slots
            .Find(x => x.SlotId == slot.SlotId)
            .FirstOrDefaultAsync();

        if(existingSlot != null)
        {
            throw new Exception(
                "A slot with this SlotId already exists");
        }

        // Default status for newly created slot
        if(string.IsNullOrEmpty(slot.Status))
        {
            slot.Status = "Available";
        }

        await _slots.InsertOneAsync(slot);
        return slot;

    }

    /// <summary>
    /// Retrieves all slots for a station, optionally
    /// filtered to a specific date.
    /// </summary>
    public async Task<List<EnergyBookingSlot>> GetSlotsByStation(
        string stationId,
        DateTime? date)
    {
        string resolvedStationId = stationId;
        if(_stations != null && ObjectId.TryParse(stationId, out _))
        {
            var stn = await _stations.Find(x => x.Id == stationId).FirstOrDefaultAsync();
            if(stn != null && !string.IsNullOrEmpty(stn.StationId))
            {
                resolvedStationId = stn.StationId;
            }
        }

        // Build filter supporting both business stationId and document ObjectId
        var filter =
            Builders<EnergyBookingSlot>.Filter.Or(
                Builders<EnergyBookingSlot>.Filter.Eq(x => x.StationId, resolvedStationId),
                Builders<EnergyBookingSlot>.Filter.Eq(x => x.StationId, stationId)
            );

        // Narrow to the requested calendar date if provided
        if(date.HasValue)
        {
            var targetDate = new DateTime(date.Value.Year, date.Value.Month, date.Value.Day, 0, 0, 0, DateTimeKind.Utc);

            filter = filter &
                Builders<EnergyBookingSlot>.Filter.Gte(
                    x => x.Date, targetDate) &
                Builders<EnergyBookingSlot>.Filter.Lt(
                    x => x.Date, targetDate.AddDays(1));
        }

        return await _slots
            .Find(filter)
            .ToListAsync();

    }

    /// <summary>
    /// Retrieves a single energy slot using its MongoDB document id or business SlotId.
    /// </summary>
    public async Task<EnergyBookingSlot?> GetSlotById(string id)
    {
        var slot = await _slots
            .Find(x => x.SlotId == id)
            .FirstOrDefaultAsync();

        if(slot == null && ObjectId.TryParse(id, out _))
        {
            slot = await _slots
                .Find(x => x.Id == id)
                .FirstOrDefaultAsync();
        }

        return slot;
    }

    /// <summary>
    /// Replaces all editable fields of an existing slot.
    /// </summary>
    public async Task<bool> UpdateSlot(
        string id,
        EnergyBookingSlot slot)
    {
        // Validate time range before saving
        if(slot.StartTime >= slot.EndTime)
        {
            throw new Exception(
                "Start time must be before end time");
        }

        // Validate capacity values before saving
        if(slot.TotalCapacity <= 0)
        {
            throw new Exception(
                "Total capacity must be greater than zero");
        }

        if(slot.AvailableCapacity > slot.TotalCapacity)
        {
            throw new Exception(
                "Available capacity cannot exceed total capacity");
        }

        var existing = await GetSlotById(id);
        if(existing == null)
        {
            return false;
        }

        // Validate that status can only be Available or Closed
        if (!string.IsNullOrEmpty(slot.Status) &&
            !string.Equals(slot.Status, "Available", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(slot.Status, "Closed", StringComparison.OrdinalIgnoreCase))
        {
            throw new Exception("Invalid status. Energy slot status can only be 'Available' or 'Closed'.");
        }

        // If status is being changed to Closed, ensure no reservations exist
        if (string.Equals(slot.Status, "Closed", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(existing.Status, "Closed", StringComparison.OrdinalIgnoreCase))
        {
            await EnsureNoActiveReservations(existing);
        }

        // Normalize slot.Date to UTC midnight preserving calendar year, month, and day
        slot.Date = new DateTime(slot.Date.Year, slot.Date.Month, slot.Date.Day, 0, 0, 0, DateTimeKind.Utc);
        slot.Id = existing.Id;

        var result =
            await _slots.ReplaceOneAsync(
                x => x.Id == existing.Id,
                slot);

        return result.ModifiedCount > 0;

    }

    /// <summary>
    /// Adjusts only the available capacity of a slot.
    /// Called by the booking service when a reservation is placed.
    /// Supports lookup by MongoDB document Id or business SlotId.
    /// </summary>
    public async Task<bool> AdjustCapacity(
        string id,
        double availableCapacity)
    {
        // Capacity cannot go below zero
        if(availableCapacity < 0)
        {
            throw new Exception(
                "Available capacity cannot be negative");
        }

        // Support lookup by business SlotId or MongoDB Id
        var slot = await _slots
            .Find(x => x.SlotId == id)
            .FirstOrDefaultAsync();

        if(slot == null && ObjectId.TryParse(id, out _))
        {
            slot = await _slots
                .Find(x => x.Id == id)
                .FirstOrDefaultAsync();
        }

        if(slot == null)
        {
            return false;
        }

        // Available capacity cannot exceed total capacity
        if(availableCapacity > slot.TotalCapacity)
        {
            throw new Exception(
                "Available capacity cannot exceed total capacity");
        }

        var update =
            Builders<EnergyBookingSlot>.Update
            .Set(x => x.AvailableCapacity, availableCapacity);

        var result =
            await _slots.UpdateOneAsync(
                x => x.Id == slot.Id,
                update);

        return result.ModifiedCount > 0;

    }

    /// <summary>
    /// Ensures that no energy has been reserved for the given slot.
    /// Throws an exception if booked capacity > 0 or if active reservations exist.
    /// </summary>
    private async Task EnsureNoActiveReservations(EnergyBookingSlot slot)
    {
        // 1. Check if capacity has been consumed (reserved energy > 0)
        if (slot.TotalCapacity - slot.AvailableCapacity > 0.001)
        {
            throw new Exception("Cannot proceed: User has reserved energy for this slot.");
        }

        // 2. Check if active reservations exist in MongoDB Reservations collection
        if (_reservations != null)
        {
            var idCandidates = new List<string>();
            if (!string.IsNullOrEmpty(slot.SlotId))
            {
                idCandidates.Add(slot.SlotId);
            }
            if (!string.IsNullOrEmpty(slot.Id))
            {
                idCandidates.Add(slot.Id);
            }

            var resFilter = Builders<EnergyReservation>.Filter.In(x => x.SlotId, idCandidates);
            var activeStatuses = new[] { "Confirmed", "Approved", "Pending" };
            var activeFilter = resFilter & Builders<EnergyReservation>.Filter.In(x => x.Status, activeStatuses);

            var hasActive = await _reservations.Find(activeFilter).AnyAsync();
            if (hasActive)
            {
                throw new Exception("Cannot proceed: User has reserved energy for this slot.");
            }
        }
    }

    /// <summary>
    /// Closes an energy booking slot if no energy has been reserved.
    /// </summary>
    public async Task<bool> CloseSlot(string id)
    {
        var slot = await GetSlotById(id);
        if (slot == null)
        {
            throw new Exception("Slot not found");
        }

        if (string.Equals(slot.Status, "Closed", StringComparison.OrdinalIgnoreCase))
        {
            return true; // Already closed
        }

        // Validate that no energy has been reserved
        await EnsureNoActiveReservations(slot);

        var update = Builders<EnergyBookingSlot>.Update
            .Set(x => x.Status, "Closed");

        var result = await _slots.UpdateOneAsync(x => x.Id == slot.Id, update);
        return result.ModifiedCount > 0;
    }

    /// <summary>
    /// Permanently deletes an energy booking slot.
    /// Only slots with status 'Closed' and no reserved energy can be deleted.
    /// </summary>
    public async Task<bool> DeleteSlot(string id)
    {
        var slot = await GetSlotById(id);
        if (slot == null)
        {
            throw new Exception("Slot not found");
        }

        // Rule 1: Only closed slots can be deleted
        if (!string.Equals(slot.Status, "Closed", StringComparison.OrdinalIgnoreCase))
        {
            throw new Exception("Only closed slots can be deleted. Please close the slot first.");
        }

        // Rule 2: Cannot delete if energy has been reserved
        await EnsureNoActiveReservations(slot);

        var result = await _slots.DeleteOneAsync(x => x.Id == slot.Id);
        return result.DeletedCount > 0;
    }

}
