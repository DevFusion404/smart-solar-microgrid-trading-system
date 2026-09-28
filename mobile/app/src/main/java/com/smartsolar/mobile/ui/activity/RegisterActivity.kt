/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : RegisterActivity.kt
 * Description : Prosumer self-registration. The prosumer enters their own
 *               NIC (the unique key for the account), full name, username,
 *               email, phone, address and password. Inputs are checked with
 *               AccountValidators, then POST /api/prosumers/register creates
 *               the account in PendingActivation status. A duplicate NIC is
 *               rejected by the server (409) and shown in an error dialog.
 * =====================================================
 */

package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doAfterTextChanged
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.api.RegisterProsumerRequest
import com.smartsolar.mobile.databinding.ActivityRegisterBinding
import com.smartsolar.mobile.utils.AccountValidators
import com.smartsolar.mobile.viewmodel.AuthViewModel
import com.smartsolar.mobile.viewmodel.RegisterUiState
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private val authViewModel: AuthViewModel by viewModels()

    // Inflates the form and wires listeners and state observers
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
        clearErrorsWhileTyping()
        observeViewModel()
    }

    // Handles the "Sign In" link and the register button
    private fun setupListeners() {
        binding.btnGoToLogin.setOnClickListener {
            finish()
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        binding.btnRegister.setOnClickListener {
            if (validateInputs()) {
                authViewModel.registerProsumer(buildRequest())
            }
        }
    }

    // Builds the API request from the form; NIC is normalised to upper case like the server stores it
    private fun buildRequest(): RegisterProsumerRequest = RegisterProsumerRequest(
        nic = AccountValidators.normalizeNic(textOf(binding.etNic)),
        fullName = textOf(binding.etFullName),
        email = textOf(binding.etRegisterEmail),
        phoneNumber = textOf(binding.etPhone),
        address = textOf(binding.etAddress),
        username = textOf(binding.etUsername),
        password = binding.etRegisterPassword.text?.toString().orEmpty()
    )

    // Removes a field's error as soon as the user edits it
    private fun clearErrorsWhileTyping() {
        listOf(
            binding.etNic to binding.tilNic,
            binding.etFullName to binding.tilFullName,
            binding.etUsername to binding.tilUsername,
            binding.etRegisterEmail to binding.tilRegisterEmail,
            binding.etPhone to binding.tilPhone,
            binding.etAddress to binding.tilAddress,
            binding.etRegisterPassword to binding.tilRegisterPassword,
            binding.etConfirmPassword to binding.tilConfirmPassword
        ).forEach { (editText, layout) ->
            editText.doAfterTextChanged { layout.error = null }
        }
    }

    // Reacts to Loading / Success / Error from the view model
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

                            // Summary screen: tells the prosumer the account is pending Backoffice approval
                            val intent = Intent(this@RegisterActivity, RegistrationSubmittedActivity::class.java)
                            startActivity(intent)
                            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                            finish()
                        }
                        is RegisterUiState.Error -> {
                            binding.btnRegister.isEnabled = true
                            binding.btnRegister.text = getString(R.string.btn_register)
                            showErrorDialog(state.message)
                            authViewModel.resetRegisterState()
                        }
                    }
                }
            }
        }
    }

    // Shows the server's message (e.g. "NIC '981234567V' is already registered.")
    private fun showErrorDialog(message: String) {
        com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
            .setTitle("Registration Error")
            .setMessage(message)
            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
            .show()
    }

    // Returns the trimmed text of an input
    private fun textOf(editText: TextInputEditText): String = editText.text?.toString()?.trim().orEmpty()

    // Sets or clears an error on a field and returns whether it is valid
    private fun check(layout: TextInputLayout, valid: Boolean, message: String): Boolean {
        layout.error = if (valid) null else message
        return valid
    }

    // Validates every field with the same rules the API uses; returns true when all are valid
    private fun validateInputs(): Boolean {
        val nic = textOf(binding.etNic)
        val name = textOf(binding.etFullName)
        val username = textOf(binding.etUsername)
        val email = textOf(binding.etRegisterEmail)
        val phone = textOf(binding.etPhone)
        val address = textOf(binding.etAddress)
        val password = binding.etRegisterPassword.text?.toString().orEmpty()
        val confirmPassword = binding.etConfirmPassword.text?.toString().orEmpty()

        // Each check runs (no short-circuit) so every invalid field is highlighted at once
        val results = listOf(
            check(binding.tilNic, AccountValidators.isValidNic(nic), getString(R.string.err_invalid_nic)),
            check(binding.tilFullName, name.length >= 2, getString(R.string.err_empty_name)),
            check(binding.tilUsername, AccountValidators.isValidUsername(username), getString(R.string.err_invalid_username)),
            check(
                binding.tilRegisterEmail,
                AccountValidators.isValidEmail(email),
                if (email.isEmpty()) getString(R.string.err_empty_email) else "Please enter a valid email address"
            ),
            check(binding.tilPhone, AccountValidators.isValidPhone(phone), getString(R.string.err_invalid_phone)),
            check(binding.tilAddress, AccountValidators.isValidAddress(address), getString(R.string.err_invalid_address)),
            check(binding.tilRegisterPassword, AccountValidators.isStrongPassword(password), getString(R.string.err_weak_password)),
            check(binding.tilConfirmPassword, confirmPassword == password, getString(R.string.err_password_mismatch))
        )
        return results.all { it }
    }
}
