using System.Security.Claims;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize(Roles = nameof(UserRole.Prosumer))]
public class ReservationsController : ControllerBase
{
    private readonly IEnergyReservationService _reservationService;

    public ReservationsController(IEnergyReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    /// <summary>Creates a confirmed reservation for the authenticated prosumer.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReservationDto request)
    {
        var reservation = await _reservationService.CreateAsync(GetUsername(), request);
        return StatusCode(StatusCodes.Status201Created, reservation);
    }

    /// <summary>Returns the authenticated user's current and future active reservations.</summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyReservations([FromQuery] DateTime? date)
    {
        var reservations = await _reservationService.GetCurrentForUserAsync(GetUsername(), date);
        return Ok(reservations);
    }

    /// <summary>Returns completed, cancelled, and past reservations for the authenticated user.</summary>
    [HttpGet("my/history")]
    public async Task<IActionResult> GetMyReservationHistory([FromQuery] DateTime? date)
    {
        var reservations = await _reservationService.GetHistoryForUserAsync(GetUsername(), date);
        return Ok(reservations);
    }

    /// <summary>Cancels a future reservation and returns its kWh to the slot.</summary>
    [HttpPut("{reservationId}/cancel")]
    public async Task<IActionResult> Cancel(string reservationId, [FromBody] CancelReservationDto? request)
    {
        var reservation = await _reservationService.CancelAsync(
            GetUsername(),
            reservationId,
            request ?? new CancelReservationDto());
        return Ok(reservation);
    }

    private string GetUsername()
    {
        var username = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(username))
        {
            throw new UnauthorizedAccessException("The access token does not contain a user identity.");
        }

        return username;
    }
}
