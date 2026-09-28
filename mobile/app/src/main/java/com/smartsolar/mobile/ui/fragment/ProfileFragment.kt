/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : ProfileFragment.kt
 * Description : "My Account" screen shared by Prosumers and Grid Operators:
 *               view profile, edit name/phone (and address for prosumers),
 *               open Change Password, and (prosumers only) request account
 *               deactivation. Data comes from GET/PATCH api/account/profile.
 * =====================================================
 */

package com.smartsolar.mobile.ui.fragment

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.UserAccount
import com.smartsolar.mobile.databinding.FragmentProfileBinding
import com.smartsolar.mobile.databinding.ItemInfoRowBinding
import com.smartsolar.mobile.ui.activity.RequestDeactivationActivity
import com.smartsolar.mobile.utils.AccountValidators
import com.smartsolar.mobile.viewmodel.AccountUiState
import com.smartsolar.mobile.viewmodel.AccountViewModel
import com.smartsolar.mobile.viewmodel.PasswordChangeState
import com.smartsolar.mobile.viewmodel.ProfileUpdateState
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

// ──────────────────────────────────────────────────────────────────────────────
// ProfileFragment — "My Account" screen.
//
// Responsible for:
//   • Displaying the logged-in user's profile (avatar, name, role, status, info rows)
//   • Toggling between view-mode and edit-form for editable fields
//   • Launching ChangePasswordFragment
//   • Opening the deactivation request screen (prosumers only)
//
// Uses AccountViewModel for all data and operations.
// Shows an error state with Retry when the API cannot be reached.
// ──────────────────────────────────────────────────────────────────────────────
class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    private val viewModel: AccountViewModel by viewModels()

    // ── Row binding helpers (via <include> with id) ───────────────────────────
    private lateinit var rowFullName: ItemInfoRowBinding
    private lateinit var rowUsername: ItemInfoRowBinding
    private lateinit var rowEmail: ItemInfoRowBinding
    private lateinit var rowPhone: ItemInfoRowBinding
    private lateinit var rowAddress: ItemInfoRowBinding
    private lateinit var rowNic: ItemInfoRowBinding

    // Role of the loaded account; address and deactivation apply to prosumers only
    private var isProsumer = false

    // Inflates the layout with ViewBinding
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    // Binds the info rows, then wires listeners and observers
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Included info-row sub-views are already bound as ItemInfoRowBinding by ViewBinding
        rowFullName = binding.rowFullName
        rowUsername = binding.rowUsername
        rowEmail    = binding.rowEmail
        rowPhone    = binding.rowPhone
        rowAddress  = binding.rowAddress
        rowNic      = binding.rowNic

        setupRowIcons()
        setupClickListeners()
        observeViewModel()
    }

    // ── Setup icon tints for info rows ────────────────────────────────────────
    private fun setupRowIcons() {
        // Sets a row's icon and applies the muted tint
        fun tint(row: ItemInfoRowBinding, drawableRes: Int) {
            row.ivInfoRowIcon.setImageResource(drawableRes)
            row.ivInfoRowIcon.imageTintList =
                ContextCompat.getColorStateList(requireContext(), R.color.icon_tint_muted)
        }
        tint(rowFullName, R.drawable.ic_person)
        tint(rowUsername, R.drawable.ic_person)
        tint(rowEmail,    R.drawable.ic_email)
        tint(rowPhone,    R.drawable.ic_phone)
        tint(rowAddress,  R.drawable.ic_home_address)
        tint(rowNic,      R.drawable.ic_id_card)
    }

    // ── Click listeners ───────────────────────────────────────────────────────
    private fun setupClickListeners() {
        // Retry on error state
        binding.btnRetry.setOnClickListener { viewModel.loadProfile() }

        // Toggle edit form
        binding.btnToggleEdit.setOnClickListener {
            val showingEdit = binding.cardEditForm.isVisible
            setEditMode(!showingEdit)
        }

        binding.btnCancelEdit.setOnClickListener {
            setEditMode(false)
            viewModel.resetUpdateState()
        }

        // Save profile edits (same rules as the API: name >= 2 chars, Sri Lankan phone, address >= 5 chars)
        binding.btnSaveProfile.setOnClickListener {
            val fullName    = binding.etEditFullName.text?.toString()?.trim().orEmpty()
            val phone       = binding.etEditPhone.text?.toString()?.trim().orEmpty()
            val address     = binding.etEditAddress.text?.toString()?.trim().orEmpty()

            val nameOk = fullName.length >= 2
            binding.tilEditFullName.error = if (nameOk) null else "Full name must be at least 2 characters"

            val phoneOk = AccountValidators.isValidPhone(phone)
            binding.tilEditPhone.error = if (phoneOk) null else getString(R.string.err_invalid_phone)

            val addressOk = !isProsumer || AccountValidators.isValidAddress(address)
            binding.tilEditAddress.error = if (addressOk) null else getString(R.string.err_invalid_address)

            if (nameOk && phoneOk && addressOk) {
                viewModel.updateProfile(fullName, phone, address)
            }
        }

        // Navigate to Change Password fragment
        binding.btnChangePassword.setOnClickListener {
            parentFragmentManager.beginTransaction()
                .replace(R.id.fragmentContainer, ChangePasswordFragment())
                .addToBackStack(null)
                .commit()
        }

        // Deactivation request: open the dedicated screen, which validates the reason
        // and shows a summary screen after the request is submitted
        binding.btnRequestDeactivation.setOnClickListener {
            startActivity(Intent(requireContext(), RequestDeactivationActivity::class.java))
        }
    }

    // ── Observe ViewModel state flows ─────────────────────────────────────────
    private fun observeViewModel() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {

                // Profile state
                launch {
                    viewModel.profileState.collect { state ->
                        when (state) {
                            is AccountUiState.Loading -> showLoading()
                            is AccountUiState.Error   -> showError(state.message)
                            is AccountUiState.Success -> showProfile(state.account)
                        }
                    }
                }

                // Update state
                launch {
                    viewModel.updateState.collect { state ->
                        when (state) {
                            is ProfileUpdateState.Idle    -> { /* no-op */ }
                            is ProfileUpdateState.Saving  -> {
                                binding.btnSaveProfile.isEnabled = false
                                binding.btnSaveProfile.text = "Saving…"
                            }
                            is ProfileUpdateState.Saved   -> {
                                binding.btnSaveProfile.isEnabled = true
                                binding.btnSaveProfile.text = "Save Changes"
                                setEditMode(false)
                                showSavedBanner()
                                viewModel.resetUpdateState()
                            }
                            is ProfileUpdateState.Error   -> {
                                binding.btnSaveProfile.isEnabled = true
                                binding.btnSaveProfile.text = "Save Changes"
                                Toast.makeText(
                                    requireContext(), state.message, Toast.LENGTH_LONG
                                ).show()
                                viewModel.resetUpdateState()
                            }
                        }
                    }
                }

                // Deactivation result
                launch {
                    viewModel.deactivationResult.collect { msg ->
                        if (msg != null) {
                            Toast.makeText(requireContext(), msg, Toast.LENGTH_LONG).show()
                            viewModel.clearDeactivationResult()
                        }
                    }
                }
            }
        }
    }

    // ── UI helpers ────────────────────────────────────────────────────────────

    // Shows the loading spinner
    private fun showLoading() {
        binding.layoutLoading.isVisible  = true
        binding.layoutError.isVisible    = false
        binding.layoutContent.isVisible  = false
    }

    // Shows the error panel with a Retry button
    private fun showError(message: String) {
        binding.layoutLoading.isVisible  = false
        binding.layoutError.isVisible    = true
        binding.layoutContent.isVisible  = false
        binding.tvErrorMessage.text      = message
    }

    // Fills the header, info rows and edit form from the loaded account
    private fun showProfile(account: UserAccount) {
        isProsumer = account.role == "Prosumer"
        binding.layoutLoading.isVisible  = false
        binding.layoutError.isVisible    = false
        binding.layoutContent.isVisible  = true

        // Avatar
        binding.tvAvatarInitials.text = account.initials
        binding.tvFullName.text       = account.fullName
        binding.tvUsername.text       = "@${account.username}"
        binding.tvRoleBadge.text      = account.role
        binding.statusBadge.setStatus(account.status)

        // Meta
        binding.tvMemberSince.text = "Member since ${formatMonthYear(account.createdAt)}"
        binding.tvLastLogin.text   = "Last login: ${formatDateTime(account.lastLoginAt)}"
        binding.tvLastUpdated.text = "Last updated: ${formatDateTime(account.updatedAt)}"

        // Info rows
        setRow(rowFullName, "Full Name",     account.fullName.ifEmpty { null })
        setRow(rowUsername, "Username",      "@${account.username}")
        setRow(rowEmail,    "Email Address", account.email.ifEmpty { null })
        setRow(rowPhone,    "Phone Number",  account.phoneNumber.ifEmpty { null })
        setRow(rowAddress,  "Address",       account.address)
        setRow(rowNic,      "NIC",           account.nic)

        // Address and NIC only exist for prosumers
        rowAddress.root.isVisible = isProsumer
        rowNic.root.isVisible = isProsumer
        binding.tilEditAddress.isVisible = isProsumer

        // Only an Active prosumer can ask for deactivation
        binding.btnRequestDeactivation.isVisible = isProsumer && account.status == "Active"

        // Pre-fill edit form
        binding.etEditFullName.setText(account.fullName)
        binding.etEditPhone.setText(account.phoneNumber)
        binding.etEditAddress.setText(account.address.orEmpty())
    }

    // Sets one info row's label and value ("—" when empty)
    private fun setRow(row: ItemInfoRowBinding, label: String, value: String?) {
        row.tvInfoLabel.text = label
        row.tvInfoValue.text = value ?: "—"
        row.tvInfoValue.setTextColor(
            ContextCompat.getColor(
                requireContext(),
                if (value != null) R.color.slate_800 else R.color.slate_400
            )
        )
    }

    // Switches between the read-only card and the edit form
    private fun setEditMode(editing: Boolean) {
        binding.cardViewInfo.isVisible  = !editing
        binding.cardEditForm.isVisible  =  editing
        binding.btnToggleEdit.text      = if (editing) "Cancel" else "Edit Profile"
        val bgTint = if (editing) R.color.slate_200 else R.color.solar_primary
        val txtColor = if (editing) R.color.slate_700 else R.color.slate_950
        binding.btnToggleEdit.backgroundTintList =
            ContextCompat.getColorStateList(requireContext(), bgTint)
        binding.btnToggleEdit.setTextColor(ContextCompat.getColor(requireContext(), txtColor))
    }

    // Shows the "Profile updated" banner for a few seconds
    private fun showSavedBanner() {
        binding.bannerSaved.isVisible = true
        binding.scrollViewProfile.post {
            binding.scrollViewProfile.smoothScrollTo(0, 0)
        }
        binding.bannerSaved.postDelayed({ binding.bannerSaved.isVisible = false }, 3500)
    }

    // ── Date formatting helpers ───────────────────────────────────────────────

    // Formats an ISO timestamp as "dd MMM yyyy, HH:mm" in local time
    private fun formatDateTime(iso: String?): String {
        if (iso.isNullOrBlank()) return "Never"
        return try {
            val instant = Instant.parse(iso)
            DateTimeFormatter
                .ofPattern("dd MMM yyyy, HH:mm")
                .withZone(ZoneId.systemDefault())
                .format(instant)
        } catch (e: Exception) {
            iso
        }
    }

    // Formats an ISO timestamp as "MMM yyyy"
    private fun formatMonthYear(iso: String): String {
        return try {
            val instant = Instant.parse(iso)
            DateTimeFormatter
                .ofPattern("MMM yyyy")
                .withZone(ZoneId.systemDefault())
                .format(instant)
        } catch (e: Exception) {
            iso
        }
    }

    // Reloads the profile when returning from the deactivation screen so the status is current
    override fun onResume() {
        super.onResume()
        if (_binding != null && binding.layoutContent.isVisible) viewModel.loadProfile()
    }

    // Releases the binding to avoid leaking the view
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
