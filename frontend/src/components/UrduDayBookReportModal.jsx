import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import UrduDayBookHTML from './UrduDayBookHTML';
import { formatPakistaniCurrency } from '../utils/formatCurrency';

const URDU_COLUMNS = {
  date: { label: 'تاریخ', visible: true },
  productName: { label: 'پروڈکٹ کا نام', visible: true },
  category: { label: 'قسم', visible: true },
  purchaseQuantity: { label: 'خریداری مقدار', visible: true },
  purchasePrice: { label: 'خریداری قیمت', visible: true },
  supplierName: { label: 'سپلائر', visible: true },
  customerName: { label: 'کسٹمر', visible: true },
  saleQuantity: { label: 'فروخت مقدار', visible: true },
  saleUnitPrice: { label: 'یونٹ قیمت', visible: true },
  totalSalePrice: { label: 'کل قیمت', visible: true },
  profitLoss: { label: 'منافع/نقصان', visible: true }
};

function UrduDayBookReportModal({ isOpen, onClose }) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [columns, setColumns] = useState(URDU_COLUMNS);
  const printRef = useRef();

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    const printContent = printRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>روزنامچہ رپورٹ</title>
          <meta charset="utf-8">
          <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; font-family: 'Noto Nastaliq Urdu', serif; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const { data: shopSettings } = useQuery(['shop-settings'], async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shop-settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json();
    return result.items?.[0] || {};
  });

  const { data: dayBookData, isLoading, refetch } = useQuery(
    ['urdu-day-book-report', startDate, endDate],
    async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/dashboard/day-book?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.json();
    },
    { enabled: Boolean(isOpen && startDate && endDate) }
  );

  const visibleColumns = Object.entries(columns).filter(([_, col]) => col.visible);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 font-urdu">روزنامچہ رپورٹ</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-urdu">شروع کی تاریخ</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-urdu">اختتام کی تاریخ</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-urdu"
                >
                  تیار کریں
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : dayBookData?.data ? (
            <div className="flex-1 overflow-auto">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200" dir="rtl">
                  <thead className="bg-gray-50">
                    <tr>
                      {visibleColumns.map(([key, col]) => (
                        <th key={key} className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase border-b font-urdu">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dayBookData.data.map((item, index) => (
                      <tr key={index} className={item.type === 'purchase' ? 'bg-blue-100' : 'bg-green-100'}>
                        {visibleColumns.map(([key]) => (
                          <td key={key} className="px-3 py-2 text-sm text-gray-900 border-b text-right">
                            {key === 'date' && new Date(item.date).toLocaleDateString()}
                            {key === 'productName' && item.productName}
                            {key === 'category' && (item.category || '-')}
                            {key === 'purchaseQuantity' && (item.purchaseQuantity || '-')}
                            {key === 'purchasePrice' && (item.purchasePrice ? formatPakistaniCurrency(item.purchasePrice) : '-')}
                            {key === 'supplierName' && (item.supplierName || '-')}
                            {key === 'customerName' && (item.customerName || '-')}
                            {key === 'saleQuantity' && (item.saleQuantity || '-')}
                            {key === 'saleUnitPrice' && (item.saleUnitPrice ? formatPakistaniCurrency(item.saleUnitPrice) : '-')}
                            {key === 'totalSalePrice' && (item.totalSalePrice ? formatPakistaniCurrency(item.totalSalePrice) : '-')}
                            {key === 'profitLoss' && (
                              <span className={item.profitLoss > 0 ? 'text-green-600' : item.profitLoss < 0 ? 'text-red-600' : ''}>
                                {item.profitLoss ? formatPakistaniCurrency(item.profitLoss) : '-'}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <div className="text-sm text-gray-600 font-urdu">
            <span className="inline-block w-4 h-4 bg-blue-100 mr-2"></span>خریداری
            <span className="inline-block w-4 h-4 bg-green-100 mr-2 ml-4"></span>فروخت
          </div>
          <div className="flex gap-3">
            {dayBookData && (
              <button
                onClick={handlePrintPDF}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-urdu"
              >
                PDF ڈاؤن لوڈ کریں
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 font-urdu"
            >
              بند کریں
            </button>
          </div>
        </div>
        
        {/* Hidden HTML content for printing */}
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            {dayBookData && (
              <UrduDayBookHTML 
                dayBookData={dayBookData} 
                dateRange={{ startDate, endDate }} 
                shopSettings={shopSettings} 
                visibleColumns={visibleColumns} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UrduDayBookReportModal;