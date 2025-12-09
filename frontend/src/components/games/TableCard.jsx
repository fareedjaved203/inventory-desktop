import { useState } from 'react';
import { FaEdit, FaTrash, FaPlay, FaClock, FaPencilAlt, FaCoffee, FaMoneyBillWave } from 'react-icons/fa';

export default function TableCard({ table, onEdit, onDelete, onCheckin, onPlayerCheckout, onEditBooking, onRefreshments, formatDuration }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const activeBooking = table.bookings?.[0];
  const activePlayers = activeBooking?.playerBills?.filter(b => !b.isPaid).map(b => b.playerName).join(' vs ') || 
                        (activeBooking?.player1Name + (activeBooking?.player2Name ? ` vs ${activeBooking.player2Name}` : ''));

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
          <div 
            className="relative h-32 cursor-pointer perspective-1000"
            onClick={() => activeBooking && setIsFlipped(!isFlipped)}
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-green-800 rounded-lg border-4 border-amber-900 shadow-inner">
                <div className="absolute inset-2 border-2 border-white/20 rounded"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
                <div className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-pink-400 rounded-full"></div>
              </div>
              {/* Back */}
              {activeBooking && (
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-4 border-blue-900 shadow-inner p-2 flex flex-col justify-center">
                  <div className="text-center mb-1 relative group">
                    <div className="text-xs font-semibold truncate">{activePlayers}</div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                      {activePlayers}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <FaClock className="text-xs" />
                    <span className="text-lg font-bold">{formatDuration(activeBooking.checkInTime)}</span>
                  </div>
                  {activeBooking.refreshments?.length > 0 && (
                    <div className="text-center">
                      <div className="text-xs opacity-80">Refreshments</div>
                      <div className="text-sm font-bold">Rs. {activeBooking.refreshments.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0).toFixed(2)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
          <div className="mb-3">
            <button onClick={() => onEditBooking(activeBooking)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded" title="Edit booking">
              <FaPencilAlt className="text-sm" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          {table.isAvailable ? (
            <button onClick={() => onCheckin(table)} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">
              <FaPlay /> Check In
            </button>
          ) : (
            <>
              <button onClick={() => onRefreshments(activeBooking)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors">
                <FaCoffee />
              </button>
              <button onClick={() => onPlayerCheckout(table, activeBooking)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">
                <FaMoneyBillWave />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
