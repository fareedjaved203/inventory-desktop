import { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaChartLine } from 'react-icons/fa';
import GameRevenueModal from './GameRevenueModal';

export default function HistoryTable({ history, page, totalPages, setPage, formatDuration, loading, onSearch }) {
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      onSearch(localSearch);
    }, 500);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [localSearch]);

  return (
    <>
      <div className="flex justify-between items-center mb-4 m-4 gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by player name..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowRevenueModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaChartLine /> Revenue Report
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No booking history</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Players</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refreshments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((booking) => {
                  const refreshmentsTotal = (booking.refreshments || []).reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
                  const playerBillsTotal = (booking.playerBills || []).reduce((sum, bill) => sum + parseFloat(bill.totalAmount || 0), 0);
                  const tableAmount = playerBillsTotal || parseFloat(booking.totalAmount || 0);
                  const grandTotal = tableAmount + refreshmentsTotal;
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.table.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {booking.payer || booking.player1Name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(booking.checkInTime).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{booking.checkOutTime ? new Date(booking.checkOutTime).toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{booking.checkOutTime ? formatDuration(booking.checkInTime, booking.checkOutTime) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs. {tableAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs. {refreshmentsTotal.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Rs. {grandTotal.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs. {(booking.playerBills || []).reduce((sum, bill) => sum + (bill.isPaid && bill.paymentReceivedAmount ? parseFloat(bill.paymentReceivedAmount) : 0), 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const playerPaymentMethods = (booking.playerBills || []).filter(bill => bill.isPaid && bill.paymentMethod).map(bill => bill.paymentMethod);
                          const method = playerPaymentMethods.length > 0 ? playerPaymentMethods[0] : (booking.paymentMethod === 'none' ? 'none' : (booking.paymentMethod || 'cash'));
                          const colorMap = {
                            'credit': { bg: '#fef3c7', text: '#b45309' },
                            'cash': { bg: '#dcfce7', text: '#166534' },
                            'easypaisa': { bg: '#f3e8ff', text: '#6b21a8' },
                            'jazzcash': { bg: '#fce7f3', text: '#be185d' },
                            'bank': { bg: '#dbeafe', text: '#1e40af' },
                            'none': { bg: '#f3f4f6', text: '#374151' }
                          };
                          const colors = colorMap[method] || colorMap['cash'];
                          return (
                            <span style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontWeight: '500',
                              borderRadius: '9999px',
                              backgroundColor: colors.bg,
                              color: colors.text,
                              textTransform: 'capitalize',
                              display: 'inline-block'
                            }}>
                              {method === 'none' ? 'None' : method}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><FaChevronLeft /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><FaChevronRight /></button>
              </div>
            </div>
          )}
        </>
      )}
      
      <GameRevenueModal 
        isOpen={showRevenueModal} 
        onClose={() => setShowRevenueModal(false)} 
      />
    </>
  );
}
