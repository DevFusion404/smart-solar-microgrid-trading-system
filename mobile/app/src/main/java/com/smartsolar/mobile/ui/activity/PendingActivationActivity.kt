package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.smartsolar.mobile.databinding.ActivityPendingActivationBinding

/**
 * PendingActivationActivity – Screen 5
 * Shown when a prosumer has logged in but their account status is PENDING.
 * Offers a "Check Again" action and a "Log Out" text link.
 *
 * Pass user details via Intent extras:
 *   - "USER_NAME"  → displayed as the user's name
 *   - "USER_EMAIL" → displayed under the name
 */
class PendingActivationActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPendingActivationBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPendingActivationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        populateUserInfo()
        setupListeners()
    }

    private fun populateUserInfo() {
        val name = intent.getStringExtra("USER_NAME") ?: "User"
        val email = intent.getStringExtra("USER_EMAIL") ?: "—"

        binding.tvPendingUserName.text = name
        binding.tvPendingUserEmail.text = email
        binding.tvPendingInitial.text = name.firstOrNull()?.uppercase() ?: "U"
    }

    private fun setupListeners() {
        binding.btnCheckAgain.setOnClickListener {
            // TODO: Replace with real status check API call via ViewModel
            Toast.makeText(this, "Checking account status…", Toast.LENGTH_SHORT).show()
        }

        binding.tvLogOutLink.setOnClickListener {
            logOut()
        }
    }

    private fun logOut() {
        val intent = Intent(this, LoginActivity::class.java)
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
