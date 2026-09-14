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

using MongoDB.Driver;

namespace backend.Services;

public class EnergySlotService : IEnergySlotService
{
    private readonly IMongoCollection<EnergyBookingSlot> _slots;

    // Constructor initializes MongoDB collection
    public EnergySlotService(MongoDbContext context)
    {
        _slots = context.Database
            .GetCollection<EnergyBookingSlot>("EnergyBookingSlot");
    }

    /// <summary>
    /// Creates a new energy booking slot after validating
    /// time range, capacity, and uniqueness.
    /// </summary>
    public async Task<EnergyBookingSlot> CreateSlot(
        EnergyBookingSlot slot)
    {
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

        // Available capacity cannot exceed the total capacity
        if(slot.AvailableCapacity > slot.TotalCapacity)
        {
            throw new Exception(
                "Available capacity cannot exceed total capacity");
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
        // Build filter starting from station match
        var filter =
            Builders<EnergyBookingSlot>.Filter.Eq(
                x => x.StationId, stationId);

        // Narrow to the requested calendar date if provided
        if(date.HasValue)
        {
            var targetDate = date.Value.Date;

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
    /// Retrieves a single energy slot using its MongoDB document id.
    /// </summary>
    public async Task<EnergyBookingSlot?> GetSlotById(string id)
    {
        return await _slots
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();
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

        var result =
            await _slots.ReplaceOneAsync(
                x => x.Id == id,
                slot);

        return result.ModifiedCount > 0;

    }

    /// <summary>
    /// Adjusts only the available capacity of a slot.
    /// Called by the booking service when a reservation is placed.
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

        var update =
            Builders<EnergyBookingSlot>.Update
            .Set(x => x.AvailableCapacity, availableCapacity);

        var result =
            await _slots.UpdateOneAsync(
                x => x.Id == id,
                update);

        return result.ModifiedCount > 0;

    }

}
