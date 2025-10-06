import React, { useState, useEffect } from 'react';
import DataStorageManager from '../utils/DataStorageManager';

function OfflineToggle() {
  const [isOffline, setIsOffline] = useState(DataStorageManager.getOfflineMode());

  const handleToggle = () => {
    const newMode = !isOffline;
    setIsOffline(newMode);
    DataStorageManager.setOfflineMode(newMode);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Data Storage Mode</h3>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Offline Mode</p>
          <p className="text-sm text-gray-600">
            {isOffline 
              ? 'Data is stored locally on your device' 
              : 'Data is stored on remote server'
            }
          </p>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isOffline}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> User registration and license validation always require internet connection.
        </p>
      </div>
    </div>
  );
}

export default OfflineToggle;