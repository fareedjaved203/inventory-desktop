import { useState, useEffect } from 'react';
import axios from '../../utils/axios';

export default function PlayerCheckoutModal({ booking, onClose, onUpdate }) {
  const [playerBills, setPlayerBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringBill, setTransferringBill] = useState(null);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState({ memberId: null, playerName: '', playerPhone: '', chargePerGame: '120' });
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);

  useEffect(() => {
    fetchPlayerBills();
    fetchAvailableBookings();
  }, []);

  const fetchPlayerBills = async () => {
    try {
      const { data } = await axios.get(`/api/games/bookings/${booking.id}/player-bills`);
      setPlayerBills(data);
    } catch (error) {
      console.error('Error fetching player bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBookings = async () => {
    try {
      const { data } = await axios.get('/api/games/tables');
      const activeBookings = data
        .filter(t => !t.isAvailable && t.bookings[0]?.id !== booking.id)
        .map(t => ({
          ...t.bookings[0],
          tableName: t.name,
          activePlayers: t.bookings[0].playerBills?.filter(b => !b.isPaid).map(b => b.playerName).join(' vs ') || 
                        (t.bookings[0].player1Name + (t.bookings[0].player2Name ? ` vs ${t.bookings[0].player2Name}` : ''))
        }));
      setAvailableBookings(activeBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const checkoutPlayer = async (billId, paymentMethod) => {
    try {
      await axios.post(`/api/games/player-bills/${billId}/checkout`, { paymentMethod });
      onUpdate();
      await fetchPlayerBills();
      await fetchAvailableBookings();
    } catch (error) {
      console.error('Error checking out player:', error);
      alert(error.response?.data?.error || 'Error checking out player');
    }
  };

  const continuePlayer = async (billId) => {
    try {
      await axios.post(`/api/games/player-bills/${billId}/continue`);
      onUpdate();
      await fetchPlayerBills();
      await fetchAvailableBookings();
    } catch (error) {
      console.error('Error continuing player:', error);
      alert(error.response?.data?.error || 'Error continuing player');
    }
  };

  const transferPlayer = async (newBookingId) => {
    try {
      await axios.put(`/api/games/player-bills/${transferringBill}/transfer`, { newBookingId });
      setShowTransferModal(false);
      setTransferringBill(null);
      onUpdate();
      await fetchPlayerBills();
      await fetchAvailableBookings();
    } catch (error) {
      console.error('Error transferring player:', error);
      alert(error.response?.data?.error || 'Error transferring player');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Player Checkout</h2>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {playerBills.map((bill) => (
                <div key={bill.id} className={`border rounded-lg p-4 ${bill.isPaid ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg text-gray-900">{bill.playerName}</div>
                      <div className="text-sm text-gray-600">{bill.playerPhone}</div>
                      {bill.member && (
                        <div className="text-xs text-blue-600 mt-1">
                          {bill.member.totalGames > 0 ? `${bill.member.remainingGames} games left` : `Rs. ${bill.member.perFrameCharge}/frame`}
                        </div>
                      )}
                    </div>
                    {bill.isPaid && (
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">PAID</span>
                    )}
                  </div>
                  
                  {!bill.isPaid && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => continuePlayer(bill.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Continue Playing
                      </button>
                      <button
                        onClick={() => { setTransferringBill(bill.id); setShowTransferModal(true); }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() => setPlayerBills(prev => prev.map(b => b.id === bill.id ? {...b, showCheckout: true} : b))}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Checkout
                      </button>
                    </div>
                  )}
                  
                  {!bill.isPaid && bill.showCheckout && (
                    <div className="mt-3 border-t pt-3">
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Game:</span>
                          <span className="font-medium">1 × Rs. {bill.chargePerGame}</span>
                        </div>
                        {bill.refreshments?.length > 0 && (
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Refreshments:</span>
                            <span className="font-medium">Rs. {bill.refreshments.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                          <span>Total:</span>
                          <span className="text-blue-600">Rs. {(parseFloat(bill.chargePerGame) + (bill.refreshments?.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0) || 0)).toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                          value={bill.paymentMethod || ''}
                          onChange={(e) => setPlayerBills(prev => prev.map(b => b.id === bill.id ? {...b, paymentMethod: e.target.value} : b))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select payment method</option>
                          <option value="cash">Cash</option>
                          <option value="easypaisa">Easypaisa</option>
                          <option value="jazzcash">JazzCash</option>
                          <option value="bank">Bank Account</option>
                        </select>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPlayerBills(prev => prev.map(b => b.id === bill.id ? {...b, showCheckout: false} : b))}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => checkoutPlayer(bill.id, bill.paymentMethod || 'cash')}
                          disabled={!bill.paymentMethod}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          Confirm Payment
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {bill.isPaid && (
                    <div className="text-sm text-gray-600">
                      <div>Paid: Rs. {(parseFloat(bill.totalAmount) + (bill.refreshments?.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0) || 0)).toFixed(2)}</div>
                      <div>Method: {bill.paymentMethod}</div>
                      <div>Games: {bill.gamesPlayed}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddPlayer(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Player
            </button>
            {activePlayers.length === 2 && activePlayers.every(b => !b.isPaid) && (
              <button
                onClick={() => setShowWinnerSelection(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Who Won?
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">Close</button>
        </div>
      </div>

      {showWinnerSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Who Won?</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Select the winner (loser pays for this game):</p>
              <div className="space-y-2">
                {activePlayers.map((bill) => (
                  <button
                    key={bill.id}
                    onClick={() => setSelectedWinner(bill.id)}
                    className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-colors ${
                      selectedWinner === bill.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{bill.playerName}</div>
                    {bill.member && (
                      <div className="text-sm text-gray-500">
                        {bill.member.totalGames > 0 ? `${bill.member.remainingGames} games left` : `Rs. ${bill.member.perFrameCharge}/frame`}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowWinnerSelection(false); setSelectedWinner(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedWinner) return alert('Please select a winner');
                  const loserBill = activePlayers.find(b => b.id !== selectedWinner);
                  if (!loserBill) return;
                  
                  try {
                    // Add game charge to loser's bill
                    await axios.post(`/api/games/player-bills/${loserBill.id}/add-game`);
                    setShowWinnerSelection(false);
                    setSelectedWinner(null);
                    onUpdate();
                    await fetchPlayerBills();
                  } catch (error) {
                    alert(error.response?.data?.error || 'Error recording game result');
                  }
                }}
                disabled={!selectedWinner}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Winner
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Add New Player</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player Name *</label>
                <input
                  type="text"
                  required
                  value={newPlayerForm.playerName}
                  onChange={(e) => setNewPlayerForm({...newPlayerForm, playerName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player Phone</label>
                <input
                  type="tel"
                  value={newPlayerForm.playerPhone}
                  onChange={(e) => setNewPlayerForm({...newPlayerForm, playerPhone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Charge Per Game (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={newPlayerForm.chargePerGame}
                  onChange={(e) => setNewPlayerForm({...newPlayerForm, chargePerGame: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowAddPlayer(false); setNewPlayerForm({ memberId: null, playerName: '', playerPhone: '', chargePerGame: '120' }); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newPlayerForm.playerName) return alert('Player name is required');
                  try {
                    await axios.post('/api/games/player-bills', {
                      bookingId: booking.id,
                      playerName: newPlayerForm.playerName,
                      playerPhone: newPlayerForm.playerPhone,
                      chargePerGame: newPlayerForm.chargePerGame,
                      chargeType: 'per_game'
                    });
                    setShowAddPlayer(false);
                    setNewPlayerForm({ memberId: null, playerName: '', playerPhone: '', chargePerGame: '120' });
                    onUpdate();
                    await fetchPlayerBills();
                  } catch (error) {
                    alert(error.response?.data?.error || 'Error adding player');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Player
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Transfer Player</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Select a table to transfer this player to:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => transferPlayer(b.id)}
                    className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
                  >
                    <div className="font-semibold text-gray-800">{b.tableName}</div>
                    <div className="text-sm text-gray-500">{b.activePlayers}</div>
                  </button>
                ))}
              </div>
              {availableBookings.length === 0 && (
                <p className="text-center text-gray-500 py-4">No other active tables</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => { setShowTransferModal(false); setTransferringBill(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
