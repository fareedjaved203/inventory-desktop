import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      title={language === 'en' ? 'Switch to Urdu' : 'انگریزی میں تبدیل کریں'}
    >
      <span className="text-sm font-medium">
        {language === 'en' ? 'EN' : 'اردو'}
      </span>
      <div className="w-8 h-4 bg-gray-300 rounded-full relative">
        <div 
          className={`w-3 h-3 bg-blue-600 rounded-full absolute top-0.5 transition-transform ${
            language === 'ur' ? 'transform translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
};

export default LanguageToggle;