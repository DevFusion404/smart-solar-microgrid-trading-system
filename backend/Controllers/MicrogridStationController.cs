/*
=====================================================
File          : MicrogridStationController.cs
Description   : Provides REST APIs for station management
=====================================================
*/

using Microsoft.AspNetCore.Mvc;
using backend.Interfaces;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/microgrid-stations")]
public class MicrogridStationController : ControllerBase
{

private readonly IMicrogridStationService _service;

public MicrogridStationController(
IMicrogridStationService service)
{
    _service = service;
}


/// <summary>
/// Creates a new microgrid station.
/// Validates GPS location and capacity before saving.
/// </summary>
[HttpPost]
public async Task<IActionResult> CreateStation(
    [FromBody] SolarStationInfo station)
{
    var result = await _service.CreateStation(station);

    return Ok(result);
}

// Retrieves all microgrid stations.
[HttpGet]
public async Task<IActionResult> GetStations()
{

var result =
await _service.GetAllStations();

return Ok(result);

}

}