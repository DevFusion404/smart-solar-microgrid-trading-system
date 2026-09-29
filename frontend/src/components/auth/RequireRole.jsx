/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Identity and Account Management (Component 1)
File          : RequireRole.jsx
Description   : Route guard for role-based page access.
                - Not logged in      -> redirect to /login (remembers the page)
                - Wrong role          -> redirect to the user's own home area
                - Allowed role        -> render the child routes
                The API also checks roles on every request; this guard only
                stops users from opening screens they cannot use.
=====================================================
*/

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { homePathForRole } from '../../utils/roleRoutes'

// Renders the nested routes only when the logged-in user has one of the allowed roles
export function RequireRole({ roles }) {
  const { isAuthenticated, role, loading } = useAuth()
  const location = useLocation()

  // Wait until the saved session has been checked against /api/Auth/me
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-400 dark:bg-slate-950">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Checking your session…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!roles.includes(role)) {
    return <Navigate to={homePathForRole(role)} replace />
  }

  return <Outlet />
}

export default RequireRole
