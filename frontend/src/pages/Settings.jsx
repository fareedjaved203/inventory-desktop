import React from 'react';
import DatabaseBackupForm from '../components/DatabaseBackupForm';
import UpdateEmailForm from '../components/UpdateUsernameForm';
import ShopSettingsForm from '../components/ShopSettingsForm';
import UpdateButton from '../components/UpdateButton';
import LicenseSettingsForm from '../components/LicenseSettingsForm';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

function Settings() {
  const { language } = useLanguage();
  const t = useTranslation(language);
  
  return (
    <div className={`p-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8">{t('settings')}</h1>
      
      <div className="space-y-6">
        <LicenseSettingsForm />
        <UpdateButton />
        <ShopSettingsForm />
        <DatabaseBackupForm />
        <UpdateEmailForm />
      </div>
    </div>
  );
}

export default Settings;