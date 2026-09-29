/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : LoginActivity.kt
 * Description : Mobile login (username or email + password) against
 *               POST api/auth/login, then role-based home redirection:
 *                 Prosumer     -> RoleRedirectionActivity -> MainActivity
 *                 GridOperator -> RoleRedirectionActivity -> GridOperatorActivity
 *                 Backoffice   -> blocked (web portal only)
 *               Account-status errors from the API open the Pending
 *               Activation or Account Deactivated screen.
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
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.local.SessionManager
import com.smartsolar.mobile.databinding.ActivityLoginBinding
import com.smartsolar.mobile.viewmodel.AuthViewModel
import com.smartsolar.mobile.viewmodel.LoginUiState
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    companion object {
        /** Optional extra: username to pre-fill (e.g. when returning from the pending screen). */
        const val EXTRA_PREFILL_USERNAME = "PREFILL_USERNAME"
    }

    private lateinit var binding: ActivityLoginBinding
    private val authViewModel: AuthViewModel by viewModels()

    // Inflates the form, pre-fills the username if one was passed, and wires listeners
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        intent.getStringExtra(EXTRA_PREFILL_USERNAME)?.let { binding.etUsername.setText(it) }

        setupListeners()
        observeViewModel()
    }

    // Wires the register link, login button and forgot-password link
    private fun setupListeners() {
        // Navigate to Registration Screen
        binding.btnGoToRegister.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        // Handle Login Submission
        binding.btnLogin.setOnClickListener {
            if (validateInputs()) {
                val username = binding.etUsername.text?.toString()?.trim().orEmpty()
                // Passwords are sent exactly as typed (spaces are allowed characters)
                val password = binding.etPassword.text?.toString().orEmpty()
                authViewModel.login(this, username, password)
            }
        }

        // Forgot password
        binding.tvForgotPassword.setOnClickListener {
            Toast.makeText(
                this,
                "Please contact a Backoffice officer to reset your password",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    // Reacts to each login state from the view model
    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                authViewModel.loginState.collect { state ->
                    when (state) {
                        is LoginUiState.Idle -> setLoading(false)
                        is LoginUiState.Loading -> setLoading(true)
                        is LoginUiState.Success -> {
                            setLoading(false)
                            val user = state.loginResponse.user
                            handleLoginSuccess(user.username, user.fullName, user.role)
                            authViewModel.resetLoginState()
                        }
                        is LoginUiState.PendingActivation -> {
                            setLoading(false)
                            openPendingActivation()
                            authViewModel.resetLoginState()
                        }
                        is LoginUiState.Deactivated -> {
                            setLoading(false)
                            openAccountDeactivated()
                            authViewModel.resetLoginState()
                        }
                        is LoginUiState.Error -> {
                            setLoading(false)
                            showErrorDialog(state.message)
                            authViewModel.resetLoginState()
                        }
                    }
                }
            }
        }
    }

    // Disables the button and changes its text while a request is running
    private fun setLoading(loading: Boolean) {
        binding.btnLogin.isEnabled = !loading
        binding.btnLogin.text = if (loading) "Logging in..." else getString(R.string.btn_login)
    }

    // Shows the API's message (e.g. "Invalid username or password.")
    private fun showErrorDialog(message: String) {
        com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
            .setTitle("Authentication Error")
            .setMessage(message)
            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
            .show()
    }

    // Registration is not approved yet: show the pending screen (no session is created)
    private fun openPendingActivation() {
        val identifier = binding.etUsername.text?.toString()?.trim().orEmpty()
        val intent = Intent(this, PendingActivationActivity::class.java).apply {
            putExtra("USER_NAME", identifier)
            putExtra("USER_EMAIL", identifier)
        }
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }

    // Account is deactivated: show the deactivated screen (no session is created)
    private fun openAccountDeactivated() {
        startActivity(Intent(this, AccountDeactivatedActivity::class.java))
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }

    // Role-based home redirection after a successful login
    private fun handleLoginSuccess(username: String, fullName: String, role: String) {
        val displayName = if (fullName.isNotBlank()) fullName else username

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
            role.equals("Grid Operator", ignoreCase = true) ->
                // Operator screens use OPERATOR_ID (the username) to load their assigned nodes
                openHome(displayName, RoleRedirectionActivity.ROLE_GRID_OPERATOR, operatorId = username)
            else ->
                // Prosumer (default role)
                openHome(displayName, RoleRedirectionActivity.ROLE_PROSUMER)
        }
    }

    // Starts watching for 401s (expired token) and opens the role's home via the redirect screen
    private fun openHome(displayName: String, role: String, operatorId: String? = null) {
        SessionManager.installSessionExpiryHandler(this)
        val intent = Intent(this, RoleRedirectionActivity::class.java).apply {
            putExtra("USER_NAME", displayName)
            putExtra("USER_ROLE", role)
            if (operatorId != null) putExtra("OPERATOR_ID", operatorId)
        }
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }

    // Both fields are required before calling the API
    private fun validateInputs(): Boolean {
        val username = binding.etUsername.text?.toString()?.trim().orEmpty()
        val password = binding.etPassword.text?.toString().orEmpty()

        var isValid = true

        if (username.isEmpty()) {
            binding.tilUsername.error = getString(R.string.err_empty_username)
            isValid = false
        } else {
            binding.tilUsername.error = null
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
