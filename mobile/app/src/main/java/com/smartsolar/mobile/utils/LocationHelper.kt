/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : LocationHelper.kt
 * Description : Reads the phone's location ONCE (no background tracking) so the
 *               app can ask the API for the nearest microgrid stations.
 *               - Uses only "while using the app" permission (fine or coarse).
 *               - Returns a recent cached fix immediately when one exists,
 *                 otherwise waits for one fresh GPS/network fix (with timeout)
 *                 and then stops listening.
 *               Uses the Android framework LocationManager, so no extra
 *               library (e.g. Google Play Services) is needed.
 * =====================================================
 */

package com.smartsolar.mobile.utils

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import java.util.Locale
import kotlin.coroutines.resume

object LocationHelper {

    /** Permissions requested at runtime (the user may grant only approximate location). */
    val PERMISSIONS = arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    )

    /** Result of a single location request. */
    sealed interface Outcome {
        data class Found(val location: Location) : Outcome
        data object PermissionMissing : Outcome
        data object LocationOff : Outcome
        data object Unavailable : Outcome
    }

    // True when precise or approximate location permission has been granted
    fun hasPermission(context: Context): Boolean =
        hasFinePermission(context) ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    // True when precise (GPS) permission has been granted
    private fun hasFinePermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    // True when the device's location setting is switched on
    fun isLocationEnabled(context: Context): Boolean {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return false
        return LocationManagerCompat.isLocationEnabled(lm)
    }

    // Opens the system screen where the user can switch location on
    fun openLocationSettings(context: Context) {
        context.startActivity(
            Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }

    // Formats a location as "6.92710, 79.86120" for display
    fun format(latitude: Double, longitude: Double): String =
        String.format(Locale.US, "%.5f, %.5f", latitude, longitude)

    /**
     * Gets the current location once.
     * @param timeoutMs      how long to wait for a fresh fix before giving up
     * @param maxCacheAgeMs  a cached fix younger than this is returned immediately
     */
    suspend fun getCurrentLocation(
        context: Context,
        timeoutMs: Long = 10_000,
        maxCacheAgeMs: Long = 2 * 60_000
    ): Outcome {
        val appContext = context.applicationContext
        if (!hasPermission(appContext)) return Outcome.PermissionMissing

        val lm = appContext.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            ?: return Outcome.Unavailable

        // GPS needs precise permission; the network provider works with approximate permission
        val providers = buildList {
            if (hasFinePermission(appContext) && lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                add(LocationManager.GPS_PROVIDER)
            }
            if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                add(LocationManager.NETWORK_PROVIDER)
            }
        }
        if (providers.isEmpty()) return Outcome.LocationOff

        return try {
            val cached = newestLastKnown(lm, providers)
            if (cached != null && ageMs(cached) <= maxCacheAgeMs) {
                return Outcome.Found(cached)
            }

            val fresh = withTimeoutOrNull(timeoutMs) { awaitFirstFix(lm, providers) }
            when {
                fresh != null -> Outcome.Found(fresh)
                cached != null -> Outcome.Found(cached) // an older fix is better than none
                else -> Outcome.Unavailable
            }
        } catch (e: SecurityException) {
            Outcome.PermissionMissing
        }
    }

    // Returns the most recent last-known fix from the given providers, if any
    @SuppressLint("MissingPermission") // permission is checked by the caller
    private fun newestLastKnown(lm: LocationManager, providers: List<String>): Location? =
        providers
            .mapNotNull { lm.getLastKnownLocation(it) }
            .maxByOrNull { it.elapsedRealtimeNanos }

    // Age of a fix in milliseconds, measured on the device's monotonic clock
    private fun ageMs(location: Location): Long =
        (SystemClock.elapsedRealtimeNanos() - location.elapsedRealtimeNanos) / 1_000_000

    // Listens on all providers until the first fix arrives, then stops listening
    @SuppressLint("MissingPermission") // permission is checked by the caller
    private suspend fun awaitFirstFix(lm: LocationManager, providers: List<String>): Location =
        suspendCancellableCoroutine { continuation ->
            val listener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    lm.removeUpdates(this)
                    if (continuation.isActive) continuation.resume(location)
                }

                // Older Android versions call these, so they must be implemented
                @Deprecated("Deprecated in Java")
                override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }

            providers.forEach { provider ->
                lm.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
            }

            // Timeout or screen closed: stop listening so the GPS is not left running
            continuation.invokeOnCancellation { lm.removeUpdates(listener) }
        }
}
