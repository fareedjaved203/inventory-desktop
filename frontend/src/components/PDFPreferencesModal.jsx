import React, { useState, useEffect } from 'react';
import { THERMAL_FIELDS, A4_FIELDS, getVisibleFields } from './PrintSettingsModal';

const A4_PREFERENCES = [
  { key: 'showLogo', label: 'Shop Logo', default: true },
  { key: 'showShopName', label: 'Shop Name', default: true },
  { key: 'showShopDescription', label: 'Shop Description', default: true },
  { key: 'showContactInfo', label: 'Shop Contact Info', default: true },
  { key: 'showBillNumber', label: 'Bill Number', default: true },
  { key: 'showDate', label: 'Date', default: true },
  { key: 'showProductName', label: 'Product Name', default: true },
  { key: 'showUnitPrice', label: 'Unit Price', default: true },
  { key: 'showQuantity', label: 'Quantity', default: true },
  { key: 'showTotal', label: 'Total', default: true },
  { key: 'showDiscount', label: 'Discount', default: true },
  { key: 'showSubTotal', label: 'Sub Total (after discount)', default: true },
  { key: 'showPaidAmount', label: 'Paid Amount', default: true },
  { key: 'showDueAmount', label: 'Due Amount', default: true },
  { key: 'showCarNumber', label: 'Car Number', default: true },
  { key: 'showTransportCost', label: 'Transport Cost', default: true },
  { key: 'showLoadingDate', label: 'Loading Date', default: true },
  { key: 'showArrivalDate', label: 'Arrival Date', default: true },
  { key: 'showDescription', label: 'Description/Notes', default: true },
  { key: 'showContactPhone', label: 'Customer Phone', default: true },
  { key: 'showContactAddress', label: 'Customer Address', default: true },
  { key: 'showBrands', label: 'Brand Names', default: true },
  { key: 'showThankYou', label: 'Thank You Message', default: true },
];

function PDFPreferencesModal({ isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('a4');
  const [a4Prefs, setA4Prefs] = useState({});
  const [thermalFields, setThermalFields] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const savedA4 = localStorage.getItem('pdfPreferences');
      if (savedA4) {
        setA4Prefs(JSON.parse(savedA4));
      } else {
        const defaults = {};
        A4_PREFERENCES.forEach(p => { defaults[p.key] = p.default; });
        setA4Prefs(defaults);
      }
      setThermalFields(getVisibleFields('posThermalPrintFields', THERMAL_FIELDS));
    }
  }, [isOpen]);

  const handleSaveA4 = () => {
    localStorage.setItem('pdfPreferences', JSON.stringify(a4Prefs));
    onSave(a4Prefs);
    onClose();
  };

  const toggleThermal = (key) => {
    const updated = thermalFields.includes(key)
      ? thermalFields.filter(k => k !== key)
      : [...thermalFields, key];
    setThermalFields(updated);
    localStorage.setItem('posThermalPrintFields', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Print Settings</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('a4')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'a4' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              A4 Invoice
            </button>
            <button
              onClick={() => setActiveTab('thermal')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'thermal' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Thermal Print
            </button>
          </div>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          {activeTab === 'a4' ? (
            <div className="space-y-2">
              {A4_PREFERENCES.map(pref => (
                <label key={pref.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={a4Prefs[pref.key] !== false}
                    onChange={(e) => setA4Prefs({ ...a4Prefs, [pref.key]: e.target.checked })}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{pref.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">These settings are shared with POS thermal print.</p>
              {THERMAL_FIELDS.map(field => (
                <label key={field.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={thermalFields.includes(field.key)}
                    onChange={() => toggleThermal(field.key)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={activeTab === 'a4' ? handleSaveA4 : onClose}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            {activeTab === 'a4' ? 'Save A4 Settings' : 'Done'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default PDFPreferencesModal;
