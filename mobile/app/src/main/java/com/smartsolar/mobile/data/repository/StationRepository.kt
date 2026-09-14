package com.smartsolar.mobile.data.repository

import android.content.Context
import com.smartsolar.mobile.data.api.ApiService
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.local.DatabaseHelper
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.data.model.StationMapPin
import com.smartsolar.mobile.utils.NetworkUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class StationRepository(
    private val context: Context,
    private val apiService: ApiService = RetrofitClient.apiService,
    private val dbHelper: DatabaseHelper = DatabaseHelper(context)
) {

    /**
     * Fetches stations with offline-first support.
     * When online: Fetches from backend, saves to SQLite, and returns live list.
     * When offline: Returns cached stations from local SQLite.
     */
    suspend fun getStations(forceRefresh: Boolean = false): Result<List<Station>> =
        withContext(Dispatchers.IO) {
            try {
                if (NetworkUtils.isNetworkAvailable(context) && forceRefresh) {
                    val response = apiService.getStations()
                    if (response.isSuccessful && response.body() != null) {
                        val stations = response.body()!!
                        dbHelper.insertStations(stations)
                        return@withContext Result.success(stations)
                    }
                }

                // Check local SQLite first or as offline fallback
                val localStations = dbHelper.getAllStations()
                if (localStations.isNotEmpty() && !forceRefresh) {
                    return@withContext Result.success(localStations)
                }

                // If local was empty or forceRefresh, try network
                if (NetworkUtils.isNetworkAvailable(context)) {
                    val response = apiService.getStations()
                    if (response.isSuccessful && response.body() != null) {
                        val stations = response.body()!!
                        dbHelper.insertStations(stations)
                        return@withContext Result.success(stations)
                    }
                }

                Result.success(localStations)
            } catch (e: Exception) {
                val fallback = dbHelper.getAllStations()
                if (fallback.isNotEmpty()) {
                    Result.success(fallback)
                } else {
                    Result.failure(e)
                }
            }
        }

    /**
     * Fetches station pins for Google Maps display.
     */
    suspend fun getMapPins(): Result<List<StationMapPin>> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getMapPins()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Failed to load map pins: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * Searches stations by location keyword and/or availability flag.
     */
    suspend fun searchStations(location: String?, available: Boolean?): Result<List<Station>> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.searchStations(location, available)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Search failed with code ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
}
