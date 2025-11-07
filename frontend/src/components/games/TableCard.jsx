import { FaEdit, FaTrash, FaPlay, FaStop, FaClock, FaPencilAlt } from 'react-icons/fa';

export default function TableCard({ table, onEdit, onDelete, onCheckin, onCheckout, onEditBooking, formatDuration }) {
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
          <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
            <div className="flex justify-between items-start mb-1">
              <div className="font-medium text-gray-900">
                {activeBooking.player1Name}{activeBooking.player2Name && ` vs ${activeBooking.player2Name}`}
              </div>
              <button onClick={() => onEditBooking(activeBooking)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit booking">
                <FaPencilAlt className="text-xs" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FaClock className="text-xs" />
              <span>{formatDuration(activeBooking.checkInTime)}</span>
            </div>
            <div className="text-xs text-gray-600 mb-1">Rs. {activeBooking.charges} / {activeBooking.chargeType.replace('_', ' ')}</div>
            {activeBooking.expectedDuration && <div className="text-xs text-blue-600 mb-1">Expected: {activeBooking.expectedDuration}</div>}
            <div className="text-xs text-gray-500">Check-in: {new Date(activeBooking.checkInTime).toLocaleTimeString()}</div>
          </div>
        )}
        <button
          onClick={() => table.isAvailable ? onCheckin(table) : onCheckout(table, activeBooking)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            table.isAvailable ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {table.isAvailable ? <><FaPlay /> Check In</> : <><FaStop /> Check Out</>}
        </button>
      </div>
    </div>
  );
}
