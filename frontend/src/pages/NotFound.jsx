import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

export default function NotFound() {
  const { language } = useLanguage();
  const t = useTranslation(language);
  
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">{language === 'ur' ? 'صفحہ نہیں ملا' : 'Page Not Found'}</h2>
        <p className="text-gray-500 mb-8">{language === 'ur' ? 'آپ جو صفحہ تلاش کر رہے ہیں وہ موجود نہیں ہے۔' : "The page you're looking for doesn't exist."}</p>
        <Link 
          to="/" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {language === 'ur' ? 'گھر واپس جائیں' : 'Go Home'}
        </Link>
      </div>
    </div>
  );
}