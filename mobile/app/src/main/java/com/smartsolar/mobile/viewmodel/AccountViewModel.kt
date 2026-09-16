package com.smartsolar.mobile.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartsolar.mobile.data.model.UpdateProfileRequest
import com.smartsolar.mobile.data.model.UserAccount
import com.smartsolar.mobile.data.repository.UserAccountRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

// ──────────────────────────────────────────────────────────────────────────────
// AccountUiState — sealed interface for the profile screen state machine.
// ──────────────────────────────────────────────────────────────────────────────
sealed interface AccountUiState {
    data object Loading : AccountUiState
    data class Success(val account: UserAccount) : AccountUiState
    data class Error(val message: String) : AccountUiState
}

// ──────────────────────────────────────────────────────────────────────────────
// ProfileUpdateState — tracks in-flight save / success / error for the edit form.
// ──────────────────────────────────────────────────────────────────────────────
sealed interface ProfileUpdateState {
    data object Idle : ProfileUpdateState
    data object Saving : ProfileUpdateState
    data class Saved(val account: UserAccount) : ProfileUpdateState
    data class Error(val message: String) : ProfileUpdateState
}

// ──────────────────────────────────────────────────────────────────────────────
// PasswordChangeState — tracks the change-password operation.
// ──────────────────────────────────────────────────────────────────────────────
sealed interface PasswordChangeState {
    data object Idle : PasswordChangeState
    data object Saving : PasswordChangeState
    data object Success : PasswordChangeState
    data class Error(val message: String) : PasswordChangeState
}

// ──────────────────────────────────────────────────────────────────────────────
// AccountViewModel — drives ProfileFragment and ChangePasswordFragment.
// ──────────────────────────────────────────────────────────────────────────────
class AccountViewModel(
    private val repository: UserAccountRepository = UserAccountRepository()
) : ViewModel() {

    // ── Profile state ─────────────────────────────────────────────────────────
    private val _profileState = MutableStateFlow<AccountUiState>(AccountUiState.Loading)
    val profileState: StateFlow<AccountUiState> = _profileState.asStateFlow()

    // ── Profile update state ──────────────────────────────────────────────────
    private val _updateState = MutableStateFlow<ProfileUpdateState>(ProfileUpdateState.Idle)
    val updateState: StateFlow<ProfileUpdateState> = _updateState.asStateFlow()

    // ── Password change state ─────────────────────────────────────────────────
    private val _passwordState = MutableStateFlow<PasswordChangeState>(PasswordChangeState.Idle)
    val passwordState: StateFlow<PasswordChangeState> = _passwordState.asStateFlow()

    // ── Deactivation result ───────────────────────────────────────────────────
    private val _deactivationResult = MutableStateFlow<String?>(null)
    val deactivationResult: StateFlow<String?> = _deactivationResult.asStateFlow()

    // ── Load profile on init ─────────────────────────────────────────────────
    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _profileState.value = AccountUiState.Loading
            repository.getProfile().fold(
                onSuccess = { _profileState.value = AccountUiState.Success(it) },
                onFailure = { _profileState.value = AccountUiState.Error(it.message ?: "Unknown error") }
            )
        }
    }

    // ── Update editable profile fields ───────────────────────────────────────
    fun updateProfile(fullName: String, phoneNumber: String, address: String) {
        viewModelScope.launch {
            _updateState.value = ProfileUpdateState.Saving
            val request = UpdateProfileRequest(
                fullName = fullName.trim().takeIf { it.isNotEmpty() },
                phoneNumber = phoneNumber.trim().takeIf { it.isNotEmpty() },
                address = address.trim().takeIf { it.isNotEmpty() }
            )
            repository.updateProfile(request).fold(
                onSuccess = {
                    _profileState.value = AccountUiState.Success(it)
                    _updateState.value = ProfileUpdateState.Saved(it)
                },
                onFailure = {
                    _updateState.value = ProfileUpdateState.Error(it.message ?: "Update failed")
                }
            )
        }
    }

    fun resetUpdateState() {
        _updateState.value = ProfileUpdateState.Idle
    }

    // ── Change password ───────────────────────────────────────────────────────
    fun changePassword(current: String, new: String, confirm: String) {
        if (new != confirm) {
            _passwordState.value = PasswordChangeState.Error("Passwords do not match")
            return
        }
        if (new.length < 6) {
            _passwordState.value = PasswordChangeState.Error("Password must be at least 6 characters")
            return
        }
        viewModelScope.launch {
            _passwordState.value = PasswordChangeState.Saving
            repository.changePassword(
                com.smartsolar.mobile.data.model.ChangePasswordRequest(
                    currentPassword = current,
                    newPassword = new,
                    confirmPassword = confirm
                )
            ).fold(
                onSuccess  = { _passwordState.value = PasswordChangeState.Success },
                onFailure  = { _passwordState.value = PasswordChangeState.Error(it.message ?: "Failed") }
            )
        }
    }

    fun resetPasswordState() {
        _passwordState.value = PasswordChangeState.Idle
    }

    // ── Request account deactivation ──────────────────────────────────────────
    fun requestDeactivation(reason: String) {
        viewModelScope.launch {
            repository.requestDeactivation(reason).fold(
                onSuccess  = { _deactivationResult.value = it },
                onFailure  = { _deactivationResult.value = "Error: ${it.message}" }
            )
        }
    }

    fun clearDeactivationResult() {
        _deactivationResult.value = null
    }
}
