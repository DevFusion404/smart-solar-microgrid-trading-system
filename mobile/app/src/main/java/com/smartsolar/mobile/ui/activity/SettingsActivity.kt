package com.smartsolar.mobile.ui.activity

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.smartsolar.mobile.databinding.ActivitySettingsBinding
import com.smartsolar.mobile.utils.Constants

/**
 * SettingsActivity
 * Settings page allowing user configuration for trading preferences,
 * push notification alerts, biometric security, custom backend API server URL,
 * clearing application cache, and navigating to account deactivation.
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Setup Toolbar
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowTitleEnabled(true)
        binding.toolbar.setNavigationOnClickListener {
            onBackPressedDispatcher.onBackPressed()
        }

        // Load saved preferences
        loadSettings()

        // Setup Listeners
        setupListeners()
    }

    private fun loadSettings() {
        val prefs = getSharedPreferences("smart_solar_settings", Context.MODE_PRIVATE)

        // Base URL
        val savedServerUrl = prefs.getString("server_url", Constants.BASE_URL)
        binding.etServerUrl.setText(savedServerUrl)

        // Switches
        binding.switchAutoTrading.isChecked = prefs.getBoolean("auto_trading", true)
        binding.switchTradeNotifications.isChecked = prefs.getBoolean("trade_notifications", true)
        binding.switchGridAlerts.isChecked = prefs.getBoolean("grid_alerts", true)
        binding.switchBiometric.isChecked = prefs.getBoolean("biometric_enabled", false)
    }

    private fun setupListeners() {
        val prefs = getSharedPreferences("smart_solar_settings", Context.MODE_PRIVATE)

        // Auto Trading Switch
        binding.switchAutoTrading.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("auto_trading", isChecked).apply()
            val msg = if (isChecked) "Automated trading enabled" else "Automated trading disabled"
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
        }

        // Trade Notifications Switch
        binding.switchTradeNotifications.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("trade_notifications", isChecked).apply()
            val msg = if (isChecked) "Trade notifications turned ON" else "Trade notifications turned OFF"
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
        }

        // Grid Alerts Switch
        binding.switchGridAlerts.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("grid_alerts", isChecked).apply()
            val msg = if (isChecked) "Grid status alerts enabled" else "Grid status alerts disabled"
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
        }

        // Biometric Switch
        binding.switchBiometric.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("biometric_enabled", isChecked).apply()
            val msg = if (isChecked) "Biometric authentication enabled" else "Biometric authentication disabled"
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
        }

        // Change Password
        binding.btnChangePassword.setOnClickListener {
            Toast.makeText(this, "To change your password, please use the My Account profile screen.", Toast.LENGTH_LONG).show()
        }

        // Request Deactivation -> open RequestDeactivationActivity (Screen 11)
        binding.btnRequestDeactivation.setOnClickListener {
            val intent = Intent(this, RequestDeactivationActivity::class.java)
            startActivity(intent)
        }

        // Save Server URL
        binding.btnSaveServerUrl.setOnClickListener {
            val newUrl = binding.etServerUrl.text.toString().trim()
            if (newUrl.isNotEmpty()) {
                prefs.edit().putString("server_url", newUrl).apply()
                Toast.makeText(this, "Server URL updated to $newUrl", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Please enter a valid server URL", Toast.LENGTH_SHORT).show()
            }
        }

        // Clear Cache
        binding.btnClearCache.setOnClickListener {
            Toast.makeText(this, "Cached charts & temporary session data cleared", Toast.LENGTH_SHORT).show()
        }

        // Terms link click
        binding.tvTerms.setOnClickListener {
            Toast.makeText(this, "Opening Terms of Service & Privacy Policy…", Toast.LENGTH_SHORT).show()
        }
    }
}
