/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Identity and Account Management (Component 1)
File          : roleRoutes.js
Description   : Web portal roles and their home areas. The web app is
                only for Backoffice officers and Grid Operators;
                prosumers use the Android app.
=====================================================
*/

// Roles that may sign in to the web application
export const WEB_ROLES = ['Backoffice', 'GridOperator']

// Error code used when valid credentials belong to a role that cannot use the web app
export const WEB_ROLE_NOT_ALLOWED = 'WEB_ROLE_NOT_ALLOWED'

export const ROLE_HOME = {
  Backoffice: '/backoffice',
  GridOperator: '/operator',
}

// Returns true when the role is allowed to use the web application
export function isWebRole(role) {
  return WEB_ROLES.includes(role)
}

// Returns the landing page for a role (falls back to the login page for unknown roles)
export function homePathForRole(role) {
  return ROLE_HOME[role] || '/login'
}

// Returns true when the path belongs to the area the role is allowed to use
export function isPathAllowedForRole(path, role) {
  const area = ROLE_HOME[role]
  return Boolean(area && path && path.startsWith(area))
}
