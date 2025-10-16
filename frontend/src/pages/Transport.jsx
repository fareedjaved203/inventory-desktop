import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaTruck } from 'react-icons/fa';

function Transport() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransport, setEditingTransport] = useState(null);
  const [formData, setFormData] = useState({
    carNumber: '',
    driverName: ''
  });

  const queryClient = useQueryClient();

  const { data: transportData, isLoading } = useQuery(['transport'], async () => {
    return await API.getTransport();
  });

  const createMutation = useMutation(API.createTransport, {
    onSuccess: () => {
      queryClient.invalidateQueries(['transport']);
      toast.success('Transport record created successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation(
    ({ id, data }) => API.updateTransport(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['transport']);
        toast.success('Transport record updated successfully');
        resetForm();
      },
      onError: (error) => {
        toast.error(error.message);
      }
    }
  );

  const deleteMutation = useMutation(API.deleteTransport, {
    onSuccess: () => {
      queryClient.invalidateQueries(['transport']);
      toast.success('Transport record deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      carNumber: '',
      driverName: ''
    });
    setShowForm(false);
    setEditingTransport(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingTransport) {
      updateMutation.mutate({ id: editingTransport.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (transport) => {
    setEditingTransport(transport);
    setFormData({
      carNumber: transport.carNumber,
      driverName: transport.driverName
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this transport record?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaTruck className="text-blue-600" />
          Transport Management
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Add Transport
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingTransport ? 'Edit Transport' : 'Add New Transport'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Car Number *
              </label>
              <input
                type="text"
                value={formData.carNumber}
                onChange={(e) => setFormData({ ...formData, carNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Name (Optional)
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {editingTransport ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Car Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transportData?.items?.map((transport) => (
                <tr key={transport.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transport.carNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transport.driverName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(transport)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(transport.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Transport;