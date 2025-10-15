import { useState, useEffect } from 'react';
// License checking not available in offline mode

export function useLicense() {
  const [licenseStatus, setLicenseStatus] = useState({
    valid: false, // Start as invalid to check properly
    expiry: null,
    timeRemaining: 0,
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
        timeRemaining: 999999999, // Lifetime
        loading: false
      });
      return;
    }
    
    if (!token) {
      // Check offline license storage for non-authenticated users
      const savedLicense = localStorage.getItem('offlineLicense');
      if (savedLicense) {
        const parsed = JSON.parse(savedLicense);
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((parsed.expiry - now) / 1000));
        setLicenseStatus({
          valid: remaining > 0,
          expiry: parsed.expiry,
          timeRemaining: remaining,
          loading: false
        });
        
        // If license expired, clear it to force new trial
        if (remaining <= 0) {
          localStorage.removeItem('offlineLicense');
        }
      } else {
        // New user gets 7-day trial
        const trialExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('offlineLicense', JSON.stringify({ expiry: trialExpiry, type: 'trial' }));
        setLicenseStatus({
          valid: true,
          expiry: trialExpiry,
          timeRemaining: 7 * 24 * 60 * 60,
          loading: false
        });
      }
      return;
    }

    // Try API call first for authenticated users
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/license/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const licenseData = {
          valid: data.valid,
          expiry: data.expiry,
          timeRemaining: data.timeRemaining
        };
        
        // Store both for caching and offline use
        localStorage.setItem('lastLicenseStatus', JSON.stringify(licenseData));
        localStorage.setItem('offlineLicense', JSON.stringify({ 
          expiry: data.expiry, 
          type: data.type || 'premium' 
        }));
        
        setLicenseStatus({ ...licenseData, loading: false });
        return;
      }
    } catch (error) {
      console.log('API call failed, using offline license data');
    }
    
    // Fallback to offline license storage
    const savedLicense = localStorage.getItem('offlineLicense');
    if (savedLicense) {
      const parsed = JSON.parse(savedLicense);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((parsed.expiry - now) / 1000));
      setLicenseStatus({
        valid: remaining > 0,
        expiry: parsed.expiry,
        timeRemaining: remaining,
        loading: false
      });
    } else {
      // New user gets 7-day trial
      const trialExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('offlineLicense', JSON.stringify({ expiry: trialExpiry, type: 'trial' }));
      setLicenseStatus({
        valid: true,
        expiry: trialExpiry,
        timeRemaining: 7 * 24 * 60 * 60,
        loading: false
      });
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