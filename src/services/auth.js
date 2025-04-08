import { api } from './api';

export const authService = {
  login: async (credentials) => {
    const data = await api.post('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  register: async (userData) => {
    const data = await api.post('/auth/register', userData);
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async () => {
    try {
      const data = await api.get('/auth/me');
      return data.user;
    } catch (error) {
      return null;
    }
  },
};