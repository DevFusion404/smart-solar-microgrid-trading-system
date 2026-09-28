/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : AuthApiService.kt
 * Description : Retrofit endpoints and request/response models for login and
 *               prosumer self-registration.
 * =====================================================
 */

package com.smartsolar.mobile.data.api

import com.google.gson.annotations.SerializedName
import com.smartsolar.mobile.data.model.UserAccount
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApiService {

    // Checks credentials and account status; returns a JWT and user summary
    @POST("api/auth/login")
    suspend fun login(
        @Body request: AuthLoginRequest
    ): Response<AuthLoginResponse>

    // Creates a prosumer account (NIC is the unique key); status starts as PendingActivation
    @POST("api/prosumers/register")
    suspend fun registerProsumer(
        @Body request: RegisterProsumerRequest
    ): Response<UserAccount>
}

data class AuthLoginRequest(
    @SerializedName("username")
    val username: String,

    @SerializedName("password")
    val password: String
)

data class AuthLoginResponse(
    @SerializedName("token")
    val token: String,

    @SerializedName("expiresAt")
    val expiresAt: String,

    @SerializedName("user")
    val user: UserSummary
)

data class UserSummary(
    @SerializedName("username")
    val username: String = "",

    @SerializedName("fullName")
    val fullName: String = "",

    @SerializedName("role")
    val role: String = "",

    @SerializedName("status")
    val status: String = "",

    @SerializedName("nic")
    val nic: String? = null
)

data class RegisterProsumerRequest(
    @SerializedName("nic")
    val nic: String,

    @SerializedName("fullName")
    val fullName: String,

    @SerializedName("email")
    val email: String,

    @SerializedName("phoneNumber")
    val phoneNumber: String,

    @SerializedName("address")
    val address: String,

    @SerializedName("username")
    val username: String,

    @SerializedName("password")
    val password: String
)
