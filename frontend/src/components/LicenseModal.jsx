import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function LicenseModal({ isOpen, onLicenseValidated, onLogout }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDemoPrompt, setShowDemoPrompt] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDeviceId();
    }
  }, [isOpen]);

  const fetchDeviceId = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/license/device-id`);
      const data = await response.json();
      if (data.deviceId) setDeviceId(data.deviceId);
    } catch {
      setDeviceId('Unable to fetch');
    }
  };

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(deviceId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/license/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ licenseKey: licenseKey.trim() })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('License activated successfully!');
        if (data.hasDemoData) {
          setShowDemoPrompt(true);
        } else {
          onLicenseValidated();
        }
      } else {
        setError(data.error || 'Invalid license key');
      }
    } catch {
      setError('Failed to validate license. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDemo = async (clear) => {
    if (clear) {
      try {
        const token = localStorage.getItem('authToken');
        await fetch(`${import.meta.env.VITE_API_URL}/api/license/clear-demo-data`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Demo data cleared');
      } catch {}
    }
    setShowDemoPrompt(false);
    onLicenseValidated();
  };

  if (!isOpen) return null;

  if (showDemoPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 text-center">
          <h2 className="text-lg font-bold mb-2">License Activated ✓</h2>
          <p className="text-gray-600 mb-1 text-sm">Clear sample data and start fresh?</p>
          <p className="text-gray-600 mb-4 text-sm font-urdu">نمونہ ڈیٹا صاف کریں؟</p>
          <div className="flex gap-3">
            <button onClick={() => handleClearDemo(true)} className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Yes / ہاں</button>
            <button onClick={() => handleClearDemo(false)} className="flex-1 py-2 border border-gray-300 rounded-md hover:bg-gray-50">No / نہیں</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-center">License Required</h2>
        <p className="text-gray-600 mb-4 text-center text-sm">
          Your license has expired. Enter a valid license key to continue.
        </p>

        {/* Device ID display */}
        {deviceId && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <label className="block text-xs font-medium text-gray-500 mb-1">Your Device ID</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-white px-2 py-1 rounded border border-gray-300 select-all break-all">
                {deviceId}
              </code>
              <button
                type="button"
                onClick={handleCopyDeviceId}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors whitespace-nowrap"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Share this ID with your admin to get a license key</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">License Key</label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX-XXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">Key must be activated within 5 minutes of generation</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 mb-3"
          >
            {loading ? 'Validating...' : 'Activate License'}
          </button>
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
