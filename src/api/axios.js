import axios from 'axios';

// Helper to get cookie value by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.31.250:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Manually attach token from cookies
api.interceptors.request.use((config) => {
  // Pulling 'json-access' token from your cookies manually
  const token = getCookie('json-access'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
