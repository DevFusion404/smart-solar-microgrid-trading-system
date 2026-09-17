package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.api.RegisterProsumerRequest
import com.smartsolar.mobile.databinding.ActivityRegisterBinding
import com.smartsolar.mobile.viewmodel.AuthViewModel
import com.smartsolar.mobile.viewmodel.RegisterUiState
import kotlinx.coroutines.launch
import java.util.Locale

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private val authViewModel: AuthViewModel by viewModels()

    private val userRoles = arrayOf(
        "Prosumer (Solar Producer)",
        "Consumer (Energy Buyer)",
        "Microgrid Operator"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRoleDropdown()
        setupListeners()
        observeViewModel()
    }

    private fun setupRoleDropdown() {
        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_dropdown_item_1line,
            userRoles
        )
        binding.actRole.setAdapter(adapter)
        binding.actRole.setText(userRoles[0], false)
    }

    private fun setupListeners() {
        // Return to Login
        binding.btnGoToLogin.setOnClickListener {
            finish()
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        // Handle Registration
        binding.btnRegister.setOnClickListener {
            if (validateInputs()) {
                val fullName = binding.etFullName.text.toString().trim()
                val email = binding.etRegisterEmail.text.toString().trim()
                val password = binding.etRegisterPassword.text.toString().trim()

                // Generate clean username from email or name
                var username = email.substringBefore("@")
                    .lowercase(Locale.ROOT)
                    .replace(Regex("[^a-z0-9_]"), "_")
                if (username.length < 4) username = "${username}_solar"
                if (username.length > 30) username = username.take(30)

                // Generate valid Sri Lankan NIC fallback (9 digits + V) using System time timestamp
                val nic = "${(100000000..999999999).random()}V"
                val phoneNumber = "077" + (1000000..9999999).random()
                val address = "Microgrid Node, Station Alpha, Colombo"

                val request = RegisterProsumerRequest(
                    nic = nic,
                    fullName = fullName,
                    email = email,
                    phoneNumber = phoneNumber,
                    address = address,
                    username = username,
                    password = password
                )

                authViewModel.registerProsumer(request)
            }
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                authViewModel.registerState.collect { state ->
                    when (state) {
                        is RegisterUiState.Idle -> {
                            binding.btnRegister.isEnabled = true
                            binding.btnRegister.text = getString(R.string.btn_register)
                        }
                        is RegisterUiState.Loading -> {
                            binding.btnRegister.isEnabled = false
                            binding.btnRegister.text = "Submitting..."
                        }
                        is RegisterUiState.Success -> {
                            binding.btnRegister.isEnabled = true
                            binding.btnRegister.text = getString(R.string.btn_register)
                            authViewModel.resetRegisterState()

                            val intent = Intent(this@RegisterActivity, RegistrationSubmittedActivity::class.java)
                            startActivity(intent)
                            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                            finish()
                        }
                        is RegisterUiState.Error -> {
                            binding.btnRegister.isEnabled = true
                            binding.btnRegister.text = getString(R.string.btn_register)
                            Toast.makeText(this@RegisterActivity, state.message, Toast.LENGTH_LONG).show()
                            authViewModel.resetRegisterState()
                        }
                    }
                }
            }
        }
    }

    private fun validateInputs(): Boolean {
        val name = binding.etFullName.text?.toString()?.trim().orEmpty()
        val email = binding.etRegisterEmail.text?.toString()?.trim().orEmpty()
        val password = binding.etRegisterPassword.text?.toString()?.trim().orEmpty()
        val confirmPassword = binding.etConfirmPassword.text?.toString()?.trim().orEmpty()

        var isValid = true

        if (name.isEmpty()) {
            binding.tilFullName.error = getString(R.string.err_empty_name)
            isValid = false
        } else {
            binding.tilFullName.error = null
        }

        if (email.isEmpty()) {
            binding.tilRegisterEmail.error = getString(R.string.err_empty_email)
            isValid = false
        } else if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilRegisterEmail.error = "Please enter a valid email address"
            isValid = false
        } else {
            binding.tilRegisterEmail.error = null
        }

        if (password.isEmpty()) {
            binding.tilRegisterPassword.error = getString(R.string.err_empty_password)
            isValid = false
        } else if (password.length < 8 || !password.any { it.isUpperCase() } || !password.any { it.isDigit() }) {
            binding.tilRegisterPassword.error = "Password must be >= 8 chars with 1 uppercase letter and 1 digit"
            isValid = false
        } else {
            binding.tilRegisterPassword.error = null
        }

        if (confirmPassword != password) {
            binding.tilConfirmPassword.error = getString(R.string.err_password_mismatch)
            isValid = false
        } else {
            binding.tilConfirmPassword.error = null
        }

        return isValid
    }
}
