export default function CheckoutForm({ table, booking, formData, setFormData, onSubmit, onCancel, formatDuration }) {
  const players = booking.playerBills?.length > 0 
    ? booking.playerBills.map(b => b.playerName)
    : [booking.player1Name, booking.player2Name].filter(Boolean);
  const groupedRefreshments = (booking.refreshments || []).reduce((acc, r) => {
    if (!acc[r.playerName]) acc[r.playerName] = [];
    acc[r.playerName].push(r);
    return acc;
  }, {});
  
  const refreshmentsTotal = (booking.refreshments || []).reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
  const grandTotal = (parseFloat(formData.totalAmount) + refreshmentsTotal).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Check Out - {table?.name}</h2>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Players:</div>
            <div className="font-medium text-gray-900">
              {booking.player1Name}{booking.player2Name && ` vs ${booking.player2Name}`}
            </div>
            <div className="text-sm text-gray-600 mt-2">Duration: {formatDuration(booking.checkInTime)}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Games Played</label>
            <input type="number" min="0" value={formData.gamesPlayed} onChange={(e) => {
              const games = parseInt(e.target.value) || 0;
              if (booking?.chargeType === 'per_game') {
                setFormData({ ...formData, gamesPlayed: games, totalAmount: (games * parseFloat(booking.charges)).toFixed(2) });
              } else {
                setFormData({ ...formData, gamesPlayed: games });
              }
            }} onWheel={(e) => e.target.blur()} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            {booking?.member?.totalGames > 0 && formData.gamesPlayed > booking.member.remainingGames && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  ⚠️ Exceeded by {formData.gamesPlayed - booking.member.remainingGames} games. Member has only {booking.member.remainingGames} games left.
                </p>
              </div>
            )}
            {booking?.member2?.totalGames > 0 && formData.gamesPlayed > booking.member2.remainingGames && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  ⚠️ Player 2 exceeded by {formData.gamesPlayed - booking.member2.remainingGames} games. Has only {booking.member2.remainingGames} games left.
                </p>
              </div>
            )}
            {(booking?.member || booking?.member2) && <p className="text-xs text-gray-500 mt-1">Will be deducted from member's remaining games</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table Charges (Rs.) *</label>
            <input type="number" min="0" step="0.01" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} onWheel={(e) => e.target.blur()} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payer *</label>
            <select value={formData.payer || booking.player1Name} onChange={(e) => setFormData({ ...formData, payer: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {players.map(player => (
                <option key={player} value={player}>{player}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
            <select value={formData.paymentMethod || 'cash'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="cash">Cash</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
              <option value="bank">Bank Account</option>
            </select>
          </div>

          {(booking.refreshments || []).length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Refreshments</h3>
              {players.map(player => groupedRefreshments[player] && (
                <div key={player} className="mb-4 bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-700 mb-2">{player}</div>
                  <div className="space-y-1">
                    {groupedRefreshments[player].map(r => (
                      <div key={r.id} className="flex justify-between text-sm">
                        <span>{r.productName} x{r.quantity}</span>
                        <span className="font-medium">Rs. {r.totalAmount}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                      <span>Subtotal</span>
                      <span>Rs. {groupedRefreshments[player].reduce((sum, r) => sum + parseFloat(r.totalAmount), 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">Grand Total</span>
              <span className="text-2xl font-bold text-blue-600">Rs. {grandTotal}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-6 border-t">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onSubmit} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Check Out & Pay</button>
        </div>
        <div className="px-6 py-3 bg-gray-50 text-center">
          <p className="text-xs text-gray-600">
            This feature is for recording payments only. The system does not facilitate or endorse betting or gambling activities.
          </p>
        </div>
      </div>
    </div>
  );
}
