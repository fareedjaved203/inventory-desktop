import React, { useState, useEffect } from 'react';

function StatementPDFPreferencesModal({ isOpen, onClose, onSave }) {
  const [preferences, setPreferences] = useState({
    showDate: true,
    showDescription: true,
    showDebit: true,
    showCredit: true,
    showBalance: true,
    showSaleDescription: true,
    showLoadingDate: true,
    showArrivalDate: true,
    showQuantity: true,
    showUnitPrice: true,
    showCarNumber: true,
    showContactPhone: true,
    showContactAddress: true,
    urduVersion: false
  });

  useEffect(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem('statementPdfPreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('statementPdfPreferences', JSON.stringify(preferences));
    onSave(preferences);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Statement PDF Preferences</h2>
        
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 mb-2">Table Columns</h3>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDate"
              checked={preferences.showDate}
              onChange={(e) => setPreferences({...preferences, showDate: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showDate" className="ml-2 text-sm">Date</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDescription"
              checked={preferences.showDescription}
              onChange={(e) => setPreferences({...preferences, showDescription: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showDescription" className="ml-2 text-sm">Memo</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showSaleDescription"
              checked={preferences.showSaleDescription}
              onChange={(e) => setPreferences({...preferences, showSaleDescription: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showSaleDescription" className="ml-2 text-sm">Sale Description</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showQuantity"
              checked={preferences.showQuantity}
              onChange={(e) => setPreferences({...preferences, showQuantity: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showQuantity" className="ml-2 text-sm">Quantity</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showUnitPrice"
              checked={preferences.showUnitPrice}
              onChange={(e) => setPreferences({...preferences, showUnitPrice: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showUnitPrice" className="ml-2 text-sm">Unit Price</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showCarNumber"
              checked={preferences.showCarNumber}
              onChange={(e) => setPreferences({...preferences, showCarNumber: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showCarNumber" className="ml-2 text-sm">Car Number</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showLoadingDate"
              checked={preferences.showLoadingDate}
              onChange={(e) => setPreferences({...preferences, showLoadingDate: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showLoadingDate" className="ml-2 text-sm">Loading Date</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showArrivalDate"
              checked={preferences.showArrivalDate}
              onChange={(e) => setPreferences({...preferences, showArrivalDate: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showArrivalDate" className="ml-2 text-sm">Arrival Date</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDebit"
              checked={preferences.showDebit}
              onChange={(e) => setPreferences({...preferences, showDebit: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showDebit" className="ml-2 text-sm">Debit</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showCredit"
              checked={preferences.showCredit}
              onChange={(e) => setPreferences({...preferences, showCredit: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showCredit" className="ml-2 text-sm">Credit</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showBalance"
              checked={preferences.showBalance}
              onChange={(e) => setPreferences({...preferences, showBalance: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showBalance" className="ml-2 text-sm">Balance</label>
          </div>

          <h3 className="font-medium text-gray-900 mb-2 mt-4">Contact Information</h3>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showContactPhone"
              checked={preferences.showContactPhone}
              onChange={(e) => setPreferences({...preferences, showContactPhone: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showContactPhone" className="ml-2 text-sm">Contact Phone</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showContactAddress"
              checked={preferences.showContactAddress}
              onChange={(e) => setPreferences({...preferences, showContactAddress: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showContactAddress" className="ml-2 text-sm">Contact Address</label>
          </div>

          <h3 className="font-medium text-gray-900 mb-2 mt-4">Language</h3>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="urduVersion"
              checked={preferences.urduVersion}
              onChange={(e) => setPreferences({...preferences, urduVersion: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="urduVersion" className="ml-2 text-sm">Urdu Version</label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Preferences
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default StatementPDFPreferencesModal;