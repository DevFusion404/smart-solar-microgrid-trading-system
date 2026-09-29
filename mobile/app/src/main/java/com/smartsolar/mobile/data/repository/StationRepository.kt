package com.smartsolar.mobile.data.repository

import android.content.Context
import android.location.Location
import com.smartsolar.mobile.data.api.ApiException
import com.smartsolar.mobile.data.api.ApiService
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.local.DatabaseHelper
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.data.model.StationMapPin
import com.smartsolar.mobile.utils.NetworkUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

/** Which point the nearest-station distances were measured from. */
enum class NearbyOrigin(val label: String) {
    CURRENT_LOCATION("your current location"),
    HOME_LOCATION("your home location")
}

/** Stations sorted nearest-first by the API, plus the point they were measured from. */
data class NearbyStations(
    val stations: List<Station>,
    val origin: NearbyOrigin
)

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
     * Explicitly synchronizes all stations from cloud backend into local SQLite.
     * Returns the count of synchronized stations.
     */
    suspend fun syncStations(): Result<Int> = withContext(Dispatchers.IO) {
        try {
            if (!NetworkUtils.isNetworkAvailable(context)) {
                return@withContext Result.failure(Exception("No internet connection available for sync"))
            }

            val response = apiService.getStations()
            if (response.isSuccessful && response.body() != null) {
                val stations = response.body()!!
                dbHelper.insertStations(stations)
                Result.success(stations.size)
            } else {
                Result.failure(Exception("Backend returned code ${response.code()} during sync"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Searches stations by location keyword and availability using backend API:
     * GET /api/stations/search?location={location}&available={available}
     * When offline or on network failure, falls back to local SQLite database.
     */
    suspend fun searchStations(
        location: String?,
        available: Boolean?
    ): Result<List<Station>> = withContext(Dispatchers.IO) {
        try {
            val queryLocation = if (location.isNullOrBlank()) null else location.trim()

            if (NetworkUtils.isNetworkAvailable(context)) {
                val response = apiService.searchStations(queryLocation, available)
                if (response.isSuccessful && response.body() != null) {
                    val stations = response.body()!!
                    return@withContext Result.success(stations)
                }
            }

            // Offline SQLite fallback
            val localStations = dbHelper.getAllStations()
            val filtered = localStations.filter { station ->
                val matchesLocation = queryLocation.isNullOrBlank() ||
                        station.address.contains(queryLocation, ignoreCase = true) ||
                        station.stationName.contains(queryLocation, ignoreCase = true) ||
                        station.stationId.contains(queryLocation, ignoreCase = true)

                val matchesAvailable = when (available) {
                    true -> station.status.equals("Active", ignoreCase = true)
                    false -> !station.status.equals("Active", ignoreCase = true)
                    null -> true
                }

                matchesLocation && matchesAvailable
            }

            Result.success(filtered)
        } catch (e: Exception) {
            val fallback = dbHelper.getAllStations()
            Result.success(fallback)
        }
    }

    /**
     * Asks the API for the active stations nearest to the prosumer.
     * - With a live location: GET /api/stations/nearby?lat=&lng=
     * - Without one (permission denied / GPS off): GET /api/stations/nearby/me,
     *   which uses the home location saved on the prosumer's account.
     * The API does the distance calculation and sorting (FAT service); the app only displays it.
     * Fails with ApiException(errorCode = "HOME_LOCATION_NOT_SET") when no home location is saved.
     */
    suspend fun findNearestStations(
        liveLocation: Location?,
        limit: Int = NEARBY_LIMIT
    ): Result<NearbyStations> = withContext(Dispatchers.IO) {
        try {
            if (!NetworkUtils.isNetworkAvailable(context)) {
                return@withContext Result.failure(Exception("No internet connection"))
            }

            val (response, origin) = if (liveLocation != null) {
                apiService.getNearbyStations(liveLocation.latitude, liveLocation.longitude, limit = limit) to
                    NearbyOrigin.CURRENT_LOCATION
            } else {
                apiService.getNearbyStationsFromHome(limit = limit) to NearbyOrigin.HOME_LOCATION
            }

            if (response.isSuccessful && response.body() != null) {
                Result.success(NearbyStations(response.body()!!, origin))
            } else {
                Result.failure(toApiException(response.code(), response.errorBody()?.string()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Nearest stations to an explicit point (used on the registration screen before login,
     * to preview the prosumer's nearest station).
     */
    suspend fun findNearestStationsTo(
        latitude: Double,
        longitude: Double,
        limit: Int = 1
    ): Result<List<Station>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getNearbyStations(latitude, longitude, limit = limit)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(toApiException(response.code(), response.errorBody()?.string()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Builds an ApiException from an error response ({ errorCode, message })
    private fun toApiException(httpStatus: Int, body: String?): ApiException {
        return try {
            val json = if (body.isNullOrBlank()) null else JSONObject(body)
            ApiException(
                httpStatus,
                json?.optString("errorCode")?.ifBlank { null },
                json?.optString("message")?.ifBlank { null } ?: "Request failed (HTTP $httpStatus)"
            )
        } catch (e: Exception) {
            ApiException(httpStatus, null, "Request failed (HTTP $httpStatus)")
        }
    }

    companion object {
        /** How many nearest stations to request (enough to rank the whole network in practice). */
        const val NEARBY_LIMIT = 50

        /** errorCode returned by /nearby/me when the prosumer has no saved home location. */
        const val HOME_LOCATION_NOT_SET = "HOME_LOCATION_NOT_SET"
    }
}
