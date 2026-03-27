import { useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function DemoDataModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
        toast.success('Sample data loaded / نمونہ ڈیٹا لوڈ ہو گیا');
        onClose();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error('Failed to load sample data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-lg font-semibold text-gray-800 mb-1">
            Load sample data?
          </p>
          <p className="text-lg font-semibold text-gray-800 font-urdu mb-1">
            کیا آپ نمونہ ڈیٹا لوڈ کرنا چاہتے ہیں؟
          </p>
          <p className="text-xs text-amber-600 mt-3">
            Sample data will be cleared on license activation
          </p>
          <p className="text-xs text-amber-600 font-urdu">
            لائسنس ایکٹیویشن پر نمونہ ڈیٹا صاف ہو جائے گا
          </p>

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleLoadDemo}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${
                loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading && <FaSpinner className="animate-spin" />}
              {loading ? 'Loading...' : 'Yes / ہاں'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
            >
              No / نہیں
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
