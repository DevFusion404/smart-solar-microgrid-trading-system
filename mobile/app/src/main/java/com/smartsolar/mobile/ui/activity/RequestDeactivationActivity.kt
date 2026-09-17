package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.smartsolar.mobile.databinding.ActivityRequestDeactivationBinding

/**
 * RequestDeactivationActivity – Screen 11
 * Full-screen dedicated deactivation request form.
 * Primarily used by Prosumers but accessible to both roles.
 *
 * On successful submission navigates to DeactivationSubmittedActivity.
 * "Cancel" navigates back.
 */
class RequestDeactivationActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRequestDeactivationBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRequestDeactivationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupListeners()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.deactivationToolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.deactivationToolbar.setNavigationOnClickListener { finish() }
    }

    private fun setupListeners() {
        binding.btnSubmitDeactivation.setOnClickListener {
            if (validateReason()) {
                submitRequest()
            }
        }

        binding.btnCancelDeactivation.setOnClickListener {
            finish()
        }
    }

    private fun validateReason(): Boolean {
        val reason = binding.etDeactivationReason.text?.toString()?.trim().orEmpty()
        return if (reason.isEmpty()) {
            binding.tilDeactivationReason.error = "Please provide a reason for deactivation"
            false
        } else {
            binding.tilDeactivationReason.error = null
            true
        }
    }

    private fun submitRequest() {
        // TODO: Call ViewModel/Repository to POST deactivation request to backend
        Toast.makeText(this, "Submitting request…", Toast.LENGTH_SHORT).show()

        val intent = Intent(this, DeactivationSubmittedActivity::class.java)
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }
}
