/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : 3D Login Page
File          : LoginPage.jsx
Description   : Beautiful login form rendered inside the
                AuthLayout glassmorphism card, with 3D
                floating effects and micro-animations.
=====================================================
*/

import { Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login({ username, password })
      const userRole = result?.user?.role || result?.role
      if (userRole === 'GridOperator') navigate('/operator')
      else if (userRole === 'Prosumer') navigate('/prosumer/profile')
      else navigate('/backoffice')
    } catch (err) {
      console.error('Login failed:', err)
      setError(err.message || 'Invalid credentials or server error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Card header */}
      <div className="auth-card-header">
        <div className="auth-card-icon">
          <LogIn size={22} strokeWidth={2} />
        </div>
        <h1 className="auth-card-title">Welcome Back</h1>
        <p className="auth-card-sub">
          Sign in to your SolarGrid account
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div id="login-error-banner" className="auth-error-banner" role="alert">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form id="login-form" className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-username" className="auth-label">Username</label>
          <input
            id="login-username"
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="login-password" className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="auth-input"
            />
            <button
              type="button"
              id="login-toggle-pw"
              onClick={() => setShowPassword((v) => !v)}
              aria-label="Toggle password visibility"
              className="auth-eye-btn"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="auth-row">
          <label className="auth-check-label">
            <input id="login-remember" type="checkbox" name="rememberMe" className="auth-checkbox" />
            <span>Remember me</span>
          </label>
          <button type="button" id="forgot-pw-btn" className="auth-link">Forgot password?</button>
        </div>

        <button
          id="login-submit-btn"
          type="submit"
          disabled={loading}
          className={`auth-submit-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <span className="auth-spinner" aria-label="Signing in" />
          ) : (
            <>
              <LogIn size={18} />
              Sign In
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <p className="auth-switch-text">
        Don&apos;t have an account?{' '}
        <button
          id="go-to-register-btn"
          type="button"
          onClick={() => navigate('/register')}
          className="auth-link auth-link-highlight"
        >
          Create one →
        </button>
      </p>
    </AuthLayout>
  )
}
