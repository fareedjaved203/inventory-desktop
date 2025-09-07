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
    
    // Check license status every 5 minutes (good balance)
    const interval = setInterval(checkLicenseStatus, 300000);
    
    return () => clearInterval(interval);
  }, []);

  // Also check on user activity (focus/click)
  useEffect(() => {
    const handleActivity = () => {
      if (!licenseStatus.loading) {
        checkLicenseStatus();
      }
    };

    window.addEventListener('focus', handleActivity);
    window.addEventListener('click', handleActivity);
    
    return () => {
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [licenseStatus.loading]);

  return {
    ...licenseStatus,
    refreshLicense: checkLicenseStatus
  };
}