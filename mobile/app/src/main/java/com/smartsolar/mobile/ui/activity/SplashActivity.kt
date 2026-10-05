/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : SplashActivity.kt
 * Description : Launch screen. Restores the saved SQLite session without any
 *               network call (so it also works offline): a valid session goes
 *               straight to the role's home, a session older than the
 *               week-long mobile limit goes to the Session Expired screen,
 *               no session goes to Login.
 * =====================================================
 */

package com.smartsolar.mobile.ui.activity

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.smartsolar.mobile.data.local.SessionManager
import com.smartsolar.mobile.databinding.ActivitySplashBinding
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySplashBinding

    // Inflates the splash layout, starts the animation and schedules navigation
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        startAnimations()
        navigateNextAfterDelay()
    }

    // Fades/scales in the logo, name, tagline and footer
    private fun startAnimations() {
        binding.logoWrapper.alpha = 0f
        binding.logoWrapper.scaleX = 0.7f
        binding.logoWrapper.scaleY = 0.7f

        binding.tvBrandName.alpha = 0f
        binding.tvBrandName.translationY = 40f

        binding.tvTagline.alpha = 0f
        binding.tvTagline.translationY = 30f

        binding.bottomContainer.alpha = 0f

        val interpolator = AccelerateDecelerateInterpolator()

        binding.logoWrapper.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(900)
            .setInterpolator(interpolator)
            .start()

        binding.tvBrandName.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(300)
            .setDuration(700)
            .setInterpolator(interpolator)
            .start()

        binding.tvTagline.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(500)
            .setDuration(600)
            .setInterpolator(interpolator)
            .start()

        binding.bottomContainer.animate()
            .alpha(1f)
            .setStartDelay(700)
            .setDuration(800)
            .start()
    }

    // After the animation, decides where to go based on the saved session
    private fun navigateNextAfterDelay() {
        lifecycleScope.launch {
            delay(2400)

            // Read the persisted session from SQLite (synced from MongoDB on last login).
            // Only users registered in MongoDB can have a session row here.
            val session = SessionManager.getActiveSession(this@SplashActivity)

            val intent = if (session != null && SessionManager.isExpired(session)) {
                // The week-long mobile session is over: end it and ask the user to sign in again
                SessionManager.clearSession(this@SplashActivity)
                Intent(this@SplashActivity, SessionExpiredActivity::class.java)
            } else if (session != null) {
                // Restore the JWT into Retrofit for immediate API calls,
                // and handle a 401 if the server rejects it later
                com.smartsolar.mobile.data.api.RetrofitClient.authToken = session.jwtToken
                SessionManager.installSessionExpiryHandler(this@SplashActivity)

                val displayName = session.fullName.ifBlank { session.username }

                when {
                    session.role.equals("GridOperator", ignoreCase = true) ||
                    session.role.equals("Grid Operator", ignoreCase = true) -> {
                        Intent(this@SplashActivity, RoleRedirectionActivity::class.java).apply {
                            putExtra("USER_NAME", displayName)
                            putExtra("USER_ROLE", RoleRedirectionActivity.ROLE_GRID_OPERATOR)
                            putExtra("OPERATOR_ID", session.username)
                        }
                    }
                    session.role.equals("Backoffice", ignoreCase = true) -> {
                        // Backoffice has no mobile home — clear session and go to login
                        SessionManager.clearSession(this@SplashActivity)
                        Intent(this@SplashActivity, LoginActivity::class.java)
                    }
                    else -> {
                        // Prosumer (default)
                        Intent(this@SplashActivity, RoleRedirectionActivity::class.java).apply {
                            putExtra("USER_NAME", displayName)
                            putExtra("USER_ROLE", RoleRedirectionActivity.ROLE_PROSUMER)
                        }
                    }
                }
            } else {
                Intent(this@SplashActivity, LoginActivity::class.java)
            }

            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }
    }
}
