import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

function ShopSettingsForm() {
  const queryClient = useQueryClient();
  const [showToast, setShowToast] = useState(false);
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [formData, setFormData] = useState({
    email: '',
    shopName: '',
    shopDescription: '',
    shopDescription2: '',
    userName1: '',
    userPhone1: '',
    userName2: '',
    userPhone2: '',
    userName3: '',
    userPhone3: '',
    brand1: '',
    brand1Registered: false,
    brand2: '',
    brand2Registered: false,
    brand3: '',
    brand3Registered: false,
    logo: '',
  });

  const { data: settings, isLoading } = useQuery(['shop-settings'], async () => {
    const response = await api.get('/api/shop-settings');
    return response.data;
  }, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        brand1Registered: settings.brand1Registered || false,
        brand2Registered: settings.brand2Registered || false,
        brand3Registered: settings.brand3Registered || false,
        logo: settings.logo || '',
      });
    }
  }, [settings]);

  const saveSettings = useMutation(
    async (data) => {
      try {
        const response = await api.post('/api/shop-settings', data);
        return response.data;
      } catch (error) {
        // If logo field causes validation error, try without logo for backward compatibility
        if (error.response?.status === 400 && data.logo) {
          console.warn('Logo field not supported by backend, saving without logo');
          const { logo, ...dataWithoutLogo } = data;
          const response = await api.post('/api/shop-settings', dataWithoutLogo);
          return response.data;
        }
        throw error;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['shop-settings']);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      },
      onError: (error) => {
        console.error('Settings save error:', error);
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error occurred';
        alert('Error saving settings: ' + errorMsg);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      // Create a copy without logo if it's too large
      const dataToSave = { ...formData };
      if (dataToSave.logo && dataToSave.logo.length > 1000000) { // 1MB limit for base64
        alert(language === 'ur' ? 'لوگو بہت بڑا ہے، براہ کرم چھوٹا فائل استعمال کریں' : 'Logo is too large, please use a smaller file');
        return;
      }
      
      // Remove logo field if backend doesn't support it (for backward compatibility)
      if (!dataToSave.logo) {
        delete dataToSave.logo;
      }
      
      saveSettings.mutate(dataToSave);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error preparing data: ' + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${language === 'ur' ? 'font-urdu' : ''}`}>
      <h2 className="text-xl font-bold mb-6">{t('shopSettings')}</h2>
      {showToast && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {language === 'ur' ? 'سیٹنگز کامیابی سے محفوظ ہو گئیں!' : 'Settings saved successfully!'}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('email')} *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('shopName')} *</label>
            <input
              type="text"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'دکان کی تفصیل' : 'Shop Description'}</label>
          <textarea
            name="shopDescription"
            value={formData.shopDescription}
            onChange={handleChange}
            rows="2"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'دکان کی تفصیل 2' : 'Shop Description 2'}</label>
          <textarea
            name="shopDescription2"
            value={formData.shopDescription2}
            onChange={handleChange}
            rows="2"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'صارف کا نام 1 *' : 'User Name 1 *'}</label>
            <input
              type="text"
              name="userName1"
              value={formData.userName1}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'فون 1 *' : 'Phone 1 *'}</label>
            <input
              type="text"
              name="userPhone1"
              value={formData.userPhone1}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'صارف کا نام 2' : 'User Name 2'}</label>
            <input
              type="text"
              name="userName2"
              value={formData.userName2}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'فون 2' : 'Phone 2'}</label>
            <input
              type="text"
              name="userPhone2"
              value={formData.userPhone2}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'صارف کا نام 3' : 'User Name 3'}</label>
            <input
              type="text"
              name="userName3"
              value={formData.userName3}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'فون 3' : 'Phone 3'}</label>
            <input
              type="text"
              name="userPhone3"
              value={formData.userPhone3}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'برانڈ 1' : 'Brand 1'}</label>
            <div className="space-y-2">
              <input
                type="text"
                name="brand1"
                value={formData.brand1}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="brand1Registered"
                  name="brand1Registered"
                  checked={formData.brand1Registered}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="brand1Registered" className="ml-2 text-sm text-gray-700">{language === 'ur' ? 'رجسٹرڈ ٹریڈ مارک (®)' : 'Registered Trademark (®)'}</label>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'برانڈ 2' : 'Brand 2'}</label>
            <div className="space-y-2">
              <input
                type="text"
                name="brand2"
                value={formData.brand2}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="brand2Registered"
                  name="brand2Registered"
                  checked={formData.brand2Registered}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="brand2Registered" className="ml-2 text-sm text-gray-700">{language === 'ur' ? 'رجسٹرڈ ٹریڈ مارک (®)' : 'Registered Trademark (®)'}</label>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{language === 'ur' ? 'برانڈ 3' : 'Brand 3'}</label>
            <div className="space-y-2">
              <input
                type="text"
                name="brand3"
                value={formData.brand3}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="brand3Registered"
                  name="brand3Registered"
                  checked={formData.brand3Registered}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="brand3Registered" className="ml-2 text-sm text-gray-700">{language === 'ur' ? 'رجسٹرڈ ٹریڈ مارک (®)' : 'Registered Trademark (®)'}</label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'ur' ? 'لوگو (اختیاری)' : 'Logo (Optional)'}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                // Check file size (limit to 2MB)
                if (file.size > 2 * 1024 * 1024) {
                  alert(language === 'ur' ? 'فائل کا سائز 2MB سے زیادہ نہیں ہونا چاہیے' : 'File size should not exceed 2MB');
                  e.target.value = '';
                  return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                  setFormData({ ...formData, logo: event.target.result });
                };
                reader.onerror = () => {
                  alert(language === 'ur' ? 'فائل پڑھنے میں خرابی' : 'Error reading file');
                };
                reader.readAsDataURL(file);
              }
            }}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">{language === 'ur' ? 'انوائس پر دکھانے کے لیے لوگو اپ لوڈ کریں' : 'Upload a logo to display on invoices'}</p>
          {formData.logo && (
            <div className="mt-2">
              <img src={formData.logo} alt="Logo preview" className="h-16 w-auto border rounded" />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, logo: '' })}
                className="ml-2 text-red-600 hover:text-red-800 text-sm"
              >
                {language === 'ur' ? 'ہٹائیں' : 'Remove'}
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saveSettings.isLoading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saveSettings.isLoading ? (language === 'ur' ? 'محفوظ ہو رہا ہے...' : 'Saving...') : (language === 'ur' ? 'سیٹنگز محفوظ کریں' : 'Save Settings')}
        </button>
      </form>
    </div>
  );
}

export default ShopSettingsForm;