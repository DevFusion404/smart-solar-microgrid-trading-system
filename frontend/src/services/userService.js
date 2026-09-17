/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Web User Administration
File          : userService.js
Description   : API service for managing web application users (Backoffice officers and Grid Operators)
=====================================================
*/

import apiClient from '../config/api';

export const userService = {
  /**
   * Creates a new Web Application user (Backoffice or GridOperator)
   * @param {Object} data - { fullName, email, phoneNumber, username, password, role }
   */
  async createWebUser(data) {
    const response = await apiClient.post('/web-users', data);
    return response.data;
  },

  /**
   * Retrieves paginated list of Web Application users with optional filters
   * @param {Object} params - { role, status, page, pageSize }
   */
  async listWebUsers(params = {}) {
    const response = await apiClient.get('/web-users', { params });
    return response.data;
  },

  /**
   * Fetches Web Application user profile by username
   * @param {string} username
   */
  async getWebUser(username) {
    const response = await apiClient.get(`/web-users/${encodeURIComponent(username)}`);
    return response.data;
  },

  /**
   * Updates Web Application user details
   * @param {string} username
   * @param {Object} data - { fullName, email, phoneNumber }
   */
  async updateWebUser(username, data) {
    const response = await apiClient.put(`/web-users/${encodeURIComponent(username)}`, data);
    return response.data;
  },

  /**
   * Deactivates a Web Application user account with mandatory reason
   * @param {string} username
   * @param {string} reason
   */
  async deactivateWebUser(username, reason) {
    const response = await apiClient.post(`/web-users/${encodeURIComponent(username)}/deactivate`, { reason });
    return response.data;
  },

  /**
   * Reactivates a previously deactivated Web Application user account
   * @param {string} username
   */
  async reactivateWebUser(username) {
    const response = await apiClient.post(`/web-users/${encodeURIComponent(username)}/reactivate`);
    return response.data;
  },
};

export default userService;
