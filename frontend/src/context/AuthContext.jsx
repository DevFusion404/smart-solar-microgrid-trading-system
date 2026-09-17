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

const AuthContext = createContext(null);

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
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setToken('');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

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
          role: data.user?.role || 'Backoffice',
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

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setToken('');
      setUser(null);
    }
  };

  const updateUserProfile = async (profileData) => {
    const updated = await profileService.updateProfile(profileData);
    setUser((prev) => {
      const newUser = { ...prev, ...updated };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
    return updated;
  };

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
