import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

function UpdateButton() {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [status, setStatus] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [progressTimeout, setProgressTimeout] = useState(null);

  useEffect(() => {
    if (window.electronAPI) {
      // Get app version
      window.electronAPI.getVersion().then(version => {
        setAppVersion(version);
      });

      // Listen for download progress
      window.electronAPI.onDownloadProgress?.((progress) => {
        const percent = Math.round(progress.percent);
        setDownloadProgress(percent);
        setStatus(`Downloading... ${percent}%`);
        
        // Clear existing timeout
        if (progressTimeout) {
          clearTimeout(progressTimeout);
        }
        
        // Set new timeout only if not at 100%
        if (percent < 100) {
          const timeout = setTimeout(() => {
            if (!downloaded) { // Only show stuck message if not downloaded
              setStatus('Download seems stuck. Check your internet connection.');
            }
          }, 15000); // 15 seconds timeout
          setProgressTimeout(timeout);
        }
      });

      // Listen for download complete
      window.electronAPI.onUpdateDownloaded?.(() => {
        // Clear any existing timeout
        if (progressTimeout) {
          clearTimeout(progressTimeout);
          setProgressTimeout(null);
        }
        setDownloading(false);
        setDownloaded(true);
        setDownloadProgress(100);
        setStatus(t('updateDownloaded'));
      });

      // Listen for update available
      window.electronAPI.onUpdateAvailable?.((info) => {
        setUpdateInfo(info);
        setUpdateAvailable(true);
        setStatus(`${t('updateAvailable')}: v${info.version}`);
      });

      // Listen for update errors
      window.electronAPI.onUpdateError?.((error) => {
        // Clear any existing timeout
        if (progressTimeout) {
          clearTimeout(progressTimeout);
          setProgressTimeout(null);
        }
        setDownloading(false);
        setUpdateAvailable(false);
        setDownloaded(false);
        setDownloadProgress(0);
        setStatus(`Update failed: ${error}`);
      });
    }
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    setStatus('');
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.checkForUpdates();
        if (result && result.updateInfo && result.updateInfo.version !== appVersion) {
          setUpdateInfo(result.updateInfo);
          setUpdateAvailable(true);
          setStatus(`Update available: v${result.updateInfo.version}`);
        } else {
          setStatus(t('noUpdatesAvailable'));
        }
      } else {
        setStatus('Update feature only available in desktop app');
      }
    } catch (error) {
      setStatus(`Error: ${error.message || 'Failed to check for updates'}`);
    }
    setChecking(false);
  };

  const downloadUpdate = async () => {
    setDownloading(true);
    setDownloaded(false);
    setDownloadProgress(0);
    setStatus('Starting download...');
    
    // Clear any existing timeout
    if (progressTimeout) {
      clearTimeout(progressTimeout);
      setProgressTimeout(null);
    }
    
    try {
      await window.electronAPI.downloadUpdate();
    } catch (error) {
      setDownloading(false);
      setDownloadProgress(0);
      setStatus(`Download failed: ${error.message || error}`);
    }
  };

  const installUpdate = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        setInstalling(true);
        setStatus('Preparing to install update...');
        console.log('Installing update...');
        await window.electronAPI.installUpdate();
        // App should restart here, so this won't execute
        setStatus('Installation started. App will restart automatically.');
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
    <div className={`bg-white p-6 rounded-lg shadow ${language === 'ur' ? 'font-urdu' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{language === 'ur' ? 'ایپ اپڈیٹس' : 'App Updates'}</h2>
        <span className="text-sm text-gray-500">v{appVersion}</span>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={checkForUpdates}
          disabled={checking}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {checking ? (language === 'ur' ? 'چیک کر رہا ہے...' : 'Checking...') : t('checkForUpdates')}
        </button>

        {/* {status && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">{status}</p>
          </div>
        )} */}

        {updateAvailable && !downloaded && !downloading && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 mb-2">{t('updateAvailable')} v{updateInfo?.version}!</p>
            <button
              onClick={downloadUpdate}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {t('downloadUpdate')}
            </button>
          </div>
        )}

        {downloading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 mb-2">{language === 'ur' ? 'اپڈیٹ ڈاؤن لوڈ ہو رہا ہے...' : 'Downloading update...'} {downloadProgress}%</p>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{width: `${downloadProgress}%`}}></div>
            </div>
          </div>
        )}

        {downloaded && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 mb-2">{language === 'ur' ? 'اپڈیٹ انسٹال کے لیے تیار ہے!' : 'Update ready to install!'}</p>
            <p className="text-green-600 text-sm mb-3">{language === 'ur' ? 'انسٹالیشن میں 2-3 منٹ لگیں گے۔ ایپ خودکار طور پر بند ہو کر دوبارہ کھل جائے گی۔' : 'Installation will take 2-3 minutes. The app will close and reopen automatically.'}</p>
            <button
              onClick={installUpdate}
              disabled={installing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {installing ? (language === 'ur' ? 'انسٹالیشن شروع ہو رہی ہے...' : 'Starting Installation...') : t('installUpdate')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateButton;