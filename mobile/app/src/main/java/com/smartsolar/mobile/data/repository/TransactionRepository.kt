package com.smartsolar.mobile.data.repository

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.smartsolar.mobile.data.api.DashboardApiService
import com.smartsolar.mobile.data.api.QRCodeApiService
import com.smartsolar.mobile.data.api.ReservationApprovalApiService
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.api.TransactionApiService
import com.smartsolar.mobile.data.model.CompleteTransferRequest
import com.smartsolar.mobile.data.model.DashboardSummary
import com.smartsolar.mobile.data.model.GenerateQrRequest
import com.smartsolar.mobile.data.model.OperationResult
import com.smartsolar.mobile.data.model.OperatorDashboard
import com.smartsolar.mobile.data.model.PagedResult
import com.smartsolar.mobile.data.model.PendingReservation
import com.smartsolar.mobile.data.model.ProsumerDashboard
import com.smartsolar.mobile.data.model.QrGenerationResponse
import com.smartsolar.mobile.data.model.QrVerificationResponse
import com.smartsolar.mobile.data.model.RejectTransferRequest
import com.smartsolar.mobile.data.model.TransactionResponse
import com.smartsolar.mobile.data.model.UpdateReservationStatusRequest
import com.smartsolar.mobile.data.model.VerifyQrRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Response
import java.io.IOException

/**
 * Component 4 repository - wraps the dashboard, QR and transaction services
 * behind the Result<T> contract already used by ReservationRepository.
 *
 * The backend answers failures with an ApiErrorResponse envelope, so
 * [errorMessageOf] surfaces the server wording (for example "This reservation
 * has already been completed") instead of a bare HTTP status.
 */
class TransactionRepository(
    private val dashboardApi: DashboardApiService =
        RetrofitClient.instance.create(DashboardApiService::class.java),
    private val qrApi: QRCodeApiService =
        RetrofitClient.instance.create(QRCodeApiService::class.java),
    private val transactionApi: TransactionApiService =
        RetrofitClient.instance.create(TransactionApiService::class.java),
    private val approvalApi: ReservationApprovalApiService =
        RetrofitClient.instance.create(ReservationApprovalApiService::class.java),
) {

    // -- Reservation approval queue --------------------------------------------

    /**
     * Reservations still awaiting a decision, oldest slot first so the queue
     * reads in the order an operator would work it.
     */
    suspend fun getPendingReservations(): Result<List<PendingReservation>> =
        withContext(Dispatchers.IO) {
            call("Could not load the reservation queue") { approvalApi.getAllReservations() }
                .map { reservations ->
                    reservations.filter { it.isPending }.sortedBy { it.slotDate }
                }
        }

    /**
     * Every reservation the signed-in grid operator is allowed to see, in any status.
     * The server limits the list to the operator's assigned nodes
     * (BackofficeReservationsController.GetAll) and returns the newest slot date first.
     */
    suspend fun getOperatorReservations(): Result<List<PendingReservation>> =
        withContext(Dispatchers.IO) {
            call("Could not load reservations") { approvalApi.getAllReservations() }
        }

    /**
     * Approves a reservation. The server mints the QR pass as part of the same
     * update, so nothing further is needed to produce the prosumer's QR.
     */
    suspend fun approveReservation(reservationId: String): Result<PendingReservation> =
        withContext(Dispatchers.IO) {
            call("Could not approve this reservation") {
                approvalApi.updateStatus(reservationId, UpdateReservationStatusRequest("Approved"))
            }
        }

    /** Declines a reservation and releases its slot capacity. */
    suspend fun cancelReservation(reservationId: String): Result<PendingReservation> =
        withContext(Dispatchers.IO) {
            call("Could not cancel this reservation") {
                approvalApi.updateStatus(reservationId, UpdateReservationStatusRequest("Cancelled"))
            }
        }

    // -- Dashboards ------------------------------------------------------------

    suspend fun getMyDashboard(): Result<ProsumerDashboard> = withContext(Dispatchers.IO) {
        call("Could not load your dashboard") { dashboardApi.getMyDashboard() }
    }

    suspend fun getOperatorDashboard(): Result<OperatorDashboard> = withContext(Dispatchers.IO) {
        call("Could not load the operator dashboard") { dashboardApi.getOperatorDashboard() }
    }

    suspend fun getSummary(prosumerNic: String? = null): Result<DashboardSummary> =
        withContext(Dispatchers.IO) {
            call("Could not load transfer counters") { dashboardApi.getSummary(prosumerNic) }
        }

    // -- QR generation and verification ----------------------------------------

    suspend fun generateQr(reservationId: String): Result<QrGenerationResponse> =
        withContext(Dispatchers.IO) {
            call("Could not generate a QR code") { qrApi.generateQr(GenerateQrRequest(reservationId)) }
        }

    suspend fun getQr(transactionId: String): Result<QrGenerationResponse> =
        withContext(Dispatchers.IO) {
            call("Could not load this QR code") { qrApi.getQr(transactionId) }
        }

    /**
     * Sends a scanned token for validation. A rejected code is a successful call
     * carrying success = false, so the caller reads the flag, not the Result.
     */
    suspend fun verifyQr(qrToken: String): Result<QrVerificationResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = qrApi.verifyQr(VerifyQrRequest(qrToken))
                val body = response.body()
                when {
                    response.isSuccessful && body != null -> Result.success(body)
                    // The API also reports a bad token through the error envelope.
                    else -> Result.success(
                        QrVerificationResponse(
                            success = false,
                            message = errorMessageOf(response, "QR verification failed"),
                            errorCode = errorCodeOf(response)
                        )
                    )
                }
            } catch (exception: IOException) {
                Result.failure(Exception("Unable to connect to server"))
            } catch (exception: Exception) {
                Result.failure(exception)
            }
        }

    // -- Transactions ----------------------------------------------------------

    suspend fun getTransaction(transactionId: String): Result<TransactionResponse> =
        withContext(Dispatchers.IO) {
            call("Could not load this transaction") { transactionApi.getTransaction(transactionId) }
        }

    suspend fun getMyTransactions(status: String? = null): Result<List<TransactionResponse>> =
        withContext(Dispatchers.IO) {
            call("No booking records found") { transactionApi.getMyTransactions(status) }
        }

    suspend fun getHistory(
        prosumerNic: String,
        status: String? = null,
    ): Result<List<TransactionResponse>> = withContext(Dispatchers.IO) {
        call("No booking records found") { transactionApi.getHistory(prosumerNic, status) }
    }

    suspend fun searchTransactions(
        status: String? = null,
        date: String? = null,
        stationId: String? = null,
        prosumerNic: String? = null,
        fromDate: String? = null,
        toDate: String? = null,
        page: Int = 1,
        pageSize: Int = 20,
    ): Result<PagedResult<TransactionResponse>> = withContext(Dispatchers.IO) {
        call("Could not search transfers") {
            transactionApi.searchTransactions(
                status, date, stationId, prosumerNic, fromDate, toDate, page, pageSize
            )
        }
    }

    suspend fun completeTransfer(
        transactionId: String,
        deliveredEnergy: Double? = null,
        remarks: String? = null,
    ): Result<OperationResult> = withContext(Dispatchers.IO) {
        call("Could not complete this transfer") {
            transactionApi.completeTransfer(
                transactionId,
                CompleteTransferRequest(deliveredEnergy, remarks)
            )
        }
    }

    suspend fun rejectTransfer(transactionId: String, reason: String): Result<OperationResult> =
        withContext(Dispatchers.IO) {
            call("Could not reject this transfer") {
                transactionApi.rejectTransfer(transactionId, RejectTransferRequest(reason))
            }
        }

    // -- Shared plumbing -------------------------------------------------------

    /** Runs a call, unwrapping the body or turning the error envelope into a message. */
    private suspend fun <T> call(fallback: String, block: suspend () -> Response<T>): Result<T> =
        try {
            val response = block()
            val body = response.body()
            if (response.isSuccessful && body != null) {
                Result.success(body)
            } else {
                Result.failure(Exception(errorMessageOf(response, fallback)))
            }
        } catch (exception: IOException) {
            Result.failure(Exception("Unable to connect to server"))
        } catch (exception: Exception) {
            Result.failure(exception)
        }

    private fun <T> errorMessageOf(response: Response<T>, fallback: String): String {
        if (response.code() == 401) return "Your session has expired. Please sign in again."
        val parsed = parseError(response)
        return parsed?.message?.takeIf { it.isNotBlank() }
            ?: "$fallback (HTTP ${response.code()})."
    }

    private fun <T> errorCodeOf(response: Response<T>): String? = parseError(response)?.errorCode

    private fun <T> parseError(response: Response<T>): ApiError? = try {
        response.errorBody()?.string()?.takeIf { it.isNotBlank() }?.let {
            Gson().fromJson(it, ApiError::class.java)
        }
    } catch (exception: Exception) {
        null
    }

    /** Mirrors backend/DTOs/Common/ApiErrorResponse.cs. */
    private data class ApiError(
        @SerializedName("errorCode") val errorCode: String? = null,
        @SerializedName("message") val message: String? = null,
    )
}
