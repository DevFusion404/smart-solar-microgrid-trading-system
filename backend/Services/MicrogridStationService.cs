/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : MicrogridStationService.cs
Description   : Handles business logic and MongoDB
                operations related to solar stations
Author        : Nanayakkara G.L.C.S
=====================================================
*/


using backend.Data;
using backend.DTOs;
using backend.Helpers;
using backend.Interfaces;
using backend.Middleware;
using backend.Models;

using MongoDB.Bson;
using MongoDB.Driver;

namespace backend.Services;
public class MicrogridStationService : IMicrogridStationService
{
    // Limits for the nearest-station search
    public const int DefaultNearbyLimit = 20;
    public const int MaxNearbyLimit = 100;

    private readonly IMongoCollection<SolarStationInfo> _stations;
    private readonly IMongoCollection<EnergyBookingSlot> _slots;
    private readonly IMongoCollection<BsonDocument> _reservations;
    private readonly IMongoCollection<UserDetails> _users;

    // Constructor initializes MongoDB collections
    public MicrogridStationService(MongoDbContext context)
    {

        _stations = context.Database
            .GetCollection<SolarStationInfo>("SolarStationInfo");

        _slots = context.Database
            .GetCollection<EnergyBookingSlot>("EnergyBookingSlot");

        _reservations = context.Database
            .GetCollection<BsonDocument>("EnergyReservations");

        // Used only to read a prosumer's saved home location for the nearest-station search
        _users = context.Users;

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

    // Returns active stations ordered from nearest to farthest from the given GPS point
    public async Task<List<NearbyStationDto>> GetNearbyStations(
        double latitude,
        double longitude,
        double? radiusKm,
        int? limit)
    {
        ValidateNearbyQuery(latitude, longitude, radiusKm);

        var activeStations =
            await _stations
            .Find(x => x.Status == "Active")
            .ToListAsync();

        return RankByDistance(activeStations, latitude, longitude, radiusKm, limit);
    }

    // Returns active stations nearest to the home location saved on the prosumer's account
    public async Task<List<NearbyStationDto>> GetNearbyStationsForUser(
        string username,
        double? radiusKm,
        int? limit)
    {
        var user = await _users
            .Find(u => u.Username == username)
            .FirstOrDefaultAsync();

        if (user == null)
        {
            throw new NotFoundException("USER_NOT_FOUND", $"User '{username}' was not found.");
        }

        if (user.HomeLatitude == null || user.HomeLongitude == null)
        {
            throw new NotFoundException(
                "HOME_LOCATION_NOT_SET",
                "No home location is saved for this account. Turn on location or set your home location in your profile.");
        }

        return await GetNearbyStations(user.HomeLatitude.Value, user.HomeLongitude.Value, radiusKm, limit);
    }

    // Pure ranking step (no database), kept separate so it can be unit tested:
    // skips stations without coordinates, measures the Haversine distance to each one,
    // drops stations outside the radius, sorts nearest first and applies the limit.
    public static List<NearbyStationDto> RankByDistance(
        IEnumerable<SolarStationInfo> stations,
        double latitude,
        double longitude,
        double? radiusKm,
        int? limit)
    {
        var take = Math.Clamp(limit ?? DefaultNearbyLimit, 1, MaxNearbyLimit);

        return stations
            .Where(s => GeoDistance.IsValidCoordinate(s.Latitude, s.Longitude) &&
                        !GeoDistance.IsUnset(s.Latitude, s.Longitude))
            .Select(s => new
            {
                Station = s,
                Distance = GeoDistance.HaversineKm(latitude, longitude, s.Latitude, s.Longitude)
            })
            .Where(x => radiusKm == null || x.Distance <= radiusKm.Value)
            .OrderBy(x => x.Distance)
            .ThenBy(x => x.Station.StationName)
            .Take(take)
            .Select(x => new NearbyStationDto
            {
                Id = x.Station.Id,
                StationId = x.Station.StationId,
                StationName = x.Station.StationName,
                Address = x.Station.Address,
                Latitude = x.Station.Latitude,
                Longitude = x.Station.Longitude,
                EnergyCapacity = x.Station.EnergyCapacity,
                BatteryStorageCapacity = x.Station.BatteryStorageCapacity,
                OperationalSchedule = x.Station.OperationalSchedule,
                Status = x.Station.Status,
                AssignedOperatorName = x.Station.AssignedOperatorName,
                DistanceKm = Math.Round(x.Distance, 2)
            })
            .ToList();
    }

    // Rejects out-of-range coordinates and non-positive radius values
    private static void ValidateNearbyQuery(double latitude, double longitude, double? radiusKm)
    {
        if (!GeoDistance.IsValidCoordinate(latitude, longitude))
        {
            throw new BadRequestException(
                "INVALID_COORDINATES",
                "Latitude must be between -90 and 90 and longitude between -180 and 180.");
        }

        if (radiusKm.HasValue && (radiusKm.Value <= 0 || radiusKm.Value > 20000))
        {
            throw new BadRequestException("INVALID_RADIUS", "Radius must be greater than 0 and at most 20000 km.");
        }
    }


}