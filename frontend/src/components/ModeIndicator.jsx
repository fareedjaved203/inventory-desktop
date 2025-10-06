import { useState, useEffect } from 'react';
import { FaDatabase, FaCloud, FaChevronDown, FaDownload, FaUpload } from 'react-icons/fa';
import DataStorageManager from '../utils/DataStorageManager';

function ModeIndicator() {
  const [isOffline, setIsOffline] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setIsOffline(DataStorageManager.getOfflineMode());
  }, []);

  const toggleMode = () => {
    const newMode = !isOffline;
    DataStorageManager.setOfflineMode(newMode);
    setIsOffline(newMode);
  };

  const handleSync = async (type) => {
    // Sync functionality will be implemented
    console.log(`${type} sync triggered`);
    setDropdownOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Mode Indicator */}
        <div 
          onClick={toggleMode}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
            isOffline 
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          {isOffline ? <FaDatabase /> : <FaCloud />}
          <span>{isOffline ? 'Offline' : 'Online'}</span>
        </div>

        {/* Sync Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Sync <FaChevronDown className="text-xs" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                onClick={() => handleSync('download')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
              >
                <FaDownload /> Download
              </button>
              <button
                onClick={() => handleSync('upload')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
              >
                <FaUpload /> Upload
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}

export default ModeIndicator;