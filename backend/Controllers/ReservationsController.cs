/*
 * File Name    : ReservationsController.cs
 * Project      : Smart Solar Microgrid Trading System
 * Description  : Exposes authenticated prosumer endpoints for creating, viewing, updating, deleting, and downloading reservation QR passes.
 * Author       : Project Team
 * Date         : 28 Sep 2026
 */

using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize(Roles = "Prosumer")]
public class ReservationsController : ControllerBase
{
    private readonly IEnergyReservationService _reservationService;

    // Initializes the controller with the reservation service.
    public ReservationsController(IEnergyReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    /// <summary>Creates a confirmed energy reservation.</summary>
    [HttpPost]
    // Creates a reservation for the authenticated prosumer and returns it as an HTTP response.
    public async Task<IActionResult> Create([FromBody] CreateReservationDto request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var reservation = await _reservationService.CreateAsync(userId, request);
        return StatusCode(StatusCodes.Status201Created, reservation);
    }

    /// <summary>Returns all reservation records. Date filtering is optional.</summary>
    [HttpGet]
    // Retrieves the authenticated prosumer's reservations, optionally filtered by date.
    public async Task<IActionResult> GetAll([FromQuery] DateTime? date)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var reservations = await _reservationService.GetAllAsync(userId, date);
        return Ok(reservations);
    }

    /// <summary>Returns reservations from previous calendar days for the reservation history screen.</summary>
    [HttpGet("history")]
    // Retrieves the authenticated prosumer's reservations from previous calendar days.
    public async Task<IActionResult> GetHistory([FromQuery] DateTime? date)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var reservations = await _reservationService.GetHistoryAsync(userId, date);
        return Ok(reservations);
    }

    /// <summary>Returns the authenticated prosumer's approved reservation QR pass.</summary>
    [HttpGet("{reservationId}/qr")]
    [Produces("image/png")]
    // Returns the authenticated prosumer's approved reservation QR pass as a PNG file.
    public async Task<IActionResult> GetQrCode(string reservationId)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var qrPng = await _reservationService.GetQrPngForUserAsync(userId, reservationId);
        return File(qrPng, "image/png", $"{reservationId}-qr.png");
    }

    /// <summary>Changes the requested energy amount within the 12-hour edit window.</summary>
    [HttpPut("{reservationId}")]
    // Updates the authenticated prosumer's reservation within the 12-hour edit window.
    public async Task<IActionResult> Update(string reservationId, [FromBody] UpdateReservationDto request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var reservation = await _reservationService.UpdateAsync(userId, reservationId, request);
        return Ok(reservation);
    }

    /// <summary>Deletes a reservation within the 12-hour edit window and restores slot capacity.</summary>
    [HttpDelete("{reservationId}")]
    // Deletes the authenticated prosumer's reservation within the 12-hour edit window.
    public async Task<IActionResult> Delete(string reservationId)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        await _reservationService.DeleteAsync(userId, reservationId);
        return NoContent();
    }

    // Extracts the authenticated user's identifier from the current claims principal.
    private bool TryGetCurrentUserId(out string userId)
    {
        userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        return !string.IsNullOrWhiteSpace(userId);
    }
}
