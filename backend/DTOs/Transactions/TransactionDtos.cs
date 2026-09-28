/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : TransactionDtos.cs
Description   : Request and response contracts for QR generation,
                QR verification, transfer completion, transaction
                history, search and dashboard endpoints.
Author        : Malmi
=====================================================
*/

namespace backend.DTOs.Transactions;

// -------------------------------------------------------------
// REQUESTS
// -------------------------------------------------------------

/// <summary>Request body for POST /api/transactions/generate-qr.</summary>
public class GenerateQrRequestDto
{
    /// <summary>Business key of the approved reservation the QR is issued for.</summary>
    public string ReservationId { get; set; } = string.Empty;
}

/// <summary>Request body for POST /api/transactions/verify-qr.</summary>
public class VerifyQrRequestDto
{
    /// <summary>
    /// The token read from the QR image. The scanner may submit either the raw
    /// token or the full JSON payload carrying a transactionToken property;
    /// both forms are accepted by the service.
    /// </summary>
    public string QrToken { get; set; } = string.Empty;
}

/// <summary>Request body for PUT /api/transactions/{transactionId}/complete.</summary>
public class CompleteTransferRequestDto
{
    /// <summary>
    /// Optional metered amount actually delivered, in kWh. When omitted the
    /// reserved amount is recorded. It may not exceed the reserved amount.
    /// </summary>
    public double? DeliveredEnergy { get; set; }

    /// <summary>Optional operator note stored against the transaction.</summary>
    public string? Remarks { get; set; }
}

/// <summary>Request body for PUT /api/transactions/{transactionId}/reject.</summary>
public class RejectTransferRequestDto
{
    /// <summary>Why the operator refused the transfer. Required.</summary>
    public string Reason { get; set; } = string.Empty;
}

// -------------------------------------------------------------
// RESPONSES
// -------------------------------------------------------------

/// <summary>Response of POST /api/transactions/generate-qr.</summary>
public class QrGenerationResponseDto
{
    /// <summary>Business key of the created (or existing reusable) transaction.</summary>
    public string TransactionId { get; set; } = string.Empty;

    /// <summary>The opaque single-use token encoded in the image.</summary>
    public string QrToken { get; set; } = string.Empty;

    /// <summary>Base64 PNG data URI, ready to bind straight to an img tag.</summary>
    public string QrImageData { get; set; } = string.Empty;

    /// <summary>Exact JSON string encoded inside the QR image.</summary>
    public string QrPayload { get; set; } = string.Empty;

    /// <summary>When the token stops being scannable.</summary>
    public DateTime ExpiryDate { get; set; }

    /// <summary>Full transaction record for the QR display screen.</summary>
    public TransactionResponseDto Transaction { get; set; } = new();
}

/// <summary>Response of POST /api/transactions/verify-qr.</summary>
public class QrVerificationResponseDto
{
    /// <summary>True only when every validation check passed.</summary>
    public bool Success { get; set; }

    /// <summary>Human readable outcome, for example "QR Expired".</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Machine readable failure code, null on success.</summary>
    public string? ErrorCode { get; set; }

    /// <summary>Populated only when Success is true.</summary>
    public TransactionResponseDto? TransactionDetails { get; set; }
}

/// <summary>Full transaction view returned by every read endpoint.</summary>
public class TransactionResponseDto
{
    /// <summary>Business key of the transaction.</summary>
    public string TransactionId { get; set; } = string.Empty;

    /// <summary>Reservation this transfer settles.</summary>
    public string ReservationId { get; set; } = string.Empty;

    /// <summary>NIC of the prosumer.</summary>
    public string ProsumerNIC { get; set; } = string.Empty;

    /// <summary>Prosumer display name.</summary>
    public string? ProsumerName { get; set; }

    /// <summary>Station identifier.</summary>
    public string StationId { get; set; } = string.Empty;

    /// <summary>Station display name.</summary>
    public string? StationName { get; set; }

    /// <summary>Booking slot identifier.</summary>
    public string? SlotId { get; set; }

    /// <summary>Energy in kWh.</summary>
    public double EnergyAmount { get; set; }

    /// <summary>Date of the booked slot.</summary>
    public DateTime SlotDate { get; set; }

    /// <summary>Booked slot window rendered as "HH:mm - HH:mm".</summary>
    public string SlotTime { get; set; } = string.Empty;

    /// <summary>When the transaction was created.</summary>
    public DateTime TransactionDate { get; set; }

    /// <summary>Token lifecycle status.</summary>
    public string QRStatus { get; set; } = string.Empty;

    /// <summary>Token expiry.</summary>
    public DateTime QRExpiryDate { get; set; }

    /// <summary>Scan outcome.</summary>
    public string VerificationStatus { get; set; } = string.Empty;

    /// <summary>Transfer lifecycle status.</summary>
    public string TransferStatus { get; set; } = string.Empty;

    /// <summary>Grid operator who scanned the QR.</summary>
    public string? OperatorId { get; set; }

    /// <summary>Grid operator display name.</summary>
    public string? OperatorName { get; set; }

    /// <summary>When the QR was verified.</summary>
    public DateTime? VerifiedDate { get; set; }

    /// <summary>When the transfer completed.</summary>
    public DateTime? CompletedDate { get; set; }

    /// <summary>Reason recorded for a rejected or failed transfer.</summary>
    public string? FailureReason { get; set; }

    /// <summary>Operator note recorded when the transfer was completed.</summary>
    public string? Remarks { get; set; }
}

/// <summary>Generic paged envelope, mirroring the prosumer list responses of Component 1.</summary>
/// <typeparam name="T">Item type carried by the page.</typeparam>
public class PagedResultDto<T>
{
    /// <summary>Items on the current page.</summary>
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();

    /// <summary>Total matching documents across all pages.</summary>
    public long TotalCount { get; set; }

    /// <summary>Current 1-based page number.</summary>
    public int Page { get; set; }

    /// <summary>Requested page size.</summary>
    public int PageSize { get; set; }

    /// <summary>Total number of pages available.</summary>
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

/// <summary>Simple message envelope for write operations.</summary>
public class OperationResultDto
{
    /// <summary>Outcome text shown to the user.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Transaction the operation acted on.</summary>
    public string? TransactionId { get; set; }

    /// <summary>When the operation was applied.</summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>Updated transaction state after the operation.</summary>
    public TransactionResponseDto? Transaction { get; set; }
}

// -------------------------------------------------------------
// DASHBOARD
// -------------------------------------------------------------

/// <summary>Response of GET /api/dashboard/summary.</summary>
public class DashboardSummaryDto
{
    /// <summary>Transactions issued but not yet verified.</summary>
    public long PendingTransfers { get; set; }

    /// <summary>Transactions verified and awaiting operator confirmation.</summary>
    public long VerifiedTransfers { get; set; }

    /// <summary>Transfers that completed successfully.</summary>
    public long CompletedTransfers { get; set; }

    /// <summary>Transactions created today (UTC).</summary>
    public long TodayTransfers { get; set; }

    /// <summary>Transfers rejected or failed.</summary>
    public long FailedTransfers { get; set; }

    /// <summary>Total energy delivered by completed transfers, in kWh.</summary>
    public double TotalEnergyTransferred { get; set; }

    /// <summary>Scope the counts were computed for: "All" or a prosumer NIC.</summary>
    public string Scope { get; set; } = "All";
}

/// <summary>Response of GET /api/dashboard/prosumer/{prosumerNic}.</summary>
public class ProsumerDashboardDto
{
    /// <summary>NIC the dashboard was built for.</summary>
    public string ProsumerNIC { get; set; } = string.Empty;

    /// <summary>Headline counters for this prosumer.</summary>
    public DashboardSummaryDto Summary { get; set; } = new();

    /// <summary>Transactions still awaiting a scan.</summary>
    public IEnumerable<TransactionResponseDto> PendingTransactions { get; set; } = Enumerable.Empty<TransactionResponseDto>();

    /// <summary>Transactions verified at the station but not yet completed.</summary>
    public IEnumerable<TransactionResponseDto> CurrentTransactions { get; set; } = Enumerable.Empty<TransactionResponseDto>();

    /// <summary>Most recent completed transfers.</summary>
    public IEnumerable<TransactionResponseDto> CompletedTransactions { get; set; } = Enumerable.Empty<TransactionResponseDto>();

    /// <summary>Approved reservations dated today or later that have no QR yet.</summary>
    public IEnumerable<UpcomingReservationDto> ApprovedFutureReservations { get; set; } = Enumerable.Empty<UpcomingReservationDto>();
}

/// <summary>Response of GET /api/dashboard/operator.</summary>
public class OperatorDashboardDto
{
    /// <summary>Headline counters across every station.</summary>
    public DashboardSummaryDto Summary { get; set; } = new();

    /// <summary>Transactions whose slot date is today.</summary>
    public IEnumerable<TransactionResponseDto> TodayTransfers { get; set; } = Enumerable.Empty<TransactionResponseDto>();

    /// <summary>Transactions awaiting a scan or awaiting confirmation.</summary>
    public IEnumerable<TransactionResponseDto> PendingTransfers { get; set; } = Enumerable.Empty<TransactionResponseDto>();

    /// <summary>Most recently completed transfers.</summary>
    public IEnumerable<TransactionResponseDto> RecentCompleted { get; set; } = Enumerable.Empty<TransactionResponseDto>();
}

/// <summary>An approved reservation that is ready for a QR to be generated.</summary>
public class UpcomingReservationDto
{
    /// <summary>Business key of the reservation.</summary>
    public string ReservationId { get; set; } = string.Empty;

    /// <summary>Station the energy will be collected from.</summary>
    public string StationId { get; set; } = string.Empty;

    /// <summary>Station display name.</summary>
    public string? StationName { get; set; }

    /// <summary>Booking slot identifier.</summary>
    public string SlotId { get; set; } = string.Empty;

    /// <summary>Date of the booked slot.</summary>
    public DateTime SlotDate { get; set; }

    /// <summary>Booked slot window rendered as "HH:mm - HH:mm".</summary>
    public string SlotTime { get; set; } = string.Empty;

    /// <summary>Energy reserved, in kWh.</summary>
    public double ReservedCapacity { get; set; }

    /// <summary>Reservation status as stored by Component 3.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>True when a transaction/QR already exists for this reservation.</summary>
    public bool HasTransaction { get; set; }
}
