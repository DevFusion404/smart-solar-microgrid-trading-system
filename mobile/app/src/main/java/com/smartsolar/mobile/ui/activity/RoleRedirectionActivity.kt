/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : RoleRedirectionActivity.kt
 * Description : Role-based home redirection after login or session restore: shows the
 *               role for 1.5 s, then opens MainActivity (Prosumer) or
 *               GridOperatorActivity (Grid Operator).
 * =====================================================
 */

package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.smartsolar.mobile.databinding.ActivityRoleRedirectionBinding
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * RoleRedirectionActivity – Screen 6
 * Brief animated transition screen shown after a successful login once
 * the user's role has been resolved.
 *
 * Pass the role via Intent extra:
 *   - "USER_ROLE" → "PROSUMER" or "GRID_OPERATOR"
 *   - "USER_NAME" → display name
 *
 * Auto-navigates after 1.5 seconds to the appropriate home activity.
 */
class RoleRedirectionActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRoleRedirectionBinding

    companion object {
        const val ROLE_PROSUMER = "PROSUMER"
        const val ROLE_GRID_OPERATOR = "GRID_OPERATOR"
    }

    // Reads the role/name extras, then animates and schedules the redirect
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRoleRedirectionBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val role = intent.getStringExtra("USER_ROLE") ?: ROLE_PROSUMER
        val name = intent.getStringExtra("USER_NAME") ?: "User"

        configureForRole(role)
        animateContent()
        scheduleRedirection(role, name)
    }

    // Sets the emoji, label and subtitle for the role
    private fun configureForRole(role: String) {
        when (role) {
            ROLE_GRID_OPERATOR -> {
                binding.tvRoleEmoji.text = "🔌"
                binding.tvRoleLabel.text = "Grid Operator"
                binding.tvRedirectingSubtitle.text = "Taking you to the Operator Dashboard"
            }
            else -> {
                binding.tvRoleEmoji.text = "⚡"
                binding.tvRoleLabel.text = "Prosumer"
                binding.tvRedirectingSubtitle.text = "Taking you to your dashboard"
            }
        }
    }

    // Slides/fades in the brand block and footer
    private fun animateContent() {
        val interpolator = AccelerateDecelerateInterpolator()

        binding.redirectBrandContainer.alpha = 0f
        binding.redirectBrandContainer.translationY = 30f

        binding.redirectBrandContainer.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(600)
            .setInterpolator(interpolator)
            .start()

        binding.redirectBottomContainer.alpha = 0f
        binding.redirectBottomContainer.animate()
            .alpha(1f)
            .setStartDelay(400)
            .setDuration(500)
            .start()
    }

    // After 1.5 s opens the role's home screen and clears the back stack
    private fun scheduleRedirection(role: String, name: String) {
        lifecycleScope.launch {
            delay(1500)
            val intent = when (role) {
                ROLE_GRID_OPERATOR -> Intent(this@RoleRedirectionActivity, GridOperatorActivity::class.java)
                else -> Intent(this@RoleRedirectionActivity, MainActivity::class.java)
            }
            intent.putExtra("USER_NAME", name)
            intent.putExtra("USER_ROLE", role)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }
    }

    // Back is ignored while redirecting
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Prevent back during redirect
    }
}
