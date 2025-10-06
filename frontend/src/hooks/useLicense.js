import { useState, useEffect } from 'react';
// License checking not available in offline mode

export function useLicense() {
  const [licenseStatus, setLicenseStatus] = useState({
    valid: true,
    expiry: null,
    timeRemaining: -1, // Use -1 to indicate loading state
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
        timeRemaining: -1,
        loading: false
      });
      return;
    }
    
    if (!token) {
      setLicenseStatus({
        valid: true, // Default to valid when not authenticated
        expiry: null,
        timeRemaining: -1,
        loading: false
      });
      return;
    }

    // License checking not available in offline mode - always return valid
    setLicenseStatus({
      valid: true,
      expiry: null,
      timeRemaining: -1,
      loading: false
    });
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