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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAccountDeactivatedBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
    }

    private fun setupListeners() {
        binding.btnDeactivatedBackToLogin.setOnClickListener {
            navigateToLogin()
        }
    }

    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        navigateToLogin()
    }
}
