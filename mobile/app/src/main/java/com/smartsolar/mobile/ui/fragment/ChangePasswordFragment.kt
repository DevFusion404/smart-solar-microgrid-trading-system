/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : ChangePasswordFragment.kt
 * Description : Change Password screen (POST api/account/change-password).
 *               Enforces the same password strength rule as the API.
 * =====================================================
 */

package com.smartsolar.mobile.ui.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.smartsolar.mobile.databinding.FragmentChangePasswordBinding
import com.smartsolar.mobile.utils.AccountValidators
import com.smartsolar.mobile.viewmodel.AccountViewModel
import com.smartsolar.mobile.viewmodel.PasswordChangeState
import kotlinx.coroutines.launch

// ──────────────────────────────────────────────────────────────────────────────
// ChangePasswordFragment — "Change Password" screen.
//
// Allows the user to update their password via POST /api/account/change-password.
// Uses the shared AccountViewModel (scoped to the parent activity so the profile
// data is preserved when navigating back).
// ──────────────────────────────────────────────────────────────────────────────
class ChangePasswordFragment : Fragment() {

    private var _binding: FragmentChangePasswordBinding? = null
    private val binding get() = _binding!!

    // Share ViewModel with the parent activity so it's the same instance as ProfileFragment
    private val viewModel: AccountViewModel by viewModels({ requireActivity() })

    // Inflates the layout with ViewBinding
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentChangePasswordBinding.inflate(inflater, container, false)
        return binding.root
    }

    // Wires the back/submit buttons and observes the password-change result
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Back button
        binding.btnBack.setOnClickListener {
            parentFragmentManager.popBackStack()
        }

        // Submit
        binding.btnSubmitPasswordChange.setOnClickListener {
            val current = binding.etCurrentPassword.text?.toString().orEmpty()
            val new     = binding.etNewPassword.text?.toString().orEmpty()
            val confirm = binding.etConfirmPassword.text?.toString().orEmpty()

            // Client-side guards
            var valid = true
            if (current.isBlank()) {
                binding.tilCurrentPassword.error = "Current password is required"
                valid = false
            } else {
                binding.tilCurrentPassword.error = null
            }
            if (new.isBlank()) {
                binding.tilNewPassword.error = "New password is required"
                valid = false
            } else if (!AccountValidators.isStrongPassword(new)) {
                binding.tilNewPassword.error = getString(com.smartsolar.mobile.R.string.err_weak_password)
                valid = false
            } else if (new == current) {
                binding.tilNewPassword.error = "New password must be different from the current one"
                valid = false
            } else {
                binding.tilNewPassword.error = null
            }
            if (confirm != new) {
                binding.tilConfirmPassword.error = "Passwords do not match"
                valid = false
            } else {
                binding.tilConfirmPassword.error = null
            }

            if (valid) viewModel.changePassword(current, new, confirm)
        }

        observePasswordState()
    }

    // Shows Saving / Success / Error for the password change request
    private fun observePasswordState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.passwordState.collect { state ->
                    when (state) {
                        is PasswordChangeState.Idle    -> resetUi()
                        is PasswordChangeState.Saving  -> {
                            binding.btnSubmitPasswordChange.isEnabled = false
                            binding.btnSubmitPasswordChange.text = "Updating…"
                        }
                        is PasswordChangeState.Success -> {
                            showResultBanner("✓  Password changed successfully.", isError = false)
                            clearFields()
                            resetButtonState()
                            viewModel.resetPasswordState()
                        }
                        is PasswordChangeState.Error   -> {
                            showResultBanner("✗  ${state.message}", isError = true)
                            resetButtonState()
                            viewModel.resetPasswordState()
                        }
                    }
                }
            }
        }
    }

    // ── UI helpers ────────────────────────────────────────────────────────────

    // Restores the idle button and hides the result banner
    private fun resetUi() {
        binding.btnSubmitPasswordChange.isEnabled = true
        binding.btnSubmitPasswordChange.text = "Update Password"
        binding.bannerPasswordResult.isVisible = false
    }

    // Re-enables the submit button after a request finishes
    private fun resetButtonState() {
        binding.btnSubmitPasswordChange.isEnabled = true
        binding.btnSubmitPasswordChange.text = "Update Password"
    }

    // Empties all three password fields after a successful change
    private fun clearFields() {
        binding.etCurrentPassword.text = null
        binding.etNewPassword.text     = null
        binding.etConfirmPassword.text = null
    }

    // Shows a success (auto-hides) or error banner
    private fun showResultBanner(message: String, isError: Boolean) {
        binding.tvPasswordResultMessage.text = message
        binding.tvPasswordResultMessage.setTextColor(
            requireContext().getColor(
                if (isError) com.smartsolar.mobile.R.color.status_red
                else 0xFF065F46.toInt()  // emerald-900 fallback
            )
        )
        binding.bannerPasswordResult.isVisible = true
        if (!isError) {
            binding.bannerPasswordResult.postDelayed(
                { binding.bannerPasswordResult.isVisible = false }, 4000
            )
        }
    }

    // Releases the binding to avoid leaking the view
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
