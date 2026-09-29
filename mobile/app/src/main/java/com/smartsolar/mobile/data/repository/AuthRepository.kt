/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : AuthRepository.kt
 * Description : Calls the login and prosumer-registration endpoints. A
 *               successful login is saved to the SQLite session table via
 *               SessionManager. Failed calls return an ApiException carrying
 *               the API's errorCode and message.
 * =====================================================
 */

package com.smartsolar.mobile.data.repository

import android.content.Context
import com.smartsolar.mobile.data.api.ApiException
import com.smartsolar.mobile.data.api.AuthApiService
import com.smartsolar.mobile.data.api.AuthLoginRequest
import com.smartsolar.mobile.data.api.AuthLoginResponse
import com.smartsolar.mobile.data.api.RegisterProsumerRequest
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.local.SessionManager
import com.smartsolar.mobile.data.model.UserAccount
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

// Data layer for authentication and self-registration
class AuthRepository(
    private val authApiService: AuthApiService =
        RetrofitClient.instance.create(AuthApiService::class.java)
) {

    /**
     * Executes login request to POST /api/auth/login.
     * On success, saves token and user summary details into TokenManager.
     */
    suspend fun login(
        context: Context,
        username: String,
        password: String
    ): Result<AuthLoginResponse> = withContext(Dispatchers.IO) {
        try {
            val response = authApiService.login(AuthLoginRequest(username, password))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                // Persist the session to SQLite (synced from MongoDB).
                // SessionManager also mirrors data to SharedPreferences (TokenManager)
                // for backward compatibility with existing code.
                SessionManager.saveSession(
                    context     = context,
                    token       = body.token,
                    expiresAt   = body.expiresAt,
                    user        = body.user
                )
                Result.success(body)
            } else {
                Result.failure(toApiException(response.code(), response.errorBody()?.string(), "Login failed (HTTP ${response.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Executes prosumer registration to POST /api/prosumers/register.
     */
    suspend fun registerProsumer(
        request: RegisterProsumerRequest
    ): Result<UserAccount> = withContext(Dispatchers.IO) {
        try {
            val response = authApiService.registerProsumer(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(toApiException(response.code(), response.errorBody()?.string(), "Registration failed (HTTP ${response.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Builds an ApiException from an error response: HTTP status + errorCode + readable message
    private fun toApiException(httpStatus: Int, body: String?, defaultMessage: String): ApiException {
        val errorCode = try {
            if (body.isNullOrBlank()) null else JSONObject(body).optString("errorCode").ifBlank { null }
        } catch (e: Exception) {
            null
        }
        return ApiException(httpStatus, errorCode, extractErrorMessage(body, defaultMessage))
    }

    // Turns the API's error JSON (message / validationErrors) into one readable message
    private fun extractErrorMessage(jsonString: String?, defaultMessage: String): String {
        if (jsonString.isNullOrBlank()) return defaultMessage
        return try {
            val json = JSONObject(jsonString)
            val errorList = mutableListOf<String>()

            if (json.has("validationErrors") && !json.isNull("validationErrors")) {
                val valObj = json.getJSONObject("validationErrors")
                val keys = valObj.keys()
                while (keys.hasNext()) {
                    val key = keys.next()
                    val arr = valObj.optJSONArray(key)
                    if (arr != null) {
                        for (i in 0 until arr.length()) {
                            errorList.add(arr.getString(i))
                        }
                    }
                }
            }

            if (errorList.isNotEmpty()) {
                "Validation Error:\n• " + errorList.joinToString("\n• ")
            } else if (json.has("message") && json.getString("message").isNotBlank()) {
                json.getString("message")
            } else if (json.has("detail") && json.getString("detail").isNotBlank()) {
                json.getString("detail")
            } else if (json.has("title") && json.getString("title").isNotBlank()) {
                json.getString("title")
            } else {
                defaultMessage
            }
        } catch (e: Exception) {
            defaultMessage
        }
    }
}
