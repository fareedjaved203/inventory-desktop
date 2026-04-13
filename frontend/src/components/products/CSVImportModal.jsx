import { useState, useRef } from 'react';
import { FaTimes, FaFileDownload, FaFileUpload, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

export default function CSVImportModal({ isOpen, onClose }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const downloadTemplate = async () => {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/csv-template`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file) => {
    setImporting(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/csv-import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setResult(data);
      if (data.created > 0) {
        toast.success(`Imported ${data.created} products`);
        window.dispatchEvent(new Event('dataStorageInvalidate'));
      }
    } catch (err) {
      setResult({ error: 'Import failed' });
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">Import Products from CSV</h3>
          <button onClick={() => { onClose(); setResult(null); }} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Step 1: Download template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-blue-800 mb-2">Step 1: Download Template</h4>
            <p className="text-xs text-blue-700 mb-3">Download the CSV template, fill it in Excel or Google Sheets, then upload it below.</p>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <FaFileDownload /> Download Template
            </button>
          </div>

          {/* Field guide */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2">Column Guide</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-red-500 font-bold">*</span>
                <span className="font-medium">Name</span>
                <span className="text-gray-400">— required</span>
              </div>
              <div><span className="font-medium">SKU</span> <span className="text-gray-400">— barcode</span></div>
              <div><span className="font-medium">Description</span></div>
              <div><span className="font-medium">Unit</span> <span className="text-gray-400">— pcs, kg, packet...</span></div>
              <div><span className="font-medium">Quantity</span> <span className="text-gray-400">— stock</span></div>
              <div><span className="font-medium">Retail Price</span></div>
              <div><span className="font-medium">Wholesale Price</span></div>
              <div><span className="font-medium">Purchase Price</span></div>
              <div><span className="font-medium">Low Stock Threshold</span></div>
              <div><span className="font-medium">Category</span> <span className="text-gray-400">— must exist</span></div>
              <div><span className="font-medium">Is Raw Material</span> <span className="text-gray-400">— true/false</span></div>
              <div><span className="font-medium">Is Service</span> <span className="text-gray-400">— true/false</span></div>
              <div><span className="font-medium">Pieces Per Unit</span></div>
              <div><span className="font-medium">Retail Price Per Piece</span></div>
            </div>
          </div>

          {/* Step 2: Upload */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-green-800 mb-2">Step 2: Upload CSV</h4>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? <LoadingSpinner size="w-4 h-4" /> : <FaFileUpload />}
              {importing ? 'Importing...' : 'Choose CSV File'}
            </button>
          </div>

          {/* Results */}
          {result && !result.error && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <FaCheckCircle />
                <span className="text-sm font-medium">{result.created} products imported</span>
              </div>
              {result.skipped > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <FaExclamationTriangle />
                  <span className="text-sm">{result.skipped} rows skipped</span>
                </div>
              )}
              {result.errors?.length > 0 && (
                <div className="max-h-24 overflow-y-auto text-xs text-red-600 space-y-0.5">
                  {result.errors.map((err, i) => <div key={i}>{err}</div>)}
                </div>
              )}
            </div>
          )}
          {result?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{result.error}</div>
          )}
        </div>

        <div className="p-4 border-t">
          <button onClick={() => { onClose(); setResult(null); }} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
