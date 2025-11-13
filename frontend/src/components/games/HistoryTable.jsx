import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function HistoryTable({ history, page, totalPages, setPage, formatDuration, loading }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 mt-2">Loading history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return <div className="text-center py-12 text-gray-500">No booking history</div>;
  }

  return (
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((booking) => {
              const refreshmentsTotal = (booking.refreshments || []).reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
              const tableAmount = parseFloat(booking.totalAmount || 0);
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 capitalize">
                      {booking.paymentMethod || 'cash'}
                    </span>
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
  );
}
