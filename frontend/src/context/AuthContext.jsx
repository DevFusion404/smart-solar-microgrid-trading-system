/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Global Authentication & User Context
File          : AuthContext.jsx
Description   : React Context providing authentication state, token persistence, and role-based helpers
=====================================================
*/

import { createContext, useContext, useEffect, useState } from 'react';
import { authService, profileService } from '../services';
import apiClient from '../config/api';

const AuthContext = createContext(null);

// Removes every stored credential from the browser
function clearStoredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

// Provides the logged-in user, JWT and login/logout helpers to the whole app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || localStorage.getItem('authToken') || '');
  const [loading, setLoading] = useState(true);

  // Synchronize state with backend on initial load if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const activeToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (activeToken) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (err) {
          console.error('Session restoration failed:', err);
          // Token expired or invalid
          clearStoredSession();
          setToken('');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // If any API call returns 401 (expired or invalid JWT), end the local session so
  // RequireRole sends the user back to the login page instead of showing broken screens.
  useEffect(() => {
    const interceptorId = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const url = error.response?.config?.url || '';
        if (status === 401 && !url.includes('/Auth/login')) {
          clearStoredSession();
          setToken('');
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => apiClient.interceptors.response.eject(interceptorId);
  }, []);

  // Logs in, stores the JWT, then loads the full user record from /api/Auth/me
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('authToken', data.token);
      setToken(data.token);

      // Fetch full user details from /api/Auth/me or use returned User summary
      try {
        const fullUser = await authService.getCurrentUser();
        setUser(fullUser);
        localStorage.setItem('user', JSON.stringify(fullUser));
        return { ...data, user: fullUser };
      } catch {
        const summaryUser = {
          username: data.user?.username || credentials.username,
          fullName: data.user?.fullName || '',
          role: data.user?.role || '',
          status: data.user?.status || 'Active',
          nic: data.user?.nic || null,
        };
        setUser(summaryUser);
        localStorage.setItem('user', JSON.stringify(summaryUser));
        return { ...data, user: summaryUser };
      }
    }
    return data;
  };

  // Tells the API the user logged out, then clears the local session
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      clearStoredSession();
      setToken('');
      setUser(null);
    }
  };

  // Saves profile changes through the API and merges them into the cached user
  const updateUserProfile = async (profileData) => {
    const updated = await profileService.updateProfile(profileData);
    setUser((prev) => {
      const newUser = { ...prev, ...updated };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
    return updated;
  };

  // Reloads the current user (e.g. after an account status change)
  const refreshCurrentUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
      return currentUser;
    } catch (err) {
      console.error('Failed to refresh user context:', err);
    }
  };

  const value = {
    user,
    token,
    role: user?.role || '',
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    logout,
    updateUserProfile,
    refreshCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for components to read the auth state; must be used inside AuthProvider
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
