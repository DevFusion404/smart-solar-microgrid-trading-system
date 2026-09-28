/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : EnergyTransactionController.cs
Description   : REST APIs for the energy transfer workflow —
                QR generation, QR verification, transfer completion,
                transaction history and search.
Author        : Malmi
=====================================================
*/

using backend.DTOs.Transactions;
using backend.Middleware;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

/// <summary>
/// Endpoints covering the final stage of the trading workflow.
/// Business rules live in <see cref="IEnergyTransactionService"/>; this
/// controller only reads identity from the JWT and shapes HTTP responses.
/// Domain exceptions are converted by the global exception middleware.
/// </summary>
[ApiController]
[Route("api/transactions")]
[Authorize]
public class EnergyTransactionController : ControllerBase
{
    private readonly IEnergyTransactionService _transactionService;
    private readonly IAuthorizationService _authorizationService;

    /// <summary>Initializes the controller with the transaction service and authorization service.</summary>
    /// <param name="transactionService">Energy transfer workflow.</param>
    /// <param name="authorizationService">Evaluates the NIC ownership policy shared with Component 1.</param>
    public EnergyTransactionController(
        IEnergyTransactionService transactionService,
        IAuthorizationService authorizationService)
    {
        _transactionService = transactionService;
        _authorizationService = authorizationService;
    }

    // =========================================================
    // QR GENERATION
    // =========================================================

    /// <summary>
    /// Generates a secure transaction QR for an approved reservation.
    /// Re-calling this for the same reservation returns the existing token
    /// rather than issuing a second one.
    /// </summary>
    /// <param name="request">Carries the reservation id.</param>
    /// <returns>The transaction id, token, PNG image data and expiry.</returns>
    [HttpPost("generate-qr")]
    [Authorize(Roles = "Prosumer,Backoffice,GridOperator")]
    public async Task<IActionResult> GenerateQr([FromBody] GenerateQrRequestDto request)
    {
        var result = await _transactionService.GenerateQrAsync(
            request,
            CurrentUsername,
            CurrentNic,
            IsStaff);

        return Ok(result);
    }

    /// <summary>
    /// Re-renders the QR image for a transaction the caller already owns, so the
    /// display page can be reopened without minting a new token.
    /// </summary>
    /// <param name="transactionId">Transaction business key or document id.</param>
    /// <returns>The same token rendered afresh, with its transaction.</returns>
    [HttpGet("{transactionId}/qr")]
    [Authorize(Roles = "Prosumer,Backoffice,GridOperator")]
    public async Task<IActionResult> GetQr(string transactionId)
    {
        var result = await _transactionService.GetQrAsync(transactionId, CurrentNic, IsStaff);
        return Ok(result);
    }

    // =========================================================
    // QR VERIFICATION
    // =========================================================

    /// <summary>
    /// Validates a QR token scanned by a grid operator.
    /// </summary>
    /// <param name="request">The scanned token or the full QR payload.</param>
    /// <returns>
    /// Always HTTP 200 with a success flag. A rejected scan is an expected
    /// outcome the scanner screen renders, not a transport-level error.
    /// </returns>
    [HttpPost("verify-qr")]
    [Authorize(Roles = "GridOperator,Backoffice")]
    public async Task<IActionResult> VerifyQr([FromBody] VerifyQrRequestDto request)
    {
        var result = await _transactionService.VerifyQrAsync(request, CurrentUsername);
        return Ok(result);
    }

    // =========================================================
    // TRANSFER COMPLETION
    // =========================================================

    /// <summary>
    /// Confirms that the energy has been handed over, closing the transaction
    /// and its reservation.
    /// </summary>
    /// <param name="transactionId">Transaction business key or document id.</param>
    /// <param name="request">Optional metered amount and operator remarks.</param>
    /// <returns>A confirmation message and the closed transaction.</returns>
    [HttpPut("{transactionId}/complete")]
    [Authorize(Roles = "GridOperator,Backoffice")]
    public async Task<IActionResult> CompleteTransfer(
        string transactionId,
        [FromBody] CompleteTransferRequestDto? request)
    {
        var result = await _transactionService.CompleteTransferAsync(
            transactionId,
            request ?? new CompleteTransferRequestDto(),
            CurrentUsername);

        return Ok(result);
    }

    /// <summary>
    /// Declines a transfer at the station and invalidates its QR token.
    /// </summary>
    /// <param name="transactionId">Transaction business key or document id.</param>
    /// <param name="request">Mandatory rejection reason.</param>
    /// <returns>A confirmation message and the rejected transaction.</returns>
    [HttpPut("{transactionId}/reject")]
    [Authorize(Roles = "GridOperator,Backoffice")]
    public async Task<IActionResult> RejectTransfer(
        string transactionId,
        [FromBody] RejectTransferRequestDto request)
    {
        var result = await _transactionService.RejectTransferAsync(transactionId, request, CurrentUsername);
        return Ok(result);
    }

    // =========================================================
    // READ / HISTORY / SEARCH
    // =========================================================

    /// <summary>
    /// Retrieves a single transaction. Prosumers may only read their own.
    /// </summary>
    /// <param name="transactionId">Transaction business key or document id.</param>
    /// <returns>The transaction view.</returns>
    [HttpGet("{transactionId}")]
    public async Task<IActionResult> GetTransaction(string transactionId)
    {
        var transaction = await _transactionService.GetTransactionAsync(transactionId);

        // Reuse Component 1's ownership policy so the rule stays in one place.
        await EnsureNicAccessAsync(transaction.ProsumerNIC);

        return Ok(transaction);
    }

    /// <summary>
    /// Returns the signed-in prosumer's own transfer history.
    /// </summary>
    /// <param name="status">Optional transfer status filter.</param>
    /// <returns>Matching transactions, newest first.</returns>
    [HttpGet("my")]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> GetMyTransactions([FromQuery] string? status)
    {
        if (string.IsNullOrWhiteSpace(CurrentNic))
        {
            throw new ForbiddenException("NIC_CLAIM_MISSING", "Your account has no NIC on record.");
        }

        var result = await _transactionService.GetHistoryAsync(CurrentNic, status);
        return Ok(result);
    }

    /// <summary>
    /// Returns one prosumer's transfer history. Staff may read any NIC; a
    /// prosumer may only read their own.
    /// </summary>
    /// <param name="prosumerNIC">NIC of the prosumer.</param>
    /// <param name="status">Optional transfer status filter.</param>
    /// <returns>Matching transactions, newest first.</returns>
    [HttpGet("history/{prosumerNIC}")]
    public async Task<IActionResult> GetHistory(string prosumerNIC, [FromQuery] string? status)
    {
        await EnsureNicAccessAsync(prosumerNIC);

        var result = await _transactionService.GetHistoryAsync(prosumerNIC, status);
        return Ok(result);
    }

    /// <summary>
    /// Searches and filters transactions by status, date, station and prosumer NIC.
    /// </summary>
    /// <param name="status">Transfer status, case-insensitive.</param>
    /// <param name="date">Exact slot date, e.g. 2026-09-18.</param>
    /// <param name="stationId">Station identifier.</param>
    /// <param name="prosumerNic">Prosumer NIC.</param>
    /// <param name="fromDate">Inclusive lower bound on the slot date.</param>
    /// <param name="toDate">Inclusive upper bound on the slot date.</param>
    /// <param name="page">1-based page number.</param>
    /// <param name="pageSize">Items per page, capped at 100.</param>
    /// <returns>A page of matching transactions.</returns>
    [HttpGet("search")]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<IActionResult> Search(
        [FromQuery] string? status,
        [FromQuery] DateTime? date,
        [FromQuery] string? stationId,
        [FromQuery] string? prosumerNic,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _transactionService.SearchAsync(
            status, date, stationId, prosumerNic, fromDate, toDate, page, pageSize);

        return Ok(result);
    }

    // =========================================================
    // IDENTITY HELPERS
    // =========================================================

    /// <summary>Username of the authenticated caller, taken from the JWT name claim.</summary>
    private string CurrentUsername => User.Identity?.Name ?? string.Empty;

    /// <summary>NIC claim of the authenticated caller. Null for staff accounts.</summary>
    private string? CurrentNic => User.FindFirst("nic")?.Value;

    /// <summary>True when the caller is Backoffice or a grid operator.</summary>
    private bool IsStaff =>
        User.IsInRole(nameof(UserRole.Backoffice)) || User.IsInRole(nameof(UserRole.GridOperator));

    /// <summary>
    /// Applies the shared NIC ownership policy, throwing 403 when a prosumer
    /// tries to read another prosumer's records.
    /// </summary>
    /// <param name="targetNic">NIC the request is trying to reach.</param>
    private async Task EnsureNicAccessAsync(string targetNic)
    {
        var authorization = await _authorizationService.AuthorizeAsync(User, targetNic, "NicOwnershipPolicy");

        if (!authorization.Succeeded)
        {
            throw new ForbiddenException("TRANSACTION_NOT_OWNED", "You can only access your own transactions.");
        }
    }
}
