package com.smartsolar.mobile.data.model

import com.google.gson.annotations.SerializedName

// ──────────────────────────────────────────────────────────────────────────────
// Component 4 — Energy Transfer and Transaction Management
// Mirrors backend/DTOs/Transactions/TransactionDtos.cs.
// Field names follow the ASP.NET camelCase wire format, so "ProsumerNIC"
// arrives as "prosumerNIC" and "QRStatus" as "qrStatus".
// ──────────────────────────────────────────────────────────────────────────────

/** Full transaction view returned by every transfer read endpoint. */
data class TransactionResponse(
    @SerializedName("transactionId")
    val transactionId: String = "",

    @SerializedName("reservationId")
    val reservationId: String = "",

    @SerializedName("prosumerNIC")
    val prosumerNic: String = "",

    @SerializedName("prosumerName")
    val prosumerName: String? = null,

    @SerializedName("stationId")
    val stationId: String = "",

    @SerializedName("stationName")
    val stationName: String? = null,

    @SerializedName("slotId")
    val slotId: String? = null,

    @SerializedName("energyAmount")
    val energyAmount: Double = 0.0,

    @SerializedName("slotDate")
    val slotDate: String = "",

    @SerializedName("slotTime")
    val slotTime: String = "",

    @SerializedName("transactionDate")
    val transactionDate: String = "",

    @SerializedName("qrStatus")
    val qrStatus: String = "",

    @SerializedName("qrExpiryDate")
    val qrExpiryDate: String = "",

    @SerializedName("verificationStatus")
    val verificationStatus: String = "",

    @SerializedName("transferStatus")
    val transferStatus: String = "",

    @SerializedName("operatorId")
    val operatorId: String? = null,

    @SerializedName("operatorName")
    val operatorName: String? = null,

    @SerializedName("verifiedDate")
    val verifiedDate: String? = null,

    @SerializedName("completedDate")
    val completedDate: String? = null,

    @SerializedName("failureReason")
    val failureReason: String? = null,

    @SerializedName("remarks")
    val remarks: String? = null
)

/** An approved reservation that is ready for a QR to be generated. */
data class UpcomingReservation(
    @SerializedName("reservationId")
    val reservationId: String = "",

    @SerializedName("stationId")
    val stationId: String = "",

    @SerializedName("stationName")
    val stationName: String? = null,

    @SerializedName("slotId")
    val slotId: String = "",

    @SerializedName("slotDate")
    val slotDate: String = "",

    @SerializedName("slotTime")
    val slotTime: String = "",

    @SerializedName("reservedCapacity")
    val reservedCapacity: Double = 0.0,

    @SerializedName("status")
    val status: String = "",

    @SerializedName("hasTransaction")
    val hasTransaction: Boolean = false
)

// ── Request bodies ────────────────────────────────────────────────────────────

data class GenerateQrRequest(
    @SerializedName("reservationId")
    val reservationId: String
)

data class VerifyQrRequest(
    @SerializedName("qrToken")
    val qrToken: String
)

data class CompleteTransferRequest(
    @SerializedName("deliveredEnergy")
    val deliveredEnergy: Double? = null,

    @SerializedName("remarks")
    val remarks: String? = null
)

data class RejectTransferRequest(
    @SerializedName("reason")
    val reason: String
)

// ── Responses ─────────────────────────────────────────────────────────────────

/** Response of POST /api/transactions/generate-qr and GET /api/transactions/{id}/qr. */
data class QrGenerationResponse(
    @SerializedName("transactionId")
    val transactionId: String = "",

    @SerializedName("qrToken")
    val qrToken: String = "",

    /** Base64 PNG rendered by the backend; may be blank, in which case the app renders locally. */
    @SerializedName("qrImageData")
    val qrImageData: String = "",

    /** JSON payload that the scanner reads out of the QR image. */
    @SerializedName("qrPayload")
    val qrPayload: String = "",

    @SerializedName("expiryDate")
    val expiryDate: String = "",

    @SerializedName("transaction")
    val transaction: TransactionResponse? = null
)

/** Response of POST /api/transactions/verify-qr. Resolves for invalid codes too. */
data class QrVerificationResponse(
    @SerializedName("success")
    val success: Boolean = false,

    @SerializedName("message")
    val message: String = "",

    @SerializedName("errorCode")
    val errorCode: String? = null,

    @SerializedName("transactionDetails")
    val transactionDetails: TransactionResponse? = null
)

/** Response of the complete and reject endpoints. */
data class OperationResult(
    @SerializedName("message")
    val message: String = "",

    @SerializedName("transactionId")
    val transactionId: String? = null,

    @SerializedName("timestamp")
    val timestamp: String = "",

    @SerializedName("transaction")
    val transaction: TransactionResponse? = null
)

/** Headline transfer counters shared by both dashboards. */
data class DashboardSummary(
    @SerializedName("pendingTransfers")
    val pendingTransfers: Long = 0,

    @SerializedName("verifiedTransfers")
    val verifiedTransfers: Long = 0,

    @SerializedName("completedTransfers")
    val completedTransfers: Long = 0,

    @SerializedName("todayTransfers")
    val todayTransfers: Long = 0,

    @SerializedName("failedTransfers")
    val failedTransfers: Long = 0,

    @SerializedName("totalEnergyTransferred")
    val totalEnergyTransferred: Double = 0.0,

    @SerializedName("scope")
    val scope: String = "All"
)

/** Response of GET /api/dashboard/prosumer. */
data class ProsumerDashboard(
    @SerializedName("prosumerNIC")
    val prosumerNic: String = "",

    @SerializedName("summary")
    val summary: DashboardSummary = DashboardSummary(),

    @SerializedName("pendingTransactions")
    val pendingTransactions: List<TransactionResponse> = emptyList(),

    @SerializedName("currentTransactions")
    val currentTransactions: List<TransactionResponse> = emptyList(),

    @SerializedName("completedTransactions")
    val completedTransactions: List<TransactionResponse> = emptyList(),

    @SerializedName("approvedFutureReservations")
    val approvedFutureReservations: List<UpcomingReservation> = emptyList()
)

/** Response of GET /api/dashboard/operator. */
data class OperatorDashboard(
    @SerializedName("summary")
    val summary: DashboardSummary = DashboardSummary(),

    @SerializedName("todayTransfers")
    val todayTransfers: List<TransactionResponse> = emptyList(),

    @SerializedName("pendingTransfers")
    val pendingTransfers: List<TransactionResponse> = emptyList(),

    @SerializedName("recentCompleted")
    val recentCompleted: List<TransactionResponse> = emptyList()
)

/** Paged envelope returned by GET /api/transactions/search. */
data class PagedResult<T>(
    @SerializedName("items")
    val items: List<T> = emptyList(),

    @SerializedName("totalCount")
    val totalCount: Int = 0,

    @SerializedName("page")
    val page: Int = 1,

    @SerializedName("pageSize")
    val pageSize: Int = 20,

    @SerializedName("totalPages")
    val totalPages: Int = 0
)
