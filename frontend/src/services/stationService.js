/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : stationService.js
Description   : Service layer for Microgrid Station / Node APIs
Author        : Sithmaka
=====================================================
*/

import apiClient from '../config/api';

const stationService = {
  /**
   * Retrieves all microgrid stations.
   * @returns {Promise<Array>} List of station objects
   */
  getAllStations: async () => {
    const response = await apiClient.get('/stations');
    return response.data;
  },

  /**
   * Retrieves a single station by its MongoDB document ID.
   * @param {string} id - Station document ID
   * @returns {Promise<Object>} Station details
   */
  getStationById: async (id) => {
    const response = await apiClient.get(`/stations/${id}`);
    return response.data;
  },

  /**
   * Creates a new solar microgrid station node.
   * @param {Object} stationData - Station payload
   * @param {string} stationData.stationId - Unique station identifier (e.g. STN-001)
   * @param {string} stationData.stationName - Display name
   * @param {string} stationData.address - Physical address
   * @param {number} stationData.latitude - GPS latitude (-90 to 90)
   * @param {number} stationData.longitude - GPS longitude (-180 to 180)
   * @param {number} stationData.energyCapacity - Maximum generation capacity in kWh (> 0)
   * @param {number} stationData.batteryStorageCapacity - Battery capacity in kWh (>= 0)
   * @param {string} stationData.operationalSchedule - Operational hours/schedule
   * @returns {Promise<Object>} Created station record
   */
  createStation: async (stationData) => {
    const response = await apiClient.post('/stations', stationData);
    return response.data;
  },

  /**
   * Updates an existing station's editable details.
   * @param {string} id - Station document ID
   * @param {Object} stationData - Updated fields
   * @returns {Promise<Object>} API response message
   */
  updateStation: async (id, stationData) => {
    const response = await apiClient.put(`/stations/${id}`, stationData);
    return response.data;
  },

  /**
   * Updates only the operational schedule of a station.
   * @param {string} id - Station document ID
   * @param {string} operationalSchedule - New operational schedule text
   * @returns {Promise<Object>} API response message
   */
  updateStationSchedule: async (id, operationalSchedule) => {
    const response = await apiClient.put(`/stations/${id}/schedule`, {
      operationalSchedule,
    });
    return response.data;
  },

  /**
   * Deactivates a station (guard check ensures no active booking slots exist).
   * @param {string} id - Station document ID
   * @returns {Promise<Object>} API response message
   */
  deactivateStation: async (id) => {
    const response = await apiClient.put(`/stations/${id}/deactivate`);
    return response.data;
  },

  /**
   * Reactivates a deactivated station (sets status back to Active).
   * @param {string} id - Station document ID
   * @returns {Promise<Object>} API response message
   */
  reactivateStation: async (id) => {
    const response = await apiClient.put(`/stations/${id}/reactivate`);
    return response.data;
  },

  /**
   * Searches stations by location keyword and/or availability status.
   * @param {Object} [params]
   * @param {string} [params.location] - Partial address/location keyword
   * @param {boolean} [params.available] - Available status filter
   * @returns {Promise<Array>} Filtered station list
   */
  searchStations: async (params = {}) => {
    const response = await apiClient.get('/stations/search', { params });
    return response.data;
  },

  /**
   * Retrieves lightweight map pin data for all active stations.
   * @returns {Promise<Array<{id: string, name: string, latitude: number, longitude: number}>>}
   */
  getStationMapPins: async () => {
    const response = await apiClient.get('/stations/map');
    return response.data;
  },
};

export default stationService;
