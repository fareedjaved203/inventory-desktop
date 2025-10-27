import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PDFDownloadLink } from '@react-pdf/renderer';
import DayBookReportPDF from './DayBookReportPDF';
import { formatPakistaniCurrency } from '../utils/formatCurrency';
import API from '../utils/api';

const DEFAULT_COLUMNS = {
  date: { label: 'Date', visible: true },
  loadingDate: { label: 'Loading Date', visible: true },
  arrivalDate: { label: 'Arrival Date', visible: true },
  carNumber: { label: 'Car Number', visible: false },
  barcode: { label: 'Barcode', visible: false },
  productName: { label: 'Product Name', visible: true },
  category: { label: 'Category', visible: true },
  productDescription: { label: 'Description', visible: true },
  purchaseQuantity: { label: 'Purchase Qty', visible: true },
  purchasePrice: { label: 'Purchase Price', visible: true },
  transportCost: { label: 'Transport Cost', visible: false },
  supplierName: { label: 'Supplier', visible: true },
  totalPurchaseCost: { label: 'Total Cost', visible: true },
  paidAmount: { label: 'Paid Amount', visible: true },
  paymentDifference: { label: 'Payment Difference', visible: true },
  remainingAmount: { label: 'Remaining Amount', visible: true },
  customerName: { label: 'Customer', visible: true },
  saleQuantity: { label: 'Sale Qty', visible: true },
  saleUnitPrice: { label: 'Unit Price', visible: true },
  totalSalePrice: { label: 'Total Price', visible: true },
  profitLoss: { label: 'Profit/Loss', visible: true }
};

function DayBookReportModal({ isOpen, onClose }) {
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

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
    ['products-for-daybook'],
    async () => {
      const result = await API.getProducts({ limit: 1000 });
      return result.items || [];
    },
    { enabled: isOpen }
  );

  const { data: dayBookData, isLoading, refetch } = useQuery(
    ['day-book-report', startDate, endDate, selectedProductId],
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

  const toggleColumn = (columnKey) => {
    setColumns(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        visible: !prev[columnKey].visible
      }
    }));
  };

  const visibleColumns = Object.entries(columns).filter(([_, col]) => col.visible);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Day Book Report</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {/* Controls */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Filter</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Products</option>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Generate
                </button>
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Columns
                </button>
              </div>
            </div>

            {/* Column Settings */}
            {showColumnSettings && (
              <div className="mt-4 p-4 bg-white rounded border">
                <h4 className="font-medium mb-3">Show/Hide Columns</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(columns).map(([key, col]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumn(key)}
                        className="rounded"
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Data Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : dayBookData?.data ? (
            <div className="flex-1 overflow-auto">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {visibleColumns.map(([key, col]) => (
                        <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dayBookData.data.map((item, index) => (
                      <tr key={index} className={item.type === 'purchase' || item.type === 'purchase-edit' ? 'bg-blue-100 border-l-4 border-blue-500' : 'bg-green-100 border-l-4 border-green-500'}>
                        {visibleColumns.map(([key]) => (
                          <td key={key} className="px-3 py-2 text-sm text-gray-900 border-b">
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
                <div className="mt-4 p-4 bg-gray-50 rounded border">
                  <h4 className="font-medium mb-3">Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Purchase:</span>
                      <div className="font-medium">{formatPakistaniCurrency(dayBookData.summary.totalPurchaseAmount || 0)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Sale:</span>
                      <div className="font-medium">{formatPakistaniCurrency(dayBookData.summary.totalSaleAmount || 0)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Profit:</span>
                      <div className="font-medium text-green-600">{formatPakistaniCurrency(dayBookData.summary.totalProfit || 0)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Entries:</span>
                      <div className="font-medium">{dayBookData.summary.totalEntries || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <div className="text-sm text-gray-600">
            <span className="inline-block w-4 h-4 bg-blue-100 border-l-4 border-blue-500 mr-2"></span>Purchase Entries
            <span className="inline-block w-4 h-4 bg-green-100 border-l-4 border-green-500 mr-2 ml-4"></span>Sale Entries
          </div>
          <div className="flex gap-3">
            {dayBookData && (
              <PDFDownloadLink
                document={<DayBookReportPDF dayBookData={dayBookData} dateRange={{ startDate, endDate }} shopSettings={shopSettings} visibleColumns={visibleColumns} />}
                fileName={`day-book-report-${startDate}-to-${endDate}.pdf`}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Download PDF
              </PDFDownloadLink>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayBookReportModal;