package com.smartsolar.mobile.data.repository

import android.content.Context
import com.smartsolar.mobile.data.api.AuthApiService
import com.smartsolar.mobile.data.api.AuthLoginRequest
import com.smartsolar.mobile.data.api.AuthLoginResponse
import com.smartsolar.mobile.data.api.RegisterProsumerRequest
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.local.TokenManager
import com.smartsolar.mobile.data.model.UserAccount
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

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
                TokenManager.saveSession(
                    context = context,
                    token = body.token,
                    username = body.user.username,
                    fullName = body.user.fullName,
                    role = body.user.role,
                    status = body.user.status,
                    nic = body.user.nic
                )
                Result.success(body)
            } else {
                val errorMsg = extractErrorMessage(response.errorBody()?.string(), "Login failed (HTTP ${response.code()})")
                Result.failure(Exception(errorMsg))
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
                val errorMsg = extractErrorMessage(response.errorBody()?.string(), "Registration failed (HTTP ${response.code()})")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

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
