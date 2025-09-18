import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import DeleteModal from '../components/DeleteModal';
import { FaPlus, FaEdit, FaTrash, FaTable } from 'react-icons/fa';

function Tables() {
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, table: null });
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    location: '',
    status: 'AVAILABLE'
  });

  const queryClient = useQueryClient();

  const { data: tables = [], isLoading } = useQuery(['tables'], async () => {
    const response = await api.get('/api/tables');
    return Array.isArray(response.data) ? response.data : [];
  });

  const createMutation = useMutation(
    (data) => api.post('/api/tables', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tables']);
        resetForm();
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/api/tables/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tables']);
        resetForm();
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/api/tables/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tables']);
        setDeleteModal({ show: false, table: null });
      }
    }
  );

  const resetForm = () => {
    setFormData({
      tableNumber: '',
      capacity: '',
      location: '',
      status: 'AVAILABLE'
    });
    setShowForm(false);
    setEditingTable(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      capacity: parseInt(formData.capacity)
    };

    if (editingTable) {
      updateMutation.mutate({ id: editingTable.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity.toString(),
      location: table.location || '',
      status: table.status
    });
    setShowForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'OCCUPIED': return 'bg-red-100 text-red-800';
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_ORDER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tables Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <FaPlus /> Add Table
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingTable ? 'Edit Table' : 'Add New Table'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Number *
              </label>
              <input
                type="text"
                value={formData.tableNumber}
                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity *
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Ground Floor, Terrace"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="RESERVED">Reserved</option>
                <option value="OUT_OF_ORDER">Out of Order</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {editingTable ? 'Update' : 'Create'} Table
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <FaTable className="text-primary-600" />
                <h3 className="font-semibold text-lg">Table {table.tableNumber}</h3>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(table)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => setDeleteModal({ show: true, table })}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium">{table.capacity} people</span>
              </div>
              
              {table.location && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{table.location}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                  {table.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <FaTable className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">No tables found</h3>
          <p className="text-gray-400 mb-4">Start by adding your first table</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Add Table
          </button>
        </div>
      )}

      <DeleteModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, table: null })}
        onConfirm={() => deleteMutation.mutate(deleteModal.table?.id)}
        title="Delete Table"
        message={`Are you sure you want to delete Table ${deleteModal.table?.tableNumber}? This action cannot be undone.`}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}

export default Tables;