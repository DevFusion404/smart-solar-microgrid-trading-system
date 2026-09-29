/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : AccountDeactivatedActivity.kt
 * Description : Shown when a deactivated account tries to sign in (API 403
 *               ACCOUNT_DEACTIVATED). Only a Backoffice officer can reactivate it.
 * =====================================================
 */

package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.smartsolar.mobile.databinding.ActivityAccountDeactivatedBinding

/**
 * AccountDeactivatedActivity – Screen 13
 * Shown to both roles when login resolves and the account status = DEACTIVATED.
 * Clears the back stack so the user cannot go back to a locked dashboard.
 *
 * Accepts optional Intent extras:
 *   - "DEACTIVATION_REASON" → optional reason string shown if provided
 */
class AccountDeactivatedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAccountDeactivatedBinding

    // Inflates the screen and wires the back-to-login button
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAccountDeactivatedBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
    }

    // "Back to Login" button
    private fun setupListeners() {
        binding.btnDeactivatedBackToLogin.setOnClickListener {
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

    // Back also returns to login instead of a locked screen
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        navigateToLogin()
    }
}
