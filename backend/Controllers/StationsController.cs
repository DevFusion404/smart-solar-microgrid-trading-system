/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : StationsController.cs
Description   : Provides REST APIs for station management
Author        : Sithmaka
=====================================================
*/


using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/stations")]
public class StationsController : ControllerBase
{

    private readonly IMicrogridStationService _service;

    public StationsController(
        IMicrogridStationService service)
    {
        _service = service;
    }


    /// <summary>
    /// Creates a new solar microgrid station.
    /// Validates GPS coordinates, energy capacity,
    /// and uniqueness of StationId before saving.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateStation(
        [FromBody] StationCreateDto dto)
    {
        // Map DTO fields onto the domain model
        var station = new SolarStationInfo
        {
            StationId              = dto.StationId,
            StationName            = dto.StationName,
            Address                = dto.Address,
            Latitude               = dto.Latitude,
            Longitude              = dto.Longitude,
            EnergyCapacity         = dto.EnergyCapacity,
            BatteryStorageCapacity = dto.BatteryStorageCapacity,
            OperationalSchedule    = dto.OperationalSchedule
        };

        try
        {
            var result = await _service.CreateStation(station);
            return Ok(result);
        }
        catch(Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }

    }

    /// <summary>
    /// Retrieves all microgrid stations regardless of status.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetStations()
    {
        var result = await _service.GetAllStations();
        return Ok(result);
    }

    /// <summary>
    /// Retrieves one station by its MongoDB document id.
    /// Returns 404 if not found.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetStationById(string id)
    {
        var result = await _service.GetStationById(id);

        if(result == null)
        {
            return NotFound(new { message = "Station not found" });
        }

        return Ok(result);
    }

    /// <summary>
    /// Updates all editable fields of an existing station.
    /// Returns 404 if no station matches the given id.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStation(
        string id,
        [FromBody] StationUpdateDto dto)
    {
        // Fetch existing record so we preserve Status and StationId
        var existing = await _service.GetStationById(id);

        if(existing == null)
        {
            return NotFound(new { message = "Station not found" });
        }

        // Overlay DTO values onto the existing document
        existing.StationName            = dto.StationName;
        existing.Address                = dto.Address;
        existing.Latitude               = dto.Latitude;
        existing.Longitude              = dto.Longitude;
        existing.EnergyCapacity         = dto.EnergyCapacity;
        existing.BatteryStorageCapacity = dto.BatteryStorageCapacity;
        existing.OperationalSchedule    = dto.OperationalSchedule;

        try
        {
            var updated = await _service.UpdateStation(id, existing);

            if(!updated)
            {
                return NotFound(new { message = "Station not found" });
            }

            return Ok(new { message = "Station updated successfully" });
        }
        catch(Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }

    }

    /// <summary>
    /// Updates only the operational schedule of a station.
    /// All other fields remain unchanged.
    /// </summary>
    [HttpPut("{id}/schedule")]
    public async Task<IActionResult> UpdateSchedule(
        string id,
        [FromBody] StationScheduleDto dto)
    {
        try
        {
            var updated =
                await _service.UpdateSchedule(
                    id, dto.OperationalSchedule);

            if(!updated)
            {
                return NotFound(new { message = "Station not found" });
            }

            return Ok(new { message = "Schedule updated successfully" });
        }
        catch(Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }

    }

    /// <summary>
    /// Deactivates a station by setting its status to Deactivated.
    /// Returns 400 if active booking slots still exist for this station.
    /// </summary>
    [HttpPut("{id}/deactivate")]
    public async Task<IActionResult> DeactivateStation(string id)
    {
        try
        {
            var deactivated = await _service.DeactivateStation(id);

            if(!deactivated)
            {
                return NotFound(new { message = "Station not found" });
            }

            return Ok(new { message = "Station deactivated successfully" });
        }
        catch(Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }

    }

    /// <summary>
    /// Searches stations by location keyword (partial address match)
    /// and/or availability. Both query parameters are optional.
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> SearchStations(
        [FromQuery] string? location,
        [FromQuery] bool? available)
    {
        var result =
            await _service.SearchStations(location, available);

        return Ok(result);
    }

    /// <summary>
    /// Returns minimal map pin data — id, name, lat, lng — for
    /// every active station. Used to place Google Maps markers.
    /// </summary>
    [HttpGet("map")]
    public async Task<IActionResult> GetMapPins()
    {
        var result = await _service.GetMapPins();
        return Ok(result);
    }

}
