package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.local.SessionManager
import com.smartsolar.mobile.databinding.ActivityLoginBinding
import com.smartsolar.mobile.viewmodel.AuthViewModel
import com.smartsolar.mobile.viewmodel.LoginUiState
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val authViewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
        observeViewModel()
    }

    private fun setupListeners() {
        // Navigate to Registration Screen
        binding.btnGoToRegister.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        // Handle Quick Grid Operator Login shortcut
        binding.btnQuickOperatorLogin.setOnClickListener {
            binding.etEmail.setText("chamithu")
            binding.etPassword.setText("Sithma#1122")
            authViewModel.login(this, "chamithu", "Sithma#1122")
        }

        // Handle Login Submission
        binding.btnLogin.setOnClickListener {
            if (validateInputs()) {
                val identifier = binding.etEmail.text?.toString()?.trim().orEmpty()
                val password = binding.etPassword.text?.toString()?.trim().orEmpty()
                authViewModel.login(this, identifier, password)
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

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                authViewModel.loginState.collect { state ->
                    when (state) {
                        is LoginUiState.Idle -> {
                            binding.btnLogin.isEnabled = true
                            binding.btnLogin.text = getString(R.string.btn_login)
                        }
                        is LoginUiState.Loading -> {
                            binding.btnLogin.isEnabled = false
                            binding.btnLogin.text = "Logging in..."
                        }
                        is LoginUiState.Success -> {
                            binding.btnLogin.isEnabled = true
                            binding.btnLogin.text = getString(R.string.btn_login)

                            val user = state.loginResponse.user
                            handleLoginSuccess(user.username, user.fullName, user.role, user.status)
                            authViewModel.resetLoginState()
                        }
                        is LoginUiState.Error -> {
                            binding.btnLogin.isEnabled = true
                            binding.btnLogin.text = getString(R.string.btn_login)
                            showErrorDialog(state.message)
                            authViewModel.resetLoginState()
                        }
                    }
                }
            }
        }
    }

    private fun showErrorDialog(message: String) {
        com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
            .setTitle("Authentication Error")
            .setMessage(message)
            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
            .show()
    }

    private fun handleLoginSuccess(username: String, fullName: String, role: String, status: String) {
        val displayName = if (fullName.isNotBlank()) fullName else username

        when (status.lowercase()) {
            "pendingactivation" -> {
                val intent = Intent(this, PendingActivationActivity::class.java).apply {
                    putExtra("USER_NAME", displayName)
                    putExtra("USER_EMAIL", username)
                }
                startActivity(intent)
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                finish()
            }
            "deactivated" -> {
                val intent = Intent(this, AccountDeactivatedActivity::class.java)
                startActivity(intent)
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                finish()
            }
            else -> {
                when {
                    role.equals("Backoffice", ignoreCase = true) -> {
                        // Backoffice role is not supported on the mobile app.
                        // Clear the session that was saved during login and inform the user.
                        SessionManager.clearSession(this)
                        com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
                            .setTitle("Mobile Access Restricted")
                            .setMessage(
                                "Backoffice accounts are not supported on the mobile app.\n\n" +
                                "Please use the web portal to access your Backoffice dashboard."
                            )
                            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                            .show()
                    }
                    role.equals("GridOperator", ignoreCase = true) ||
                    role.equals("Grid Operator", ignoreCase = true) -> {
                        val intent = Intent(this, RoleRedirectionActivity::class.java).apply {
                            putExtra("USER_NAME", displayName)
                            putExtra("USER_ROLE", RoleRedirectionActivity.ROLE_GRID_OPERATOR)
                        }
                        startActivity(intent)
                        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                        finish()
                    }
                    else -> {
                        // Prosumer (default role)
                        val intent = Intent(this, RoleRedirectionActivity::class.java).apply {
                            putExtra("USER_NAME", displayName)
                            putExtra("USER_ROLE", RoleRedirectionActivity.ROLE_PROSUMER)
                        }
                        startActivity(intent)
                        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                        finish()
                    }
                }
            }
        }
    }

    private fun validateInputs(): Boolean {
        val emailOrUsername = binding.etEmail.text?.toString()?.trim().orEmpty()
        val password = binding.etPassword.text?.toString()?.trim().orEmpty()

        var isValid = true

        if (emailOrUsername.isEmpty()) {
            binding.tilEmail.error = "Username or Email is required"
            isValid = false
        } else {
            binding.tilEmail.error = null
        }

        if (password.isEmpty()) {
            binding.tilPassword.error = getString(R.string.err_empty_password)
            isValid = false
        } else {
            binding.tilPassword.error = null
        }

        return isValid
    }
}
