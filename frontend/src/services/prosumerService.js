/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Prosumer Account Management
File          : prosumerService.js
Description   : API service for prosumer registration, status management, activations, and deactivations
=====================================================
*/

import apiClient from '../config/api';

export const prosumerService = {
  /**
   * Registers a new prosumer account with status PendingActivation
   * @param {Object} data - { nic, fullName, email, phoneNumber, address, username, password }
   */
  async registerProsumer(data) {
    const response = await apiClient.post('/prosumers/register', data);
    return response.data;
  },

  /**
   * Retrieves paginated list of prosumer profiles filtered by optional account status
   * @param {Object} params - { status, page, pageSize }
   */
  async listProsumers(params = {}) {
    const response = await apiClient.get('/prosumers', { params });
    return response.data;
  },

  /**
   * Searches prosumer accounts by text query across FullName, NIC, Email, and Username
   * @param {Object} params - { q, status, page, pageSize }
   */
  async searchProsumers(params = {}) {
    const response = await apiClient.get('/prosumers/search', { params });
    return response.data;
  },

  /**
   * Lists prosumers with pending activation requests for Backoffice review
   * @param {Object} params - { page, pageSize }
   */
  async listPendingActivations(params = {}) {
    const response = await apiClient.get('/prosumers/pending-activations', { params });
    return response.data;
  },

  /**
   * Lists prosumers requesting deactivation for Backoffice review
   * @param {Object} params - { page, pageSize }
   */
  async listDeactivationRequests(params = {}) {
    const response = await apiClient.get('/prosumers/deactivation-requests', { params });
    return response.data;
  },

  /**
   * Fetches prosumer profile by NIC primary key
   * @param {string} nic
   */
  async getProsumerByNic(nic) {
    const response = await apiClient.get(`/prosumers/${encodeURIComponent(nic)}`);
    return response.data;
  },

  /**
   * Updates prosumer profile details by NIC (Backoffice officers only)
   * @param {string} nic
   * @param {Object} data - { fullName, email, phoneNumber, address }
   */
  async updateProsumer(nic, data) {
    const response = await apiClient.put(`/prosumers/${encodeURIComponent(nic)}`, data);
    return response.data;
  },

  /**
   * Approves pending prosumer registration and activates account
   * @param {string} nic
   */
  async activateProsumer(nic) {
    const response = await apiClient.post(`/prosumers/${encodeURIComponent(nic)}/activate`);
    return response.data;
  },

  /**
   * Rejects pending prosumer registration with reason
   * @param {string} nic
   * @param {string} reason
   */
  async rejectProsumerActivation(nic, reason) {
    const response = await apiClient.post(`/prosumers/${encodeURIComponent(nic)}/reject-activation`, { reason });
    return response.data;
  },

  /**
   * Submits voluntary deactivation request for prosumer account with reason
   * @param {string} nic
   * @param {string} reason
   */
  async requestDeactivation(nic, reason) {
    const response = await apiClient.post(`/prosumers/${encodeURIComponent(nic)}/request-deactivation`, { reason });
    return response.data;
  },

  /**
   * Approves deactivation request and deactivates prosumer account
   * @param {string} nic
   */
  async approveDeactivation(nic) {
    const response = await apiClient.post(`/prosumers/${encodeURIComponent(nic)}/deactivate`);
    return response.data;
  },

  /**
   * Reactivates a deactivated prosumer account
   * @param {string} nic
   */
  async reactivateProsumer(nic) {
    const response = await apiClient.post(`/prosumers/${encodeURIComponent(nic)}/reactivate`);
    return response.data;
  },

  /**
   * Checks current account status and activation boolean flag for a given prosumer NIC
   * @param {string} nic
   */
  async checkProsumerStatus(nic) {
    const response = await apiClient.get(`/prosumers/${encodeURIComponent(nic)}/status`);
    return response.data;
  },
};

export default prosumerService;
