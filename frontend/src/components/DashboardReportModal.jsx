import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PDFDownloadLink } from '@react-pdf/renderer';
import api from '../utils/axios';
import ProfitLossStatementPDF from './ProfitLossStatementPDF';
import SalesStatementPDF from './SalesStatementPDF';
import PurchaseStatementPDF from './PurchaseStatementPDF';
import ExpenseStatementPDF from './ExpenseStatementPDF';
import { formatPakistaniCurrency } from '../utils/formatCurrency';

function DashboardReportModal({ isOpen, onClose }) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: shopSettings } = useQuery(['shop-settings'], async () => {
    const response = await api.get('/shop-settings');
    return response.data;
  });

  const { data: reportData, isLoading, error } = useQuery(
    ['dashboard-report', startDate, endDate, isOpen],
    async () => {
      console.log('Making API calls with dates:', { startDate, endDate });
      const [dashboardRes, statsRes, salesRes, purchasesRes, expensesRes] = await Promise.all([
        api.get('/api/dashboard'),
        api.get(`/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/api/sales?limit=1000`),
        api.get(`/api/bulk-purchases?limit=1000`),
        api.get(`/api/expenses?limit=1000`)
      ]);
      console.log('API responses:', { dashboard: dashboardRes.data, stats: statsRes.data });
      // Filter data by date range
      const filterByDateRange = (items, dateField) => {
        return items.filter(item => {
          const itemDate = new Date(item[dateField]);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return itemDate >= start && itemDate <= end;
        });
      };

      const filteredSales = filterByDateRange(salesRes.data.items || [], 'saleDate');
      const filteredPurchases = filterByDateRange(purchasesRes.data.items || [], 'purchaseDate');
      const filteredExpenses = filterByDateRange(expensesRes.data.items || [], 'date');
      
      // Only use manual expenses - raw materials are already in purchases
      const allExpenses = filteredExpenses;

      return {
        dashboardData: dashboardRes.data,
        salesStats: statsRes.data,
        salesData: filteredSales,
        purchaseData: filteredPurchases,
        expenseData: allExpenses
      };
    },
    {
      enabled: Boolean(isOpen && startDate && endDate),
      staleTime: 0,
      refetchOnWindowFocus: false
    }
  );

  // Debug logging
  console.log('Report Modal State:', { isOpen, startDate, endDate, isLoading, hasData: !!reportData, error });



  if (!isOpen) return null;

  const totalSales = reportData?.salesStats?.totalSales || 0;
  const totalPurchases = reportData?.salesStats?.totalPurchases || 0;
  const totalExpenses = reportData?.salesStats?.totalExpenses || 0;
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit - totalExpenses;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Report</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Date Range Selection */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Report Preview */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <h3 className="text-xl font-bold text-blue-800 mb-4">Executive Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-green-600">{formatPakistaniCurrency(totalSales)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Purchases</p>
                    <p className="text-2xl font-bold text-blue-600">{formatPakistaniCurrency(totalPurchases)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatPakistaniCurrency(totalExpenses)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Net Profit</p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netProfit >= 0 ? formatPakistaniCurrency(netProfit) : `(${formatPakistaniCurrency(Math.abs(netProfit))})`}
                    </p>
                    {netProfit < 0 && (
                      <p className="text-xs text-red-500 mt-1">Loss</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-blue-700 text-center">
                    <span className="font-semibold">Calculation:</span> Sales ({formatPakistaniCurrency(totalSales)}) - Purchases ({formatPakistaniCurrency(totalPurchases)}) - Expenses ({formatPakistaniCurrency(totalExpenses)}) = Net Profit ({netProfit >= 0 ? formatPakistaniCurrency(netProfit) : `(${formatPakistaniCurrency(Math.abs(netProfit))})`})
                  </p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-xl font-bold">{reportData.dashboardData?.totalProducts || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-xl font-bold">{formatPakistaniCurrency(reportData.salesStats?.totalSales || 0)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="text-xl font-bold text-amber-600">{reportData.dashboardData?.lowStock || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <p className="text-sm text-gray-600">Sales Due</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatPakistaniCurrency(reportData.salesStats?.totalSalesDueAmount || 0)}
                  </p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-lg font-semibold">{reportData.salesStats?.totalTransactions || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <p className="text-sm text-gray-600">Average Sale Value</p>
                  <p className="text-lg font-semibold">{formatPakistaniCurrency(reportData.salesStats?.averageSaleValue || 0)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-lg font-semibold">
                    {totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) + '%' : '0%'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Download Reports</h3>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Close
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {reportData && (
              <>
                <PDFDownloadLink
                  document={<ProfitLossStatementPDF reportData={reportData} dateRange={{ startDate, endDate }} shopSettings={shopSettings} />}
                  fileName={`profit-loss-statement-${startDate}-to-${endDate}.pdf`}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Profit & Loss Statement
                </PDFDownloadLink>
                
                <PDFDownloadLink
                  document={<SalesStatementPDF salesData={reportData.salesData} dateRange={{ startDate, endDate }} shopSettings={shopSettings} />}
                  fileName={`sales-statement-${startDate}-to-${endDate}.pdf`}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Sales Statement
                </PDFDownloadLink>
                
                <PDFDownloadLink
                  document={<PurchaseStatementPDF purchaseData={reportData.purchaseData} dateRange={{ startDate, endDate }} shopSettings={shopSettings} />}
                  fileName={`purchase-statement-${startDate}-to-${endDate}.pdf`}
                  className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Purchase Statement
                </PDFDownloadLink>
                
                <PDFDownloadLink
                  document={<ExpenseStatementPDF expenseData={reportData.expenseData} dateRange={{ startDate, endDate }} shopSettings={shopSettings} />}
                  fileName={`expense-statement-${startDate}-to-${endDate}.pdf`}
                  className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Expense Statement
                </PDFDownloadLink>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



export default DashboardReportModal;