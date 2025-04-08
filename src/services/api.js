// Base API configuration and utilities
import config from '../config';

const API_BASE_URL = config.apiBaseUrl;

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Generic request function with auth header
const request = async (endpoint, options = {}) => {
  if (!options.method) options.method = 'GET';
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  return handleResponse(response);
};

// Export API methods
export const api = {
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  get: (endpoint) => request(endpoint),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};

// Auth API endpoints
const auth = {
  login: async (credentials) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },
  register: async (userData) => {
    return await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  getCurrentUser: async () => {
    try {
      const data = await request('/auth/me');
      return data.user;
    } catch (error) {
      return null;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
  },
};

// Client API endpoints
const clients = {
  getAll: async () => await request('/clients'),
  getById: async (clientId) => await request(`/clients/${clientId}`),
  create: async (clientData) => await request('/clients', {
    method: 'POST',
    body: JSON.stringify({
      ...clientData,
      fixedAmount: parseFloat(clientData.fixedAmount),
    }),
  }),
  update: async (clientId, clientData) => await request(`/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...clientData,
      fixedAmount: parseFloat(clientData.fixedAmount),
    }),
  }),
  delete: async (clientId) => await request(`/clients/${clientId}`, {
    method: 'DELETE',
  }),
};

// Payment API endpoints
const payments = {
  getClientPayments: async (clientId) => await request(`/payments/client/${clientId}`),
  getAll: async () => await request('/payments'),
  create: async (paymentData) => await request('/payments', {
    method: 'POST',
    body: JSON.stringify({
      ...paymentData,
      enteredAmount: parseFloat(paymentData.enteredAmount),
    }),
  }),
  update: async (paymentId, paymentData) => await request(`/payments/${paymentId}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...paymentData,
      enteredAmount: parseFloat(paymentData.enteredAmount),
    }),
  }),
  delete: async (paymentId) => await request(`/payments/${paymentId}`, {
    method: 'DELETE',
  }),
  getRecent: async () => await request('/payments/recent'),
};

export {
  auth,
  clients,
  payments, 
};