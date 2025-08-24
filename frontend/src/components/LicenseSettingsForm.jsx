import { useState } from 'react';
import { useLicense } from '../hooks/useLicense';

export default function LicenseSettingsForm() {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { valid, expiry, timeRemaining, refreshLicense } = useLicense();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setMessage('Please enter a license key');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/license/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKey.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('License updated successfully!');
        setLicenseKey('');
        refreshLicense();
      } else {
        setMessage(data.error || 'Failed to update license');
      }
    } catch (err) {
      setMessage('Failed to update license');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return 'Expired';
    
    const days = Math.floor(seconds / 86400);
    const years = Math.floor(days / 365);
    
    // If more than 25 years, show as Lifetime
    if (years >= 25) return 'Lifetime';
    
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (years > 0) return `${years} years ${days % 365}d`;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">License Management</h2>
      
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <div className="flex justify-between items-center">
          <span className="font-medium">License Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {valid ? 'Active' : 'Expired'}
          </span>
        </div>
        {valid && (
          <div className="mt-2 text-sm text-gray-600">
            Time Remaining: {formatTimeRemaining(timeRemaining)}
            {/* Show trial indicator */}
            {timeRemaining <= (3 * 24 * 60 * 60) && timeRemaining > (2 * 24 * 60 * 60) && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Trial</span>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Update License Key
          </label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        
        {message && (
          <div className={`p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update License'}
        </button>
      </form>
    </div>
  );
}