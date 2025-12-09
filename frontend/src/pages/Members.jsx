import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { FaPlus, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import MemberForm from '../components/members/MemberForm';
import RenewModal from '../components/members/RenewModal';
import MemberTable from '../components/members/MemberTable';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewingMember, setRenewingMember] = useState(null);
  const [renewDuration, setRenewDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cnic: '',
    membershipType: '',
    membershipPrice: 0,
    totalGames: 0,
    perFrameCharge: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchMembers();
  }, [filter, debouncedSearch, page]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter !== 'all') params.filter = filter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await axios.get('/api/members', { params });
      setMembers(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await axios.put(`/api/members/${editingMember.id}`, formData);
      } else {
        await axios.post('/api/members', formData);
      }
      setShowModal(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
    }
  };

  const openRenewModal = (member) => {
    setRenewingMember(member);
    setRenewDuration(1);
    setShowRenewModal(true);
  };

  const handleRenew = async () => {
    try {
      await axios.post(`/api/members/${renewingMember.id}/renew`, { duration: renewDuration });
      setShowRenewModal(false);
      setRenewingMember(null);
      fetchMembers();
    } catch (error) {
      console.error('Error renewing membership:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this member?')) return;
    try {
      await axios.delete(`/api/members/${id}`);
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', cnic: '', membershipType: '', membershipPrice: 0, totalGames: 0, perFrameCharge: 0 });
    setEditingMember(null);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone,
      cnic: member.cnic || '',
      membershipType: member.membershipType,
      membershipPrice: member.membershipPrice,
      totalGames: member.totalGames,
      perFrameCharge: member.perFrameCharge
    });
    setShowModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Membership Management</h1>
            <p className="text-gray-600 text-sm mt-1">Manage member subscriptions and renewals</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FaPlus /> Add Member
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by name, phone, email or CNIC..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'expired'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? `bg-${f === 'all' ? 'blue' : f === 'active' ? 'green' : 'red'}-600 text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No members found</div>
        ) : (
          <MemberTable members={members} onEdit={openEditModal} onRenew={openRenewModal} onDelete={handleDelete} />
        )}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><FaChevronLeft /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><FaChevronRight /></button>
            </div>
          </div>
        )}
      </div>

      {showModal && <MemberForm formData={formData} setFormData={setFormData} onSubmit={handleSubmit} onCancel={() => { setShowModal(false); resetForm(); }} isEditing={!!editingMember} />}
      {showRenewModal && renewingMember && <RenewModal member={renewingMember} duration={renewDuration} setDuration={setRenewDuration} onRenew={handleRenew} onCancel={() => { setShowRenewModal(false); setRenewingMember(null); }} />}
    </div>
  );
}
