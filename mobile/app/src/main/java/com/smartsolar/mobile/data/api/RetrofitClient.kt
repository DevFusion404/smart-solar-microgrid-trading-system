/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * File        : RetrofitClient.kt
 * Description : Shared Retrofit/OkHttp client. Adds the JWT to every
 *               request and reports 401 responses on authenticated calls
 *               through onUnauthorized so the app can end the session.
 * =====================================================
 */

package com.smartsolar.mobile.data.api

import com.smartsolar.mobile.utils.Constants
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {

    private var currentBaseUrl: String = ApiConfig.BASE_URL
    private var retrofitInstance: Retrofit? = null

    /**
     * Active JWT authorization token used for authenticated requests.
     */
    var authToken: String? = null

    /**
     * Called when a request that carried a JWT gets 401 Unauthorized (token expired
     * or revoked). Set by SessionManager.installSessionExpiryHandler.
     */
    @Volatile
    var onUnauthorized: (() -> Unit)? = null

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(Constants.NETWORK_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(Constants.NETWORK_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(Constants.NETWORK_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .addInterceptor { chain ->
                val requestBuilder = chain.request().newBuilder()
                val token = authToken
                if (!token.isNullOrBlank()) {
                    requestBuilder.addHeader("Authorization", "Bearer $token")
                }
                val response = chain.proceed(requestBuilder.build())
                // Only a request that was sent WITH a token can mean "session expired";
                // a 401 from the login endpoint just means wrong credentials
                val isLoginCall = chain.request().url().encodedPath().endsWith("api/auth/login", ignoreCase = true)
                if (response.code() == 401 && !token.isNullOrBlank() && !isLoginCall) {
                    onUnauthorized?.invoke()
                }
                response
            }
            .build()
    }

    // Builds the Retrofit instance on first use (or after the base URL changes)
    private fun getClient(): Retrofit {
        if (retrofitInstance == null) {
            retrofitInstance = Retrofit.Builder()
                .baseUrl(currentBaseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
        }
        return retrofitInstance!!
    }

    val apiService: ApiService
        get() = getClient().create(ApiService::class.java)

    /**
     * Exposes the underlying Retrofit instance so other services (e.g. AccountApiService)
     * can be created via RetrofitClient.instance.create(MyService::class.java).
     */
    val instance: retrofit2.Retrofit
        get() = getClient()

    /**
     * Updates the base URL dynamically (e.g., when switching from Emulator IP 10.0.2.2 to LAN IP).
     */
    fun updateBaseUrl(newUrl: String) {
        val sanitizedUrl = if (newUrl.endsWith("/")) newUrl else "$newUrl/"
        if (currentBaseUrl != sanitizedUrl) {
            currentBaseUrl = sanitizedUrl
            retrofitInstance = null
        }
    }
}
