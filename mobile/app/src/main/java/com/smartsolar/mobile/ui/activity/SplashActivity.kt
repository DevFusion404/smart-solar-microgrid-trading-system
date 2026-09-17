package com.smartsolar.mobile.ui.activity

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.smartsolar.mobile.data.local.TokenManager
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
            val intent = if (TokenManager.isLoggedIn(this@SplashActivity)) {
                val role = TokenManager.getUserRole(this@SplashActivity) ?: "Prosumer"
                val name = TokenManager.getFullName(this@SplashActivity)
                    ?: TokenManager.getUsername(this@SplashActivity)
                    ?: "User"
                val isOperator = role.equals("GridOperator", ignoreCase = true) || role.equals("Grid Operator", ignoreCase = true)
                val targetRole = if (isOperator) RoleRedirectionActivity.ROLE_GRID_OPERATOR else RoleRedirectionActivity.ROLE_PROSUMER

                Intent(this@SplashActivity, RoleRedirectionActivity::class.java).apply {
                    putExtra("USER_NAME", name)
                    putExtra("USER_ROLE", targetRole)
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
