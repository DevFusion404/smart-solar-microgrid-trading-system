/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : ApiException.kt
 * Description : Error raised when the API returns a non-2xx response. Keeps
 *               the HTTP status and the API's machine-readable errorCode
 *               (e.g. ACCOUNT_PENDING_ACTIVATION, DUPLICATE_NIC) so screens
 *               can react to specific cases instead of parsing messages.
 * =====================================================
 */

package com.smartsolar.mobile.data.api

class ApiException(
    val httpStatus: Int,
    val errorCode: String?,
    message: String
) : Exception(message) {

    companion object {
        const val ACCOUNT_PENDING_ACTIVATION = "ACCOUNT_PENDING_ACTIVATION"
        const val ACCOUNT_DEACTIVATED = "ACCOUNT_DEACTIVATED"
    }
}
