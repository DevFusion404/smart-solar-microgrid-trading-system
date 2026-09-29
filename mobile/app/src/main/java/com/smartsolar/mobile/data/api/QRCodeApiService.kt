package com.smartsolar.mobile.data.api

import com.smartsolar.mobile.data.model.GenerateQrRequest
import com.smartsolar.mobile.data.model.QrGenerationResponse
import com.smartsolar.mobile.data.model.QrVerificationResponse
import com.smartsolar.mobile.data.model.VerifyQrRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * Component 4 — QR generation (prosumer) and QR verification (grid operator).
 */
interface QRCodeApiService {

    /**
     * Mints a transfer QR for an approved reservation. Calling it twice for the
     * same reservation returns the existing token rather than issuing a second one.
     */
    @POST("api/transactions/generate-qr")
    suspend fun generateQr(
        @Body request: GenerateQrRequest
    ): Response<QrGenerationResponse>

    /** Re-renders an existing QR so the display screen survives a reload. */
    @GET("api/transactions/{transactionId}/qr")
    suspend fun getQr(
        @Path("transactionId") transactionId: String
    ): Response<QrGenerationResponse>

    /**
     * Validates a scanned token. The backend answers 200 for invalid codes too,
     * so callers must read the success flag rather than relying on the HTTP status.
     */
    @POST("api/transactions/verify-qr")
    suspend fun verifyQr(
        @Body request: VerifyQrRequest
    ): Response<QrVerificationResponse>
}
