// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: ProsumersController.cs
// Description: API Controller for managing prosumer accounts, registration, activations, and deactivation workflows.
// ===============================================

using backend.DTOs.Prosumers;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/prosumers")]
public class ProsumersController : ControllerBase
{
    private readonly IProsumerService _prosumerService;
    private readonly IAuthorizationService _authorizationService;

    // Initializes controller with IProsumerService and IAuthorizationService dependencies
    public ProsumersController(IProsumerService prosumerService, IAuthorizationService authorizationService)
    {
        _prosumerService = prosumerService;
        _authorizationService = authorizationService;
    }

    // Registers a new prosumer account with NIC primary key in PendingActivation status
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterProsumer([FromBody] RegisterProsumerDto request)
    {
        var result = await _prosumerService.RegisterProsumerAsync(request);
        return CreatedAtAction(nameof(GetProsumerByNic), new { nic = result.Nic }, result);
    }

    // Retrieves paginated list of prosumer profiles filtered by optional account status
    [HttpGet]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<IActionResult> ListProsumers(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        AccountStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AccountStatus>(status, true, out var parsedStatus))
        {
            statusEnum = parsedStatus;
        }

        var result = await _prosumerService.ListProsumersAsync(statusEnum, page, pageSize);
        return Ok(result);
    }

    // Searches prosumer accounts by text query across FullName, NIC, Email, and Username
    [HttpGet("search")]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<IActionResult> SearchProsumers(
        [FromQuery] string? q,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        AccountStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AccountStatus>(status, true, out var parsedStatus))
        {
            statusEnum = parsedStatus;
        }

        var result = await _prosumerService.SearchProsumersAsync(q ?? string.Empty, statusEnum, page, pageSize);
        return Ok(result);
    }

    // Lists prosumers with pending activation requests for Backoffice review
    [HttpGet("pending-activations")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> ListPendingActivations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _prosumerService.ListPendingActivationsAsync(page, pageSize);
        return Ok(result);
    }

    // Lists prosumers requesting deactivation for Backoffice review
    [HttpGet("deactivation-requests")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> ListDeactivationRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _prosumerService.ListDeactivationRequestsAsync(page, pageSize);
        return Ok(result);
    }

    // Fetches prosumer profile by NIC primary key with ownership policy authorization
    [HttpGet("{nic}")]
    [Authorize]
    public async Task<IActionResult> GetProsumerByNic(string nic)
    {
        var authResult = await _authorizationService.AuthorizeAsync(User, nic, "NicOwnershipPolicy");
        if (!authResult.Succeeded)
        {
            return Forbid();
        }

        var result = await _prosumerService.GetProsumerByNicAsync(nic);
        return Ok(result);
    }

    // Updates prosumer profile details by NIC (Backoffice officers only)
    [HttpPut("{nic}")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> UpdateProsumer(string nic, [FromBody] UpdateProsumerDto request)
    {
        var result = await _prosumerService.UpdateProsumerAsync(nic, request);
        return Ok(result);
    }

    // Approves pending prosumer registration and activates account (Backoffice officer only)
    [HttpPost("{nic}/activate")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> ActivateProsumer(string nic)
    {
        var actingUsername = User.Identity?.Name ?? "system";
        var result = await _prosumerService.ActivateProsumerAsync(nic, actingUsername);
        return Ok(result);
    }

    // Rejects pending prosumer registration with reason (Backoffice officer only)
    [HttpPost("{nic}/reject-activation")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> RejectProsumerActivation(string nic, [FromBody] RejectActivationDto request)
    {
        var actingUsername = User.Identity?.Name ?? "system";
        var result = await _prosumerService.RejectProsumerActivationAsync(nic, request.Reason, actingUsername);
        return Ok(result);
    }

    // Submits voluntary deactivation request for prosumer account with reason
    [HttpPost("{nic}/request-deactivation")]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> RequestDeactivation(string nic, [FromBody] DeactivationRequestDto request)
    {
        var authResult = await _authorizationService.AuthorizeAsync(User, nic, "NicOwnershipPolicy");
        if (!authResult.Succeeded)
        {
            return Forbid();
        }

        var result = await _prosumerService.RequestDeactivationAsync(nic, request.Reason);
        return Ok(result);
    }

    // Approves deactivation request and deactivates prosumer account (Backoffice officer only)
    [HttpPost("{nic}/deactivate")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> ApproveDeactivation(string nic)
    {
        var actingUsername = User.Identity?.Name ?? "system";
        var result = await _prosumerService.ApproveDeactivationAsync(nic, actingUsername);
        return Ok(result);
    }

    // Reactivates a deactivated prosumer account (Backoffice officer only)
    [HttpPost("{nic}/reactivate")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> ReactivateProsumer(string nic)
    {
        var actingUsername = User.Identity?.Name ?? "system";
        var result = await _prosumerService.ReactivateProsumerAsync(nic, actingUsername);
        return Ok(result);
    }

    // Checks current account status and activation boolean flag for a given prosumer NIC
    [HttpGet("{nic}/status")]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<IActionResult> CheckProsumerStatus(string nic)
    {
        var result = await _prosumerService.CheckProsumerStatusAsync(nic);
        return Ok(result);
    }
}
