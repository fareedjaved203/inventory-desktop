import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FaGlobe, FaChevronDown } from 'react-icons/fa';

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors min-w-[100px] border border-white/20"
      >
        <FaGlobe className="text-sm" />
        <span className="flex items-center gap-1">
          <span>{currentLanguage?.flag}</span>
          <span>{currentLanguage?.name}</span>
        </span>
        <FaChevronDown className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  language === lang.code ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                } ${lang.code === languages[0].code ? 'rounded-t-lg' : ''} ${lang.code === languages[languages.length - 1].code ? 'rounded-b-lg' : ''}`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {language === lang.code && (
                  <span className="ml-auto text-primary-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageToggle;