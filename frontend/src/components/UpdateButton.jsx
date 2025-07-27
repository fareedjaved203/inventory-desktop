import React, { useState, useEffect } from 'react';

function UpdateButton() {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [status, setStatus] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (window.electronAPI) {
      // Listen for download progress
      window.electronAPI.onDownloadProgress?.((progress) => {
        setDownloadProgress(Math.round(progress.percent));
        setStatus(`Downloading... ${Math.round(progress.percent)}%`);
      });

      // Listen for download complete
      window.electronAPI.onUpdateDownloaded?.(() => {
        setDownloading(false);
        setStatus('Update downloaded! Ready to install.');
      });
    }
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('ElectronAPI found, checking for updates...');
        const result = await window.electronAPI.checkForUpdates();
        if (result && result.updateInfo) {
          setUpdateAvailable(true);
          setStatus('Update found! Downloading...');
          setDownloading(true);
        } else {
          alert('No updates available');
          setStatus('No updates available');
        }
      } else {
        alert('Update feature only available in desktop app');
        console.log('ElectronAPI not found:', !!window.electronAPI);
      }
    } catch (error) {
      console.error('Update check error:', error);
      alert(`Error checking for updates: ${error.message || error}`);
    }
    setChecking(false);
  };

  const installUpdate = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        setInstalling(true);
        setStatus('Installing update and restarting...');
        console.log('Installing update...');
        await window.electronAPI.installUpdate();
        // App should restart here, so this won't execute
        setStatus('Update installed! Restarting...');
      } else {
        alert('Update feature only available in desktop app');
      }
    } catch (error) {
      console.error('Install error:', error);
      setInstalling(false);
      setStatus(`Error: ${error.message || error}`);
      alert(`Error installing update: ${error.message || error}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">App Updates</h2>
        <span className="text-sm text-gray-500">v{window.electronAPI?.version || '1.0.0'}</span>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={checkForUpdates}
          disabled={checking}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {checking ? 'Checking...' : 'Check for Updates'}
        </button>

        {status && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">{status}</p>
          </div>
        )}

        {updateAvailable && (
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-primary-800 mb-2">
              {downloading ? 'Downloading update...' : 'Update ready to install!'}
            </p>
            <button
              onClick={installUpdate}
              disabled={installing || downloading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {installing ? 'Installing...' : downloading ? 'Downloading...' : 'Install Update & Restart'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateButton;