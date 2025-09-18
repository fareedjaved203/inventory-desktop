import { useState } from 'react';
import { useLicense } from '../hooks/useLicense';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../utils/axios';

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
      const response = await api.post('/api/license/validate', {
        licenseKey: licenseKey.trim()
      });

      if (response.data.success) {
        setMessage(language === 'ur' ? 'لائسنس کامیابی سے اپڈیٹ ہو گیا!' : 'License updated successfully!');
        setLicenseKey('');
        refreshLicense();
      } else {
        setMessage(language === 'ur' ? 'لائسنس اپڈیٹ کرنے میں ناکام' : 'Failed to update license');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || (language === 'ur' ? 'لائسنس اپڈیٹ کرنے میں ناکام' : 'Failed to update license'));
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
        {valid && (
          <div className="mt-2 text-sm text-gray-600">
            {language === 'ur' ? 'باقی وقت' : 'Time Remaining'}: {timeRemaining === -1 ? '...' : formatTimeRemaining(timeRemaining)}
            {/* Show trial indicator */}
            {timeRemaining <= (3 * 24 * 60 * 60) && timeRemaining > (2 * 24 * 60 * 60) && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{language === 'ur' ? 'آزمائشی' : 'Trial'}</span>
            )}
          </div>
        )}
      </div>

      {/* License input form removed - users should only enter license when expired */}
    </div>
  );
}