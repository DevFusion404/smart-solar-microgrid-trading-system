package com.smartsolar.mobile.data.api

import com.smartsolar.mobile.data.model.EnergySlot
import com.smartsolar.mobile.data.model.CreateReservationRequest
import com.smartsolar.mobile.data.model.Reservation
import com.smartsolar.mobile.data.model.SlotCapacityUpdate
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.data.model.StationMapPin
import com.smartsolar.mobile.data.model.UpdateReservationRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    @POST("api/reservations")
    suspend fun createReservation(
        @Body request: CreateReservationRequest
    ): Response<Reservation>

    @GET("api/reservations")
    suspend fun getReservations(): Response<List<Reservation>>

    @PUT("api/reservations/{reservationId}")
    suspend fun updateReservation(
        @Path("reservationId") reservationId: String,
        @Body request: UpdateReservationRequest
    ): Response<Reservation>

    @DELETE("api/reservations/{reservationId}")
    suspend fun deleteReservation(
        @Path("reservationId") reservationId: String
    ): Response<Unit>

    // ── Station Endpoints ──────────────────────────────────────────────────────

    @GET("api/stations")
    suspend fun getStations(): Response<List<Station>>

    @GET("api/stations/{id}")
    suspend fun getStationById(
        @Path("id") id: String
    ): Response<Station>

    @POST("api/stations")
    suspend fun createStation(
        @Body station: Station
    ): Response<Station>

    @PUT("api/stations/{id}")
    suspend fun updateStation(
        @Path("id") id: String,
        @Body station: Station
    ): Response<Map<String, String>>

    @PUT("api/stations/{id}/deactivate")
    suspend fun deactivateStation(
        @Path("id") id: String
    ): Response<Map<String, String>>

    @GET("api/stations/search")
    suspend fun searchStations(
        @Query("location") location: String?,
        @Query("available") available: Boolean?
    ): Response<List<Station>>

    @GET("api/stations/map")
    suspend fun getMapPins(): Response<List<StationMapPin>>

    // ── Energy Slot Endpoints ──────────────────────────────────────────────────

    @POST("api/stations/{stationId}/slots")
    suspend fun createSlot(
        @Path("stationId") stationId: String,
        @Body slot: EnergySlot
    ): Response<EnergySlot>

    @GET("api/stations/{stationId}/slots")
    suspend fun getSlotsByStation(
        @Path("stationId") stationId: String,
        @Query("date") date: String? = null
    ): Response<List<EnergySlot>>

    @GET("api/slots/{id}")
    suspend fun getSlotById(
        @Path("id") id: String
    ): Response<EnergySlot>

    @PUT("api/slots/{id}")
    suspend fun updateSlot(
        @Path("id") id: String,
        @Body slot: EnergySlot
    ): Response<Map<String, String>>

    @PUT("api/slots/{id}/capacity")
    suspend fun adjustCapacity(
        @Path("id") id: String,
        @Body capacity: SlotCapacityUpdate
    ): Response<Map<String, String>>
}
