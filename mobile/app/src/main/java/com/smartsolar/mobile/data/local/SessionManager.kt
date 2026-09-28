/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : SessionManager.kt
 * Description : Local login/session persistence using the SQLite `sessions`
 *               table. Saves the session after login, restores it on app
 *               start (only while the JWT is still valid), and ends it on
 *               logout, token expiry or a 401 from the API.
 * =====================================================
 */

package com.smartsolar.mobile.data.local

import android.content.Context
import android.content.Intent
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.api.UserSummary
import com.smartsolar.mobile.data.model.SessionRecord
import com.smartsolar.mobile.ui.activity.SessionExpiredActivity
import java.time.Instant
import java.util.concurrent.atomic.AtomicBoolean

/**
 * SessionManager — Singleton that manages the authenticated user session
 * using the local SQLite `sessions` table as the persistent store.
 *
 * Flow:
 *   1. User logs in → backend (MongoDB) validates → backend returns JWT + user profile.
 *   2. [saveSession] writes the response into the SQLite sessions table.
 *   3. On subsequent app launches, [getActiveSession] reads the SQLite row.
 *   4. [clearSession] deactivates all rows on logout.
 *
 * MongoDB is the source of truth. SQLite is a local cache that is overwritten
 * on every successful login from the server.
 */
object SessionManager {

    // Prevents several parallel 401 responses from opening the expired screen more than once
    private val expiryHandled = AtomicBoolean(false)

    /**
     * Persists the authenticated session to SQLite and syncs the JWT
     * to RetrofitClient for in-memory API calls.
     *
     * @param context    Android context (used to obtain DatabaseHelper)
     * @param token      JWT from POST /api/auth/login
     * @param expiresAt  ISO-8601 expiry string from the login response
     * @param user       UserSummary returned by the backend (MongoDB data)
     * @param email      Full email — may not be in UserSummary; pass empty if unavailable
     * @param phoneNumber Full phone — may not be in UserSummary; pass empty if unavailable
     * @param address    Optional address
     * @param userId     Optional MongoDB ObjectId string
     */
    fun saveSession(
        context: Context,
        token: String,
        expiresAt: String,
        user: UserSummary,
        email: String = "",
        phoneNumber: String = "",
        address: String? = null,
        userId: String = ""
    ) {
        val loggedInAt = Instant.now().toString()

        DatabaseHelper(context).use { db ->
            db.saveSession(
                userId      = userId,
                username    = user.username,
                fullName    = user.fullName,
                email       = email,
                phoneNumber = phoneNumber,
                role        = user.role,
                status      = user.status,
                nic         = user.nic,
                address     = address,
                jwtToken    = token,
                expiresAt   = expiresAt,
                loggedInAt  = loggedInAt
            )
        }

        // Keep Retrofit in-memory token in sync
        RetrofitClient.authToken = token
        expiryHandled.set(false)

        // Also mirror to SharedPreferences so existing TokenManager consumers
        // continue to work without modification during the migration period.
        TokenManager.saveSession(
            context  = context,
            token    = token,
            username = user.username,
            fullName = user.fullName,
            role     = user.role,
            status   = user.status,
            nic      = user.nic
        )
    }

    /**
     * Returns the active [SessionRecord] from SQLite, or null if not logged in.
     */
    fun getActiveSession(context: Context): SessionRecord? {
        return DatabaseHelper(context).use { it.getActiveSession() }
    }

    /**
     * True when the session's JWT expiry time has passed.
     * If the stored value cannot be parsed, the API's 401 response is used instead.
     */
    fun isExpired(session: SessionRecord, now: Instant = Instant.now()): Boolean {
        return try {
            !Instant.parse(session.expiresAt).isAfter(now)
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Registers what happens when the API rejects our token (401): clear the local
     * session and show SessionExpiredActivity. Uses the application context so it
     * is safe to call from any activity.
     */
    fun installSessionExpiryHandler(context: Context) {
        val appContext = context.applicationContext
        RetrofitClient.onUnauthorized = {
            if (expiryHandled.compareAndSet(false, true)) {
                clearSession(appContext)
                val intent = Intent(appContext, SessionExpiredActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                appContext.startActivity(intent)
            }
        }
    }

    /**
     * True when there is an active session row in the SQLite sessions table.
     */
    fun isLoggedIn(context: Context): Boolean {
        return DatabaseHelper(context).use { it.isLoggedIn() }
    }

    /**
     * Convenience getter — returns the role string from the active session, or null.
     */
    fun getRole(context: Context): String? = getActiveSession(context)?.role

    /**
     * Convenience getter — returns username from the active session, or null.
     */
    fun getUsername(context: Context): String? = getActiveSession(context)?.username

    /**
     * Convenience getter — returns the display name from the active session, or null.
     */
    fun getDisplayName(context: Context): String? {
        val session = getActiveSession(context) ?: return null
        return session.fullName.ifBlank { session.username }
    }

    /**
     * Convenience getter — returns the JWT token from the active session, or null.
     */
    fun getToken(context: Context): String? = getActiveSession(context)?.jwtToken

    /**
     * Clears the active session from SQLite and wipes the in-memory Retrofit token.
     * Also clears SharedPreferences for backward compatibility.
     */
    fun clearSession(context: Context) {
        DatabaseHelper(context).use { it.clearSession() }
        RetrofitClient.authToken = null
        TokenManager.clearSession(context)
    }
}
