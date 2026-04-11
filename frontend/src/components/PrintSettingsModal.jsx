import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const THERMAL_FIELDS = [
  { key: 'logo', label: 'Shop Logo', default: true },
  { key: 'shopName', label: 'Shop Name', default: true },
  { key: 'shopDescription', label: 'Shop Description', default: true },
  { key: 'contactNumber', label: 'Contact Number', default: true },
  { key: 'cashierName', label: 'Cashier Name', default: true },
  { key: 'date', label: 'Date', default: true },
  { key: 'billNumber', label: 'Bill Number', default: true },
  { key: 'time', label: 'Time', default: true },
  { key: 'customerName', label: 'Customer Name', default: true },
  { key: 'itemNumber', label: 'Item # Column', default: true },
  { key: 'itemDescription', label: 'Item Description', default: true },
  { key: 'quantity', label: 'Quantity', default: true },
  { key: 'rate', label: 'Rate', default: true },
  { key: 'amount', label: 'Amount', default: true },
  { key: 'total', label: 'Total', default: true },
  { key: 'discount', label: 'Discount', default: true },
  { key: 'subTotal', label: 'Sub Total', default: true },
  { key: 'paidAmount', label: 'Paid Amount', default: true },
  { key: 'change', label: 'Change', default: true },
  { key: 'thankYou', label: 'Thank You Message', default: true },
];

const A4_FIELDS = [
  { key: 'logo', label: 'Shop Logo', default: true },
  { key: 'shopName', label: 'Shop Name', default: true },
  { key: 'shopDescription', label: 'Shop Description', default: true },
  { key: 'contactNumber', label: 'Contact Number', default: true },
  { key: 'billNumber', label: 'Bill Number', default: true },
  { key: 'date', label: 'Date', default: true },
  { key: 'customerName', label: 'Customer Name', default: true },
  { key: 'customerPhone', label: 'Customer Phone', default: true },
  { key: 'itemNumber', label: 'Item # Column', default: true },
  { key: 'itemDescription', label: 'Item Description', default: true },
  { key: 'quantity', label: 'Quantity', default: true },
  { key: 'rate', label: 'Rate/Price', default: true },
  { key: 'amount', label: 'Amount', default: true },
  { key: 'total', label: 'Total', default: true },
  { key: 'discount', label: 'Discount', default: true },
  { key: 'paidAmount', label: 'Paid Amount', default: true },
  { key: 'dueAmount', label: 'Due Amount', default: true },
  { key: 'thankYou', label: 'Thank You Message', default: true },
];

export function getVisibleFields(storageKey, fieldList) {
  const saved = localStorage.getItem(storageKey);
  if (saved) return JSON.parse(saved);
  return fieldList.filter(f => f.default).map(f => f.key);
}

export function isFieldVisible(storageKey, fieldKey, fieldList) {
  const visible = getVisibleFields(storageKey, fieldList);
  return visible.includes(fieldKey);
}

export { THERMAL_FIELDS, A4_FIELDS };

export default function PrintSettingsModal({ isOpen, onClose, storageKey, fieldList, title }) {
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setVisible(getVisibleFields(storageKey, fieldList));
    }
  }, [isOpen, storageKey, fieldList]);

  const toggle = (key) => {
    const updated = visible.includes(key)
      ? visible.filter(k => k !== key)
      : [...visible, key];
    setVisible(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const selectAll = () => {
    const all = fieldList.map(f => f.key);
    setVisible(all);
    localStorage.setItem(storageKey, JSON.stringify(all));
  };

  const deselectAll = () => {
    setVisible([]);
    localStorage.setItem(storageKey, JSON.stringify([]));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-bold text-gray-800">{title || 'Print Settings'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>
        <div className="p-4">
          <div className="flex justify-between mb-3">
            <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800">Select All</button>
            <button onClick={deselectAll} className="text-xs text-gray-500 hover:text-gray-700">Deselect All</button>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {fieldList.map(field => (
              <label key={field.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visible.includes(field.key)}
                  onChange={() => toggle(field.key)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">{field.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
