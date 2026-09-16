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

    // Constructor initializes MongoDB collection
    public EnergySlotService(MongoDbContext context)
    {
        _slots = context.Database
            .GetCollection<EnergyBookingSlot>("EnergyBookingSlot");
        _stations = context.Database
            .GetCollection<SolarStationInfo>("SolarStationInfo");
    }

    /// <summary>
    /// Creates a new energy booking slot after validating
    /// time range, capacity, and uniqueness.
    /// AvailableCapacity starts equal to TotalCapacity.
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

}
