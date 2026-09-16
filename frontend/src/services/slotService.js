/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : slotService.js
Description   : Service layer for Energy Slot Management APIs
Author        : Sithmaka
=====================================================
*/

import apiClient from '../config/api';

const slotService = {
  /**
   * Retrieves all energy booking slots for a specific station.
   * Optionally filtered by date.
   * @param {string} stationId - Station identifier or document ID
   * @param {string|Date} [date] - Optional date filter (YYYY-MM-DD or Date object)
   * @returns {Promise<Array>} List of energy slots
   */
  getSlotsByStation: async (stationId, date) => {
    const params = {};
    if (date) {
      // If date is a Date object, format to YYYY-MM-DD; otherwise pass string
      params.date = date instanceof Date ? date.toISOString().split('T')[0] : date;
    }
    const response = await apiClient.get(`/stations/${stationId}/slots`, { params });
    return response.data;
  },

  /**
   * Retrieves a single slot by its MongoDB document ID.
   * @param {string} id - Slot document ID
   * @returns {Promise<Object>} Slot details
   */
  getSlotById: async (id) => {
    const response = await apiClient.get(`/slots/${id}`);
    return response.data;
  },

  /**
   * Creates a new energy slot for a station.
   * @param {string} stationId - Station identifier
   * @param {Object} slotData - Slot payload
   * @param {string} slotData.slotId - Unique slot identifier (e.g. SLOT-20260320-001)
   * @param {string|Date} slotData.date - Slot date
   * @param {string} slotData.startTime - Start time in "HH:mm:ss" or "HH:mm"
   * @param {string} slotData.endTime - End time in "HH:mm:ss" or "HH:mm"
   * @param {number} slotData.totalCapacity - Total capacity in kWh
   * @param {number} slotData.availableCapacity - Available capacity in kWh
   * @param {string} [slotData.status] - Status (e.g. 'Available', 'Booked', 'Completed', 'Cancelled')
   * @returns {Promise<Object>} Created slot record
   */
  createSlot: async (stationId, slotData) => {
    const response = await apiClient.post(`/stations/${stationId}/slots`, slotData);
    return response.data;
  },

  /**
   * Updates an existing slot's details (times, capacities, status).
   * @param {string} id - Slot document ID
   * @param {Object} slotData - Updated fields
   * @returns {Promise<Object>} API response message
   */
  updateSlot: async (id, slotData) => {
    const response = await apiClient.put(`/slots/${id}`, slotData);
    return response.data;
  },

  /**
   * Adjusts the available capacity of an existing slot.
   * Called during booking creation, confirmation, or cancellation.
   * @param {string} id - Slot document ID
   * @param {number} availableCapacity - New available capacity in kWh
   * @returns {Promise<Object>} API response message
   */
  adjustSlotCapacity: async (id, availableCapacity) => {
    const response = await apiClient.put(`/slots/${id}/capacity`, {
      availableCapacity,
    });
    return response.data;
  },
};

export default slotService;
