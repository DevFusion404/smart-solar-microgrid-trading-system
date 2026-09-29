/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : AuthViewModel.kt
 * Description : UI state for login and registration. Login failures caused
 *               by account status (pending / deactivated) get their own
 *               states so the app can open the matching screen.
 * =====================================================
 */

package com.smartsolar.mobile.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartsolar.mobile.data.api.ApiException
import com.smartsolar.mobile.data.api.AuthLoginResponse
import com.smartsolar.mobile.data.api.RegisterProsumerRequest
import com.smartsolar.mobile.data.model.UserAccount
import com.smartsolar.mobile.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface LoginUiState {
    data object Idle : LoginUiState
    data object Loading : LoginUiState
    data class Success(val loginResponse: AuthLoginResponse) : LoginUiState
    /** Correct password, but the registration has not been approved yet (API 403 ACCOUNT_PENDING_ACTIVATION). */
    data class PendingActivation(val message: String) : LoginUiState
    /** Correct password, but the account is deactivated (API 403 ACCOUNT_DEACTIVATED). */
    data class Deactivated(val message: String) : LoginUiState
    data class Error(val message: String) : LoginUiState
}

sealed interface RegisterUiState {
    data object Idle : RegisterUiState
    data object Loading : RegisterUiState
    data class Success(val account: UserAccount) : RegisterUiState
    data class Error(val message: String) : RegisterUiState
}

// Shared view model for LoginActivity and RegisterActivity
class AuthViewModel(
    private val authRepository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _loginState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val loginState: StateFlow<LoginUiState> = _loginState.asStateFlow()

    private val _registerState = MutableStateFlow<RegisterUiState>(RegisterUiState.Idle)
    val registerState: StateFlow<RegisterUiState> = _registerState.asStateFlow()

    // Logs in and maps the result (including account-status errors) to a UI state
    fun login(context: Context, identifier: String, pass: String) {
        viewModelScope.launch {
            _loginState.value = LoginUiState.Loading
            authRepository.login(context, identifier, pass).fold(
                onSuccess = { _loginState.value = LoginUiState.Success(it) },
                onFailure = { _loginState.value = mapLoginFailure(it) }
            )
        }
    }

    // Chooses the state for a failed login based on the API's errorCode
    private fun mapLoginFailure(error: Throwable): LoginUiState {
        val message = error.message ?: "Authentication failed"
        return when ((error as? ApiException)?.errorCode) {
            ApiException.ACCOUNT_PENDING_ACTIVATION -> LoginUiState.PendingActivation(message)
            ApiException.ACCOUNT_DEACTIVATED -> LoginUiState.Deactivated(message)
            else -> LoginUiState.Error(message)
        }
    }

    // Sends the prosumer registration and exposes Loading / Success / Error
    fun registerProsumer(request: RegisterProsumerRequest) {
        viewModelScope.launch {
            _registerState.value = RegisterUiState.Loading
            authRepository.registerProsumer(request).fold(
                onSuccess = { _registerState.value = RegisterUiState.Success(it) },
                onFailure = { _registerState.value = RegisterUiState.Error(it.message ?: "Registration failed") }
            )
        }
    }

    // Returns the login state to Idle after the screen has handled it
    fun resetLoginState() {
        _loginState.value = LoginUiState.Idle
    }

    // Returns the register state to Idle after the screen has handled it
    fun resetRegisterState() {
        _registerState.value = RegisterUiState.Idle
    }
}
