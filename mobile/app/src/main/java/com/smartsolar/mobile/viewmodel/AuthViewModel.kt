package com.smartsolar.mobile.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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
    data class Error(val message: String) : LoginUiState
}

sealed interface RegisterUiState {
    data object Idle : RegisterUiState
    data object Loading : RegisterUiState
    data class Success(val account: UserAccount) : RegisterUiState
    data class Error(val message: String) : RegisterUiState
}

class AuthViewModel(
    private val authRepository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _loginState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val loginState: StateFlow<LoginUiState> = _loginState.asStateFlow()

    private val _registerState = MutableStateFlow<RegisterUiState>(RegisterUiState.Idle)
    val registerState: StateFlow<RegisterUiState> = _registerState.asStateFlow()

    fun login(context: Context, identifier: String, pass: String) {
        viewModelScope.launch {
            _loginState.value = LoginUiState.Loading
            authRepository.login(context, identifier, pass).fold(
                onSuccess = { _loginState.value = LoginUiState.Success(it) },
                onFailure = { _loginState.value = LoginUiState.Error(it.message ?: "Authentication failed") }
            )
        }
    }

    fun registerProsumer(request: RegisterProsumerRequest) {
        viewModelScope.launch {
            _registerState.value = RegisterUiState.Loading
            authRepository.registerProsumer(request).fold(
                onSuccess = { _registerState.value = RegisterUiState.Success(it) },
                onFailure = { _registerState.value = RegisterUiState.Error(it.message ?: "Registration failed") }
            )
        }
    }

    fun resetLoginState() {
        _loginState.value = LoginUiState.Idle
    }

    fun resetRegisterState() {
        _registerState.value = RegisterUiState.Idle
    }
}
