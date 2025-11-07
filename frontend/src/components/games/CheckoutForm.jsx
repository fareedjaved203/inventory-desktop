export default function CheckoutForm({ table, booking, formData, setFormData, onSubmit, onCancel, formatDuration }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Check Out - {table?.name}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Players:</div>
            <div className="font-medium text-gray-900">
              {booking.player1Name}{booking.player2Name && ` vs ${booking.player2Name}`}
            </div>
            <div className="text-sm text-gray-600 mt-2">Duration: {formatDuration(booking.checkInTime)}</div>
          </div>
          {booking?.chargeType === 'per_game' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Games Played *</label>
              <input type="number" min="0" value={formData.gamesPlayed} onChange={(e) => {
                const games = parseInt(e.target.value);
                setFormData({ gamesPlayed: games, totalAmount: (games * parseFloat(booking.charges)).toFixed(2) });
              }} onWheel={(e) => e.target.blur()} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (Rs.) *</label>
            <input type="number" min="0" step="0.01" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} onWheel={(e) => e.target.blur()} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={onSubmit} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Check Out & Pay</button>
          </div>
        </div>
      </div>
    </div>
  );
}
