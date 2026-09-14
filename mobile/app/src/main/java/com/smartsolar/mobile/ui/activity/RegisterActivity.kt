package com.smartsolar.mobile.ui.activity

import android.os.Bundle
import android.util.Patterns
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.smartsolar.mobile.R
import com.smartsolar.mobile.databinding.ActivityRegisterBinding

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding

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
                val role = binding.actRole.text.toString().trim()
                Toast.makeText(
                    this,
                    "Account registered for $fullName ($role)",
                    Toast.LENGTH_LONG
                ).show()
                // Return to login after registration
                finish()
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
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
        } else if (password.length < 6) {
            binding.tilRegisterPassword.error = "Password must be at least 6 characters"
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
