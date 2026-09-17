package com.smartsolar.mobile.data.model

import com.google.gson.annotations.SerializedName

// ──────────────────────────────────────────────────────────────────────────────
// UserAccount — mirrors ProsumerResponseDto / WebUserResponseDto from backend.
// Used by GET /api/account/profile (to be implemented in backend).
// ──────────────────────────────────────────────────────────────────────────────
data class UserAccount(
    @SerializedName("username")
    val username: String = "",

    @SerializedName("fullName")
    val fullName: String = "",

    @SerializedName("email")
    val email: String = "",

    @SerializedName("phoneNumber")
    val phoneNumber: String = "",

    @SerializedName("address")
    val address: String? = null,

    @SerializedName("nic")
    val nic: String? = null,

    @SerializedName("role")
    val role: String = "",

    @SerializedName("status")
    val status: String = "",

    @SerializedName("createdAt")
    val createdAt: String = "",

    @SerializedName("updatedAt")
    val updatedAt: String = "",

    @SerializedName("lastLoginAt")
    val lastLoginAt: String? = null,

    @SerializedName("activationRequestedAt")
    val activationRequestedAt: String? = null,

    @SerializedName("activatedAt")
    val activatedAt: String? = null,

    @SerializedName("activatedBy")
    val activatedBy: String? = null,

    @SerializedName("deactivationReason")
    val deactivationReason: String? = null,

    @SerializedName("deactivatedAt")
    val deactivatedAt: String? = null,

    @SerializedName("deactivatedBy")
    val deactivatedBy: String? = null
) {
    /** Computed display initials — up to two letters from the full name. */
    val initials: String
        get() = fullName
            .split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercaseChar().toString() }
            .ifEmpty { "U" }

    /** True when this account is in the Active state. */
    val isActive: Boolean get() = status.equals("Active", ignoreCase = true)

    /** Human-readable account status label. */
    val statusLabel: String
        get() = when (status.lowercase()) {
            "active"                -> "Active"
            "pendingactivation"     -> "Pending Activation"
            "deactivationrequested" -> "Deactivation Requested"
            "deactivated"           -> "Deactivated"
            else                    -> status
        }
}

// ──────────────────────────────────────────────────────────────────────────────
// UpdateProfileRequest — maps to PATCH /api/account/profile body.
// Fields are nullable; omitted when null on serialization.
// ──────────────────────────────────────────────────────────────────────────────
data class UpdateProfileRequest(
    @SerializedName("fullName")
    val fullName: String? = null,

    @SerializedName("phoneNumber")
    val phoneNumber: String? = null,

    @SerializedName("address")
    val address: String? = null
)

// ──────────────────────────────────────────────────────────────────────────────
// ChangePasswordRequest — maps to POST /api/account/change-password body.
// ──────────────────────────────────────────────────────────────────────────────
data class ChangePasswordRequest(
    @SerializedName("currentPassword")
    val currentPassword: String,

    @SerializedName("newPassword")
    val newPassword: String,

    @SerializedName("confirmPassword")
    val confirmPassword: String
)

// ──────────────────────────────────────────────────────────────────────────────
// DeactivationRequest — maps to POST /api/account/request-deactivation body.
// ──────────────────────────────────────────────────────────────────────────────
data class DeactivationRequest(
    @SerializedName("reason")
    val reason: String
)
