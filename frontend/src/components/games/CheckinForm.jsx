import { useState, useEffect, useRef } from 'react';
import axios from '../../utils/axios';

export default function CheckinForm({ table, formData, setFormData, onSubmit, onCancel }) {
  const [members, setMembers] = useState([]);
  const [search1, setSearch1] = useState('Walk-in Customer');
  const [search2, setSearch2] = useState('Walk-in Customer');
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [highlightedIndex1, setHighlightedIndex1] = useState(-1);
  const [highlightedIndex2, setHighlightedIndex2] = useState(-1);
  const searchRef1 = useRef(null);
  const searchRef2 = useRef(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = getFilteredMembers(search1);
      if (search1 && search1 !== 'Walk-in Customer' && filtered.length > 0 && !members.find(m => m.name === search1)) {
        setShowDropdown1(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search1, members]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = getFilteredMembers(search2);
      if (search2 && search2 !== 'Walk-in Customer' && filtered.length > 0 && !members.find(m => m.name === search2)) {
        setShowDropdown2(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search2, members]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef1.current && !searchRef1.current.contains(e.target)) setShowDropdown1(false);
      if (searchRef2.current && !searchRef2.current.contains(e.target)) setShowDropdown2(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get('/api/members/active');
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const getFilteredMembers = (search) => {
    return search.trim() && search !== 'Walk-in Customer'
      ? members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search))
      : [];
  };

  const handleMemberSelect = (member, isPlayer2 = false) => {
    if (isPlayer2) {
      setShowDropdown2(false);
      setHighlightedIndex2(-1);
      if (member) {
        setSearch2(member.name);
        setFormData({ ...formData, member2Id: member.id, player2Name: member.name, player2Phone: member.phone });
      } else {
        setSearch2('Walk-in Customer');
        setFormData({ ...formData, member2Id: null, player2Name: '', player2Phone: '' });
      }
    } else {
      setShowDropdown1(false);
      setHighlightedIndex1(-1);
      if (member) {
        setSearch1(member.name);
        setFormData({ ...formData, memberId: member.id, player1Name: member.name, player1Phone: member.phone });
      } else {
        setSearch1('Walk-in Customer');
        setFormData({ ...formData, memberId: null, player1Name: '', player1Phone: '' });
      }
    }
  };

  const handleKeyDown = (e, isPlayer2 = false) => {
    const filteredMembers = getFilteredMembers(isPlayer2 ? search2 : search1);
    const showDropdown = isPlayer2 ? showDropdown2 : showDropdown1;
    const highlightedIndex = isPlayer2 ? highlightedIndex2 : highlightedIndex1;
    const setHighlightedIndex = isPlayer2 ? setHighlightedIndex2 : setHighlightedIndex1;
    const setShowDropdown = isPlayer2 ? setShowDropdown2 : setShowDropdown1;

    if (!showDropdown || filteredMembers.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredMembers.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleMemberSelect(filteredMembers[highlightedIndex], isPlayer2);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Check In - {table?.name}</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="relative" ref={searchRef1}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 (Optional)</label>
              <input
                type="text"
                value={search1}
                onChange={(e) => setSearch1(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, false)}
                placeholder="Walk-in Customer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showDropdown1 && getFilteredMembers(search1).length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredMembers(search1).map((m, idx) => (
                    <div
                      key={m.id}
                      onMouseDown={(e) => { e.preventDefault(); handleMemberSelect(m, false); }}
                      className={`px-4 py-3 cursor-pointer border-b last:border-b-0 ${highlightedIndex1 === idx ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`font-semibold ${highlightedIndex1 === idx ? 'text-white' : 'text-gray-800'}`}>{m.name}</div>
                          <div className={`text-sm ${highlightedIndex1 === idx ? 'text-blue-100' : 'text-gray-500'}`}>{m.phone}</div>
                        </div>
                        <div className={`text-sm ${highlightedIndex1 === idx ? 'text-blue-100' : 'text-gray-600'}`}>
                          {m.totalGames > 0 ? `${m.remainingGames} games left` : `Rs. ${m.perFrameCharge}/frame`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={searchRef2}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 (Optional)</label>
              <input
                type="text"
                value={search2}
                onChange={(e) => setSearch2(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, true)}
                placeholder="Walk-in Customer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showDropdown2 && getFilteredMembers(search2).length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredMembers(search2).map((m, idx) => (
                    <div
                      key={m.id}
                      onMouseDown={(e) => { e.preventDefault(); handleMemberSelect(m, true); }}
                      className={`px-4 py-3 cursor-pointer border-b last:border-b-0 ${highlightedIndex2 === idx ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`font-semibold ${highlightedIndex2 === idx ? 'text-white' : 'text-gray-800'}`}>{m.name}</div>
                          <div className={`text-sm ${highlightedIndex2 === idx ? 'text-blue-100' : 'text-gray-500'}`}>{m.phone}</div>
                        </div>
                        <div className={`text-sm ${highlightedIndex2 === idx ? 'text-blue-100' : 'text-gray-600'}`}>
                          {m.totalGames > 0 ? `${m.remainingGames} games left` : `Rs. ${m.perFrameCharge}/frame`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!formData.memberId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 Name *</label>
                  <input type="text" required value={formData.player1Name} onChange={(e) => setFormData({ ...formData, player1Name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 Phone</label>
                  <input type="tel" value={formData.player1Phone} onChange={(e) => setFormData({ ...formData, player1Phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </>
            )}
            {!formData.member2Id && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 Name</label>
                  <input type="text" value={formData.player2Name} onChange={(e) => setFormData({ ...formData, player2Name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 Phone</label>
                  <input type="tel" value={formData.player2Phone} onChange={(e) => setFormData({ ...formData, player2Phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Charge Type *</label>
              <select required value={formData.chargeType} onChange={(e) => setFormData({ ...formData, chargeType: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="per_min">Per Minute</option>
                <option value="per_hour">Per Hour</option>
                <option value="per_game">Per Game</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 Charges (Rs.)</label>
                <input type="number" min="0" step="0.01" value={formData.player1Charges} onChange={(e) => setFormData({ ...formData, player1Charges: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 Charges (Rs.)</label>
                <input type="number" min="0" step="0.01" value={formData.player2Charges} onChange={(e) => setFormData({ ...formData, player2Charges: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Duration/Games</label>
              <input type="text" placeholder="e.g., 2 hours, 5 games, 30 mins" value={formData.expectedDuration} onChange={(e) => setFormData({ ...formData, expectedDuration: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Check In</button>
          </div>
        </form>
      </div>
    </div>
  );
}
