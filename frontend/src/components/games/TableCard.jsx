import { FaEdit, FaTrash, FaPlay, FaStop, FaClock, FaPencilAlt, FaCoffee } from 'react-icons/fa';

export default function TableCard({ table, onEdit, onDelete, onCheckin, onCheckout, onEditBooking, onRefreshments, formatDuration }) {
  const activeBooking = table.bookings[0];

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 ${table.isAvailable ? 'border-green-500' : 'border-red-500'} overflow-hidden`}>
      <div className={`p-4 ${table.tableType === 'snooker' ? 'bg-gradient-to-br from-green-700 to-green-900' : 'bg-gray-700'} text-white`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{table.name}</h3>
            <p className="text-sm opacity-90 capitalize">{table.tableType}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(table)} className="p-1 hover:bg-white/20 rounded"><FaEdit /></button>
            <button onClick={() => onDelete(table)} className="p-1 hover:bg-white/20 rounded"><FaTrash /></button>
          </div>
        </div>
        {table.tableType === 'snooker' && (
          <div className="relative h-32 bg-green-800 rounded-lg border-4 border-amber-900 shadow-inner">
            <div className="absolute inset-2 border-2 border-white/20 rounded"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
            <div className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-pink-400 rounded-full"></div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${table.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {table.isAvailable ? 'Available' : 'Occupied'}
          </span>
        </div>
        {activeBooking && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-3 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div className="font-semibold text-gray-900 text-base">
                {activeBooking.player1Name}{activeBooking.player2Name && ` vs ${activeBooking.player2Name}`}
              </div>
              <button onClick={() => onEditBooking(activeBooking)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded" title="Edit booking">
                <FaPencilAlt className="text-sm" />
              </button>
            </div>
            <div className="bg-white rounded-lg p-3 mb-2 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaClock className="text-blue-600" />
                  <span className="text-sm font-medium">Elapsed</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{formatDuration(activeBooking.checkInTime)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2 border border-gray-200">
                <div className="text-gray-500 mb-1">Rate</div>
                <div className="font-semibold text-gray-800">Rs. {activeBooking.charges}/{activeBooking.chargeType.replace('per_', '')}</div>
              </div>
              {activeBooking.refreshments?.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                  <div className="text-orange-600 mb-1">Refreshments</div>
                  <div className="font-semibold text-orange-700">Rs. {activeBooking.refreshments.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0).toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          {!table.isAvailable && (
            <button onClick={() => onRefreshments(activeBooking)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors">
              <FaCoffee /> Refreshments
            </button>
          )}
          <button
            onClick={() => table.isAvailable ? onCheckin(table) : onCheckout(table, activeBooking)}
            className={`${!table.isAvailable ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              table.isAvailable ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {table.isAvailable ? <><FaPlay /> Check In</> : <><FaStop /> Check Out</>}
          </button>
        </div>
      </div>
    </div>
  );
}
