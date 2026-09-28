/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : PendingActivationActivity.kt
 * Description : Shown when a prosumer signs in before a Backoffice officer
 *               has approved the registration (API 403
 *               ACCOUNT_PENDING_ACTIVATION). No session is stored for a
 *               pending account. "Check Again" returns to the login screen
 *               with the username filled in; the next sign-in asks the server
 *               for the current status.
 *
 * Intent extras:
 *   - "USER_NAME"  -> name shown on the card (the username/email typed at login)
 *   - "USER_EMAIL" -> shown under the name; also used to pre-fill the login form
 * =====================================================
 */

package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.smartsolar.mobile.databinding.ActivityPendingActivationBinding

class PendingActivationActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPendingActivationBinding

    // Inflates the screen, fills the user card and wires the buttons
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPendingActivationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        populateUserInfo()
        setupListeners()
    }

    // Shows who is waiting for approval
    private fun populateUserInfo() {
        val name = intent.getStringExtra("USER_NAME") ?: "User"
        val email = intent.getStringExtra("USER_EMAIL") ?: "—"

        binding.tvPendingUserName.text = name
        binding.tvPendingUserEmail.text = email
        binding.tvPendingInitial.text = name.firstOrNull()?.uppercase() ?: "U"
    }

    // "Check Again" re-checks by signing in again; "Log out" just returns to login
    private fun setupListeners() {
        binding.btnCheckAgain.setOnClickListener {
            Toast.makeText(this, "Sign in again to check your account status", Toast.LENGTH_SHORT).show()
            returnToLogin(prefillUsername = intent.getStringExtra("USER_EMAIL"))
        }

        binding.tvLogOutLink.setOnClickListener {
            returnToLogin(prefillUsername = null)
        }
    }

    // Opens a fresh login screen, optionally with the username already filled in
    private fun returnToLogin(prefillUsername: String?) {
        val intent = Intent(this, LoginActivity::class.java)
        if (!prefillUsername.isNullOrBlank()) {
            intent.putExtra(LoginActivity.EXTRA_PREFILL_USERNAME, prefillUsername)
        }
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }

    // Disable hardware back to prevent returning to a locked session
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // intentionally no-op; user must log out explicitly
    }
}
