package com.smartsolar.mobile.data.repository

import com.smartsolar.mobile.data.api.ApiService
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.model.CreateReservationRequest
import com.smartsolar.mobile.data.model.Reservation
import com.smartsolar.mobile.data.model.UpdateReservationRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ReservationRepository(
    private val apiService: ApiService = RetrofitClient.apiService,
) {
    suspend fun getAllReservations(): Result<List<Reservation>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getReservations()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Could not load reservations (HTTP ${response.code()})."))
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
