/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : RequestDeactivationActivity.kt
 * Description : Prosumer's request to close their account
 *               (POST api/account/request-deactivation). The reason must be
 *               10-500 characters. On success the account becomes
 *               DeactivationRequested and a summary screen is shown; only a
 *               Backoffice officer can approve it (and later reactivate).
 * =====================================================
 */

package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.smartsolar.mobile.databinding.ActivityRequestDeactivationBinding
import com.smartsolar.mobile.utils.AccountValidators
import com.smartsolar.mobile.viewmodel.AccountViewModel
import kotlinx.coroutines.launch

/**
 * RequestDeactivationActivity – Screen 11
 * Full-screen dedicated deactivation request form.
 * Primarily used by Prosumers but accessible to both roles.
 */
class RequestDeactivationActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRequestDeactivationBinding
    private val accountViewModel: AccountViewModel by viewModels()

    // Inflates the form and wires toolbar, buttons and result observer
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRequestDeactivationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupListeners()
        observeViewModel()
    }

    // Shows a back arrow that closes the screen
    private fun setupToolbar() {
        setSupportActionBar(binding.deactivationToolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.deactivationToolbar.setNavigationOnClickListener { finish() }
    }

    // Submit validates then sends the request; Cancel closes the screen
    private fun setupListeners() {
        binding.btnSubmitDeactivation.setOnClickListener {
            if (validateReason()) {
                val reason = binding.etDeactivationReason.text?.toString()?.trim().orEmpty()
                submitRequest(reason)
            }
        }

        binding.btnCancelDeactivation.setOnClickListener {
            finish()
        }
    }

    // Checks the reason is 10-500 characters (same rule as the API)
    private fun validateReason(): Boolean {
        val reason = binding.etDeactivationReason.text?.toString()?.trim().orEmpty()
        return if (!AccountValidators.isValidReason(reason)) {
            binding.tilDeactivationReason.error = "Reason must be between 10 and 500 characters"
            false
        } else {
            binding.tilDeactivationReason.error = null
            true
        }
    }

    // Disables the button and asks the view model to send the request
    private fun submitRequest(reason: String) {
        binding.btnSubmitDeactivation.isEnabled = false
        binding.btnSubmitDeactivation.text = "Submitting..."
        accountViewModel.requestDeactivation(reason)
    }

    // On success opens the summary screen; on error shows the server's message
    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                accountViewModel.deactivationResult.collect { result ->
                    if (result != null) {
                        binding.btnSubmitDeactivation.isEnabled = true
                        binding.btnSubmitDeactivation.text = "Submit Request"

                        if (result.startsWith("Error:")) {
                            Toast.makeText(this@RequestDeactivationActivity, result, Toast.LENGTH_LONG).show()
                            accountViewModel.clearDeactivationResult()
                        } else {
                            accountViewModel.clearDeactivationResult()
                            val intent = Intent(this@RequestDeactivationActivity, DeactivationSubmittedActivity::class.java)
                            startActivity(intent)
                            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                            finish()
                        }
                    }
                }
            }
        }
    }
}
