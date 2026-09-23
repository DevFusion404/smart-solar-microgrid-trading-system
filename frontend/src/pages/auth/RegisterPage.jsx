/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : 3D Register Page
File          : RegisterPage.jsx
Description   : Beautiful prosumer registration form rendered
                inside the AuthLayout glassmorphism card.
=====================================================
*/

import { Eye, EyeOff, AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { prosumerService } from '../../services'

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nic: '',
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await prosumerService.registerProsumer(formData)
      setSuccess(true)
    } catch (err) {
      console.error('Registration failed:', err)
      setError(err.message || 'Registration failed. Please check your inputs and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div id="register-success-panel" className="auth-success-panel">
          <div className="auth-success-icon-wrap">
            <CheckCircle2 size={40} strokeWidth={1.5} />
          </div>
          <h1 className="auth-card-title" style={{ marginTop: '1rem' }}>Registration Submitted!</h1>
          <p className="auth-card-sub" style={{ marginBottom: '0.5rem' }}>
            Your prosumer account is now{' '}
            <strong className="pending-badge">Pending Activation</strong>
            {' '}and awaiting Backoffice review.
          </p>
          <p className="auth-card-sub" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            You&apos;ll receive confirmation once your account is approved.
          </p>
          <button
            id="go-to-login-after-register-btn"
            type="button"
            onClick={() => navigate('/login')}
            className="auth-submit-btn"
          >
            <LogIn size={18} />
            Go to Sign In
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      {/* Card header */}
      <div className="auth-card-header">
        <div className="auth-card-icon" style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)' }}>
          <UserPlus size={22} strokeWidth={2} />
        </div>
        <h1 className="auth-card-title">Create Account</h1>
        <p className="auth-card-sub">Register as a prosumer on SolarGrid</p>
      </div>

      {/* Error banner */}
      {error && (
        <div id="register-error-banner" className="auth-error-banner" role="alert">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form id="register-form" className="auth-form" onSubmit={handleSubmit}>
        {/* Row 1: NIC + Username */}
        <div className="auth-grid-2">
          <div className="auth-field">
            <label htmlFor="reg-nic" className="auth-label">NIC Number</label>
            <input
              id="reg-nic"
              type="text"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              placeholder="e.g. 981234567V"
              required
              className="auth-input"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-username" className="auth-label">Username</label>
            <input
              id="reg-username"
              type="text"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. kasun.silva"
              required
              className="auth-input"
            />
          </div>
        </div>

        {/* Full name */}
        <div className="auth-field">
          <label htmlFor="reg-fullname" className="auth-label">Full Name</label>
          <input
            id="reg-fullname"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Kasun Silva"
            required
            className="auth-input"
          />
        </div>

        {/* Row 2: Email + Phone */}
        <div className="auth-grid-2">
          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">Email</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="auth-input"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-phone" className="auth-label">Phone</label>
            <input
              id="reg-phone"
              type="tel"
              name="phoneNumber"
              autoComplete="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+94 77 111 2222"
              required
              className="auth-input"
            />
          </div>
        </div>

        {/* Address */}
        <div className="auth-field">
          <label htmlFor="reg-address" className="auth-label">Address</label>
          <input
            id="reg-address"
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="No. 15, Park Road, Colombo 05"
            required
            className="auth-input"
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <label htmlFor="reg-password" className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
              className="auth-input"
            />
            <button
              type="button"
              id="reg-toggle-pw"
              onClick={() => setShowPassword((v) => !v)}
              aria-label="Toggle password visibility"
              className="auth-eye-btn"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Terms */}
        <label className="auth-check-label" style={{ marginTop: '0.25rem' }}>
          <input id="reg-terms" type="checkbox" required className="auth-checkbox" />
          <span>I agree to the <button type="button" className="auth-link">terms &amp; privacy policy</button></span>
        </label>

        {/* Submit */}
        <button
          id="register-submit-btn"
          type="submit"
          disabled={loading}
          className={`auth-submit-btn register-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <span className="auth-spinner" aria-label="Creating account" />
          ) : (
            <>
              <UserPlus size={18} />
              Create Prosumer Account
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <p className="auth-switch-text">
        Already have an account?{' '}
        <button
          id="go-to-login-btn"
          type="button"
          onClick={() => navigate('/login')}
          className="auth-link auth-link-highlight"
        >
          Sign in →
        </button>
      </p>
    </AuthLayout>
  )
}
