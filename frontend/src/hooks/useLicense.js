import { useState, useEffect } from 'react';

export function useLicense() {
  const [licenseStatus, setLicenseStatus] = useState({
    valid: true,
    expiry: null,
    timeRemaining: 0,
    loading: true
  });

  const checkLicenseStatus = async () => {
    try {
      const response = await fetch('/api/license/status');
      const data = await response.json();
      setLicenseStatus({
        ...data,
        loading: false
      });
    } catch (error) {
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
    
    // Check license status every minute
    const interval = setInterval(checkLicenseStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...licenseStatus,
    refreshLicense: checkLicenseStatus
  };
}