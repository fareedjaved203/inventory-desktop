import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { FaPlus } from 'react-icons/fa';
import TableCard from '../components/games/TableCard';
import TableForm from '../components/games/TableForm';
import CheckinForm from '../components/games/CheckinForm';
import CheckoutForm from '../components/games/CheckoutForm';
import HistoryTable from '../components/games/HistoryTable';
import DeleteModal from '../components/games/DeleteModal';

export default function Games() {
  const [activeTab, setActiveTab] = useState('tables');
  const [tables, setTables] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editBookingForm, setEditBookingForm] = useState({ expectedDuration: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTable, setDeletingTable] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableForm, setTableForm] = useState({ name: '', tableType: 'snooker' });
  const [checkinForm, setCheckinForm] = useState({ player1Name: '', player1Phone: '', player2Name: '', player2Phone: '', chargeType: 'per_hour', charges: '', expectedDuration: '' });
  const [checkoutForm, setCheckoutForm] = useState({ gamesPlayed: 0, totalAmount: 0 });

  useEffect(() => { fetchTables(); }, []);
  useEffect(() => { if (activeTab === 'history') fetchHistory(); }, [activeTab, historyPage]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/games/tables');
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/games/bookings', { params: { page: historyPage, limit: 10 } });
      setHistory(data.items);
      setHistoryTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTable) {
        await axios.put(`/api/games/tables/${selectedTable.id}`, tableForm);
      } else {
        await axios.post('/api/games/tables', tableForm);
      }
      setShowTableModal(false);
      setTableForm({ name: '', tableType: 'snooker' });
      setSelectedTable(null);
      fetchTables();
    } catch (error) {
      console.error('Error saving table:', error);
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/games/bookings/checkin', { ...checkinForm, tableId: selectedTable.id });
      setShowCheckinModal(false);
      setCheckinForm({ player1Name: '', player1Phone: '', player2Name: '', player2Phone: '', chargeType: 'per_hour', charges: '', expectedDuration: '' });
      setSelectedTable(null);
      fetchTables();
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/games/bookings/${selectedBooking.id}/checkout`, checkoutForm);
      setShowCheckoutModal(false);
      setCheckoutForm({ gamesPlayed: 0, totalAmount: 0 });
      setSelectedBooking(null);
      fetchTables();
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/games/bookings/${editingBooking.id}`, editBookingForm);
      setShowEditBookingModal(false);
      setEditingBooking(null);
      fetchTables();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const openEditBookingModal = (booking) => {
    setEditingBooking(booking);
    setEditBookingForm({ expectedDuration: booking.expectedDuration || '' });
    setShowEditBookingModal(true);
  };

  const openEditModal = (table) => {
    setSelectedTable(table);
    setTableForm({ name: table.name, tableType: table.tableType });
    setShowTableModal(true);
  };

  const openCheckinModal = (table) => {
    setSelectedTable(table);
    setShowCheckinModal(true);
  };

  const openCheckoutModal = (table, booking) => {
    setSelectedTable(table);
    setSelectedBooking(booking);
    const duration = (new Date() - new Date(booking.checkInTime)) / 1000 / 60;
    let amount = 0;
    if (booking.chargeType === 'per_min') amount = (duration * parseFloat(booking.charges)).toFixed(2);
    else if (booking.chargeType === 'per_hour') amount = ((duration / 60) * parseFloat(booking.charges)).toFixed(2);
    setCheckoutForm({ gamesPlayed: 0, totalAmount: amount });
    setShowCheckoutModal(true);
  };

  const formatDuration = (checkInTime, checkOutTime = null) => {
    const endTime = checkOutTime ? new Date(checkOutTime) : new Date();
    const duration = Math.floor((endTime - new Date(checkInTime)) / 1000 / 60);
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Game Tables</h1>
            <p className="text-gray-600 text-sm mt-1">Manage snooker tables and bookings</p>
          </div>
          <button onClick={() => { setTableForm({ name: '', tableType: 'snooker' }); setSelectedTable(null); setShowTableModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FaPlus /> Add Table
          </button>
        </div>
        <div className="flex gap-2 border-b border-gray-200">
          {['tables', 'history'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium transition-colors ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>
              {tab === 'tables' ? 'Active Tables' : 'History'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'tables' ? (
        loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading tables...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} onEdit={openEditModal} onDelete={(t) => { setDeletingTable(t); setShowDeleteModal(true); }} onCheckin={openCheckinModal} onCheckout={openCheckoutModal} onEditBooking={openEditBookingModal} formatDuration={formatDuration} />
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <HistoryTable history={history} page={historyPage} totalPages={historyTotalPages} setPage={setHistoryPage} formatDuration={formatDuration} loading={loading} />
        </div>
      )}

      {showTableModal && <TableForm formData={tableForm} setFormData={setTableForm} onSubmit={handleTableSubmit} onCancel={() => { setShowTableModal(false); setTableForm({ name: '', tableType: 'snooker' }); setSelectedTable(null); }} isEditing={!!selectedTable} />}
      {showCheckinModal && <CheckinForm table={selectedTable} formData={checkinForm} setFormData={setCheckinForm} onSubmit={handleCheckin} onCancel={() => { setShowCheckinModal(false); setCheckinForm({ player1Name: '', player1Phone: '', player2Name: '', player2Phone: '', chargeType: 'per_hour', charges: '', expectedDuration: '' }); setSelectedTable(null); }} />}
      {showCheckoutModal && selectedBooking && <CheckoutForm table={selectedTable} booking={selectedBooking} formData={checkoutForm} setFormData={setCheckoutForm} onSubmit={handleCheckout} onCancel={() => { setShowCheckoutModal(false); setCheckoutForm({ gamesPlayed: 0, totalAmount: 0 }); setSelectedBooking(null); }} formatDuration={formatDuration} />}
      {showEditBookingModal && editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Edit Booking</h2>
            </div>
            <form onSubmit={handleUpdateBooking} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-600 mb-1">Players:</div>
                <div className="font-medium text-gray-900">{editingBooking.player1Name}{editingBooking.player2Name && ` vs ${editingBooking.player2Name}`}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Duration/Games</label>
                <input type="text" placeholder="e.g., 2 hours, 5 games, 30 mins" value={editBookingForm.expectedDuration} onChange={(e) => setEditBookingForm({ expectedDuration: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowEditBookingModal(false); setEditingBooking(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && deletingTable && <DeleteModal table={deletingTable} onDelete={async () => { try { await axios.delete(`/api/games/tables/${deletingTable.id}`); setShowDeleteModal(false); setDeletingTable(null); fetchTables(); } catch (error) { console.error('Error deleting table:', error); } }} onCancel={() => { setShowDeleteModal(false); setDeletingTable(null); }} />}
    </div>
  );
}
