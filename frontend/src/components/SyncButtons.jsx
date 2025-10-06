import React, { useState } from 'react';
import SyncManager from '../utils/syncManager';
import DataStorageManager from '../utils/DataStorageManager';
import toast from 'react-hot-toast';

function SyncButtons() {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const isOffline = DataStorageManager.getOfflineMode();

  const handleUpload = async () => {
    if (!isOffline) {
      toast.error('Switch to offline mode first');
      return;
    }

    setUploading(true);
    setProgress(0);
    
    try {
      await SyncManager.uploadData((message, prog) => {
        setProgressMessage(message);
        setProgress(prog);
      });
      toast.success('Data uploaded successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleDownload = async () => {
    if (!isOffline) {
      toast.error('Switch to offline mode first');
      return;
    }

    setDownloading(true);
    setProgress(0);
    
    try {
      await SyncManager.downloadData((message, prog) => {
        setProgressMessage(message);
        setProgress(prog);
      });
      toast.success('Data downloaded successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDownloading(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  if (!isOffline) return null;

  // Show progress bar during sync
  if ((uploading || downloading) && progress > 0) {
    return (
      <div className="flex items-center gap-2 text-white text-sm">
        <div className="w-20 bg-white bg-opacity-20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs">{Math.round(progress)}%</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative">
        <button
          onClick={handleUpload}
          disabled={uploading || downloading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          title={uploading ? progressMessage : "Upload local data to server"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
          </svg>
          {uploading ? `${Math.round(progress)}%` : 'Upload'}
        </button>
        {uploading && (
          <div className="absolute top-full left-0 mt-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
            {progressMessage}
          </div>
        )}
      </div>
      
      <div className="relative">
        <button
          onClick={handleDownload}
          disabled={downloading || uploading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          title={downloading ? progressMessage : "Download data from server"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
          </svg>
          {downloading ? `${Math.round(progress)}%` : 'Download'}
        </button>
        {downloading && (
          <div className="absolute top-full left-0 mt-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
            {progressMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default SyncButtons;