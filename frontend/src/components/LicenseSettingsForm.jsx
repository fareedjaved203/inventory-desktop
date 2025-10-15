import { useState } from 'react';
import { useLicense } from '../hooks/useLicense';
import { useLanguage } from '../contexts/LanguageContext';

export default function LicenseSettingsForm() {
  const { language } = useLanguage();
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { valid, expiry, timeRemaining, refreshLicense } = useLicense();

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
        body: JSON.stringify({ licenseKey, forceRebind: false })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(language === 'ur' ? 'لائسنس کامیابی سے اپڈیٹ ہو گیا!' : 'License updated successfully!');
        setLicenseKey('');
        // Clear offline license to force DB fetch
        localStorage.removeItem('offlineLicense');
        localStorage.removeItem('lastLicenseStatus');
        // Refresh license from database
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
    </div>
  );
}