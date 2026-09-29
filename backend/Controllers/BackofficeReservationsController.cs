/*
 * File Name    : BackofficeReservationsController.cs
 * Project      : Smart Solar Microgrid Trading System
 * Description  : Exposes Backoffice endpoints for listing reservations, updating their workflow status, and downloading approved reservation QR passes.
 * Author       : Project Team
 * Date         : 28 Sep 2026
 */

using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/backoffice/reservations")]
[Authorize(Roles = "Backoffice")]
public class BackofficeReservationsController : ControllerBase
{
    private readonly IEnergyReservationService _reservationService;

    // Initializes the controller with the reservation service.
    public BackofficeReservationsController(IEnergyReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    /// <summary>Returns all reservation details for the Backoffice reservation dashboard.</summary>
    [HttpGet]
    // Retrieves all reservation records for the Backoffice reservation dashboard.
    public async Task<IActionResult> GetAll()
    {
        var reservations = await _reservationService.GetAllForBackofficeAsync();
        return Ok(reservations);
    }

    /// <summary>Updates a reservation's workflow status.</summary>
    [HttpPatch("{reservationId}/status")]
    // Updates the workflow status of the specified reservation.
    public async Task<IActionResult> UpdateStatus(string reservationId, [FromBody] UpdateReservationStatusDto request)
    {
        var reservation = await _reservationService.UpdateStatusForBackofficeAsync(reservationId, request);
        return Ok(reservation);
    }

    /// <summary>Returns the active QR pass for an approved reservation.</summary>
    [HttpGet("{reservationId}/qr")]
    [Produces("image/png")]
    // Returns the specified approved reservation QR pass as a PNG file.
    public async Task<IActionResult> GetQrCode(string reservationId)
    {
        var qrPng = await _reservationService.GetQrPngForBackofficeAsync(reservationId);
        return File(qrPng, "image/png", $"{reservationId}-qr.png");
    }
}
