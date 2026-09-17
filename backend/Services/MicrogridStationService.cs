/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : MicrogridStationService.cs
Description   : Handles business logic and MongoDB
                operations related to solar stations
Author        : Sithmaka
=====================================================
*/


using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;

using MongoDB.Bson;
using MongoDB.Driver;

namespace backend.Services;
public class MicrogridStationService : IMicrogridStationService
{
    private readonly IMongoCollection<SolarStationInfo> _stations;
    private readonly IMongoCollection<EnergyBookingSlot> _slots;
    private readonly IMongoCollection<BsonDocument> _reservations;

    // Constructor initializes MongoDB collections
    public MicrogridStationService(MongoDbContext context)
    {

        _stations = context.Database
            .GetCollection<SolarStationInfo>("SolarStationInfo");

        _slots = context.Database
            .GetCollection<EnergyBookingSlot>("EnergyBookingSlot");

        _reservations = context.Database
            .GetCollection<BsonDocument>("EnergyReservations");

    }

    // Retrieves all active and inactive microgrid stations
    public async Task<List<SolarStationInfo>> GetAllStations()
    {
        return await _stations
            .Find(_ => true)
            .ToListAsync();
    }

    // Retrieves a single microgrid station using MongoDB ID or StationId
    public async Task<SolarStationInfo?> GetStationById(string id)
    {
        var station = await _stations
            .Find(x => x.StationId == id)
            .FirstOrDefaultAsync();

        if(station == null && ObjectId.TryParse(id, out _))
        {
            station = await _stations
                .Find(x => x.Id == id)
                .FirstOrDefaultAsync();
        }

        return station;
    }




    // Creates a new microgrid station after validating data
    public async Task<SolarStationInfo> CreateStation(
        SolarStationInfo station)
    {
        // Validate station name
        if(string.IsNullOrWhiteSpace(station.StationName))
        {
            throw new Exception(
                "Station name is required");
        }

        // Validate GPS latitude
        if(station.Latitude < -90 ||
           station.Latitude > 90)
        {
            throw new Exception(
                "Invalid latitude value");
        }

        // Validate GPS longitude
        if(station.Longitude < -180 ||
           station.Longitude > 180)
        {
            throw new Exception(
                "Invalid longitude value");
        }

        // Validate energy capacity
        if(station.EnergyCapacity <= 0)
        {
            throw new Exception(
                "Energy capacity must be greater than zero");
        }

        // Prevent duplicate station creation
        var existingStation =
            await _stations
            .Find(x =>
                x.StationId == station.StationId)
            .FirstOrDefaultAsync();

        if(existingStation != null)
        {
            throw new Exception(
                "Station already exists");
        }

        // Default status for newly created station
        if(string.IsNullOrEmpty(station.Status))
        {
            station.Status = "Active";
        }

        await _stations.InsertOneAsync(station);
        return station;

    }

    // Updates existing microgrid station information
    public async Task<bool> UpdateStation(
        string id,
        SolarStationInfo station)
    {
        // Validate GPS values before update
        if(station.Latitude < -90 ||
           station.Latitude > 90)
        {
            throw new Exception(
                "Invalid latitude value");
        }

        if(station.Longitude < -180 ||
           station.Longitude > 180)
        {
            throw new Exception(
                "Invalid longitude value");
        }

        var existing = await GetStationById(id);
        if(existing == null)
        {
            return false;
        }

        station.Id = existing.Id;

        var result =
            await _stations.ReplaceOneAsync(
                x => x.Id == existing.Id,
                station);
        return result.ModifiedCount > 0;

    }

    // Updates only the operational schedule of a station
    public async Task<bool> UpdateSchedule(
        string id,
        string schedule)
    {
        if(string.IsNullOrWhiteSpace(schedule))
        {
            throw new Exception(
                "Operational schedule is required");
        }

        var existing = await GetStationById(id);
        if(existing == null)
        {
            return false;
        }

        var update =
            Builders<SolarStationInfo>.Update
            .Set(x => x.OperationalSchedule, schedule);

        var result =
            await _stations.UpdateOneAsync(
                x => x.Id == existing.Id,
                update);

        return result.ModifiedCount > 0;

    }

    // Deactivates a microgrid station.
    // Blocked if there are any Available booking slots or active reservations linked to it.
    public async Task<bool> DeactivateStation(string id)
    {
        // Retrieve the station by StationId or ObjectId
        var station =
            await _stations
            .Find(x => x.StationId == id)
            .FirstOrDefaultAsync();

        if(station == null && ObjectId.TryParse(id, out _))
        {
            station =
                await _stations
                .Find(x => x.Id == id)
                .FirstOrDefaultAsync();
        }

        if(station == null)
        {
            throw new Exception("Station not found");
        }

        // Block deactivation if active booking slots exist
        var activeSlotCount =
            await _slots
            .CountDocumentsAsync(x =>
                x.StationId == station.StationId &&
                x.Status == "Available");

        if(activeSlotCount > 0)
        {
            throw new Exception(
                "Cannot deactivate station: " +
                $"{activeSlotCount} active booking slot(s) still exist");
        }

        // Block deactivation if active reservations exist in EnergyReservations collection
        if(_reservations != null)
        {
            // Find all slots belonging to this station
            var stationSlots = await _slots
                .Find(x => x.StationId == station.StationId)
                .ToListAsync();

            var slotIds = stationSlots.Select(x => x.SlotId).ToList();

            var activeReservationStatuses = new[] { "Pending", "Approved", "Confirmed", "Active" };

            var filterBuilder = Builders<BsonDocument>.Filter;
            var stationOrSlotFilter = filterBuilder.Or(
                filterBuilder.Eq("StationId", station.StationId),
                filterBuilder.In("SlotId", slotIds)
            );
            var statusFilter = filterBuilder.In("Status", activeReservationStatuses);

            var activeReservationCount = await _reservations.CountDocumentsAsync(
                filterBuilder.And(stationOrSlotFilter, statusFilter));

            if(activeReservationCount > 0)
            {
                throw new Exception(
                    $"Cannot deactivate station: {activeReservationCount} active reservation(s) still exist");
            }
        }

        var update =
            Builders<SolarStationInfo>.Update
            .Set(x => x.Status, "Deactivated");


        var result =
            await _stations.UpdateOneAsync(
                x => x.Id == station.Id,
                update);

        return result.ModifiedCount > 0;

    }

    // Reactivates a deactivated microgrid station by setting its status back to Active.
    public async Task<bool> ReactivateStation(string id)
    {
        var station =
            await _stations
            .Find(x => x.StationId == id)
            .FirstOrDefaultAsync();

        if (station == null && ObjectId.TryParse(id, out _))
        {
            station =
                await _stations
                .Find(x => x.Id == id)
                .FirstOrDefaultAsync();
        }

        if (station == null)
        {
            throw new Exception("Station not found");
        }

        var update =
            Builders<SolarStationInfo>.Update
            .Set(x => x.Status, "Active");

        var result =
            await _stations.UpdateOneAsync(
                x => x.Id == station.Id,
                update);

        return result.ModifiedCount > 0;
    }

    // Searches stations by location keyword and/or availability
    public async Task<List<SolarStationInfo>> SearchStations(
        string? location,
        bool? available)
    {
        // Start with a match-all filter and narrow it down
        var filter = Builders<SolarStationInfo>.Filter.Empty;

        // Filter by partial address, name, or station ID if location keyword is provided
        if (!string.IsNullOrWhiteSpace(location))
        {
            var trimmed = location.Trim();
            var regex = new MongoDB.Bson.BsonRegularExpression(trimmed, "i");
            var locationFilter = Builders<SolarStationInfo>.Filter.Or(
                Builders<SolarStationInfo>.Filter.Regex(x => x.Address, regex),
                Builders<SolarStationInfo>.Filter.Regex(x => x.StationName, regex),
                Builders<SolarStationInfo>.Filter.Regex(x => x.StationId, regex)
            );
            filter &= locationFilter;
        }

        // Filter by availability status if flag is provided
        if (available.HasValue)
        {
            if (available.Value)
            {
                filter &= Builders<SolarStationInfo>.Filter.Eq(x => x.Status, "Active");
            }
            else
            {
                filter &= Builders<SolarStationInfo>.Filter.Ne(x => x.Status, "Active");
            }
        }

        return await _stations
            .Find(filter)
            .ToListAsync();
    }

    // Returns lightweight map pin data for all active stations
    public async Task<List<StationMapDto>> GetMapPins()
    {
        var activeStations =
            await _stations
            .Find(x => x.Status == "Active")
            .ToListAsync();

        // Project only the fields needed for map markers
        return activeStations
            .Select(x => new StationMapDto
            {
                Id   = x.Id,
                Name = x.StationName,
                Lat  = x.Latitude,
                Lng  = x.Longitude
            })
            .ToList();

    }


}