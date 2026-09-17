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
                    Result.failure(
                        Exception("Profile update failed (HTTP ${response.code()})")
                    )
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
                    Result.failure(
                        Exception("Password change failed (HTTP ${response.code()})")
                    )
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
                    Result.failure(
                        Exception("Deactivation request failed (HTTP ${response.code()})")
                    )
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
}
