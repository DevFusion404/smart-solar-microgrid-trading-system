package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.smartsolar.mobile.databinding.ActivityLogoutConfirmationBinding

/**
 * LogoutConfirmationActivity – Screen 14
 * Full-screen modal-style logout confirmation shown for both roles.
 * Uses a dark overlay with a centered card containing user avatar,
 * "Sign Out" (amber) and "Stay Logged In" (outline) buttons.
 *
 * Accepts Intent extras:
 *   - "USER_NAME" → displayed as the user name in the card
 */
class LogoutConfirmationActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLogoutConfirmationBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLogoutConfirmationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Apply transparent theme feel – handled by the dark overlay background in XML
        populateUser()
        setupListeners()
    }

    private fun populateUser() {
        val name = intent.getStringExtra("USER_NAME") ?: "User"
        binding.tvLogoutUserName.text = name
        binding.tvLogoutUserInitial.text = name.firstOrNull()?.uppercase() ?: "U"
    }

    private fun setupListeners() {
        binding.btnConfirmSignOut.setOnClickListener {
            signOut()
        }

        binding.btnStayLoggedIn.setOnClickListener {
            finish() // Simply dismiss and return to the previous screen
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        // Allow tapping outside the card to dismiss (optional UX)
        binding.logoutConfirmRoot.setOnClickListener {
            finish()
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }
        // Prevent clicks on the card from dismissing
        binding.logoutConfirmCard.setOnClickListener { /* consume */ }
    }

    private fun signOut() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }
}
