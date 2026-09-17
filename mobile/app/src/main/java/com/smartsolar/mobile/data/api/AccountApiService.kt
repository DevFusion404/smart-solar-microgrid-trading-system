package com.smartsolar.mobile.data.api

import com.smartsolar.mobile.data.model.ChangePasswordRequest
import com.smartsolar.mobile.data.model.DeactivationRequest
import com.smartsolar.mobile.data.model.UpdateProfileRequest
import com.smartsolar.mobile.data.model.UserAccount
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST

// ──────────────────────────────────────────────────────────────────────────────
// AccountApiService — User account management endpoints.
// All routes are relative to RetrofitClient.BASE_URL.
// Backend implementation is pending — endpoints are declared here for wiring.
// ──────────────────────────────────────────────────────────────────────────────
interface AccountApiService {

    /**
     * Fetch the currently authenticated user's profile.
     * Backend endpoint: GET /api/account/profile
     * Returns: UserAccount (ProsumerResponseDto or WebUserResponseDto shape)
     */
    @GET("api/account/profile")
    suspend fun getProfile(): Response<UserAccount>

    /**
     * Update editable profile fields (fullName, phoneNumber, address).
     * Backend endpoint: PATCH /api/account/profile
     */
    @PATCH("api/account/profile")
    suspend fun updateProfile(
        @Body request: UpdateProfileRequest
    ): Response<UserAccount>

    /**
     * Change the authenticated user's password.
     * Backend endpoint: POST /api/account/change-password
     */
    @POST("api/account/change-password")
    suspend fun changePassword(
        @Body request: ChangePasswordRequest
    ): Response<Map<String, String>>

    /**
     * Submit a self-service account deactivation request.
     * Backend endpoint: POST /api/account/request-deactivation
     */
    @POST("api/account/request-deactivation")
    suspend fun requestDeactivation(
        @Body request: DeactivationRequest
    ): Response<Map<String, String>>
}
