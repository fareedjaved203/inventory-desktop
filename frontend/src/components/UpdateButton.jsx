import React, { useState } from 'react';

function UpdateButton() {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.checkForUpdates();
        if (result) {
          setUpdateAvailable(true);
        } else {
          alert('No updates available');
        }
      } else {
        alert('Update feature only available in desktop app');
      }
    } catch (error) {
      alert('Error checking for updates');
    }
    setChecking(false);
  };

  const installUpdate = async () => {
    if (window.electronAPI) {
      await window.electronAPI.installUpdate();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">App Updates</h2>
      
      <div className="space-y-4">
        <button
          onClick={checkForUpdates}
          disabled={checking}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {checking ? 'Checking...' : 'Check for Updates'}
        </button>

        {updateAvailable && (
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-primary-800 mb-2">Update available!</p>
            <button
              onClick={installUpdate}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Install Update & Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateButton;