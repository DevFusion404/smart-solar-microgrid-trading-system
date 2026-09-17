/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node Assignment Management
File          : nodeAssignmentService.js
Description   : API service for assigning Grid Operators to Microgrid Nodes
=====================================================
*/

import apiClient from '../config/api';

export const nodeAssignmentService = {
  /**
   * Assigns a Grid Operator to a microgrid node.
   * @param {string} nodeId - Node / Station identifier or MongoDB ID
   * @param {string} operatorId - Grid Operator user ID or username
   * @returns {Promise<Object>} Updated station node
   */
  async assignOperator(nodeId, data) {
    const operatorId = typeof data === 'string' ? data : (data?.operatorId || '');
    const operatorName = typeof data === 'object' ? data?.operatorName : undefined;
    const response = await apiClient.post(`/nodes/${encodeURIComponent(nodeId)}/assign-operator`, {
      operatorId,
      ...(operatorName ? { operatorName } : {}),
    });
    return response.data;
  },

  /**
   * Removes operator assignment from a microgrid node.
   * @param {string} nodeId - Node / Station identifier or MongoDB ID
   * @returns {Promise<Object>} Updated station node
   */
  async removeOperator(nodeId) {
    const response = await apiClient.delete(`/nodes/${encodeURIComponent(nodeId)}/remove-operator`);
    return response.data;
  },

  /**
   * Retrieves all microgrid nodes assigned to a specific Grid Operator.
   * @param {string} operatorId - Grid Operator ID or username
   * @returns {Promise<Array>} List of assigned station nodes
   */
  async getNodesByOperator(operatorId) {
    const response = await apiClient.get(`/operators/${encodeURIComponent(operatorId)}/nodes`);
    return response.data;
  },

  /**
   * Retrieves assigned operator details for a specific microgrid node.
   * @param {string} nodeId - Node / Station identifier or MongoDB ID
   * @returns {Promise<Object>} Assigned operator information
   */
  async getOperatorByNode(nodeId) {
    const response = await apiClient.get(`/nodes/${encodeURIComponent(nodeId)}/operator`);
    return response.data;
  },
};

export default nodeAssignmentService;
