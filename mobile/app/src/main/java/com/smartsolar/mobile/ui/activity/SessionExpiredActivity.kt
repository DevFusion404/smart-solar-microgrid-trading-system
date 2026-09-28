/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : SessionExpiredActivity.kt
 * Description : Shown when the JWT has expired: at app start (SplashActivity) or when
 *               the API returns 401 (SessionManager.installSessionExpiryHandler).
 * =====================================================
 */

package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.smartsolar.mobile.databinding.ActivitySessionExpiredBinding

/**
 * SessionExpiredActivity – Screen 15
 * Shown to both roles when the authentication token has expired.
 * Clears the back stack and routes back to LoginActivity.
 *
 * Typically launched from a network interceptor or ViewModel when a
 * 401 Unauthorized response is detected.
 */
class SessionExpiredActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySessionExpiredBinding

    // Inflates the screen and wires the sign-in button
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySessionExpiredBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
    }

    // "Sign In Again" button
    private fun setupListeners() {
        binding.btnSignInAgain.setOnClickListener {
            navigateToLogin()
        }
    }

    // Clears the back stack and opens the login screen
    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }

    // Back also returns to login instead of a stale screen
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Prevent back-navigation to a stale/locked screen
        navigateToLogin()
    }
}
