package com.smartsolar.mobile.data.api

import com.smartsolar.mobile.data.model.PendingReservation
import com.smartsolar.mobile.data.model.UpdateReservationStatusRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path

/**
 * Component 4 - the reservation approval queue shared by Backoffice and
 * Grid Operators.
 *
 * Approving through [updateStatus] is what issues the reservation QR pass:
 * the server sets QrToken, QrGeneratedAt and QrIsActive in the same update
 * (EnergyReservationService.UpdateStatusForBackofficeAsync). There is no
 * separate "generate QR" call to make afterwards.
 */
interface ReservationApprovalApiService {

    /** Every reservation, newest slot date first. Filtered to the queue on device. */
    @GET("api/backoffice/reservations")
    suspend fun getAllReservations(): Response<List<PendingReservation>>

    /** Moves a reservation to Approved, Reviewing or Cancelled. */
    @PATCH("api/backoffice/reservations/{reservationId}/status")
    suspend fun updateStatus(
        @Path("reservationId") reservationId: String,
        @Body request: UpdateReservationStatusRequest,
    ): Response<PendingReservation>
}
