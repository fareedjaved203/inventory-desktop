import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import UrduDayBookHTML from './UrduDayBookHTML';
import { formatPakistaniCurrency } from '../utils/formatCurrency';
import API from '../utils/api';

const URDU_COLUMNS = {
  date: { label: 'تاریخ', visible: true },
  loadingDate: { label: 'لوڈنگ تاریخ', visible: true },
  arrivalDate: { label: 'آمد تاریخ', visible: true },
  carNumber: { label: 'گاڑی نمبر', visible: false },
  barcode: { label: 'بار کوڈ', visible: false },
  productName: { label: 'پروڈکٹ کا نام', visible: true },
  category: { label: 'قسم', visible: true },
  productDescription: { label: 'تفصیل', visible: false },
  purchaseQuantity: { label: 'خریداری مقدار', visible: true },
  purchasePrice: { label: 'خریداری قیمت', visible: true },
  transportCost: { label: 'ٹرانسپورٹ لاگت', visible: false },
  supplierName: { label: 'سپلائر', visible: true },
  totalPurchaseCost: { label: 'کل لاگت', visible: true },
  paidAmount: { label: 'ادا شدہ رقم', visible: true },
  paymentDifference: { label: 'ادائیگی فرق', visible: true },
  remainingAmount: { label: 'باقی رقم', visible: true },
  customerName: { label: 'کسٹمر', visible: true },
  saleQuantity: { label: 'فروخت مقدار', visible: true },
  saleUnitPrice: { label: 'یونٹ قیمت', visible: true },
  totalSalePrice: { label: 'کل قیمت', visible: true },
  profitLoss: { label: 'منافع/نقصان', visible: true }
};

function UrduDayBookReportModal({ isOpen, onClose }) {
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [columns, setColumns] = useState(URDU_COLUMNS);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const printRef = useRef();

  const toggleColumn = (columnKey) => {
    setColumns(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        visible: !prev[columnKey].visible
      }
    }));
  };

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

  // Fetch products for dropdown
  const { data: products } = useQuery(
    ['products-for-urdu-daybook'],
    async () => {
      const result = await API.getProducts({ limit: 1000 });
      return result.items || [];
    },
    { enabled: isOpen }
  );

  const { data: dayBookData, isLoading, refetch } = useQuery(
    ['urdu-day-book-report', startDate, endDate, selectedProductId],
    async () => {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedProductId && { productId: selectedProductId })
      });
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/dashboard/day-book?${params}`,
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                <label className="block text-sm font-medium text-gray-700 mb-2 font-urdu">پروڈکٹ فلٹر</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-urdu"
                  dir="rtl"
                >
                  <option value="">تمام پروڈکٹس</option>
                  {products?.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-urdu"
                >
                  تیار کریں
                </button>
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-urdu"
                >
                  کالمز
                </button>
              </div>
            </div>

            {/* Column Settings */}
            {showColumnSettings && (
              <div className="mt-4 p-4 bg-white rounded border">
                <h4 className="font-medium mb-3 font-urdu text-center">کالمز دکھائیں/چھپائیں</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(columns).map(([key, col]) => (
                    <label key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded font-urdu" dir="rtl">
                      <span className="text-sm mr-2">{col.label}</span>
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumn(key)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : dayBookData?.data ? (
            <div className="flex-1 overflow-auto">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 shadow-sm rounded-lg overflow-hidden" dir="rtl">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      {visibleColumns.map(([key, col]) => (
                        <th key={key} className="px-4 py-3 text-right text-sm font-bold text-gray-700 border-b border-gray-300 font-urdu">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dayBookData.data.map((item, index) => (
                      <tr key={index} className={`hover:bg-gray-50 transition-colors ${item.type === 'purchase' || item.type === 'purchase-edit' ? 'bg-blue-50 border-r-4 border-blue-400' : 'bg-green-50 border-r-4 border-green-400'}`}>
                        {visibleColumns.map(([key]) => (
                          <td key={key} className="px-4 py-3 text-sm text-gray-800 border-b border-gray-200 text-right font-urdu">
                            {key === 'date' && (() => {
                              const date = new Date(item.date);
                              return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit', hour12: true})}`;
                            })()}
                            {key === 'loadingDate' && (item.loadingDate ? new Date(item.loadingDate).toLocaleDateString() : '-')}
                            {key === 'arrivalDate' && (item.arrivalDate ? new Date(item.arrivalDate).toLocaleDateString() : '-')}
                            {key === 'carNumber' && (item.carNumber || '-')}
                            {key === 'barcode' && (item.barcode || '-')}
                            {key === 'productName' && item.productName}
                            {key === 'category' && (item.category || '-')}
                            {key === 'productDescription' && (
                              <div>
                                <div>{item.productDescription || '-'}</div>
                                {item.auditChange?.description && !item.isEdit && (
                                  <div className="text-xs text-blue-600 mt-1 italic">
                                    {item.auditChange.description}
                                  </div>
                                )}
                                {item.isEdit && item.auditChange?.description && (
                                  <div className="text-xs text-blue-600 mt-1 italic font-medium">
                                    ادائیگی اپڈیٹ: {item.auditChange.description}
                                  </div>
                                )}
                              </div>
                            )}
                            {key === 'purchaseQuantity' && (item.purchaseQuantity || '-')}
                            {key === 'purchasePrice' && (item.purchasePrice ? formatPakistaniCurrency(item.purchasePrice) : '-')}
                            {key === 'transportCost' && (item.transportCost ? formatPakistaniCurrency(item.transportCost) : '-')}
                            {key === 'supplierName' && (item.supplierName || '-')}
                            {key === 'totalPurchaseCost' && (item.totalPurchaseCost ? formatPakistaniCurrency(item.totalPurchaseCost) : '-')}
                            {key === 'paidAmount' && (item.paidAmount ? formatPakistaniCurrency(item.paidAmount) : '-')}
                            {key === 'paymentDifference' && (
                              <span className={item.paymentDifference > 0 ? 'text-green-600 font-medium' : item.paymentDifference < 0 ? 'text-red-600 font-medium' : ''}>
                                {item.paymentDifference ? formatPakistaniCurrency(item.paymentDifference) : '-'}
                              </span>
                            )}
                            {key === 'remainingAmount' && (
                              <span className={item.remainingAmount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                {formatPakistaniCurrency(item.remainingAmount || 0)}
                              </span>
                            )}
                            {key === 'customerName' && (item.customerName || '-')}
                            {key === 'saleQuantity' && (item.saleQuantity || '-')}
                            {key === 'saleUnitPrice' && (item.saleUnitPrice ? formatPakistaniCurrency(item.saleUnitPrice) : '-')}
                            {key === 'totalSalePrice' && (item.totalSalePrice ? formatPakistaniCurrency(item.totalSalePrice) : '-')}
                            {key === 'profitLoss' && (
                              <span className={item.profitLoss > 0 ? 'text-green-600' : item.profitLoss < 0 ? 'text-red-600' : ''}>
                                {formatPakistaniCurrency(item.profitLoss || 0)}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              {dayBookData.summary && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-gray-200" dir="rtl">
                  <h4 className="font-bold mb-4 font-urdu text-lg text-center text-gray-800">خلاصہ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                      <span className="text-gray-600 font-urdu text-sm block mb-1">کل خریداری:</span>
                      <div className="font-bold text-blue-600 text-lg">{formatPakistaniCurrency(dayBookData.summary.totalPurchaseAmount || 0)}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                      <span className="text-gray-600 font-urdu text-sm block mb-1">کل فروخت:</span>
                      <div className="font-bold text-green-600 text-lg">{formatPakistaniCurrency(dayBookData.summary.totalSaleAmount || 0)}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                      <span className="text-gray-600 font-urdu text-sm block mb-1">کل منافع:</span>
                      <div className="font-bold text-emerald-600 text-lg">{formatPakistaniCurrency(dayBookData.summary.totalProfit || 0)}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                      <span className="text-gray-600 font-urdu text-sm block mb-1">کل اندراجات:</span>
                      <div className="font-bold text-gray-800 text-lg">{dayBookData.summary.totalEntries || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <div className="text-sm text-gray-600 font-urdu">
            <span className="inline-block w-4 h-4 bg-blue-100 border-l-4 border-blue-500 mr-2"></span>خریداری اندراجات
            <span className="inline-block w-4 h-4 bg-green-100 border-l-4 border-green-500 mr-2 ml-4"></span>فروخت اندراجات
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