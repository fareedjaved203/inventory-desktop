import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

function DeleteModal({ isOpen, onClose, onConfirm, itemName, error, loading = false }) {
  const { language } = useLanguage();
  const t = useTranslation(language);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`bg-white p-6 rounded-lg w-full max-w-md ${language === 'ur' ? 'font-urdu' : ''}`}>
        <h2 className="text-xl font-bold mb-4">{language === 'ur' ? 'ڈیلیٹ کی تصدیق' : 'Confirm Deletion'}</h2>
        <p className="mb-6">
          {language === 'ur' ? `کیا آپ واقعی ${itemName} کو ڈیلیٹ کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔` : `Are you sure you want to delete ${itemName}? This action cannot be undone.`}
        </p>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;