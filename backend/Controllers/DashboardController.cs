/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : DashboardController.cs
Description   : Dashboard REST APIs exposing transfer counters,
                current bookings, transaction history and approved
                future reservations.
Author        : Malmi
=====================================================
*/

using backend.Middleware;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

/// <summary>
/// Read-only dashboard endpoints for the energy transfer workflow.
/// The counters are computed with server-side aggregation so neither the
/// React portal nor the mobile app has to tally records itself.
/// </summary>
[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IEnergyTransactionService _transactionService;
    private readonly IAuthorizationService _authorizationService;

    /// <summary>Initializes the controller with the transaction service and authorization service.</summary>
    /// <param name="transactionService">Energy transfer workflow.</param>
    /// <param name="authorizationService">Evaluates the NIC ownership policy shared with Component 1.</param>
    public DashboardController(
        IEnergyTransactionService transactionService,
        IAuthorizationService authorizationService)
    {
        _transactionService = transactionService;
        _authorizationService = authorizationService;
    }

    /// <summary>
    /// Headline transfer counters.
    /// A prosumer always sees their own figures; staff see the whole grid unless
    /// a NIC is supplied.
    /// </summary>
    /// <param name="prosumerNic">Optional prosumer scope, honoured for staff callers only.</param>
    /// <returns>Pending, verified, completed, failed and today's transfer counts.</returns>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] string? prosumerNic)
    {
        // A prosumer is pinned to their own NIC regardless of what they pass.
        var scope = IsStaff ? prosumerNic : CurrentNic;

        if (!IsStaff && string.IsNullOrWhiteSpace(scope))
        {
            throw new ForbiddenException("NIC_CLAIM_MISSING", "Your account has no NIC on record.");
        }

        var summary = await _transactionService.GetSummaryAsync(scope);
        return Ok(summary);
    }

    /// <summary>
    /// Full dashboard for the signed-in prosumer: counters, pending, current and
    /// completed transactions, plus approved bookings still awaiting a QR.
    /// </summary>
    /// <returns>The assembled prosumer dashboard.</returns>
    [HttpGet("prosumer")]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> GetMyDashboard()
    {
        if (string.IsNullOrWhiteSpace(CurrentNic))
        {
            throw new ForbiddenException("NIC_CLAIM_MISSING", "Your account has no NIC on record.");
        }

        var dashboard = await _transactionService.GetProsumerDashboardAsync(CurrentNic, CurrentUsername);
        return Ok(dashboard);
    }

    /// <summary>
    /// Full dashboard for one prosumer. Staff may request any NIC; a prosumer
    /// may only request their own.
    /// </summary>
    /// <param name="prosumerNic">NIC of the prosumer.</param>
    /// <returns>The assembled prosumer dashboard.</returns>
    [HttpGet("prosumer/{prosumerNic}")]
    public async Task<IActionResult> GetProsumerDashboard(string prosumerNic)
    {
        var authorization = await _authorizationService.AuthorizeAsync(User, prosumerNic, "NicOwnershipPolicy");

        if (!authorization.Succeeded)
        {
            throw new ForbiddenException("DASHBOARD_NOT_OWNED", "You can only view your own dashboard.");
        }

        // Only the owning prosumer's username helps resolve reservations that
        // were stored without a NIC, so it is passed only in that case.
        var username = IsStaff ? null : CurrentUsername;

        var dashboard = await _transactionService.GetProsumerDashboardAsync(prosumerNic, username);
        return Ok(dashboard);
    }

    /// <summary>
    /// Grid operator dashboard: counters plus today's, outstanding and recently
    /// completed transfers.
    /// </summary>
    /// <returns>The assembled operator dashboard.</returns>
    [HttpGet("operator")]
    [Authorize(Roles = "GridOperator,Backoffice")]
    public async Task<IActionResult> GetOperatorDashboard()
    {
        var dashboard = await _transactionService.GetOperatorDashboardAsync();
        return Ok(dashboard);
    }

    /// <summary>Username of the authenticated caller, taken from the JWT name claim.</summary>
    private string CurrentUsername => User.Identity?.Name ?? string.Empty;

    /// <summary>NIC claim of the authenticated caller. Null for staff accounts.</summary>
    private string? CurrentNic => User.FindFirst("nic")?.Value;

    /// <summary>True when the caller is Backoffice or a grid operator.</summary>
    private bool IsStaff =>
        User.IsInRole(nameof(UserRole.Backoffice)) || User.IsInRole(nameof(UserRole.GridOperator));
}
