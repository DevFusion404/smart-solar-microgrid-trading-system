/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : IEnergyTransactionService.cs
Description   : Business contract for the energy transfer workflow —
                QR generation, QR verification, transfer completion,
                transaction history, search and dashboards.
Author        : Malmi
=====================================================
*/

using backend.DTOs.Transactions;

namespace backend.Services.Interfaces;

/// <summary>
/// The whole energy transfer workflow. Every rule — ownership, QR validity,
/// state transitions, reservation closure — is enforced here so the controller
/// stays a thin HTTP adapter and the same logic serves both the React portal
/// and the mobile operator app.
/// </summary>
public interface IEnergyTransactionService
{
    /// <summary>
    /// Issues a secure QR for an approved reservation, creating the transaction
    /// that the grid operator will later scan.
    /// </summary>
    /// <param name="request">Carries the reservation to issue against.</param>
    /// <param name="requestedByUsername">Authenticated caller, used for ownership checks.</param>
    /// <param name="requestedByNic">Caller's NIC claim, null for staff roles.</param>
    /// <param name="isStaff">True when the caller is Backoffice or a grid operator.</param>
    /// <returns>The token, its rendered image, the expiry and the full transaction.</returns>
    Task<QrGenerationResponseDto> GenerateQrAsync(
        GenerateQrRequestDto request,
        string requestedByUsername,
        string? requestedByNic,
        bool isStaff);

    /// <summary>
    /// Validates a scanned QR token and, when every check passes, marks the
    /// transaction verified against the scanning operator.
    /// </summary>
    /// <param name="request">The scanned token or QR payload.</param>
    /// <param name="operatorUsername">Username of the grid operator scanning.</param>
    /// <returns>
    /// Always a populated result rather than an exception: an invalid scan is a
    /// normal outcome the scanner screen needs to render, not a server fault.
    /// </returns>
    Task<QrVerificationResponseDto> VerifyQrAsync(VerifyQrRequestDto request, string operatorUsername);

    /// <summary>
    /// Confirms that the energy has physically changed hands, closing both the
    /// transaction and its reservation.
    /// </summary>
    /// <param name="transactionId">Transaction to complete.</param>
    /// <param name="request">Optional metered amount and operator remarks.</param>
    /// <param name="operatorUsername">Username of the confirming grid operator.</param>
    /// <returns>A confirmation message and the closed transaction.</returns>
    Task<OperationResultDto> CompleteTransferAsync(
        string transactionId,
        CompleteTransferRequestDto request,
        string operatorUsername);

    /// <summary>
    /// Declines a transfer at the station, invalidating its QR token.
    /// </summary>
    /// <param name="transactionId">Transaction to reject.</param>
    /// <param name="request">Mandatory reason.</param>
    /// <param name="operatorUsername">Username of the rejecting grid operator.</param>
    /// <returns>A confirmation message and the rejected transaction.</returns>
    Task<OperationResultDto> RejectTransferAsync(
        string transactionId,
        RejectTransferRequestDto request,
        string operatorUsername);

    /// <summary>Retrieves one transaction by business key or document id.</summary>
    /// <param name="transactionId">Transaction identifier.</param>
    /// <returns>The transaction view.</returns>
    Task<TransactionResponseDto> GetTransactionAsync(string transactionId);

    /// <summary>
    /// Regenerates the QR image for a transaction the prosumer already owns,
    /// so the display page can be reopened without minting a second token.
    /// </summary>
    /// <param name="transactionId">Transaction identifier.</param>
    /// <param name="requestedByNic">Caller's NIC claim, null for staff roles.</param>
    /// <param name="isStaff">True when the caller is Backoffice or a grid operator.</param>
    /// <returns>The same token rendered afresh, with its transaction.</returns>
    Task<QrGenerationResponseDto> GetQrAsync(string transactionId, string? requestedByNic, bool isStaff);

    /// <summary>Returns a prosumer's transfer history, newest first.</summary>
    /// <param name="prosumerNic">Prosumer NIC.</param>
    /// <param name="status">Optional transfer status filter.</param>
    /// <returns>Matching transactions.</returns>
    Task<IEnumerable<TransactionResponseDto>> GetHistoryAsync(string prosumerNic, string? status);

    /// <summary>Paged search across every transaction.</summary>
    /// <param name="status">Transfer status, case-insensitive.</param>
    /// <param name="date">Exact slot date.</param>
    /// <param name="stationId">Station identifier.</param>
    /// <param name="prosumerNic">Prosumer NIC.</param>
    /// <param name="fromDate">Inclusive lower bound on the slot date.</param>
    /// <param name="toDate">Inclusive upper bound on the slot date.</param>
    /// <param name="page">1-based page number.</param>
    /// <param name="pageSize">Items per page.</param>
    /// <returns>A page of matching transactions.</returns>
    Task<PagedResultDto<TransactionResponseDto>> SearchAsync(
        string? status,
        DateTime? date,
        string? stationId,
        string? prosumerNic,
        DateTime? fromDate,
        DateTime? toDate,
        int page,
        int pageSize);

    /// <summary>Headline counters, optionally narrowed to one prosumer.</summary>
    /// <param name="prosumerNic">Optional prosumer scope; null counts every transaction.</param>
    /// <returns>The summary counters.</returns>
    Task<DashboardSummaryDto> GetSummaryAsync(string? prosumerNic);

    /// <summary>Full prosumer dashboard: counters, transaction lists and bookings awaiting a QR.</summary>
    /// <param name="prosumerNic">Prosumer NIC.</param>
    /// <param name="username">Account username, used to find reservations stored without a NIC.</param>
    /// <returns>The assembled dashboard.</returns>
    Task<ProsumerDashboardDto> GetProsumerDashboardAsync(string prosumerNic, string? username);

    /// <summary>Full grid operator dashboard: counters plus today's, pending and completed transfers.</summary>
    /// <returns>The assembled dashboard.</returns>
    Task<OperatorDashboardDto> GetOperatorDashboardAsync();
}
