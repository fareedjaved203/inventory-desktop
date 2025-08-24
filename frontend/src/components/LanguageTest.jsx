import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

const LanguageTest = () => {
  const { language } = useLanguage();
  const t = useTranslation(language);

  return (
    <div className={`p-4 border rounded-lg ${language === 'ur' ? 'font-urdu' : ''}`}>
      <h3 className="text-lg font-semibold mb-2">Language Test</h3>
      <p>Current Language: {language}</p>
      <p>Dashboard: {t('dashboard')}</p>
      <p>Products: {t('products')}</p>
      <p>Sales: {t('sales')}</p>
      <p>Add Product: {t('addProduct')}</p>
    </div>
  );
};

export default LanguageTest;