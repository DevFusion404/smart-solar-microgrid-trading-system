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
            val localSlots = dbHelper.getSlotsByStation(stationId)
            Result.success(localSlots)
        } catch (e: Exception) {
            val localSlots = dbHelper.getSlotsByStation(stationId)
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
}
