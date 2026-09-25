package com.smartsolar.mobile.data.repository

import com.smartsolar.mobile.data.api.ApiService
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.model.CreateReservationRequest
import com.smartsolar.mobile.data.model.Reservation
import com.smartsolar.mobile.data.model.UpdateReservationRequest
import java.time.LocalDate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ReservationRepository(
    private val context: android.content.Context? = null,
    private val apiService: ApiService = RetrofitClient.apiService,
    private val dbHelper: com.smartsolar.mobile.data.local.DatabaseHelper? = context?.let { com.smartsolar.mobile.data.local.DatabaseHelper(it) }
) {
    suspend fun getAllReservations(): Result<List<Reservation>> = withContext(Dispatchers.IO) {
        try {
            // Ensure Retrofit has active token if context is available
            context?.let { ctx ->
                if (RetrofitClient.authToken.isNullOrBlank()) {
                    val token = com.smartsolar.mobile.data.local.SessionManager.getToken(ctx)
                    if (!token.isNullOrBlank()) {
                        RetrofitClient.authToken = token
                    }
                }
            }

            val response = apiService.getReservations()
            if (response.isSuccessful && response.body() != null) {
                val list = response.body()!!
                dbHelper?.let { helper ->
                    for (item in list) {
                        helper.insertReservation(item)
                    }
                }
                Result.success(list)
            } else {
                // If remote returned an error, try offline SQLite cache before failing
                val local = dbHelper?.getAllReservations() ?: emptyList()
                if (local.isNotEmpty()) {
                    Result.success(local)
                } else {
                    Result.failure(Exception("Could not load reservations (HTTP ${response.code()})."))
                }
            }
        } catch (exception: Exception) {
            val local = dbHelper?.getAllReservations() ?: emptyList()
            if (local.isNotEmpty()) {
                Result.success(local)
            } else {
                Result.failure(exception)
            }
        }
    }

    suspend fun getReservationHistory(date: LocalDate): Result<List<Reservation>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getReservationHistory(date.toString())
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Could not load reservation history (HTTP ${response.code()})."))
            }
        } catch (exception: Exception) {
            Result.failure(exception)
        }
    }

    suspend fun getReservationQr(reservationId: String): Result<ByteArray> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getReservationQr(reservationId)
            val qrImage = response.body()?.bytes()
            if (response.isSuccessful && qrImage != null && qrImage.isNotEmpty()) {
                Result.success(qrImage)
            } else {
                Result.failure(Exception("QR pass is not available for this reservation (HTTP ${response.code()})."))
            }
        } catch (exception: Exception) {
            Result.failure(exception)
        }
    }

    suspend fun createReservation(slotId: String, requestedCapacity: Double): Result<Reservation> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.createReservation(CreateReservationRequest(slotId, requestedCapacity))
                response.toReservationResult()
            } catch (exception: Exception) {
                Result.failure(exception)
            }
        }

    suspend fun updateReservation(reservationId: String, requestedCapacity: Double): Result<Reservation> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.updateReservation(
                    reservationId,
                    UpdateReservationRequest(requestedCapacity)
                )
                response.toReservationResult()
            } catch (exception: Exception) {
                Result.failure(exception)
            }
        }

    suspend fun deleteReservation(reservationId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.deleteReservation(reservationId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Could not delete reservation (HTTP ${response.code()})."))
            }
        } catch (exception: Exception) {
            Result.failure(exception)
        }
    }

    private fun retrofit2.Response<Reservation>.toReservationResult(): Result<Reservation> =
        if (isSuccessful && body() != null) {
            Result.success(body()!!)
        } else {
            Result.failure(Exception("Reservation request failed (HTTP ${this.code()})."))
        }
}
