/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : SlotsController.cs
Description   : Provides REST APIs for energy slot management
Author        : Sithmaka
=====================================================
*/


using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;

namespace backend.Controllers;

[ApiController]
public class SlotsController : ControllerBase
{

    private readonly IEnergySlotService _slotService;

    public SlotsController(IEnergySlotService slotService)
    {
        _slotService = slotService;
    }


    /// <summary>
    /// Creates a new energy booking slot for a given station.
    /// StationId comes from the route; all other fields from the body.
    /// </summary>
    [HttpPost("api/stations/{stationId}/slots")]
    public async Task<IActionResult> CreateSlot(
        string stationId,
        [FromBody] SlotCreateDto dto)
    {
        // Build the domain object, binding stationId from the route
        var slot = new EnergyBookingSlot
        {
            SlotId            = dto.SlotId,
            StationId         = stationId,
            Date              = dto.Date,
            StartTime         = dto.StartTime,
            EndTime           = dto.EndTime,
            TotalCapacity     = dto.TotalCapacity,
            AvailableCapacity = dto.AvailableCapacity,
            Status            = dto.Status
        };

        try
        {
            var result = await _slotService.CreateSlot(slot);
            return Ok(result);
        }
        catch(Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }

    }

    /// <summary>
    /// Lists all slots for a station.
    /// Optionally pass ?date=YYYY-MM-DD to filter to a specific day.
    /// </summary>
    [HttpGet("api/stations/{stationId}/slots")]
    public async Task<IActionResult> GetSlots(
        string stationId,
        [FromQuery] DateTime? date)
    {
        var result =
            await _slotService.GetSlotsByStation(stationId, date);

        return Ok(result);
    }

    /// <summary>
    /// Retrieves a single energy booking slot by its MongoDB document id.
    /// Returns 404 if the slot does not exist.
    /// </summary>
    [HttpGet("api/slots/{id}")]
    public async Task<IActionResult> GetSlotById(string id)
    {
        var result = await _slotService.GetSlotById(id);

        if(result == null)
        {
            return NotFound(new { message = "Slot not found" });
        }

        return Ok(result);
    }

    /// <summary>
    /// Updates all editable fields of an existing slot —
    /// times, total capacity, available capacity, and status.
    /// Returns 404 if no slot matches the given id.
    /// </summary>
    [HttpPut("api/slots/{id}")]
    public async Task<IActionResult> UpdateSlot(
        string id,
        [FromBody] SlotUpdateDto dto)
    {
        // Fetch existing record to preserve StationId and SlotId
        var existing = await _slotService.GetSlotById(id);

        if(existing == null)
        {
            return NotFound(new { message = "Slot not found" });
        }

        // Overlay DTO values onto the existing document
        existing.Date              = dto.Date;
        existing.StartTime         = dto.StartTime;
        existing.EndTime           = dto.EndTime;
        existing.TotalCapacity     = dto.TotalCapacity;
        existing.AvailableCapacity = dto.AvailableCapacity;
        existing.Status            = dto.Status;

        try
        {
            var updated = await _slotService.UpdateSlot(id, existing);

            if(!updated)
            {
                return NotFound(new { message = "Slot not found" });
            }

            return Ok(new { message = "Slot updated successfully" });
        }
        catch(Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }

    }

    /// <summary>
    /// Adjusts the available capacity of a slot.
    /// This is the endpoint Pasan's booking flow will call
    /// when a reservation is confirmed or cancelled.
    /// </summary>
    [HttpPut("api/slots/{id}/capacity")]
    public async Task<IActionResult> AdjustCapacity(
        string id,
        [FromBody] SlotCapacityDto dto)
    {
        try
        {
            var updated =
                await _slotService.AdjustCapacity(
                    id, dto.AvailableCapacity);

            if(!updated)
            {
                return NotFound(new { message = "Slot not found" });
            }

            return Ok(new { message = "Slot capacity updated successfully" });
        }
        catch(Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }

    }

}
