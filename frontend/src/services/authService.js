/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : User Account and Authentication
File          : authService.js
Description   : API service for user authentication (login, logout, current user session)
=====================================================
*/

import apiClient from '../config/api';

export const authService = {
  /**
   * Authenticates user credentials and retrieves JWT access token + user details
   * @param {Object} credentials - { username, password }
   */
  async login(credentials) {
    const response = await apiClient.post('/Auth/login', credentials);
    return response.data;
  },

  /**
   * Invalidates active user session on the backend
   */
  async logout() {
    try {
      const response = await apiClient.post('/Auth/logout');
      return response.data;
    } catch (error) {
      // Return fallback message if session already invalidated
      return { message: 'Logged out successfully.' };
    }
  },

  /**
   * Fetches profile details of currently authenticated user based on JWT token
   */
  async getCurrentUser() {
    const response = await apiClient.get('/Auth/me');
    return response.data;
  },
};

export default authService;
