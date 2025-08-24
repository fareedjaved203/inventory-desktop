import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
      title={language === 'en' ? 'Switch to Urdu' : 'انگریزی میں تبدیل کریں'}
    >
      <span className="text-sm font-medium text-white">
        {language === 'en' ? 'EN' : 'اردو'}
      </span>
      <div className={`w-8 h-4 rounded-full relative transition-colors ${
        language === 'ur' ? 'bg-green-400' : 'bg-blue-400'
      }`}>
        <div 
          className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
            language === 'ur' ? 'transform translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
};

export default LanguageToggle;