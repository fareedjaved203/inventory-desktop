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
  async (error) => {
    if (error.response?.status === 401) {
      // Check if we have login credentials to retry
      const email = localStorage.getItem('userEmail');
      const password = localStorage.getItem('userPassword');
      
      if (email && password && !error.config._retry) {
        error.config._retry = true;
        
        try {
          // Try to re-authenticate
          const loginResponse = await axios.post('/api/auth/login', { email, password });
          const { token } = loginResponse.data;
          
          // Update token
          localStorage.setItem('authToken', token);
          
          // Retry original request with new token
          error.config.headers.Authorization = `Bearer ${token}`;
          return api.request(error.config);
        } catch (loginError) {
          // Login failed, clear all auth data
          localStorage.clear();
          window.location.reload();
        }
      } else {
        // No credentials or retry failed - clear auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTime');
        localStorage.removeItem('userPermissions');
        localStorage.removeItem('userType');
        localStorage.removeItem('employeeId');
        localStorage.removeItem('employeeName');
      }
    }
    return Promise.reject(error);
  }
);

export default api;