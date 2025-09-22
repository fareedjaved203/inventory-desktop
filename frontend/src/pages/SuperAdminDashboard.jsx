import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';
import TableSkeleton from '../components/TableSkeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import DeleteModal from '../components/DeleteModal';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const userType = localStorage.getItem('userType');
  
  if (userType !== 'superadmin') {
    window.location.replace('/');
    return null;
  }
  
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: ''
  });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [deleting, setDeleting] = useState(false);

  const { data: usersData, isLoading, error, refetch, isFetching } = useQuery(
    ['super-admin-users', currentPage, pageSize],
    async () => {
      const response = await api.get(`/api/super-admin/users?page=${currentPage}&limit=${pageSize}`);
      return response.data;
    },
    {
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  );

  const users = usersData?.users || [];
  const totalPages = usersData?.totalPages || 1;
  const totalUsers = usersData?.total || 0;

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    try {
      await api.post('/api/super-admin/create-user', formData);
      setMessage('User created successfully!');
      setFormData({ email: '', password: '', companyName: '' });
      setShowCreateForm(false);
      queryClient.invalidateQueries(['super-admin-users']);
      toast.success('User created successfully!');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    
    setDeleting(true);
    try {
      await api.delete(`/api/super-admin/users/${deleteModal.user.id}`);
      toast.success('User deleted successfully!');
      setDeleteModal({ isOpen: false, user: null });
      
      // Force immediate refetch of user list
      await queryClient.invalidateQueries(['super-admin-users']);
      await refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-300 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-40 animate-pulse"></div>
        </div>
        <TableSkeleton rows={5} columns={10} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Total Users: {totalUsers}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isFetching && <LoadingSpinner size="w-4 h-4" />}
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create New User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-100 relative">
        {isFetching && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <LoadingSpinner size="w-8 h-8" />
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Products</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Inventory</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Branches</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Employees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Sales</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">License Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">License Start</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">License End</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-primary-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-700">{user.companyName || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{user.stats.products}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{user.stats.inventory}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{user.stats.branches}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{user.stats.employees}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{user.stats.sales}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.licenseType === 'LIFETIME' ? 'bg-purple-100 text-purple-800' :
                    user.licenseType === '1_YEAR' ? 'bg-blue-100 text-blue-800' :
                    user.licenseType === '30_DAYS' ? 'bg-green-100 text-green-800' :
                    user.licenseDuration ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.licenseType === 'LIFETIME' ? 'Lifetime' :
                     user.licenseType === '1_YEAR' ? '1 Year' :
                     user.licenseType === '30_DAYS' ? '30 Days' :
                     user.licenseDuration || user.licenseType || 'Trial'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {user.licenseStartDate ? new Date(user.licenseStartDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {user.licenseEndDate ? new Date(user.licenseEndDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, user })}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-2 border rounded-md bg-blue-50 text-blue-600">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create New Admin User</h2>
            
            <form onSubmit={handleCreateUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {message && (
                <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDeleteUser}
        itemName={deleteModal.user ? `${deleteModal.user.companyName || deleteModal.user.email} and all associated data` : ''}
        loading={deleting}
      />
    </div>
  );
}