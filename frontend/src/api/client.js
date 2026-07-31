import axios from 'axios';

// Use env variable if set, otherwise fall back to the deployed backend URL
const BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://civiclens-backend-f8mx.onrender.com' : 'http://localhost:5000');

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default client;
