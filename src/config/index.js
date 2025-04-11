'use client';

import { api } from "@/services/api";

const config = {
  // apiBaseUrl: 'https://client-app-blush.vercel.app',
  apiBaseUrl: 'http://localhost:5001',
  endpoints: {
    login: '/auth/login',
    register: '/auth/register',
  }
};

export default config;