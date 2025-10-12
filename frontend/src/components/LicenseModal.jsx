import { useState } from 'react';
// License validation not available in offline mode

export default function LicenseModal({ isOpen, onLicenseValidated, onLogout }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [canRebind, setCanRebind] = useState(false);

  const handleSubmit = async (e, forceRebind = false) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setLoading(true);
    setError('');
    setCanRebind(false);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/license/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          licenseKey: licenseKey.trim(),
          forceRebind 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onLicenseValidated();
      } else {
        setError(data.error || 'Invalid license key');
        if (data.canRebind) {
          setCanRebind(true);
        }
      }
    } catch (err) {
      setError('Failed to validate license. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRebind = (e) => {
    handleSubmit(e, true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-center">License Required</h2>
        <p className="text-gray-600 mb-4 text-center">
          Your license has expired. Please enter a valid license key to continue.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              License Key
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
              {canRebind && (
                <p className="mt-2 text-sm">
                  This license is bound to a different device. Click "Rebind License" to use it on this device.
                </p>
              )}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 mb-3"
          >
            {loading ? 'Validating...' : 'Activate License'}
          </button>
          
          {canRebind && (
            <button
              type="button"
              onClick={handleRebind}
              disabled={loading}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 mb-3"
            >
              {loading ? 'Rebinding...' : 'Rebind License to This Device'}
            </button>
          )}
        </form>
        
        <button
          onClick={onLogout}
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}