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

// Response interceptor for centralized error message formatting
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.message ||
      'An unexpected error occurred';
    
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
