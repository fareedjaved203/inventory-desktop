import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlus, FaTrash, FaSearch, FaShoppingCart } from 'react-icons/fa';
import axios from '../../utils/axios';

export default function RefreshmentsModal({ booking, onClose, onUpdate }) {
  const [products, setProducts] = useState([]);
  const [refreshments, setRefreshments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(booking.player1Name);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const searchRef = useRef(null);
  const quantityRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchRefreshments();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/products', { params: { limit: 100 } });
      setProducts(data.items || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchRefreshments = async () => {
    try {
      const { data } = await axios.get(`/api/games/bookings/${booking.id}/refreshments`);
      setRefreshments(data);
    } catch (error) {
      console.error('Error fetching refreshments:', error);
    }
  };

  const handleAdd = async (productId) => {
    if (!productId || !quantity) return;
    setLoading(true);
    try {
      await axios.post(`/api/games/bookings/${booking.id}/refreshments`, {
        playerName: selectedPlayer,
        productId,
        quantity: parseFloat(quantity)
      });
      setSearch('');
      setSelectedProduct('');
      setQuantity(1);
      setShowDropdown(false);
      setHighlightedIndex(0);
      fetchRefreshments();
      fetchProducts();
      onUpdate();
      searchRef.current?.focus();
    } catch (error) {
      alert(error.response?.data?.error || 'Error adding refreshment');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || filteredProducts.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredProducts.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts[highlightedIndex]) {
        setSelectedProduct(filteredProducts[highlightedIndex].id);
        setSearch(filteredProducts[highlightedIndex].name);
        setShowDropdown(false);
        quantityRef.current?.focus();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter' && selectedProduct) {
      e.preventDefault();
      handleAdd(selectedProduct);
    }
  };

  const handleRemove = async () => {
    if (!deletingItem) return;
    try {
      await axios.delete(`/api/games/bookings/${booking.id}/refreshments/${deletingItem}`);
      fetchRefreshments();
      fetchProducts();
      onUpdate();
      setShowDeleteModal(false);
      setDeletingItem(null);
    } catch (error) {
      alert('Error removing refreshment');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && p.quantity > 0
  );

  useEffect(() => {
    if (search && !selectedProduct) {
      setShowDropdown(true);
      setHighlightedIndex(0);
    } else {
      setShowDropdown(false);
    }
  }, [search, selectedProduct]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const players = [booking.player1Name, booking.player2Name].filter(Boolean);
  const groupedRefreshments = refreshments.reduce((acc, r) => {
    if (!acc[r.playerName]) acc[r.playerName] = [];
    acc[r.playerName].push(r);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg">
              <FaShoppingCart className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Order Refreshments</h2>
              <p className="text-sm text-gray-600">Add items for players</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 hover:bg-white p-2 rounded-lg transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Player</label>
                <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" required>
                  {players.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={searchRef}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search menu..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setSelectedProduct('');
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={() => search && setShowDropdown(true)}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoComplete="off"
                    />
                  </div>
                  {showDropdown && filteredProducts.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                      {filteredProducts.map((p, idx) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p.id);
                            setSearch(p.name);
                            setShowDropdown(false);
                            quantityRef.current?.focus();
                          }}
                          className={`px-4 py-3 cursor-pointer border-b last:border-b-0 transition-all ${
                            idx === highlightedIndex ? 'bg-blue-500 text-white' : 'hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <div className={`font-semibold truncate ${idx === highlightedIndex ? 'text-white' : 'text-gray-800'}`}>{p.name}</div>
                              <div className={`text-sm ${idx === highlightedIndex ? 'text-blue-100' : 'text-gray-500'}`}>
                                Stock: {p.quantity} {p.unit}
                              </div>
                            </div>
                            <div className={`font-bold whitespace-nowrap ${idx === highlightedIndex ? 'text-white' : 'text-blue-600'}`}>
                              Rs. {p.retailPrice || p.price}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                  <div className="flex gap-2">
                    <input
                      ref={quantityRef}
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      onKeyDown={handleQuantityKeyDown}
                      onWheel={(e) => e.target.blur()}
                      className="w-24 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      onClick={() => handleAdd(selectedProduct)}
                      disabled={loading || !selectedProduct}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
                    >
                      <FaPlus /> Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {players.map(player => (
              <div key={player} className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b-2 border-gray-200">
                  <h3 className="font-bold text-gray-800 text-lg">{player}</h3>
                </div>
                <div className="p-4">
                  {groupedRefreshments[player]?.length > 0 ? (
                    <div className="space-y-2">
                      {groupedRefreshments[player].map(r => (
                        <div key={r.id} className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm">
                              x{r.quantity}
                            </div>
                            <span className="font-semibold text-gray-800">{r.productName}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-gray-800">Rs. {r.totalAmount}</span>
                            <button onClick={() => { setDeletingItem(r.id); setShowDeleteModal(true); }} className="text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-lg transition-all">
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-gray-300">
                        <span className="text-gray-600 font-semibold">Subtotal</span>
                        <span className="font-bold text-2xl text-blue-600">
                          Rs. {groupedRefreshments[player].reduce((sum, r) => sum + parseFloat(r.totalAmount), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-6 italic">No items added yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Remove Item</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to remove this item?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeletingItem(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleRemove} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
