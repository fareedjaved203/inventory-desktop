import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - just clear auth data, don't reload
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authTime');
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('userType');
      localStorage.removeItem('employeeId');
      localStorage.removeItem('employeeName');
      // Don't reload to prevent infinite loops
    }
    return Promise.reject(error);
  }
);

export default api;