/*
 * File Name    : BackofficeReservationsController.cs
 * Project      : Smart Solar Microgrid Trading System
 * Description  : Exposes Backoffice endpoints for listing reservations, updating their workflow status, and downloading approved reservation QR passes.
 * Author       : Project Team
 * Date         : 28 Sep 2026
 */

using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/backoffice/reservations")]
// Grid operators work the same pending queue from the station, so they share
// these endpoints with Backoffice. Approving here is what mints the QR pass
// (see EnergyReservationService.UpdateStatusForBackofficeAsync).
[Authorize(Roles = "Backoffice,GridOperator")]
public class BackofficeReservationsController : ControllerBase
{
    private readonly IEnergyReservationService _reservationService;
    private readonly INodeAssignmentService _assignmentService;

    // Initializes the controller with the reservation service and node assignment service.
    public BackofficeReservationsController(
        IEnergyReservationService reservationService,
        INodeAssignmentService assignmentService)
    {
        _reservationService = reservationService;
        _assignmentService = assignmentService;
    }

    private string CurrentUsername => User.Identity?.Name ?? string.Empty;

    /// <summary>Returns reservation details. Backoffice sees all; Grid Operators only see reservations for their assigned nodes.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        IEnumerable<string>? stationIds = null;
        if (User.IsInRole("GridOperator") && !User.IsInRole("Backoffice"))
        {
            var assignedNodes = await _assignmentService.GetNodesByOperatorAsync(CurrentUsername);
            var assignedStationIds = assignedNodes.Select(n => n.StationId).ToList();
            if (assignedStationIds.Count == 0)
            {
                return Ok(new List<EnergyReservation>());
            }
            stationIds = assignedStationIds;
        }

        var reservations = await _reservationService.GetAllForBackofficeAsync(stationIds);
        return Ok(reservations);
    }

    /// <summary>Updates a reservation's workflow status. Grid Operators can only update reservations at their assigned stations.</summary>
    [HttpPatch("{reservationId}/status")]
    public async Task<IActionResult> UpdateStatus(string reservationId, [FromBody] UpdateReservationStatusDto request)
    {
        if (User.IsInRole("GridOperator") && !User.IsInRole("Backoffice"))
        {
            var assignedNodes = await _assignmentService.GetNodesByOperatorAsync(CurrentUsername);
            var assignedStationIds = assignedNodes.Select(n => n.StationId).ToHashSet(StringComparer.OrdinalIgnoreCase);

            var existing = await _reservationService.GetByIdAsync(reservationId);
            if (existing == null)
            {
                return NotFound(new { message = "Reservation not found." });
            }
            if (!assignedStationIds.Contains(existing.StationId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only update reservations for stations assigned to you." });
            }
        }

        var reservation = await _reservationService.UpdateStatusForBackofficeAsync(reservationId, request);
        return Ok(reservation);
    }

    /// <summary>Returns the active QR pass for an approved reservation. Grid Operators can only access QR passes for their assigned stations.</summary>
    [HttpGet("{reservationId}/qr")]
    [Produces("image/png")]
    public async Task<IActionResult> GetQrCode(string reservationId)
    {
        if (User.IsInRole("GridOperator") && !User.IsInRole("Backoffice"))
        {
            var assignedNodes = await _assignmentService.GetNodesByOperatorAsync(CurrentUsername);
            var assignedStationIds = assignedNodes.Select(n => n.StationId).ToHashSet(StringComparer.OrdinalIgnoreCase);

            var existing = await _reservationService.GetByIdAsync(reservationId);
            if (existing == null)
            {
                return NotFound(new { message = "Reservation not found." });
            }
            if (!assignedStationIds.Contains(existing.StationId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only view QR passes for stations assigned to you." });
            }
        }

        var qrPng = await _reservationService.GetQrPngForBackofficeAsync(reservationId);
        return File(qrPng, "image/png", $"{reservationId}-qr.png");
    }
}
