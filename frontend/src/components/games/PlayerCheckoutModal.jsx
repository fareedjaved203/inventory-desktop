import { useState, useEffect, useRef } from 'react';
import axios from '../../utils/axios';

export default function PlayerCheckoutModal({ booking, onClose, onUpdate }) {
  const [playerBills, setPlayerBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringBill, setTransferringBill] = useState(null);
  const [transferMode, setTransferMode] = useState('move');
  const [selectedPlayerToSwap, setSelectedPlayerToSwap] = useState(null);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState({ memberId: null, playerName: '', playerPhone: '', chargePerGame: '120' });
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef(null);
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [lastPayerId, setLastPayerId] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);

  useEffect(() => {
    fetchPlayerBills();
    fetchAvailableBookings();
    fetchGameHistory();
    fetchMembers();
    // Set lastPayerId from booking
    if (booking.lastPayerId) {
      setLastPayerId(booking.lastPayerId);
    }
  }, [booking.lastPayerId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = getFilteredMembers();
      if (memberSearch && filtered.length > 0) {
        setShowMemberDropdown(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch, members]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowMemberDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const fetchGameHistory = async () => {
    try {
      const { data } = await axios.get(`/api/games/bookings/${booking.id}/game-history`);
      setGameHistory(data);
    } catch (error) {
      console.error('Error fetching game history:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get('/api/members/active');
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const getFilteredMembers = () => {
    return memberSearch.trim()
      ? members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.phone.includes(memberSearch))
      : [];
  };

  const handleMemberSelect = (member) => {
    setShowMemberDropdown(false);
    setHighlightedIndex(-1);
    if (member) {
      setMemberSearch(member.name);
      setNewPlayerForm({
        memberId: member.id,
        playerName: member.name,
        playerPhone: member.phone,
        chargePerGame: member.totalGames > 0 ? '0' : member.perFrameCharge
      });
    } else {
      setMemberSearch('');
      setNewPlayerForm({ memberId: null, playerName: '', playerPhone: '', chargePerGame: '120' });
    }
  };

  const handleKeyDown = (e) => {
    const filteredMembers = getFilteredMembers();
    if (!showMemberDropdown || filteredMembers.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredMembers.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleMemberSelect(filteredMembers[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowMemberDropdown(false);
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

  const renewMatch = async () => {
    // Reset lastPayerId to start fresh match, keeping history intact
    try {
      await axios.put(`/api/games/bookings/${booking.id}`, { lastPayerId: null });
      setLastPayerId(null);
      onUpdate();
      await fetchPlayerBills();
      onClose();
    } catch (error) {
      console.error('Error renewing match:', error);
    }
  };

  const transferPlayer = async (newBookingId) => {
    try {
      if (transferMode === 'switch' && selectedPlayerToSwap) {
        await axios.put(`/api/games/player-bills/switch`, {
          bill1Id: transferringBill,
          bill2Id: selectedPlayerToSwap
        });
      } else {
        await axios.put(`/api/games/player-bills/${transferringBill}/transfer`, { newBookingId });
      }
      setShowTransferModal(false);
      setTransferringBill(null);
      setTransferMode('move');
      setSelectedPlayerToSwap(null);
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
              {gameHistory.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Frame History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-2">Frame</th>
                          <th className="text-left py-2 px-2">Paid By</th>
                          <th className="text-right py-2 px-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gameHistory.map((history) => {
                          const payerBill = playerBills.find(b => b.id === history.payerBillId);
                          return (
                            <tr key={history.id} className="border-b border-gray-200">
                              <td className="py-2 px-2">Frame {history.frameNumber}</td>
                              <td className="py-2 px-2 font-medium">{payerBill?.playerName || 'Unknown'}</td>
                              <td className="py-2 px-2 text-right">Rs. {parseFloat(history.amount).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {playerBills.map((bill) => (
                <div key={bill.id} className={`border rounded-lg p-4 ${bill.isPaid ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-lg text-gray-900">{bill.playerName}</div>
                        {lastPayerId === bill.id && !bill.isPaid && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded font-medium">Paying</span>
                        )}
                        <button
                          onClick={() => { setSelectedBill(bill); setShowBillModal(true); }}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          View Bill
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">{bill.playerPhone}</div>
                      {bill.member && (
                        <div className="text-xs text-blue-600 mt-1">
                          {bill.member.totalGames > 0 ? `${bill.member.remainingGames} games left` : `Rs. ${bill.member.perFrameCharge}/frame`}
                        </div>
                      )}
                      {!bill.isPaid && bill.gamesPlayed > 0 && (
                        <div className="text-sm text-gray-700 mt-1 font-medium">
                          Frames Played: {bill.gamesPlayed}
                        </div>
                      )}
                    </div>
                    {bill.isPaid && (
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">PAID</span>
                    )}
                  </div>
                  
                  {!bill.isPaid && bill.gamesPlayed > 0 && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-xs text-blue-800">
                        💰 Paid for {gameHistory.filter(h => h.payerBillId === bill.id).length} frame(s)
                      </div>
                    </div>
                  )}
                  
                  {!bill.isPaid && lastPayerId && bill.gamesPlayed > 0 && (
                    <div className="flex gap-2">
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
                        {parseFloat(bill.totalAmount) > 0 && (
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Game Charges:</span>
                            <span className="font-medium">Rs. {parseFloat(bill.totalAmount).toFixed(2)}</span>
                          </div>
                        )}
                        {bill.refreshments?.length > 0 && (
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Refreshments:</span>
                            <span className="font-medium">Rs. {bill.refreshments.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                          <span>Total:</span>
                          <span className="text-blue-600">Rs. {(parseFloat(bill.totalAmount) + (bill.refreshments?.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0) || 0)).toFixed(2)}</span>
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
            {lastPayerId && playerBills.some(b => !b.isPaid && b.gamesPlayed > 0) && (
              <>
                <button
                  onClick={renewMatch}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Renew Match
                </button>
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Player
                </button>
              </>
            )}
            {!lastPayerId && playerBills.filter(b => !b.isPaid).length >= 2 && (
              <button
                onClick={() => setShowWinnerSelection(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Select Payer
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
              <h2 className="text-xl font-bold text-gray-800">Select Payer</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Select who will pay for this game:</p>
              <div className="space-y-2">
                {playerBills.filter(b => !b.isPaid).map((bill) => (
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
                  if (!selectedWinner) return alert('Please select a payer');
                  const payerBill = playerBills.filter(b => !b.isPaid).find(b => b.id === selectedWinner);
                  if (!payerBill) return;
                  
                  try {
                    // Add game charge to payer's bill
                    const { data } = await axios.post(`/api/games/player-bills/${payerBill.id}/add-game`);
                    setLastPayerId(payerBill.id);
                    setShowWinnerSelection(false);
                    setSelectedWinner(null);
                    onUpdate();
                    await fetchPlayerBills();
                    await fetchGameHistory();
                  } catch (error) {
                    alert(error.response?.data?.error || 'Error recording game result');
                  }
                }}
                disabled={!selectedWinner}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Payer
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
              <div className="relative" ref={searchRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Member</label>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by name or phone"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showMemberDropdown && getFilteredMembers().length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {getFilteredMembers().map((m, idx) => (
                      <div
                        key={m.id}
                        onMouseDown={(e) => { e.preventDefault(); handleMemberSelect(m); }}
                        className={`px-4 py-3 cursor-pointer border-b last:border-b-0 ${highlightedIndex === idx ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`font-semibold ${highlightedIndex === idx ? 'text-white' : 'text-gray-800'}`}>{m.name}</div>
                            <div className={`text-sm ${highlightedIndex === idx ? 'text-blue-100' : 'text-gray-500'}`}>{m.phone}</div>
                          </div>
                          <div className={`text-sm ${highlightedIndex === idx ? 'text-blue-100' : 'text-gray-600'}`}>
                            {m.totalGames > 0 ? `${m.remainingGames} games left` : `Rs. ${m.perFrameCharge}/frame`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!newPlayerForm.memberId && (
                <>
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
                </>
              )}
              {newPlayerForm.memberId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="font-semibold text-gray-800">{newPlayerForm.playerName}</div>
                  <div className="text-sm text-gray-600">{newPlayerForm.playerPhone}</div>
                  <div className="text-sm text-blue-600 mt-1">
                    {parseFloat(newPlayerForm.chargePerGame) === 0 ? 'Member with game package' : `Rs. ${newPlayerForm.chargePerGame}/frame`}
                  </div>
                  <button
                    onClick={() => handleMemberSelect(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowAddPlayer(false); setNewPlayerForm({ memberId: null, playerName: '', playerPhone: '', chargePerGame: '120' }); setMemberSearch(''); }}
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
                      memberId: newPlayerForm.memberId,
                      playerName: newPlayerForm.playerName,
                      playerPhone: newPlayerForm.playerPhone,
                      chargePerGame: newPlayerForm.chargePerGame,
                      chargeType: 'per_game'
                    });
                    setShowAddPlayer(false);
                    setNewPlayerForm({ memberId: null, playerName: '', playerPhone: '', chargePerGame: '120' });
                    setMemberSearch('');
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
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setTransferMode('move'); setSelectedPlayerToSwap(null); }}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors ${transferMode === 'move' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Move
                </button>
                <button
                  onClick={() => setTransferMode('switch')}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors ${transferMode === 'switch' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Switch
                </button>
              </div>
              <p className="text-gray-600 mb-4">{transferMode === 'move' ? 'Select a table to move this player to:' : 'Select a player to switch with:'}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableBookings.map((b) => {
                  const playerCount = b.playerBills?.filter(pb => !pb.isPaid).length || 0;
                  const canMove = playerCount < 4;
                  return transferMode === 'move' ? (
                    <button
                      key={b.id}
                      onClick={() => canMove ? transferPlayer(b.id) : alert('Table is full (max 4 players)')}
                      disabled={!canMove}
                      className={`w-full text-left px-4 py-3 border rounded-lg transition-colors ${
                        canMove 
                          ? 'border-gray-300 hover:bg-blue-50 hover:border-blue-500' 
                          : 'border-red-300 bg-red-50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-800">{b.tableName}</div>
                          <div className="text-sm text-gray-500">{b.activePlayers}</div>
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded ${canMove ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {playerCount}/4
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div key={b.id} className="border border-gray-300 rounded-lg p-3">
                      <div className="font-semibold text-gray-800 mb-2">{b.tableName}</div>
                      <div className="space-y-1">
                        {b.playerBills?.filter(pb => !pb.isPaid).map(pb => (
                          <button
                            key={pb.id}
                            onClick={() => setSelectedPlayerToSwap(pb.id)}
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                              selectedPlayerToSwap === pb.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            {pb.playerName}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {availableBookings.length === 0 && (
                <p className="text-center text-gray-500 py-4">No other active tables</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => { setShowTransferModal(false); setTransferringBill(null); setTransferMode('move'); setSelectedPlayerToSwap(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              {transferMode === 'switch' && selectedPlayerToSwap && (
                <button
                  onClick={() => transferPlayer(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm Switch
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showBillModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Current Bill</h2>
              <button
                onClick={() => {
                  const printWindow = window.open('', '', 'width=300,height=600');
                  const refreshmentsTotal = (selectedBill.refreshments || []).reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
                  const gameCharges = parseFloat(selectedBill.chargePerGame) * selectedBill.gamesPlayed;
                  const total = gameCharges + refreshmentsTotal;
                  
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Bill - ${selectedBill.playerName}</title>
                        <style>
                          @media print { @page { margin: 0; size: 80mm auto; } }
                          body { font-family: monospace; font-size: 12px; margin: 10px; width: 80mm; }
                          .header { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 10px; border-bottom: 2px dashed #000; padding-bottom: 8px; }
                          .info { margin-bottom: 8px; font-size: 11px; }
                          .divider { border-top: 1px dashed #000; margin: 8px 0; }
                          .item { display: flex; justify-content: space-between; margin: 4px 0; }
                          .total { font-weight: bold; font-size: 13px; border-top: 2px solid #000; padding-top: 6px; margin-top: 8px; }
                          .footer { text-align: center; font-size: 10px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px; }
                        </style>
                      </head>
                      <body>
                        <div class="header">CURRENT BILL</div>
                        <div class="info">
                          <div><strong>Player:</strong> ${selectedBill.playerName}</div>
                          ${selectedBill.playerPhone ? `<div><strong>Phone:</strong> ${selectedBill.playerPhone}</div>` : ''}
                          <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
                        </div>
                        <div class="divider"></div>
                        <div class="item"><span>Games Played:</span><span>${selectedBill.gamesPlayed}</span></div>
                        ${parseFloat(selectedBill.totalAmount) > 0 ? `
                          <div class="item"><span>Rate/Game:</span><span>Rs. ${parseFloat(selectedBill.chargePerGame).toFixed(2)}</span></div>
                          <div class="item"><span>Game Charges:</span><span>Rs. ${parseFloat(selectedBill.totalAmount).toFixed(2)}</span></div>
                        ` : ''}
                        ${(selectedBill.refreshments || []).length > 0 ? `
                          <div class="divider"></div>
                          <div style="font-weight: bold; margin: 6px 0;">Refreshments:</div>
                          ${(selectedBill.refreshments || []).map(r => `
                            <div class="item">
                              <span>${r.productName} x${r.quantity}</span>
                              <span>Rs. ${parseFloat(r.totalAmount).toFixed(2)}</span>
                            </div>
                          `).join('')}
                          <div class="item"><span><strong>Refreshments Total:</strong></span><span><strong>Rs. ${refreshmentsTotal.toFixed(2)}</strong></span></div>
                        ` : ''}
                        <div class="total">
                          <div class="item"><span>TOTAL:</span><span>Rs. ${total.toFixed(2)}</span></div>
                        </div>
                        <div class="footer">Thank you!</div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Print
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="font-bold text-lg mb-2">{selectedBill.playerName}</div>
                {selectedBill.playerPhone && <div className="text-sm text-gray-600 mb-2">{selectedBill.playerPhone}</div>}
                {selectedBill.member && (
                  <div className="text-xs text-blue-600">
                    {selectedBill.member.totalGames > 0 ? `${selectedBill.member.remainingGames} games left` : `Rs. ${selectedBill.member.perFrameCharge}/frame`}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Games Played:</span>
                  <span className="font-medium">{selectedBill.gamesPlayed}</span>
                </div>
                {parseFloat(selectedBill.totalAmount) > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rate per Game:</span>
                      <span className="font-medium">Rs. {parseFloat(selectedBill.chargePerGame).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Game Charges:</span>
                      <span className="font-medium">Rs. {parseFloat(selectedBill.totalAmount).toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                {(selectedBill.refreshments || []).length > 0 && (
                  <>
                    <div className="border-t pt-2 mt-2">
                      <div className="font-semibold text-sm mb-2">Refreshments:</div>
                      {selectedBill.refreshments.map(r => (
                        <div key={r.id} className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{r.productName} x{r.quantity}</span>
                          <span className="font-medium">Rs. {parseFloat(r.totalAmount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Refreshments Total:</span>
                      <span className="font-medium">Rs. {(selectedBill.refreshments || []).reduce((sum, r) => sum + parseFloat(r.totalAmount), 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t-2 pt-3 mt-3">
                  <span>Total:</span>
                  <span className="text-blue-600">Rs. {(parseFloat(selectedBill.totalAmount) + (selectedBill.refreshments || []).reduce((sum, r) => sum + parseFloat(r.totalAmount), 0)).toFixed(2)}</span>
                </div>
                
                {selectedBill.isPaid && (
                  <div className="bg-green-50 border border-green-200 rounded p-2 mt-3">
                    <div className="text-sm text-green-800 font-medium">✓ PAID</div>
                    <div className="text-xs text-green-700">Method: {selectedBill.paymentMethod}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => { setShowBillModal(false); setSelectedBill(null); }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
