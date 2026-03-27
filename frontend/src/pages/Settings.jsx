import React from 'react';
import DatabaseBackupForm from '../components/DatabaseBackupForm';
import UpdateEmailForm from '../components/UpdateUsernameForm';
import ShopSettingsForm from '../components/ShopSettingsForm';
import UpdateButton from '../components/UpdateButton';
import LicenseSettingsForm from '../components/LicenseSettingsForm';
import OfflineToggle from '../components/OfflineToggle';
import ThemeToggle from '../components/ThemeToggle';
import LoadDemoData from '../components/LoadDemoData';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

function Settings() {
  const { language } = useLanguage();
  const t = useTranslation(language);
  
  return (
    <div className={`p-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8">{t('settings')}</h1>
      
      <div className="space-y-6">
        {/* Theme Settings */}
        <ThemeToggle />
        
        {/* Demo Data */}
        <LoadDemoData />
        
        {/* Priority 1: License Management */}
        <LicenseSettingsForm />
        
        {/* Priority 3: Shop Configuration */}
        <ShopSettingsForm />
        
        {/* Priority 3: App Updates */}
        {/* <UpdateButton /> */}
        
        {/* Priority 4: Data Management */}
        {/* <DatabaseBackupForm /> */}
        
        {/* Priority 5: Account Settings */}
        <UpdateEmailForm />
      </div>
    </div>
  );
}

export default Settings;