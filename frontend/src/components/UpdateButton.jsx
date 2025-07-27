import React, { useState, useEffect } from 'react';

function UpdateButton() {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [status, setStatus] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [downloadTimeout, setDownloadTimeout] = useState(null);

  useEffect(() => {
    if (window.electronAPI) {
      // Get app version
      window.electronAPI.getVersion().then(version => {
        setAppVersion(version);
      });

      // Listen for download progress
      window.electronAPI.onDownloadProgress?.((progress) => {
        setDownloadProgress(Math.round(progress.percent));
        setStatus(`Downloading... ${Math.round(progress.percent)}%`);
        
        // Clear any existing timeout
        if (downloadTimeout) {
          clearTimeout(downloadTimeout);
        }
        
        // Set new timeout for download stall detection
        const timeout = setTimeout(() => {
          setStatus('Download seems stuck. Check your internet connection.');
          setDownloading(false);
        }, 30000); // 30 seconds timeout
        
        setDownloadTimeout(timeout);
      });

      // Listen for download complete
      window.electronAPI.onUpdateDownloaded?.(() => {
        if (downloadTimeout) {
          clearTimeout(downloadTimeout);
        }
        setDownloading(false);
        setUpdateAvailable(true); // Ensure button shows
        setStatus('Update downloaded! Ready to install.');
      });

      // Listen for update errors
      window.electronAPI.onUpdateError?.((error) => {
        if (downloadTimeout) {
          clearTimeout(downloadTimeout);
        }
        setDownloading(false);
        setUpdateAvailable(false);
        setStatus(`Update failed: ${error}`);
      });
    }
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('ElectronAPI found, checking for updates...');
        console.log('Current app version:', appVersion);
        const result = await window.electronAPI.checkForUpdates();
        console.log('Update check result:', result);
        if (result && result.updateInfo) {
          console.log('Available version:', result.updateInfo.version);
          console.log('Current version:', appVersion);
          
          if (result.updateInfo.version !== appVersion) {
            setUpdateAvailable(true);
            setStatus('Update found! Downloading...');
            setDownloading(true);
            
            // Set download timeout
            const timeout = setTimeout(() => {
              setStatus('Download failed or timed out. Try again.');
              setDownloading(false);
              setUpdateAvailable(false);
            }, 60000); // 60 seconds total timeout
            
            setDownloadTimeout(timeout);
          } else {
            setStatus('No updates available - you have the latest version');
          }
        } else {
          setStatus('No updates available - you have the latest version');
        }
      } else {
        alert('Update feature only available in desktop app');
        console.log('ElectronAPI not found:', !!window.electronAPI);
      }
    } catch (error) {
      console.error('Update check error:', error);
      setStatus(`Error: ${error.message || 'Failed to check for updates'}`);
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
      setStatus(`Install failed: ${error.message || error}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">App Updates</h2>
        <span className="text-sm text-gray-500">v{appVersion}</span>
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

        {(updateAvailable || status.includes('downloaded')) && (
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