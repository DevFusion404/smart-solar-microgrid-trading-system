package com.smartsolar.mobile.data.local

import android.content.Context
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.api.UserSummary
import com.smartsolar.mobile.data.model.SessionRecord
import java.time.Instant

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
