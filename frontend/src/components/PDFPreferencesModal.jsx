import React, { useState, useEffect } from 'react';

function PDFPreferencesModal({ isOpen, onClose, onSave }) {
  const [preferences, setPreferences] = useState({
    showDescription: true,
    showTransportDetails: true,
    showCarNumber: true,
    showLoadingDate: true,
    showArrivalDate: true,
    showTransportCost: true,
    showContactPhone: true,
    showContactAddress: true
  });

  useEffect(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem('pdfPreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('pdfPreferences', JSON.stringify(preferences));
    onSave(preferences);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">PDF Display Preferences</h2>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDescription"
              checked={preferences.showDescription}
              onChange={(e) => setPreferences({...preferences, showDescription: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showDescription" className="ml-2 text-sm">Show Description</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showTransportDetails"
              checked={preferences.showTransportDetails}
              onChange={(e) => setPreferences({...preferences, showTransportDetails: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showTransportDetails" className="ml-2 text-sm">Show Transport Details</label>
          </div>

          {preferences.showTransportDetails && (
            <div className="ml-6 space-y-2">
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
                  id="showTransportCost"
                  checked={preferences.showTransportCost}
                  onChange={(e) => setPreferences({...preferences, showTransportCost: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showTransportCost" className="ml-2 text-sm">Transport Cost</label>
              </div>
            </div>
          )}

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

export default PDFPreferencesModal;