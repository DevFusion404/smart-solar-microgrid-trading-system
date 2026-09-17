package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import com.smartsolar.mobile.databinding.ActivityRegistrationSubmittedBinding

/**
 * RegistrationSubmittedActivity – Screen 4
 * Shown after a prosumer successfully submits a registration form.
 * Displays confirmation with a "what happens next" info block and
 * a "Back to Login" button.
 */
class RegistrationSubmittedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegistrationSubmittedBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegistrationSubmittedBinding.inflate(layoutInflater)
        setContentView(binding.root)

        animateSuccessIcon()
        setupListeners()
    }

    private fun animateSuccessIcon() {
        val interpolator = AccelerateDecelerateInterpolator()

        binding.successIconWrapper.alpha = 0f
        binding.successIconWrapper.scaleX = 0.6f
        binding.successIconWrapper.scaleY = 0.6f

        binding.successIconWrapper.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(700)
            .setInterpolator(interpolator)
            .start()
    }

    private fun setupListeners() {
        binding.btnRegSubmittedBackToLogin.setOnClickListener {
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

    // Prevent back-navigation returning to the registration form
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        navigateToLogin()
    }
}
