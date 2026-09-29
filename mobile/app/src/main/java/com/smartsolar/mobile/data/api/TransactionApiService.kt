package com.smartsolar.mobile.data.api

import com.smartsolar.mobile.data.model.CompleteTransferRequest
import com.smartsolar.mobile.data.model.OperationResult
import com.smartsolar.mobile.data.model.PagedResult
import com.smartsolar.mobile.data.model.RejectTransferRequest
import com.smartsolar.mobile.data.model.TransactionResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Component 4 — transfer completion, history and search.
 */
interface TransactionApiService {

    /** One transaction by its business key. */
    @GET("api/transactions/{transactionId}")
    suspend fun getTransaction(
        @Path("transactionId") transactionId: String
    ): Response<TransactionResponse>

    /** The signed-in prosumer's own transfer history. */
    @GET("api/transactions/my")
    suspend fun getMyTransactions(
        @Query("status") status: String? = null
    ): Response<List<TransactionResponse>>

    /** One prosumer's transfer history by NIC. */
    @GET("api/transactions/history/{prosumerNic}")
    suspend fun getHistory(
        @Path("prosumerNic") prosumerNic: String,
        @Query("status") status: String? = null
    ): Response<List<TransactionResponse>>

    /** Paged search across stations, statuses and slot dates. */
    @GET("api/transactions/search")
    suspend fun searchTransactions(
        @Query("status") status: String? = null,
        @Query("date") date: String? = null,
        @Query("stationId") stationId: String? = null,
        @Query("prosumerNic") prosumerNic: String? = null,
        @Query("fromDate") fromDate: String? = null,
        @Query("toDate") toDate: String? = null,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20
    ): Response<PagedResult<TransactionResponse>>

    /** Confirms that the energy has physically been handed over. */
    @PUT("api/transactions/{transactionId}/complete")
    suspend fun completeTransfer(
        @Path("transactionId") transactionId: String,
        @Body request: CompleteTransferRequest
    ): Response<OperationResult>

    /** Declines a transfer at the station and invalidates its QR token. */
    @PUT("api/transactions/{transactionId}/reject")
    suspend fun rejectTransfer(
        @Path("transactionId") transactionId: String,
        @Body request: RejectTransferRequest
    ): Response<OperationResult>
}
