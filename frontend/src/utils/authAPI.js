import axios from 'axios';

// Authentication APIs that ALWAYS use online backend regardless of offline mode
class AuthAPI {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
  }

  // Login - MUST be online
  async login(email, password) {
    const response = await axios.post(`${this.baseURL}/api/auth/login`, {
      email,
      password
    });
    return response.data;
  }

  // Registration - MUST be online
  async register(email, password) {
    const response = await axios.post(`${this.baseURL}/api/auth/signup`, {
      email,
      password
    });
    return response.data;
  }

  // License validation - MUST be online
  async validateLicense(licenseKey, forceRebind = false) {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${this.baseURL}/api/license/validate`, {
      licenseKey,
      forceRebind
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  }

  // License check - MUST be online
  async checkLicense() {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${this.baseURL}/api/license/check`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  }

  // Profile update - MUST be online
  async updateProfile(data) {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${this.baseURL}/api/auth/profile`, data, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  }

  // Update email - MUST be online
  async updateEmail(currentEmail, newEmail, password) {
    const response = await axios.post(`${this.baseURL}/api/auth/update-email`, {
      currentEmail,
      newEmail,
      password
    });
    return response.data;
  }

  // Password reset - MUST be online
  async forgotPassword(email) {
    const response = await axios.post(`${this.baseURL}/api/auth/forgot-password`, {
      email
    });
    return response.data;
  }

  // Reset password - MUST be online
  async resetPassword(email, otp, newPassword) {
    const response = await axios.post(`${this.baseURL}/api/auth/reset-password`, {
      email,
      otp,
      newPassword
    });
    return response.data;
  }
}

export default new AuthAPI();