package com.smartsolar.mobile.data.repository

import com.smartsolar.mobile.data.api.AccountApiService
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.model.ChangePasswordRequest
import com.smartsolar.mobile.data.model.DeactivationRequest
import com.smartsolar.mobile.data.model.UpdateProfileRequest
import com.smartsolar.mobile.data.model.UserAccount
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

// ──────────────────────────────────────────────────────────────────────────────
// UserAccountRepository — mediates all user account API calls.
//
// Pattern mirrors StationRepository: uses Dispatchers.IO, wraps every
// network call in Result<T> to isolate ViewModel from raw exceptions.
//
// When the backend is not yet running the functions return Result.failure()
// with a descriptive exception — ViewModels show an offline/error UI state.
// ──────────────────────────────────────────────────────────────────────────────
class UserAccountRepository(
    private val apiService: AccountApiService =
        RetrofitClient.instance.create(AccountApiService::class.java)
) {

    /**
     * GET /api/account/profile
     * Loads the authenticated user's profile from the backend.
     */
    suspend fun getProfile(): Result<UserAccount> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getProfile()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(
                    Exception("Failed to load profile (HTTP ${response.code()})")
                )
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * PATCH /api/account/profile
     * Updates editable fields and returns the refreshed profile.
     */
    suspend fun updateProfile(request: UpdateProfileRequest): Result<UserAccount> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.updateProfile(request)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    val errorMsg = extractErrorMessage(response.errorBody()?.string(), "Profile update failed (HTTP ${response.code()})")
                    Result.failure(Exception(errorMsg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * POST /api/account/change-password
     * Sends current + new passwords for server-side validation.
     */
    suspend fun changePassword(request: ChangePasswordRequest): Result<String> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.changePassword(request)
                if (response.isSuccessful) {
                    val message = response.body()?.get("message") ?: "Password changed successfully"
                    Result.success(message)
                } else {
                    val errorMsg = extractErrorMessage(response.errorBody()?.string(), "Password change failed (HTTP ${response.code()})")
                    Result.failure(Exception(errorMsg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * POST /api/account/request-deactivation
     * Submits a self-service deactivation request with an optional reason.
     */
    suspend fun requestDeactivation(reason: String): Result<String> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.requestDeactivation(DeactivationRequest(reason))
                if (response.isSuccessful) {
                    val message = response.body()?.get("message") ?: "Deactivation request submitted"
                    Result.success(message)
                } else {
                    val errorMsg = extractErrorMessage(response.errorBody()?.string(), "Deactivation request failed (HTTP ${response.code()})")
                    Result.failure(Exception(errorMsg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    private fun extractErrorMessage(jsonString: String?, defaultMessage: String): String {
        if (jsonString.isNullOrBlank()) return defaultMessage
        return try {
            val json = org.json.JSONObject(jsonString)
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
