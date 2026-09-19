package com.smartsolar.mobile.data.model

// ──────────────────────────────────────────────────────────────────────────────
// SessionRecord — mirrors one row in the local SQLite `sessions` table.
// Populated after a successful POST /api/auth/login (MongoDB-validated).
// ──────────────────────────────────────────────────────────────────────────────
data class SessionRecord(
    /** Local SQLite row ID */
    val id: Long = 0L,

    /** MongoDB user identifier */
    val userId: String = "",

    val username: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String,

    /** Prosumer | GridOperator | Backoffice */
    val role: String,

    /** Active | PendingActivation | DeactivationRequested | Deactivated */
    val status: String,

    val nic: String? = null,
    val address: String? = null,

    /** Current JWT issued by the backend */
    val jwtToken: String,

    /** ISO-8601 token expiry timestamp returned by the backend */
    val expiresAt: String,

    /** ISO-8601 timestamp of the last successful login */
    val loggedInAt: String,

    /** True when this record represents the currently active session */
    val isActiveSession: Boolean = true
) {
    /** Computed display initials — up to two letters from the full name. */
    val initials: String
        get() = fullName
            .split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercaseChar().toString() }
            .ifEmpty { "U" }

    val isActive: Boolean get() = status.equals("Active", ignoreCase = true)

    val statusLabel: String
        get() = when (status.lowercase()) {
            "active"                -> "Active"
            "pendingactivation"     -> "Pending Activation"
            "deactivationrequested" -> "Deactivation Requested"
            "deactivated"           -> "Deactivated"
            else                    -> status
        }
}
