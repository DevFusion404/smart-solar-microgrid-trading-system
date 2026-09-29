/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * Component   : Identity and Account Management (Component 1)
 * File        : AccountValidators.kt
 * Description : Client-side field rules for registration, profile editing,
 *               password change and deactivation requests. They mirror the
 *               API's validation (ProsumerService / ProfileService) so the
 *               user sees mistakes before a request is sent. The API still
 *               validates everything; this is only for fast feedback.
 * =====================================================
 */

package com.smartsolar.mobile.utils

import android.util.Patterns

object AccountValidators {

    /** Sri Lankan NIC: old format 9 digits + V/X, or new format 12 digits. */
    private val NIC_REGEX = Regex("^([0-9]{9}[VXvx]|[0-9]{12})$")

    /** Sri Lankan phone: 0XXXXXXXXX or +94XXXXXXXXX. */
    private val PHONE_REGEX = Regex("^(0[0-9]{9}|\\+94[0-9]{9})$")

    private val USERNAME_REGEX = Regex("^[a-zA-Z0-9_]{4,30}$")

    // Returns true for a valid old- or new-format NIC
    fun isValidNic(nic: String): Boolean = NIC_REGEX.matches(nic.trim())

    // Normalises a NIC the same way the server stores it (trimmed, upper-case V/X)
    fun normalizeNic(nic: String): String = nic.trim().uppercase()

    // Returns true for 0771234567 or +94771234567
    fun isValidPhone(phone: String): Boolean = PHONE_REGEX.matches(phone.trim())

    // Returns true for 4-30 letters, digits or underscores
    fun isValidUsername(username: String): Boolean = USERNAME_REGEX.matches(username.trim())

    // Returns true for a syntactically valid email address
    fun isValidEmail(email: String): Boolean = Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()

    // Returns true when the password has 8+ chars with upper-case, lower-case and a digit
    fun isStrongPassword(password: String): Boolean =
        password.length >= 8 &&
            password.any { it.isUpperCase() } &&
            password.any { it.isLowerCase() } &&
            password.any { it.isDigit() }

    // Returns true for an address of at least 5 characters
    fun isValidAddress(address: String): Boolean = address.trim().length >= 5

    // Returns true when a reason is 10-500 characters (deactivation / rejection rule)
    fun isValidReason(reason: String): Boolean = reason.trim().length in 10..500
}
