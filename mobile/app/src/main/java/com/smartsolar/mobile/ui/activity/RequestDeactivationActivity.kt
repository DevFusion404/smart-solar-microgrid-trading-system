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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRequestDeactivationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupListeners()
        observeViewModel()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.deactivationToolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.deactivationToolbar.setNavigationOnClickListener { finish() }
    }

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

    private fun validateReason(): Boolean {
        val reason = binding.etDeactivationReason.text?.toString()?.trim().orEmpty()
        return if (reason.length < 10) {
            binding.tilDeactivationReason.error = "Deactivation reason must be at least 10 characters"
            false
        } else {
            binding.tilDeactivationReason.error = null
            true
        }
    }

    private fun submitRequest(reason: String) {
        binding.btnSubmitDeactivation.isEnabled = false
        binding.btnSubmitDeactivation.text = "Submitting..."
        accountViewModel.requestDeactivation(reason)
    }

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
