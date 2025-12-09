import { useState, useEffect } from 'react';
import { FaDownload, FaTimes } from 'react-icons/fa';
import axios from '../../utils/axios';
import { useQuery } from '@tanstack/react-query';

export default function GameRevenueModal({ isOpen, onClose }) {
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: shopSettings } = useQuery(['shop-settings'], async () => {
    const { data } = await axios.get('/api/shop-settings');
    return data;
  }, {
    enabled: isOpen
  });

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/games/bookings', {
        params: { 
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 1000
        }
      });
      
      const filteredBookings = data.items.filter(booking => {
        const checkoutDate = new Date(booking.checkOutTime);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate + 'T23:59:59');
        return booking.checkOutTime && checkoutDate >= start && checkoutDate <= end;
      });

      const summary = {
        totalBookings: filteredBookings.length,
        totalGameRevenue: 0,
        totalRefreshmentRevenue: 0,
        totalRevenue: 0,
        bookings: filteredBookings
      };

      filteredBookings.forEach(booking => {
        const gameRevenue = (booking.playerBills || []).reduce((sum, bill) => sum + parseFloat(bill.totalAmount || 0), 0) || parseFloat(booking.totalAmount || 0);
        const refreshmentRevenue = (booking.refreshments || []).reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
        
        summary.totalGameRevenue += gameRevenue;
        summary.totalRefreshmentRevenue += refreshmentRevenue;
      });

      summary.totalRevenue = summary.totalGameRevenue + summary.totalRefreshmentRevenue;
      setRevenueData(summary);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!revenueData) return;

    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Game Revenue Report</title>
          <style>
            @page { margin: 10mm; size: A4 landscape; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 5px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 15px; }
            .logo { text-align: center; margin-bottom: 8px; }
            .logo img { max-width: 100px; height: auto; }
            .summary { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 3px; display: flex; justify-content: space-around; }
            .summary-item { text-align: center; }
            .summary-item .value { font-size: 16px; font-weight: bold; color: #2563eb; }
            .summary-item .label { font-size: 11px; color: #6b7280; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #d1d5db; padding: 4px 6px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; font-size: 10px; }
            .total-row { font-weight: bold; background-color: #dcfce7; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          ${shopSettings?.logo ? `<div class="logo"><img src="${shopSettings.logo}" alt="Logo" onload="setTimeout(() => window.print(), 100)" /></div>` : ''}
          <div class="header">
            <h1>${shopSettings?.shopName || 'Game Revenue Report'}</h1>
            <p>Period: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="value">${revenueData.totalBookings}</div>
              <div class="label">Total Bookings</div>
            </div>
            <div class="summary-item">
              <div class="value">Rs. ${revenueData.totalGameRevenue.toFixed(2)}</div>
              <div class="label">Game Revenue</div>
            </div>
            <div class="summary-item">
              <div class="value">Rs. ${revenueData.totalRefreshmentRevenue.toFixed(2)}</div>
              <div class="label">Refreshment Revenue</div>
            </div>
            <div class="summary-item">
              <div class="value" style="color: #dc2626;">Rs. ${revenueData.totalRevenue.toFixed(2)}</div>
              <div class="label">Total Revenue</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Table</th>
                <th>Players</th>
                <th>Game Revenue</th>
                <th>Refreshments</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${revenueData.bookings.map(booking => {
                const gameRevenue = (booking.playerBills || []).reduce((sum, bill) => sum + parseFloat(bill.totalAmount || 0), 0) || parseFloat(booking.totalAmount || 0);
                const refreshmentRevenue = (booking.refreshments || []).reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
                const total = gameRevenue + refreshmentRevenue;
                return `
                  <tr>
                    <td>${new Date(booking.checkOutTime).toLocaleDateString()}</td>
                    <td>${booking.table.name}</td>
                    <td>${booking.payer || booking.player1Name}</td>
                    <td class="text-right">Rs. ${gameRevenue.toFixed(2)}</td>
                    <td class="text-right">Rs. ${refreshmentRevenue.toFixed(2)}</td>
                    <td class="text-right"><strong>Rs. ${total.toFixed(2)}</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    if (!shopSettings?.logo) {
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Game Revenue Report</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchRevenueData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {revenueData && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{revenueData.totalBookings}</div>
                    <div className="text-sm text-gray-600">Total Bookings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">Rs. {revenueData.totalGameRevenue.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Game Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">Rs. {revenueData.totalRefreshmentRevenue.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Refreshments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">Rs. {revenueData.totalRevenue.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Players</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Game Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refreshments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {revenueData.bookings.map((booking) => {
                      const gameRevenue = (booking.playerBills || []).reduce((sum, bill) => sum + parseFloat(bill.totalAmount || 0), 0) || parseFloat(booking.totalAmount || 0);
                      const refreshmentRevenue = (booking.refreshments || []).reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
                      const total = gameRevenue + refreshmentRevenue;
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(booking.checkOutTime).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.table.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {booking.payer || booking.player1Name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rs. {gameRevenue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rs. {refreshmentRevenue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            Rs. {total.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Close
          </button>
          {revenueData && (
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FaDownload /> Download PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}