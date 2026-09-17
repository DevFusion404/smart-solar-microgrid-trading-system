/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : api.js
Description   : Axios API client configuration with base URL,
                interceptors, and error handling
Author        : Sithmaka
=====================================================
*/

import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5295/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error message formatting and developer console logging
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const data = error.response?.data;
    let formattedMessage = '';

    if (data?.validationErrors && typeof data.validationErrors === 'object') {
      const fieldErrors = Object.entries(data.validationErrors)
        .map(([field, msgs]) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
          const messagesStr = Array.isArray(msgs) ? msgs.join(', ') : msgs;
          return `${fieldName}: ${messagesStr}`;
        })
        .join(' | ');
      formattedMessage = `Validation Error: ${fieldErrors}`;
    } else if (data?.message) {
      formattedMessage = data.message;
    } else if (data?.title) {
      formattedMessage = data.title;
    } else if (error.message) {
      formattedMessage = error.message;
    } else {
      formattedMessage = 'An unexpected error occurred';
    }

    // Log detailed error info to developer console for fast troubleshooting
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      errorCode: data?.errorCode,
      validationErrors: data?.validationErrors,
      rawResponse: data,
      formattedMessage
    });

    const customError = new Error(formattedMessage);
    customError.response = error.response;
    customError.validationErrors = data?.validationErrors;
    return Promise.reject(customError);
  }
);

export default apiClient;
