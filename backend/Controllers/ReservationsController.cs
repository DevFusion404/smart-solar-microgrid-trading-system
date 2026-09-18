using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/reservations")]
public class ReservationsController : ControllerBase
{
    private readonly IEnergyReservationService _reservationService;

    public ReservationsController(IEnergyReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    /// <summary>Creates a confirmed energy reservation.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReservationDto request)
    {
        var reservation = await _reservationService.CreateAsync(request);
        return StatusCode(StatusCodes.Status201Created, reservation);
    }

    /// <summary>Returns all reservation records. Date filtering is optional.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DateTime? date)
    {
        var reservations = await _reservationService.GetAllAsync(date);
        return Ok(reservations);
    }

    /// <summary>Changes the requested energy amount within the 12-hour edit window.</summary>
    [HttpPut("{reservationId}")]
    public async Task<IActionResult> Update(string reservationId, [FromBody] UpdateReservationDto request)
    {
        var reservation = await _reservationService.UpdateAsync(reservationId, request);
        return Ok(reservation);
    }

    /// <summary>Deletes a reservation within the 12-hour edit window and restores slot capacity.</summary>
    [HttpDelete("{reservationId}")]
    public async Task<IActionResult> Delete(string reservationId)
    {
        await _reservationService.DeleteAsync(reservationId);
        return NoContent();
    }
}
