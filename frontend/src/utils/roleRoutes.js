/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Identity and Account Management (Component 1)
File          : roleRoutes.js
Description   : Maps each user role to its home area in the web app.
                Used after login and when a user opens a page their
                role is not allowed to see.
=====================================================
*/

export const ROLE_HOME = {
  Backoffice: '/backoffice',
  GridOperator: '/operator',
  Prosumer: '/prosumer/profile',
}

// Returns the landing page for a role (falls back to the login page for unknown roles)
export function homePathForRole(role) {
  return ROLE_HOME[role] || '/login'
}

// Returns true when the path belongs to the area the role is allowed to use
export function isPathAllowedForRole(path, role) {
  const area = { Backoffice: '/backoffice', GridOperator: '/operator', Prosumer: '/prosumer' }[role]
  return Boolean(area && path && path.startsWith(area))
}
