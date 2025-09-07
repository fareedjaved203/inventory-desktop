import { useState, useEffect } from 'react';
import api from '../utils/axios';

export function useLicense() {
  const [licenseStatus, setLicenseStatus] = useState({
    valid: true,
    expiry: null,
    timeRemaining: 0,
    loading: true
  });

  const checkLicenseStatus = async () => {
    // Only check if we have an auth token
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    // Super admin bypasses license checks
    if (userType === 'superadmin') {
      setLicenseStatus({
        valid: true,
        expiry: null,
        timeRemaining: 0,
        loading: false
      });
      return;
    }
    
    if (!token) {
      setLicenseStatus({
        valid: true, // Default to valid when not authenticated
        expiry: null,
        timeRemaining: 0,
        loading: false
      });
      return;
    }

    try {
      const response = await api.get('/api/license/status');
      setLicenseStatus({
        ...response.data,
        loading: false
      });
    } catch (error) {
      console.warn('License check failed:', error);
      setLicenseStatus({
        valid: false,
        expiry: null,
        timeRemaining: 0,
        loading: false
      });
    }
  };

  useEffect(() => {
    checkLicenseStatus();
    
    // Check license status every 6 hours
    const interval = setInterval(checkLicenseStatus, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...licenseStatus,
    refreshLicense: checkLicenseStatus
  };
}