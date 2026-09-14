/*
=====================================================
File          : IMicrogridStationService.cs
Description   : Defines microgrid station operations
=====================================================
*/

using backend.DTOs;
using backend.Models;

namespace backend.Interfaces;

public interface IMicrogridStationService
{
    // Retrieves all available microgrid stations.
    Task<List<SolarStationInfo>> GetAllStations();

    // Retrieves one station using station id.
    Task<SolarStationInfo?> GetStationById(string id);

    // Creates a new microgrid station.
    Task<SolarStationInfo> CreateStation(
        SolarStationInfo station);

    // Updates existing station information.
    Task<bool> UpdateStation(
        string id,
        SolarStationInfo station);

    // Updates only the operational schedule of a station.
    Task<bool> UpdateSchedule(
        string id,
        string schedule);

    // Deactivates a station — blocked if active slots exist.
    Task<bool> DeactivateStation(string id);

    // Searches stations by location keyword and/or availability.
    Task<List<SolarStationInfo>> SearchStations(
        string? location,
        bool? available);

    // Returns lightweight map pin data for all active stations.
    Task<List<StationMapDto>> GetMapPins();

}