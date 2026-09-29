/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Identity and Account Management (Component 1)
File          : LoginPage.jsx
Description   : Web portal login for Backoffice officers and Grid
                Operators, rendered inside the AuthLayout card.
                Prosumer credentials are refused with a popup that
                points the user to the mobile app.
=====================================================
*/

import { Eye, EyeOff, AlertCircle, LogIn, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { useAuth } from '../../context/AuthContext'
import { homePathForRole, isPathAllowedForRole, WEB_ROLE_NOT_ALLOWED } from '../../utils/roleRoutes'

// Popup shown when prosumer credentials are used on the web portal
function MobileOnlyDialog({ message, onClose }) {
  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-only-title"
      onClick={onClose}
    >
      <div className="auth-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-icon">
          <Smartphone size={26} strokeWidth={2} />
        </div>
        <h2 id="mobile-only-title" className="auth-card-title">Web access not available</h2>
        <p className="auth-card-sub auth-modal-text">{message}</p>
        <button id="mobile-only-ok-btn" type="button" onClick={onClose} className="auth-submit-btn" autoFocus>
          OK
        </button>
      </div>
    </div>
  )
}

// Login form: authenticates against /api/Auth/login and sends the user to their role's home area
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, role, loading: sessionLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobileOnlyMessage, setMobileOnlyMessage] = useState('')

  // Page the user tried to open before being sent to login (set by RequireRole)
  const requestedPath = location.state?.from

  // Chooses where to go after login: the requested page if the role may open it, otherwise the role's home
  const destinationFor = (userRole) =>
    isPathAllowedForRole(requestedPath, userRole) ? requestedPath : homePathForRole(userRole)

  // Submits credentials; on success redirects by role, on failure shows the API's message
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login({ username, password })
      const userRole = result?.user?.role || result?.role
      navigate(destinationFor(userRole), { replace: true })
    } catch (err) {
      const apiErrorCode = err.response?.data?.errorCode
      if (err.code === WEB_ROLE_NOT_ALLOWED) {
        // Valid prosumer credentials: no web session is created
        setMobileOnlyMessage(err.message)
        setPassword('')
      } else if (apiErrorCode === 'ACCOUNT_PENDING_ACTIVATION') {
        // Only prosumer registrations can be pending, so this is also a prosumer account
        setMobileOnlyMessage(
          'This is a prosumer account and it is still waiting for Backoffice approval. ' +
          'Prosumers use the SolarGrid mobile app; you can sign in there once the account is activated.'
        )
        setPassword('')
      } else {
        setError(err.message || 'Invalid credentials or server error. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Already logged in: skip the form and go straight to the role's area
  if (!sessionLoading && isAuthenticated) {
    return <Navigate to={destinationFor(role)} replace />
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
          Sign in to the SolarGrid Backoffice &amp; Grid Operator portal
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

      {/* Web accounts are created by a Backoffice officer; prosumers use the mobile app */}
      <p className="auth-switch-text">
        Web accounts are created by a Backoffice officer.
        <br />
        Prosumer? Please use the SolarGrid mobile app.
      </p>

      {mobileOnlyMessage && (
        <MobileOnlyDialog message={mobileOnlyMessage} onClose={() => setMobileOnlyMessage('')} />
      )}
    </AuthLayout>
  )
}
