/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Profile Management
File          : profileService.js
Description   : API service for self-service profile viewing, editing, and deactivation requests
=====================================================
*/

import apiClient from '../config/api';

export const profileService = {
  /**
   * Fetches profile details of currently authenticated user
   */
  async getProfile() {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  /**
   * Updates profile details (fullName, phoneNumber, address)
   * @param {Object} data - { fullName, phoneNumber, address }
   */
  async updateProfile(data) {
    const response = await apiClient.put('/profile', data);
    return response.data;
  },

  /**
   * Submits voluntary account deactivation request for prosumers
   * @param {string} reason
   */
  async requestDeactivation(reason) {
    const response = await apiClient.post('/profile/request-deactivation', { reason });
    return response.data;
  },
};

export default profileService;
