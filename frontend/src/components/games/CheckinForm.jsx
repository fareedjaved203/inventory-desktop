import { useState, useEffect, useRef } from 'react';
import axios from '../../utils/axios';

export default function CheckinForm({ table, formData, setFormData, onSubmit, onCancel }) {
  const [members, setMembers] = useState([]);
  const [search1, setSearch1] = useState('Walk-in Customer');
  const [search2, setSearch2] = useState('Walk-in Customer');
  const [search3, setSearch3] = useState('Walk-in Customer');
  const [search4, setSearch4] = useState('Walk-in Customer');
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [showDropdown3, setShowDropdown3] = useState(false);
  const [showDropdown4, setShowDropdown4] = useState(false);
  const [highlightedIndex1, setHighlightedIndex1] = useState(-1);
  const [highlightedIndex2, setHighlightedIndex2] = useState(-1);
  const [highlightedIndex3, setHighlightedIndex3] = useState(-1);
  const [highlightedIndex4, setHighlightedIndex4] = useState(-1);
  const searchRef1 = useRef(null);
  const searchRef2 = useRef(null);
  const searchRef3 = useRef(null);
  const searchRef4 = useRef(null);

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
    const timer = setTimeout(() => {
      const filtered = getFilteredMembers(search3);
      if (search3 && search3 !== 'Walk-in Customer' && filtered.length > 0 && !members.find(m => m.name === search3)) {
        setShowDropdown3(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search3, members]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = getFilteredMembers(search4);
      if (search4 && search4 !== 'Walk-in Customer' && filtered.length > 0 && !members.find(m => m.name === search4)) {
        setShowDropdown4(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search4, members]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef1.current && !searchRef1.current.contains(e.target)) setShowDropdown1(false);
      if (searchRef2.current && !searchRef2.current.contains(e.target)) setShowDropdown2(false);
      if (searchRef3.current && !searchRef3.current.contains(e.target)) setShowDropdown3(false);
      if (searchRef4.current && !searchRef4.current.contains(e.target)) setShowDropdown4(false);
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

  const handleMemberSelect = (member, playerNum = 1) => {
    if (playerNum === 1) {
      setShowDropdown1(false);
      setHighlightedIndex1(-1);
      if (member) {
        setSearch1(member.name);
        setFormData({ ...formData, memberId: member.id, player1Name: member.name, player1Phone: member.phone });
      } else {
        setSearch1('Walk-in Customer');
        setFormData({ ...formData, memberId: null, player1Name: '', player1Phone: '' });
      }
    } else if (playerNum === 2) {
      setShowDropdown2(false);
      setHighlightedIndex2(-1);
      if (member) {
        setSearch2(member.name);
        setFormData({ ...formData, member2Id: member.id, player2Name: member.name, player2Phone: member.phone });
      } else {
        setSearch2('Walk-in Customer');
        setFormData({ ...formData, member2Id: null, player2Name: '', player2Phone: '' });
      }
    } else if (playerNum === 3) {
      setShowDropdown3(false);
      setHighlightedIndex3(-1);
      if (member) {
        setSearch3(member.name);
        setFormData({ ...formData, member3Id: member.id, player3Name: member.name, player3Phone: member.phone });
      } else {
        setSearch3('Walk-in Customer');
        setFormData({ ...formData, member3Id: null, player3Name: '', player3Phone: '' });
      }
    } else if (playerNum === 4) {
      setShowDropdown4(false);
      setHighlightedIndex4(-1);
      if (member) {
        setSearch4(member.name);
        setFormData({ ...formData, member4Id: member.id, player4Name: member.name, player4Phone: member.phone });
      } else {
        setSearch4('Walk-in Customer');
        setFormData({ ...formData, member4Id: null, player4Name: '', player4Phone: '' });
      }
    }
  };

  const handleKeyDown = (e, playerNum = 1) => {
    const searches = [search1, search2, search3, search4];
    const dropdowns = [showDropdown1, showDropdown2, showDropdown3, showDropdown4];
    const indices = [highlightedIndex1, highlightedIndex2, highlightedIndex3, highlightedIndex4];
    const setIndices = [setHighlightedIndex1, setHighlightedIndex2, setHighlightedIndex3, setHighlightedIndex4];
    const setDropdowns = [setShowDropdown1, setShowDropdown2, setShowDropdown3, setShowDropdown4];
    
    const idx = playerNum - 1;
    const filteredMembers = getFilteredMembers(searches[idx]);
    
    if (!dropdowns[idx] || filteredMembers.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndices[idx](prev => (prev < filteredMembers.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndices[idx](prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && indices[idx] >= 0) {
      e.preventDefault();
      handleMemberSelect(filteredMembers[indices[idx]], playerNum);
    } else if (e.key === 'Escape') {
      setDropdowns[idx](false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Check In - {table?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Search for members or enter walk-in customer details (max 4 players)</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">👥 Players</h3>
              <p className="text-sm text-blue-700">Type to search members or leave as "Walk-in Customer" and fill details below</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
            <div className="relative" ref={searchRef1}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={search1}
                onChange={(e) => setSearch1(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 1)}
                placeholder="Walk-in Customer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showDropdown1 && getFilteredMembers(search1).length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredMembers(search1).map((m, idx) => (
                    <div
                      key={m.id}
                      onMouseDown={(e) => { e.preventDefault(); handleMemberSelect(m, 1); }}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Player 2</label>
              <input
                type="text"
                value={search2}
                onChange={(e) => setSearch2(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 2)}
                placeholder="Walk-in Customer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showDropdown2 && getFilteredMembers(search2).length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredMembers(search2).map((m, idx) => (
                    <div
                      key={m.id}
                      onMouseDown={(e) => { e.preventDefault(); handleMemberSelect(m, 2); }}
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
            <div className="relative" ref={searchRef3}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player 3</label>
              <input
                type="text"
                value={search3}
                onChange={(e) => setSearch3(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 3)}
                placeholder="Walk-in Customer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showDropdown3 && getFilteredMembers(search3).length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredMembers(search3).map((m, idx) => (
                    <div
                      key={m.id}
                      onMouseDown={(e) => { e.preventDefault(); handleMemberSelect(m, 3); }}
                      className={`px-4 py-3 cursor-pointer border-b last:border-b-0 ${highlightedIndex3 === idx ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`font-semibold ${highlightedIndex3 === idx ? 'text-white' : 'text-gray-800'}`}>{m.name}</div>
                          <div className={`text-sm ${highlightedIndex3 === idx ? 'text-blue-100' : 'text-gray-500'}`}>{m.phone}</div>
                        </div>
                        <div className={`text-sm ${highlightedIndex3 === idx ? 'text-blue-100' : 'text-gray-600'}`}>
                          {m.totalGames > 0 ? `${m.remainingGames} games left` : `Rs. ${m.perFrameCharge}/frame`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={searchRef4}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player 4</label>
              <input
                type="text"
                value={search4}
                onChange={(e) => setSearch4(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 4)}
                placeholder="Walk-in Customer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showDropdown4 && getFilteredMembers(search4).length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredMembers(search4).map((m, idx) => (
                    <div
                      key={m.id}
                      onMouseDown={(e) => { e.preventDefault(); handleMemberSelect(m, 4); }}
                      className={`px-4 py-3 cursor-pointer border-b last:border-b-0 ${highlightedIndex4 === idx ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`font-semibold ${highlightedIndex4 === idx ? 'text-white' : 'text-gray-800'}`}>{m.name}</div>
                          <div className={`text-sm ${highlightedIndex4 === idx ? 'text-blue-100' : 'text-gray-500'}`}>{m.phone}</div>
                        </div>
                        <div className={`text-sm ${highlightedIndex4 === idx ? 'text-blue-100' : 'text-gray-600'}`}>
                          {m.totalGames > 0 ? `${m.remainingGames} games left` : `Rs. ${m.perFrameCharge}/frame`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>

            {(!formData.memberId || !formData.member2Id || !formData.member3Id || !formData.member4Id) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">📝 Walk-in Customer Details</h3>
                <div className="grid grid-cols-2 gap-4">
            {!formData.memberId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.player1Name} onChange={(e) => setFormData({ ...formData, player1Name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 Phone</label>
                  <input type="tel" value={formData.player1Phone} onChange={(e) => setFormData({ ...formData, player1Phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Optional" />
                </div>
              </>
            )}
            {!formData.member2Id && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 Name</label>
                  <input type="text" value={formData.player2Name} onChange={(e) => setFormData({ ...formData, player2Name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 Phone</label>
                  <input type="tel" value={formData.player2Phone} onChange={(e) => setFormData({ ...formData, player2Phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Optional" />
                </div>
              </>
            )}
            {!formData.member3Id && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 3 Name</label>
                  <input type="text" value={formData.player3Name} onChange={(e) => setFormData({ ...formData, player3Name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 3 Phone</label>
                  <input type="tel" value={formData.player3Phone} onChange={(e) => setFormData({ ...formData, player3Phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Optional" />
                </div>
              </>
            )}
            {!formData.member4Id && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 4 Name</label>
                  <input type="text" value={formData.player4Name} onChange={(e) => setFormData({ ...formData, player4Name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 4 Phone</label>
                  <input type="tel" value={formData.player4Phone} onChange={(e) => setFormData({ ...formData, player4Phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Optional" />
                </div>
              </>
            )}
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">💰 Billing Details</h3>
              <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Charge Type <span className="text-red-500">*</span></label>
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
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Check In</button>
          </div>
        </form>
      </div>
    </div>
  );
}
