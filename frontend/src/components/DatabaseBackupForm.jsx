import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../utils/api';
import { FaDatabase, FaEnvelope, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

function DatabaseBackupForm() {
  const [activeTab, setActiveTab] = useState('backup');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  
  // Google Drive states
  const [serviceAccountKey, setServiceAccountKey] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState(false);
  const [driveError, setDriveError] = useState(null);
  const [credentialsExist, setCredentialsExist] = useState(false);

  const { data: shopSettings } = useQuery(['shop-settings'], async () => {
    const result = await API.getShopSettings();
    return result.items?.[0] || {};
  });

  const { data: driveSettings } = useQuery(['drive-settings'], async () => {
    // Drive settings not available in API wrapper
    return { hasCredentials: false };
  });

  useEffect(() => {
    if (shopSettings?.email && email === '') {
      setEmail(shopSettings.email);
    }
  }, [shopSettings]);

  useEffect(() => {
    if (driveSettings) {
      setCredentialsExist(driveSettings.hasCredentials);
    }
  }, [driveSettings]);

  const handleDriveCredentialsSave = async (e) => {
    e.preventDefault();
    setDriveLoading(true);
    setDriveSuccess(false);
    setDriveError(null);

    try {
      // Drive settings not available in API wrapper
      throw new Error('Drive backup not available in offline mode');
      
      setDriveSuccess(true);
      setCredentialsExist(true);
      setServiceAccountKey('');
    } catch (err) {
      setDriveError(err.response?.data?.error || 'Failed to save credentials');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveBackup = async () => {
    setDriveLoading(true);
    setDriveSuccess(false);
    setDriveError(null);

    try {
      // Drive backup not available in API wrapper
      throw new Error('Drive backup not available in offline mode');
      
      setDriveSuccess(true);
    } catch (err) {
      setDriveError(err.response?.data?.error || 'Failed to backup to Google Drive');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    try {
      // Drive settings not available in API wrapper
      throw new Error('Drive settings not available in offline mode');
      setCredentialsExist(false);
      setDriveSuccess(false);
    } catch (err) {
      setDriveError(err.response?.data?.error || 'Failed to delete credentials');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    setPreviewUrl(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/backup/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error('Backup failed');
      }
      
      const data = await response.json();
      setSuccess(true);
      
      console.log('Backup created successfully:', data);
    } catch (err) {
      setError('Failed to create backup. Please try again.');
      console.error('Error creating backup:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 to-accent-50 p-6 rounded-lg shadow-lg border border-primary-100">
      <div className="flex items-center gap-3 mb-6">
        <FaDatabase className="text-2xl text-primary-600" />
        <h2 className="text-xl font-bold text-primary-800">Database Management</h2>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'backup'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Create Backup
        </button>
        <button
          onClick={() => setActiveTab('restore')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'restore'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Restore Backup
        </button>
      </div>

      {activeTab === 'backup' && (
      <div>
          <p className="mb-4 text-gray-600">
            Create a PostgreSQL database backup file that can be restored on another machine.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 px-3 py-2 border border-primary-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700'
              }`}
            >
              {loading ? 'Sending...' : 'Send Backup'}
            </button>
          </form>
          
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start gap-3">
              <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Backup sent successfully!</p>
                {previewUrl ? (
                  <div className="mt-2">
                    <p>This is a test email. View it here:</p>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      View Test Email
                    </a>
                  </div>
                ) : (
                  <p>Please check your email.</p>
                )}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start gap-3">
              <FaExclamationCircle className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}
      </div>
      
      <div className="mt-6 text-sm text-gray-500 bg-white bg-opacity-50 p-3 rounded-md border border-gray-100">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Download the backup file (.sql)</li>
          <li>Install PostgreSQL on the target machine</li>
          <li>Create a new database: <code className="bg-gray-200 px-1 rounded">createdb hisabghar</code></li>
          <li>Restore: <code className="bg-gray-200 px-1 rounded">psql hisabghar &lt; backup_file.sql</code></li>
        </ol>
      </div>
      </div>
      )}

      {activeTab === 'restore' && (
      <div>
        <p className="mb-4 text-gray-600">
          Upload a backup file (.sql) to restore your database. <strong>Warning:</strong> This will replace all current data.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Backup File
            </label>
            <input
              type="file"
              accept=".sql"
              onChange={(e) => setRestoreFile(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <button
            onClick={handleRestore}
            disabled={!restoreFile || restoreLoading}
            className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              !restoreFile || restoreLoading
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
            }`}
          >
            {restoreLoading ? 'Restoring...' : 'Restore Database'}
          </button>
        </div>
        
        {restoreSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start gap-3">
            <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Database restored successfully!</p>
              <p>Please refresh the page to see the restored data.</p>
            </div>
          </div>
        )}
        
        {restoreError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start gap-3">
            <FaExclamationCircle className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>{restoreError}</div>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
          <p className="font-medium">⚠️ Important:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>This will completely replace your current database</li>
            <li>Make sure to backup current data before restoring</li>
            <li>Only upload .sql files from trusted sources</li>
          </ul>
        </div>
      </div>
      )}
    </div>
  );

  async function handleRestore() {
    if (!restoreFile) return;
    
    setRestoreLoading(true);
    setRestoreSuccess(false);
    setRestoreError(null);
    
    try {
      const formData = new FormData();
      formData.append('backupFile', restoreFile);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/backup/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Restore failed');
      }
      
      setRestoreSuccess(true);
      setRestoreFile(null);
    } catch (err) {
      setRestoreError('Failed to restore database. Please check the file and try again.');
    } finally {
      setRestoreLoading(false);
    }
  }
}

export default DatabaseBackupForm;