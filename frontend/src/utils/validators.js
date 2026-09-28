/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Identity and Account Management (Component 1)
File          : validators.js
Description   : Client-side field rules that mirror the API's validation
                (ProsumerService / WebUserService / ProfileService), so users
                see mistakes before the request is sent. The API still
                validates everything - these are only for fast feedback.
=====================================================
*/

// Sri Lankan NIC: old format 9 digits + V/X, or new format 12 digits
export const NIC_PATTERN = /^([0-9]{9}[VXvx]|[0-9]{12})$/
// Sri Lankan phone: 0XXXXXXXXX or +94XXXXXXXXX
export const PHONE_PATTERN = /^(0[0-9]{9}|\+94[0-9]{9})$/
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{4,30}$/
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// Returns an error message for an invalid NIC, or '' when valid
export function validateNic(value) {
  return NIC_PATTERN.test((value || '').trim()) ? '' : 'NIC must be 9 digits + V/X (e.g. 981234567V) or 12 digits (e.g. 199812345678).'
}

// Returns an error message for an invalid phone number, or '' when valid
export function validatePhone(value) {
  return PHONE_PATTERN.test((value || '').trim()) ? '' : 'Phone must be 0771234567 or +94771234567 (no spaces).'
}

// Returns an error message for an invalid username, or '' when valid
export function validateUsername(value) {
  return USERNAME_PATTERN.test((value || '').trim()) ? '' : 'Username must be 4-30 letters, numbers or underscores.'
}

// Returns an error message for an invalid email, or '' when valid
export function validateEmail(value) {
  return EMAIL_PATTERN.test((value || '').trim()) ? '' : 'Enter a valid email address.'
}

// Returns an error message for a weak password, or '' when strong enough
export function validatePassword(value) {
  const v = value || ''
  if (v.length < 8 || !/[A-Z]/.test(v) || !/[a-z]/.test(v) || !/[0-9]/.test(v)) {
    return 'Password needs at least 8 characters with an uppercase letter, a lowercase letter and a number.'
  }
  return ''
}

// Returns an error message when a reason is outside the API's 10-500 character range
export function validateReason(value) {
  const length = (value || '').trim().length
  return length >= 10 && length <= 500 ? '' : 'Reason must be between 10 and 500 characters.'
}

// Validates a prosumer registration form; returns { fieldName: message } for every invalid field
export function validateProsumerForm(form) {
  const errors = {
    nic: validateNic(form.nic),
    fullName: (form.fullName || '').trim().length >= 2 ? '' : 'Full name must be at least 2 characters.',
    username: validateUsername(form.username),
    email: validateEmail(form.email),
    phoneNumber: validatePhone(form.phoneNumber),
    address: (form.address || '').trim().length >= 5 ? '' : 'Address must be at least 5 characters.',
    password: validatePassword(form.password),
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}
