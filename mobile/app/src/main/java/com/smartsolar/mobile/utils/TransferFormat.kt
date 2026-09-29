package com.smartsolar.mobile.utils

import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Component 4 - shared formatting for transfer screens.
 *
 * The backend sends ISO-8601 timestamps (2026-09-21T18:30:00Z). These helpers
 * render them in the device time zone and never throw on a malformed value,
 * because a parse failure must not take a dashboard down.
 */
object TransferFormat {

    private val DATE_OUT: DateTimeFormatter =
        DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.getDefault())

    private val DATE_TIME_OUT: DateTimeFormatter =
        DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.getDefault())

    private val API_DATE: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    /** "2026-09-21T18:30:00Z" -> "21 Sep 2026". Falls back to the raw value. */
    fun date(raw: String?): String {
        val parsed = parse(raw) ?: return raw.orEmpty()
        return parsed.format(DATE_OUT)
    }

    /** "2026-09-21T18:30:00Z" -> "21 Sep 2026, 18:30". Falls back to the raw value. */
    fun dateTime(raw: String?): String {
        val parsed = parse(raw) ?: return raw.orEmpty()
        return parsed.format(DATE_TIME_OUT)
    }

    /** Renders kWh with a single decimal, for example "19.0 kWh". */
    fun energy(value: Double): String = String.format(Locale.getDefault(), "%.1f kWh", value)

    /** Formats a picked date for the API query string (yyyy-MM-dd). */
    fun apiDate(date: LocalDate): String = date.format(API_DATE)

    /** Minutes remaining until an ISO expiry, or null when it cannot be read. */
    fun minutesUntil(raw: String?): Long? {
        val parsed = parse(raw) ?: return null
        return java.time.Duration.between(LocalDateTime.now(), parsed).toMinutes()
    }

    /** True when the ISO timestamp is in the past. An unreadable value is not expired. */
    fun isExpired(raw: String?): Boolean {
        val minutes = minutesUntil(raw) ?: return false
        return minutes < 0
    }

    private fun parse(raw: String?): LocalDateTime? {
        if (raw.isNullOrBlank()) return null
        return try {
            // Instants carry a zone designator; LocalDateTime values do not.
            LocalDateTime.ofInstant(Instant.parse(raw), ZoneId.systemDefault())
        } catch (exception: Exception) {
            try {
                LocalDateTime.parse(raw)
            } catch (inner: Exception) {
                try {
                    LocalDate.parse(raw).atStartOfDay()
                } catch (deepest: Exception) {
                    null
                }
            }
        }
    }
}
