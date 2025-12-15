import { useState, useRef } from 'react';
import axios from '../../utils/axios';
import { useEffect } from 'react';

// Move PlayerField OUTSIDE the main component
const PlayerField = ({ playerNum, searches, setSearches, showDropdowns, results, debounceTimers, fetchResults, handleSelectPerson }) => {
  const idx = playerNum - 1;
  
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Player {playerNum} {playerNum === 1 && <span className="text-red-500">*</span>}
      </label>
      <input
        onClick={(e) => e.stopPropagation()}
        type="text"
        value={searches[idx]}
        onChange={(e) => {
          const value = e.target.value;
          setSearches(prev => {
            const newSearches = [...prev];
            newSearches[idx] = value;
            return newSearches;
          });
          
          if (debounceTimers.current[idx]) clearTimeout(debounceTimers.current[idx]);
          
          debounceTimers.current[idx] = setTimeout(() => {
            fetchResults(value, idx);
          }, 300);
        }}
        placeholder="Search member or player..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {showDropdowns[idx] && results[idx].length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-64 overflow-y-auto z-50">
          {results[idx]
            .filter((item) => {
              // Filter out players already selected in other fields
              const alreadySelected = searches.some((name, searchIdx) => 
                searchIdx !== idx && name.toLowerCase() === item.name.toLowerCase()
              );
              return !alreadySelected;
            })
            .map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onMouseDown={() => handleSelectPerson(item, playerNum)}
                className="px-4 py-3 cursor-pointer hover:bg-blue-100 border-b last:border-b-0 flex items-center justify-between bg-white"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl">{item.type === 'member' ? '👤' : '🎱'}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    {item.phone && <div className="text-xs text-gray-600">{item.phone}</div>}
                  </div>
                </div>
                {item.type === 'member' && item.remainingGames > 0 && (
                  <div className="text-xs font-semibold text-green-700 ml-2 whitespace-nowrap">{item.remainingGames} games</div>
                )}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

export default function CheckinForm({ table, formData, setFormData, onSubmit, onCancel }) {
  const [results, setResults] = useState([[], [], [], []]);
  const [searches, setSearches] = useState(['', '', '', '']);
  const [showDropdowns, setShowDropdowns] = useState([false, false, false, false]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState({ name: '', phone: '' });
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamSetup, setTeamSetup] = useState({ team1: [0, 1], team2: [2, 3] });
  const [errors, setErrors] = useState({});
  const debounceTimers = useRef([null, null, null, null]);

  const fetchResults = async (query, idx) => {
    if (!query.trim()) {
      setResults(prev => {
        const newResults = [...prev];
        newResults[idx] = [];
        return newResults;
      });
      return;
    }
    try {
      const [membersRes, playersRes] = await Promise.all([
        axios.get('/api/members', { params: { page: 1, limit: 10, search: query } }),
        axios.get('/api/players/search', { params: { q: query } })
      ]);
      
      const members = (membersRes.data.items || []).map(m => ({ ...m, type: 'member' }));
      const players = (playersRes.data || []).map(p => ({ ...p, type: 'player' }));
      
      // Remove duplicates: prioritize members over players
      const allResults = [...members, ...players];
      const uniqueResults = allResults.filter((item, index, self) => 
        index === self.findIndex((t) => 
          t.name.toLowerCase() === item.name.toLowerCase() && 
          t.phone === item.phone
        )
      );
      
      setResults(prev => {
        const newResults = [...prev];
        newResults[idx] = uniqueResults;
        return newResults;
      });
      
      setShowDropdowns(prev => {
        const newState = [...prev];
        newState[idx] = true;
        return newState;
      });
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleSelectPerson = (person, playerNum) => {
    const idx = playerNum - 1;
    setSearches(prev => {
      const newSearches = [...prev];
      newSearches[idx] = person.name;
      return newSearches;
    });
    setFormData({
      ...formData,
      [`player${playerNum}Name`]: person.name,
      [`player${playerNum}Phone`]: person.phone || '',
      ...(person.type === 'member' && { [`member${playerNum === 1 ? '' : playerNum}Id`]: person.id })
    });
    setShowDropdowns(prev => {
      const newState = [...prev];
      newState[idx] = false;
      return newState;
    });
  };

  const handleAddPlayer = async () => {
    if (!newPlayerForm.name.trim()) {
      setErrors({ newPlayer: 'Player name is required' });
      return;
    }
    
    setAddingPlayer(true);
    try {
      await axios.post('/api/players', {
        name: newPlayerForm.name.trim(),
        phone: newPlayerForm.phone || null
      });
      setNewPlayerForm({ name: '', phone: '' });
      setShowAddPlayer(false);
      setErrors({});
    } catch (error) {
      setErrors({ newPlayer: error.response?.data?.error || 'Error adding player' });
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleTeamSubmit = () => {
    setFormData({
      ...formData,
      team1Players: [teamSetup.team1[0], teamSetup.team1[1]],
      team2Players: [teamSetup.team2[0], teamSetup.team2[1]]
    });
    setShowTeamModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.player1Name?.trim()) newErrors.player1Name = 'Player 1 name is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    await onSubmit(e);
  };

  const allPlayersAdded = searches.every(s => s.trim());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col relative z-50">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Check In - {table?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Search for members or previous players</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">👥 Players</h3>
                <button
                  type="button"
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  + Add New Player
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <PlayerField 
                  playerNum={1}
                  searches={searches}
                  setSearches={setSearches}
                  showDropdowns={showDropdowns}
                  results={results}
                  debounceTimers={debounceTimers}
                  fetchResults={fetchResults}
                  handleSelectPerson={handleSelectPerson}
                />
                <PlayerField 
                  playerNum={2}
                  searches={searches}
                  setSearches={setSearches}
                  showDropdowns={showDropdowns}
                  results={results}
                  debounceTimers={debounceTimers}
                  fetchResults={fetchResults}
                  handleSelectPerson={handleSelectPerson}
                />
                <PlayerField 
                  playerNum={3}
                  searches={searches}
                  setSearches={setSearches}
                  showDropdowns={showDropdowns}
                  results={results}
                  debounceTimers={debounceTimers}
                  fetchResults={fetchResults}
                  handleSelectPerson={handleSelectPerson}
                />
                <PlayerField 
                  playerNum={4}
                  searches={searches}
                  setSearches={setSearches}
                  showDropdowns={showDropdowns}
                  results={results}
                  debounceTimers={debounceTimers}
                  fetchResults={fetchResults}
                  handleSelectPerson={handleSelectPerson}
                />
              </div>
            </div>

            {allPlayersAdded && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-purple-900">🏆 Create Teams</h3>
                    <p className="text-sm text-purple-700 mt-1">Organize players into 2 teams of 2</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Setup Teams
                  </button>
                </div>
              </div>
            )}

            {showAddPlayer && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">➕ Add New Player</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Player Name *</label>
                    <input
                      type="text"
                      value={newPlayerForm.name}
                      onChange={(e) => setNewPlayerForm({ ...newPlayerForm, name: e.target.value })}
                      placeholder="Enter player name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={newPlayerForm.phone}
                      onChange={(e) => setNewPlayerForm({ ...newPlayerForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {errors.newPlayer && <p className="text-red-500 text-sm">{errors.newPlayer}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddPlayer}
                      disabled={addingPlayer}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {addingPlayer ? 'Adding...' : 'Add Player'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddPlayer(false); setNewPlayerForm({ name: '', phone: '' }); setErrors({}); }}
                      className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">💰 Billing Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Charge Type *</label>
                  <select required value={formData.chargeType} onChange={(e) => setFormData({ ...formData, chargeType: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="per_min">Per Minute</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_game">Per Game</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Charges (Rs.)</label>
                  <input type="number" min="0" step="0.01" value={formData.charges} onChange={(e) => setFormData({ ...formData, charges: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="120" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Duration/Games</label>
                  <input type="text" placeholder="e.g., 2 hours, 5 games, 30 mins" value={formData.expectedDuration} onChange={(e) => setFormData({ ...formData, expectedDuration: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Check In</button>
          </div>
        </form>
      </div>

      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Create Teams</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team 1</label>
                <div className="space-y-2">
                  {[0, 1].map((pos) => (
                    <select
                      key={pos}
                      value={teamSetup.team1[pos]}
                      onChange={(e) => {
                        const newTeam1 = [...teamSetup.team1];
                        newTeam1[pos] = parseInt(e.target.value);
                        setTeamSetup({ ...teamSetup, team1: newTeam1 });
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {searches.map((name, idx) => (
                        <option key={idx} value={idx}>{name}</option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team 2</label>
                <div className="space-y-2">
                  {[0, 1].map((pos) => (
                    <select
                      key={pos}
                      value={teamSetup.team2[pos]}
                      onChange={(e) => {
                        const newTeam2 = [...teamSetup.team2];
                        newTeam2[pos] = parseInt(e.target.value);
                        setTeamSetup({ ...teamSetup, team2: newTeam2 });
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {searches.map((name, idx) => (
                        <option key={idx} value={idx}>{name}</option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button type="button" onClick={() => setShowTeamModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleTeamSubmit} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create Teams</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}