import { useState } from 'react';
import { FaDatabase, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

export default function LoadDemoData() {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const handleLoadDemo = async () => {
    const msg = isUrdu
      ? 'کیا آپ نمونہ ڈیٹا لوڈ کرنا چاہتے ہیں؟ یہ صرف خالی اکاؤنٹ پر کام کرتا ہے۔'
      : 'This will populate your account with demo data. Only works on empty accounts. Continue?';
    if (!confirm(msg)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seed-demo-data`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isUrdu ? 'ڈیمو ڈیٹا لوڈ ہو گیا!' : 'Demo data loaded!');
        setLoaded(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error(isUrdu ? 'ڈیمو ڈیٹا لوڈ نہیں ہو سکا' : 'Failed to load demo data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 border border-blue-200 ${isUrdu ? 'font-urdu text-right' : ''}`}>
      <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <FaDatabase className="text-blue-600" />
        {isUrdu ? 'نمونہ ڈیٹا' : 'Demo Data'}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        {isUrdu
          ? 'ایپ کی تمام خصوصیات دیکھنے کے لیے نمونہ ڈیٹا لوڈ کریں۔'
          : 'Load sample data to explore all features — products, sales, contacts, and more.'}
      </p>
      <button
        onClick={handleLoadDemo}
        disabled={loading || loaded}
        className={`px-4 py-2 rounded text-white text-sm flex items-center gap-2 ${
          loaded ? 'bg-green-500' : loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading && <FaSpinner className="animate-spin" />}
        {loaded
          ? (isUrdu ? '✓ لوڈ ہو گیا' : '✓ Loaded')
          : loading
            ? (isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...')
            : (isUrdu ? 'نمونہ ڈیٹا لوڈ کریں' : 'Load Demo Data')}
      </button>
    </div>
  );
}
