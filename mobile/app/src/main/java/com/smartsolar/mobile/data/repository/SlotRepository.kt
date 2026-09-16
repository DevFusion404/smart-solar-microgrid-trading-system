package com.smartsolar.mobile.data.repository

import android.content.Context
import com.smartsolar.mobile.data.api.ApiService
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.local.DatabaseHelper
import com.smartsolar.mobile.data.model.EnergySlot
import com.smartsolar.mobile.data.model.SlotCapacityUpdate
import com.smartsolar.mobile.utils.NetworkUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SlotRepository(
    private val context: Context,
    private val apiService: ApiService = RetrofitClient.apiService,
    private val dbHelper: DatabaseHelper = DatabaseHelper(context)
) {

    /**
     * Fetches slots for a station, with fallback to SQLite if offline.
     */
    suspend fun getSlotsByStation(
        stationId: String,
        date: String? = null
    ): Result<List<EnergySlot>> = withContext(Dispatchers.IO) {
        try {
            if (NetworkUtils.isNetworkAvailable(context)) {
                val response = apiService.getSlotsByStation(stationId, date)
                if (response.isSuccessful && response.body() != null) {
                    val slots = response.body()!!
                    for (slot in slots) {
                        dbHelper.insertOrUpdateSlot(slot)
                    }
                    return@withContext Result.success(slots)
                }
            }

            // Fallback to locally cached slots
            val localSlots = dbHelper.getSlotsByStationAndDate(stationId, date)
            Result.success(localSlots)
        } catch (e: Exception) {
            val localSlots = dbHelper.getSlotsByStationAndDate(stationId, date)
            if (localSlots.isNotEmpty()) {
                Result.success(localSlots)
            } else {
                Result.failure(e)
            }
        }
    }

    /**
     * Adjusts available capacity of an energy booking slot.
     */
    suspend fun adjustCapacity(slotId: String, newCapacity: Double): Result<Boolean> =
        withContext(Dispatchers.IO) {
            try {
                if (NetworkUtils.isNetworkAvailable(context)) {
                    val response = apiService.adjustCapacity(
                        slotId,
                        SlotCapacityUpdate(newCapacity)
                    )
                    if (response.isSuccessful) {
                        dbHelper.updateSlotCapacity(slotId, newCapacity)
                        return@withContext Result.success(true)
                    }
                }
                // Offline optimistic update
                dbHelper.updateSlotCapacity(slotId, newCapacity)
                Result.success(true)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * Synchronizes slots across all provided stations.
     * Returns total number of slots synchronized.
     */
    suspend fun syncAllSlots(stations: List<com.smartsolar.mobile.data.model.Station>): Result<Int> =
        withContext(Dispatchers.IO) {
            try {
                if (!NetworkUtils.isNetworkAvailable(context)) {
                    return@withContext Result.failure(Exception("No internet connection available for sync"))
                }

                var totalSlots = 0
                for (station in stations) {
                    val idToQuery = station.stationId.ifBlank { station.id ?: "" }
                    if (idToQuery.isNotBlank()) {
                        val response = apiService.getSlotsByStation(idToQuery)
                        if (response.isSuccessful && response.body() != null) {
                            val slots = response.body()!!
                            dbHelper.insertSlots(slots)
                            totalSlots += slots.size
                        }
                    }
                }
                Result.success(totalSlots)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * Saves a reservation locally and updates slot capacity.
     */
    suspend fun bookSlot(
        slot: EnergySlot,
        requestedCapacity: Double,
        userId: String = "USR-CURRENT"
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val newAvailable = (slot.availableCapacity - requestedCapacity).coerceAtLeast(0.0)

            // Adjust capacity via backend / local
            val adjustResult = adjustCapacity(slot.slotId, newAvailable)
            if (adjustResult.isFailure) {
                return@withContext adjustResult
            }

            // Record reservation locally
            val reservation = com.smartsolar.mobile.data.model.Reservation(
                reservationId = "RES-${System.currentTimeMillis().toString().takeLast(6)}",
                stationId = slot.stationId,
                slotId = slot.slotId,
                userId = userId,
                reservedCapacity = requestedCapacity,
                createdAt = java.time.LocalDateTime.now().toString(),
                status = "Confirmed"
            )
            dbHelper.insertReservation(reservation)
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
