import { api } from './api';

export const clientService = {
  getAll: async () => {
    const response = await api.get('/clients');
    return response;
  },
  getClientById: async (clientId) => {
    const response = await api.get(`/clients/${clientId}`);
    return response.data;
  },

  createClient: async (clientData) => {
    const response = await api.post('/clients', {
      ...clientData,
      fixedAmount: parseFloat(clientData.fixedAmount),
    });
    return response;
  },

  updateClient: async (clientId, clientData) => {
    const response = await api.put(`/clients/${clientId}`, {
      ...clientData,
      fixedAmount: parseFloat(clientData.fixedAmount),
    });
    return response.data;
  },

  deleteClient: async (clientId) => {
    const response = await api.delete(`/clients/${clientId}`);
    return response.data;
  },

  // Add CSV upload functionality
  uploadCSV: async (clients) => {
    const response = await api.post('/clients/upload-csv', { clients });
    return response.data;
  },
};
export const paymentService = {
    getAllByClient: async (clientId) => {
    const response = await api.get(`/payments/client/${clientId}`);
    return response;
  },

  createPayment: async (clientId, paymentData) => {
    const response = await api.post(`/payments/${clientId}`, {
      ...paymentData,
      enteredAmount: parseFloat(paymentData.enteredAmount),
    });
    return response.data;
  },

  deletePayment: async (paymentId) => {
    const response = await api.delete(`/payments/${paymentId}`);
    return response.data;
  }
};