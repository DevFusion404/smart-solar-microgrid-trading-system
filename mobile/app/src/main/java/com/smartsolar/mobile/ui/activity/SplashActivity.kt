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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        startAnimations()
        navigateNextAfterDelay()
    }

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

    private fun navigateNextAfterDelay() {
        lifecycleScope.launch {
            delay(2400)

            // Read the persisted session from SQLite (synced from MongoDB on last login).
            // Only users registered in MongoDB can have a session row here.
            val session = SessionManager.getActiveSession(this@SplashActivity)

            val intent = if (session != null) {
                // Restore the JWT into Retrofit for immediate API calls
                com.smartsolar.mobile.data.api.RetrofitClient.authToken = session.jwtToken

                val displayName = session.fullName.ifBlank { session.username }

                when {
                    session.role.equals("GridOperator", ignoreCase = true) ||
                    session.role.equals("Grid Operator", ignoreCase = true) -> {
                        Intent(this@SplashActivity, RoleRedirectionActivity::class.java).apply {
                            putExtra("USER_NAME", displayName)
                            putExtra("USER_ROLE", RoleRedirectionActivity.ROLE_GRID_OPERATOR)
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
