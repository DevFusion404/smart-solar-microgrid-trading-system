package com.smartsolar.mobile.data.local

import android.content.Context
import android.content.SharedPreferences
import com.smartsolar.mobile.data.api.RetrofitClient

/**
 * TokenManager — Manages persistent storage of JWT auth token and cached user session details.
 */
object TokenManager {

    private const val PREF_NAME = "smart_solar_auth_prefs"
    private const val KEY_AUTH_TOKEN = "jwt_token"
    private const val KEY_USERNAME = "user_username"
    private const val KEY_FULL_NAME = "user_full_name"
    private const val KEY_USER_ROLE = "user_role"
    private const val KEY_USER_STATUS = "user_status"
    private const val KEY_NIC = "user_nic"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    /**
     * Saves JWT auth token and user information. Synchronizes with RetrofitClient.
     */
    fun saveSession(
        context: Context,
        token: String,
        username: String,
        fullName: String,
        role: String,
        status: String,
        nic: String? = null
    ) {
        val prefs = getPrefs(context)
        prefs.edit()
            .putString(KEY_AUTH_TOKEN, token)
            .putString(KEY_USERNAME, username)
            .putString(KEY_FULL_NAME, fullName)
            .putString(KEY_USER_ROLE, role)
            .putString(KEY_USER_STATUS, status)
            .putString(KEY_NIC, nic)
            .apply()

        RetrofitClient.authToken = token
    }

    /**
     * Retrieves the stored JWT auth token. Also syncs RetrofitClient if token is available.
     */
    fun getToken(context: Context): String? {
        val token = getPrefs(context).getString(KEY_AUTH_TOKEN, null)
        if (!token.isNullOrBlank() && RetrofitClient.authToken.isNullOrBlank()) {
            RetrofitClient.authToken = token
        }
        return token
    }

    /** Returns true if a valid JWT token is stored. */
    fun isLoggedIn(context: Context): Boolean {
        return !getToken(context).isNullOrBlank()
    }

    fun getUsername(context: Context): String? = getPrefs(context).getString(KEY_USERNAME, null)
    fun getFullName(context: Context): String? = getPrefs(context).getString(KEY_FULL_NAME, null)
    fun getUserRole(context: Context): String? = getPrefs(context).getString(KEY_USER_ROLE, null)
    fun getUserStatus(context: Context): String? = getPrefs(context).getString(KEY_USER_STATUS, null)
    fun getNic(context: Context): String? = getPrefs(context).getString(KEY_NIC, null)

    /**
     * Clears all saved authentication session details on logout.
     */
    fun clearSession(context: Context) {
        getPrefs(context).edit().clear().apply()
        RetrofitClient.authToken = null
    }
}
