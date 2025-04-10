import { api } from './api';

export const paymentService = {
  getClientPayments: async (clientId) => {
    return await api.get(`/payments/client/${clientId}`);
  },

  getAllPayments: async () => {
    return await api.get('/client/payments');
  },

  createPayment: async (paymentData) => {
    return await api.post('/payments', {
      ...paymentData,
      enteredAmount: parseFloat(paymentData.enteredAmount),
    });
  },

  updatePayment: async (paymentId, paymentData) => {
    return await api.post(`/payments/${paymentId}/payments`, {
      ...paymentData,
      enteredAmount: parseFloat(paymentData.enteredAmount),
    });
  },

  deletePayment: async (paymentId) => {
    return await api.delete(`/payments/${paymentId}`);
  },

  getRecentPayments: async () => {
    return await api.get('/payments/recent');
  },
};