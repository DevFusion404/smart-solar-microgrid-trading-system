package com.smartsolar.mobile.ui.activity

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
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
        navigateToLoginAfterDelay()
    }

    private fun startAnimations() {
        // Initial state
        binding.logoWrapper.alpha = 0f
        binding.logoWrapper.scaleX = 0.7f
        binding.logoWrapper.scaleY = 0.7f

        binding.tvBrandName.alpha = 0f
        binding.tvBrandName.translationY = 40f

        binding.tvTagline.alpha = 0f
        binding.tvTagline.translationY = 30f

        binding.bottomContainer.alpha = 0f

        val interpolator = AccelerateDecelerateInterpolator()

        // Animate Logo pop and glow
        binding.logoWrapper.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(900)
            .setInterpolator(interpolator)
            .start()

        // Animate Brand Title
        binding.tvBrandName.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(300)
            .setDuration(700)
            .setInterpolator(interpolator)
            .start()

        // Animate Tagline
        binding.tvTagline.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(500)
            .setDuration(600)
            .setInterpolator(interpolator)
            .start()

        // Animate Bottom Slogan & Progress Indicator
        binding.bottomContainer.animate()
            .alpha(1f)
            .setStartDelay(700)
            .setDuration(800)
            .start()
    }

    private fun navigateToLoginAfterDelay() {
        lifecycleScope.launch {
            // Keep splash visible smoothly for 2.6 seconds
            delay(2600)
            val intent = Intent(this@SplashActivity, LoginActivity::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }
    }
}
