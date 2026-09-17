package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.smartsolar.mobile.R
import com.smartsolar.mobile.databinding.ActivityLoginBinding

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
    }

    private fun setupListeners() {
        // Navigate to Registration Screen
        binding.btnGoToRegister.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        // Handle Quick Grid Operator Login
        binding.btnQuickOperatorLogin.setOnClickListener {
            binding.etEmail.setText("chamithu")
            binding.etPassword.setText("Sithma#1122")
            attemptOperatorLogin("chamithu", "Sithma#1122")
        }

        // Handle Login Submission
        binding.btnLogin.setOnClickListener {
            val identifier = binding.etEmail.text?.toString()?.trim().orEmpty()
            val password = binding.etPassword.text?.toString()?.trim().orEmpty()

            if (identifier.equals("chamithu", ignoreCase = true) && password == "Sithma#1122") {
                attemptOperatorLogin(identifier, password)
            } else if (validateInputs()) {
                Toast.makeText(
                    this,
                    "Welcome, Sithmaka!",
                    Toast.LENGTH_SHORT
                ).show()
                val intent = Intent(this, MainActivity::class.java)
                startActivity(intent)
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                finish()
            }
        }

        // Forgot password
        binding.tvForgotPassword.setOnClickListener {
            Toast.makeText(
                this,
                "Password recovery feature coming soon",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    private fun attemptOperatorLogin(username: String, pass: String) {
        Toast.makeText(this, "Logging in as Grid Operator...", Toast.LENGTH_SHORT).show()
        lifecycleScope.launch {
            try {
                val resp = com.smartsolar.mobile.data.api.RetrofitClient.apiService.login(
                    com.smartsolar.mobile.data.api.LoginRequest(username, pass)
                )
                if (resp.isSuccessful && resp.body() != null) {
                    com.smartsolar.mobile.data.api.RetrofitClient.authToken = resp.body()!!.token
                }
            } catch (e: Exception) {
                // Fallback on network failure
            }

            Toast.makeText(this@LoginActivity, "Welcome, Operator Chamithu!", Toast.LENGTH_SHORT).show()
            val intent = Intent(this@LoginActivity, GridOperatorActivity::class.java).apply {
                putExtra("USER_NAME", "Chamithu")
                putExtra("USER_ROLE", "Grid Operator")
                putExtra("OPERATOR_ID", "chamithu")
            }
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }
    }

    private fun validateInputs(): Boolean {
        val email = binding.etEmail.text?.toString()?.trim().orEmpty()
        val password = binding.etPassword.text?.toString()?.trim().orEmpty()

        var isValid = true

        if (email.isEmpty()) {
            binding.tilEmail.error = getString(R.string.err_empty_email)
            isValid = false
        } else if (!email.equals("chamithu", ignoreCase = true) && !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = "Please enter a valid email address or username"
            isValid = false
        } else {
            binding.tilEmail.error = null
        }

        if (password.isEmpty()) {
            binding.tilPassword.error = getString(R.string.err_empty_password)
            isValid = false
        } else if (password.length < 6) {
            binding.tilPassword.error = "Password must be at least 6 characters"
            isValid = false
        } else {
            binding.tilPassword.error = null
        }

        return isValid
    }
}
