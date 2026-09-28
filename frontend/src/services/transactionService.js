/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : transactionService.js
Description   : Service layer for the energy transfer APIs —
                QR generation, QR verification, transfer completion,
                history, search and dashboards
Author        : Malmi
=====================================================
*/

import apiClient from '../config/api';

/**
 * Formats a date for the API, which expects YYYY-MM-DD.
 * @param {string|Date} value - Date object or already formatted string
 * @returns {string|undefined} Formatted date, or undefined when nothing was supplied
 */
function toDateParam(value) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString().split('T')[0] : value;
}

const transactionService = {
  /**
   * Generates a secure transaction QR for an approved reservation.
   * Calling this twice for the same reservation returns the existing token
   * rather than issuing a second one.
   * @param {string} reservationId - Reservation business key (e.g. RES-20260918-AB12CD)
   * @returns {Promise<Object>} { transactionId, qrToken, qrImageData, qrPayload, expiryDate, transaction }
   */
  generateQr: async (reservationId) => {
    const response = await apiClient.post('/transactions/generate-qr', { reservationId });
    return response.data;
  },

  /**
   * Re-renders the QR image for a transaction that already exists.
   * Used when the prosumer reopens their QR display page.
   * @param {string} transactionId - Transaction business key
   * @returns {Promise<Object>} Same shape as generateQr
   */
  getQr: async (transactionId) => {
    const response = await apiClient.get(`/transactions/${transactionId}/qr`);
    return response.data;
  },

  /**
   * Sends a scanned QR token to the backend for validation.
   * Resolves for both valid and invalid codes — check the success flag.
   * @param {string} qrToken - Raw token or the full QR JSON payload
   * @returns {Promise<Object>} { success, message, errorCode, transactionDetails }
   */
  verifyQr: async (qrToken) => {
    const response = await apiClient.post('/transactions/verify-qr', { qrToken });
    return response.data;
  },

  /**
   * Confirms that the energy has physically been handed over.
   * @param {string} transactionId - Transaction business key
   * @param {Object} [payload] - Optional completion details
   * @param {number} [payload.deliveredEnergy] - Metered amount in kWh, may not exceed the reserved amount
   * @param {string} [payload.remarks] - Operator note stored against the transaction
   * @returns {Promise<Object>} { message, transactionId, timestamp, transaction }
   */
  completeTransfer: async (transactionId, payload = {}) => {
    const response = await apiClient.put(`/transactions/${transactionId}/complete`, payload);
    return response.data;
  },

  /**
   * Declines a transfer at the station and invalidates its QR token.
   * @param {string} transactionId - Transaction business key
   * @param {string} reason - Why the transfer was refused (required)
   * @returns {Promise<Object>} { message, transactionId, transaction }
   */
  rejectTransfer: async (transactionId, reason) => {
    const response = await apiClient.put(`/transactions/${transactionId}/reject`, { reason });
    return response.data;
  },

  /**
   * Retrieves one transaction by its business key.
   * @param {string} transactionId - Transaction business key
   * @returns {Promise<Object>} Transaction details
   */
  getTransaction: async (transactionId) => {
    const response = await apiClient.get(`/transactions/${transactionId}`);
    return response.data;
  },

  /**
   * Returns the signed-in prosumer's own transfer history.
   * @param {string} [status] - Optional filter: Pending, Verified, Completed, Failed, Rejected
   * @returns {Promise<Array>} Transactions, newest first
   */
  getMyTransactions: async (status) => {
    const response = await apiClient.get('/transactions/my', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  /**
   * Returns one prosumer's transfer history by NIC.
   * @param {string} prosumerNic - Prosumer NIC
   * @param {string} [status] - Optional transfer status filter
   * @returns {Promise<Array>} Transactions, newest first
   */
  getHistory: async (prosumerNic, status) => {
    const response = await apiClient.get(`/transactions/history/${prosumerNic}`, {
      params: status ? { status } : {},
    });
    return response.data;
  },

  /**
   * Searches and filters transactions.
   * @param {Object} [filters] - Search filters
   * @param {string} [filters.status] - Transfer status
   * @param {string|Date} [filters.date] - Exact slot date
   * @param {string} [filters.stationId] - Station identifier
   * @param {string} [filters.prosumerNic] - Prosumer NIC
   * @param {string|Date} [filters.fromDate] - Inclusive lower bound on the slot date
   * @param {string|Date} [filters.toDate] - Inclusive upper bound on the slot date
   * @param {number} [filters.page=1] - 1-based page number
   * @param {number} [filters.pageSize=20] - Items per page, capped at 100 by the API
   * @returns {Promise<Object>} { items, totalCount, page, pageSize, totalPages }
   */
  searchTransactions: async (filters = {}) => {
    const params = {
      status: filters.status || undefined,
      date: toDateParam(filters.date),
      stationId: filters.stationId || undefined,
      prosumerNic: filters.prosumerNic || undefined,
      fromDate: toDateParam(filters.fromDate),
      toDate: toDateParam(filters.toDate),
      page: filters.page || 1,
      pageSize: filters.pageSize || 20,
    };

    const response = await apiClient.get('/transactions/search', { params });
    return response.data;
  },

  /**
   * Headline transfer counters. Prosumers always receive their own figures.
   * @param {string} [prosumerNic] - Optional scope, honoured for staff callers only
   * @returns {Promise<Object>} { pendingTransfers, verifiedTransfers, completedTransfers, todayTransfers, failedTransfers, totalEnergyTransferred }
   */
  getDashboardSummary: async (prosumerNic) => {
    const response = await apiClient.get('/dashboard/summary', {
      params: prosumerNic ? { prosumerNic } : {},
    });
    return response.data;
  },

  /**
   * Full dashboard for the signed-in prosumer.
   * @returns {Promise<Object>} Counters, transaction lists and approved future reservations
   */
  getMyDashboard: async () => {
    const response = await apiClient.get('/dashboard/prosumer');
    return response.data;
  },

  /**
   * Full dashboard for one prosumer by NIC.
   * @param {string} prosumerNic - Prosumer NIC
   * @returns {Promise<Object>} Counters, transaction lists and approved future reservations
   */
  getProsumerDashboard: async (prosumerNic) => {
    const response = await apiClient.get(`/dashboard/prosumer/${prosumerNic}`);
    return response.data;
  },

  /**
   * Grid operator dashboard.
   * @returns {Promise<Object>} { summary, todayTransfers, pendingTransfers, recentCompleted }
   */
  getOperatorDashboard: async () => {
    const response = await apiClient.get('/dashboard/operator');
    return response.data;
  },
};

export default transactionService;
