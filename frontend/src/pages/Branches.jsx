import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  code: z.string().min(1, "Branch code is required"),
  location: z.string().min(1, "Location is required"),
});

function Branches() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", location: "" });
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const { data: branches = [], isLoading, error } = useQuery(
    ["branches"],
    async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/branches`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        console.log('Branches API response:', response.data);
        setApiError(null);
        return Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error('Branches API error:', err);
        setApiError(err.response?.data?.error || err.message || 'Failed to fetch branches');
        return [];
      }
    },
    {
      retry: 1,
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: false
    }
  );

  const createBranch = useMutation(
    async (branchData) => {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/branches`, branchData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["branches"]);
        setIsModalOpen(false);
        resetForm();
      },
      onError: (error) => {
        console.error('Create branch error:', error);
        setApiError(error.response?.data?.error || error.message);
      }
    }
  );

  const updateBranch = useMutation(
    async ({ id, ...branchData }) => {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/branches/${id}`, branchData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["branches"]);
        setIsModalOpen(false);
        resetForm();
      },
    }
  );

  const deleteBranch = useMutation(
    async (id) => {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/branches/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["branches"]);
      },
    }
  );

  const resetForm = () => {
    setFormData({ name: "", code: "", location: "" });
    setEditingBranch(null);
    setValidationErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      branchSchema.parse(formData);
      setValidationErrors({});
      
      if (editingBranch) {
        updateBranch.mutate({ id: editingBranch.id, ...formData });
      } else {
        createBranch.mutate(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({ name: branch.name, code: branch.code, location: branch.location });
    setIsModalOpen(true);
  };

  const handleDelete = (branch) => {
    if (confirm(`Delete branch "${branch.name}"?`)) {
      deleteBranch.mutate(branch.id);
    }
  };

  if (isLoading) return <div className="p-4">Loading...</div>;
  
  if (error || apiError) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading branches</h3>
          <p className="text-red-600 text-sm mt-1">
            {apiError || error?.response?.data?.error || error?.message || 'Failed to load branches'}
          </p>
          <button 
            onClick={() => {
              setApiError(null);
              queryClient.invalidateQueries(["branches"]);
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-800">Branches</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800"
        >
          Add Branch
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Employees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(branches) && branches.map((branch) => (
              <tr key={branch.id} className="hover:bg-primary-50">
                <td className="px-6 py-4 font-medium text-primary-700">{branch.name}</td>
                <td className="px-6 py-4 text-gray-700">{branch.code}</td>
                <td className="px-6 py-4 text-gray-700">{branch.location}</td>
                <td className="px-6 py-4 text-gray-700">{Array.isArray(branch.employees) ? branch.employees.length : 0}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(branch)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(branch)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingBranch ? "Edit Branch" : "Add Branch"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {validationErrors.code && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.code}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {validationErrors.location && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.location}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800"
                >
                  {editingBranch ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Branches;