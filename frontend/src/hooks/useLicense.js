import { useState, useEffect } from 'react';
// License checking not available in offline mode

export function useLicense() {
  const [licenseStatus, setLicenseStatus] = useState({
    valid: true,
    expiry: null,
    timeRemaining: -1,
    loading: true
  });

  const checkLicenseStatus = async () => {
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    // Super admin bypasses license checks
    if (userType === 'superadmin') {
      setLicenseStatus({
        valid: true,
        expiry: null,
        timeRemaining: -1,
        loading: false
      });
      return;
    }
    
    if (!token) {
      setLicenseStatus({
        valid: true,
        expiry: null,
        timeRemaining: -1,
        loading: false
      });
      return;
    }

    // Skip license check if offline
    if (!navigator.onLine) {
      const cachedLicense = localStorage.getItem('lastLicenseStatus');
      if (cachedLicense) {
        const parsed = JSON.parse(cachedLicense);
        setLicenseStatus({ ...parsed, loading: false });
      } else {
        setLicenseStatus({
          valid: true,
          expiry: null,
          timeRemaining: -1,
          loading: false
        });
      }
      return;
    }

    // Online license check
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/license/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      const licenseData = {
        valid: data.valid,
        expiry: data.expiry,
        timeRemaining: data.timeRemaining
      };
      
      // Cache license status for offline use
      localStorage.setItem('lastLicenseStatus', JSON.stringify(licenseData));
      
      setLicenseStatus({ ...licenseData, loading: false });
    } catch (error) {
      // If online check fails, use cached license or default to valid
      const cachedLicense = localStorage.getItem('lastLicenseStatus');
      if (cachedLicense) {
        const parsed = JSON.parse(cachedLicense);
        setLicenseStatus({ ...parsed, loading: false });
      } else {
        setLicenseStatus({
          valid: true,
          expiry: null,
          timeRemaining: -1,
          loading: false
        });
      }
    }
  };

  useEffect(() => {
    checkLicenseStatus();
    
    // Check license status every 2 hours
    const interval = setInterval(checkLicenseStatus, 2 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...licenseStatus,
    refreshLicense: checkLicenseStatus
  };
}