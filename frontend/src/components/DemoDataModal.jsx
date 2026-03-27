import { useState } from 'react';
import { FaDatabase, FaSpinner, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function DemoDataModal({ isOpen, onClose, language = 'en' }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isUrdu = language === 'ur';

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seed-demo-data`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isUrdu ? 'ڈیمو ڈیٹا کامیابی سے لوڈ ہو گیا!' : 'Demo data loaded successfully!');
        onClose();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error(isUrdu ? 'ڈیمو ڈیٹا لوڈ نہیں ہو سکا' : 'Failed to load demo data');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden ${isUrdu ? 'font-urdu text-right' : ''}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <FaDatabase className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isUrdu ? 'خوش آمدید! 🎉' : 'Welcome! 🎉'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {isUrdu ? '3 دن کا مفت ٹرائل' : '3-Day Free Trial'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4 leading-relaxed">
            {isUrdu
              ? 'کیا آپ نمونہ ڈیٹا لوڈ کرنا چاہتے ہیں؟ اس سے آپ ایپ کی تمام خصوصیات دیکھ سکتے ہیں — پروڈکٹس، سیلز، رابطے، اخراجات وغیرہ۔'
              : 'Would you like to load sample data? This lets you explore all features — products, sales, contacts, expenses, and more.'}
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              {isUrdu
                ? '📦 58 پروڈکٹس • 80 سیلز • 40 خریداری • 40 رابطے • 50 اخراجات اور بہت کچھ'
                : '📦 58 Products • 80 Sales • 40 Purchases • 40 Contacts • 50 Expenses & more'}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-amber-700">
              {isUrdu
                ? '⚠️ لائسنس خریدنے پر نمونہ ڈیٹا خود بخود صاف ہو جائے گا اور آپ نئے سرے سے شروع کریں گے۔'
                : '⚠️ Sample data will be automatically cleared when you activate a license, giving you a fresh start.'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleLoadDemo}
              disabled={loading}
              className={`flex-1 py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${
                loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading && <FaSpinner className="animate-spin" />}
              {isUrdu
                ? (loading ? 'لوڈ ہو رہا ہے...' : '✓ نمونہ ڈیٹا لوڈ کریں')
                : (loading ? 'Loading...' : '✓ Load Sample Data')}
            </button>
            <button
              onClick={handleSkip}
              disabled={loading}
              className="px-4 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
            >
              {isUrdu ? 'چھوڑیں' : 'Skip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
