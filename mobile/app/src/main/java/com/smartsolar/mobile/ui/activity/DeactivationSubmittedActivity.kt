/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : DeactivationSubmittedActivity.kt
 * Description : Summary screen after a prosumer submits a deactivation request. The
 *               account stays usable (DeactivationRequested) until a Backoffice
 *               officer approves the request.
 * =====================================================
 */

package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import com.smartsolar.mobile.databinding.ActivityDeactivationSubmittedBinding

/**
 * DeactivationSubmittedActivity – Screen 12
 * Confirmation screen shown after a prosumer submits a deactivation request.
 * "Back to Profile" navigates to MainActivity (which hosts ProfileFragment).
 */
class DeactivationSubmittedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDeactivationSubmittedBinding

    // Inflates the screen, animates the icon and wires the button
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDeactivationSubmittedBinding.inflate(layoutInflater)
        setContentView(binding.root)

        animateIcon()
        setupListeners()
    }

    // Scales and fades in the confirmation icon
    private fun animateIcon() {
        val interpolator = AccelerateDecelerateInterpolator()
        binding.deactSubmittedIconWrapper.alpha = 0f
        binding.deactSubmittedIconWrapper.scaleX = 0.6f
        binding.deactSubmittedIconWrapper.scaleY = 0.6f

        binding.deactSubmittedIconWrapper.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(700)
            .setInterpolator(interpolator)
            .start()
    }

    // "Back to Profile" returns to the prosumer home on the profile tab
    private fun setupListeners() {
        binding.btnBackToProfile.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            // Open the profile fragment on arrival
            intent.putExtra("OPEN_FRAGMENT", "profile")
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }
    }

    // Back behaves like the "Back to Profile" button
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Redirect back via the button to ensure consistent state
        binding.btnBackToProfile.performClick()
    }
}
