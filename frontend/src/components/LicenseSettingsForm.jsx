import { useState, useEffect } from 'react';
import { useLicense } from '../hooks/useLicense';
import { useLanguage } from '../contexts/LanguageContext';

export default function LicenseSettingsForm() {
  const { language } = useLanguage();
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDemoPrompt, setShowDemoPrompt] = useState(false);
  const { valid, expiry, timeRemaining, refreshLicense } = useLicense();

  useEffect(() => {
    const fetchDeviceId = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/license/device-id`);
        const data = await res.json();
        if (data.deviceId) setDeviceId(data.deviceId);
      } catch (err) {
        console.error('Failed to fetch device ID:', err);
      }
    };
    fetchDeviceId();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setMessage(language === 'ur' ? 'براہ کرم لائسنس کی داخل کریں' : 'Please enter a license key');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/license/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ licenseKey })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.hasDemoData) {
          setShowDemoPrompt(true);
        }
        setMessage(language === 'ur' ? 'لائسنس کامیابی سے اپڈیٹ ہو گیا!' : 'License updated successfully!');
        setLicenseKey('');
        localStorage.removeItem('offlineLicense');
        localStorage.removeItem('lastLicenseStatus');
        setTimeout(() => refreshLicense(), 500);
      } else {
        setMessage(data.error || (language === 'ur' ? 'غلط لائسنس کی' : 'Invalid license key'));
      }
    } catch (err) {
      console.error('License activation error:', err);
      setMessage(language === 'ur' ? 'لائسنس ایپی آئی دستیاب نہیں' : 'License API not available');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return language === 'ur' ? 'ختم ہو گیا' : 'Expired';
    
    const days = Math.floor(seconds / 86400);
    const years = Math.floor(days / 365);
    
    // If more than 25 years, show as Lifetime
    if (years >= 25) return language === 'ur' ? 'زندگی بھر' : 'Lifetime';
    
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (language === 'ur') {
      if (years > 0) return `${years} سال ${days % 365} دن`;
      if (days > 0) return `${days} دن ${hours} گھنٹے ${minutes} منٹ`;
      if (hours > 0) return `${hours} گھنٹے ${minutes} منٹ`;
      return `${minutes} منٹ`;
    } else {
      if (years > 0) return `${years} years ${days % 365}d`;
      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${language === 'ur' ? 'font-urdu' : ''}`}>
      <h2 className="text-xl font-semibold mb-4">{language === 'ur' ? 'لائسنس کا انتظام' : 'License Management'}</h2>
      
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <div className="flex justify-between items-center">
          <span className="font-medium">{language === 'ur' ? 'لائسنس کی صورتحال' : 'License Status'}:</span>
          <span className={`px-2 py-1 rounded text-sm ${valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {valid ? (language === 'ur' ? 'فعال' : 'Active') : (language === 'ur' ? 'ختم ہو گیا' : 'Expired')}
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {language === 'ur' ? 'باقی وقت' : 'Time Remaining'}: {timeRemaining === -1 ? 'Loading...' : formatTimeRemaining(timeRemaining)}
          {timeRemaining <= (3 * 24 * 60 * 60) && timeRemaining > (2 * 24 * 60 * 60) && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{language === 'ur' ? 'آزمائشی' : 'Trial'}</span>
          )}
        </div>
      </div>

      {deviceId && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">{language === 'ur' ? 'ڈیوائس آئی ڈی' : 'Device ID'}:</span>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border select-all">{deviceId}</code>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(deviceId); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                {copied ? '✓' : (language === 'ur' ? 'کاپی' : 'Copy')}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'ur' ? 'لائسنس کی' : 'License Key'}
          </label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={language === 'ur' ? 'لائسنس کی داخل کریں' : 'Enter license key'}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (language === 'ur' ? 'اپڈیٹ ہو رہا ہے...' : 'Updating...') : (language === 'ur' ? 'لائسنس اپڈیٹ کریں' : 'Update License')}
        </button>
        
        {message && (
          <div className={`p-3 rounded ${message.includes('success') || message.includes('کامیابی') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
      </form>

      {showDemoPrompt && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-gray-700 mb-1">{language === 'ur' ? 'نمونہ ڈیٹا صاف کریں؟' : 'Clear sample data and start fresh?'}</p>
          {language !== 'ur' && <p className="text-sm text-gray-700 mb-3 font-urdu">نمونہ ڈیٹا صاف کریں؟</p>}
          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('authToken');
                  await fetch(`${import.meta.env.VITE_API_URL}/api/license/clear-demo-data`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                } catch {}
                setShowDemoPrompt(false);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              {language === 'ur' ? 'ہاں' : 'Yes'}
            </button>
            <button onClick={() => setShowDemoPrompt(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
              {language === 'ur' ? 'نہیں' : 'No'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}