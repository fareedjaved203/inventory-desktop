import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TableSkeleton from '../components/TableSkeleton';
import DeleteModal from '../components/DeleteModal';
import { z } from "zod";
import { debounce } from 'lodash';
import DataStorageManager from '../utils/DataStorageManager';

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
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [isOffline, setIsOffline] = useState(true);

  useEffect(() => {
    setIsOffline(DataStorageManager.getOfflineMode());
  }, []);

  const debouncedSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const { data: branches, isLoading, isFetching, error } = useQuery(
    ["branches", debouncedSearchTerm, currentPage],
    async () => {
      try {
        const result = await API.getBranches({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm
        });
        setApiError(null);
        return result;
      } catch (err) {
        console.error('Branches API error:', err);
        setApiError(err.message || 'Failed to fetch branches');
        return { items: [], total: 0 };
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
      return await API.createBranch(branchData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["branches"]);
        queryClient.refetchQueries(["branches"]);
        setIsModalOpen(false);
        resetForm();
        toast.success('Branch created successfully!');
      },
      onError: (error) => {
        console.error('Create branch error:', error);
        setApiError(error.response?.data?.error || error.message);
      }
    }
  );

  const updateBranch = useMutation(
    async ({ id, ...branchData }) => {
      return await API.updateBranch(id, branchData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["branches"]);
        queryClient.refetchQueries(["branches"]);
        setIsModalOpen(false);
        resetForm();
        toast.success('Branch updated successfully!');
      },
    }
  );

  const deleteBranch = useMutation(
    async (id) => {
      return await API.deleteBranch(id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["branches"]);
        queryClient.refetchQueries(["branches"]);
        toast.success('Branch deleted successfully!');
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
    setBranchToDelete(branch);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (branchToDelete) {
      deleteBranch.mutate(branchToDelete.id);
      setDeleteModalOpen(false);
      setBranchToDelete(null);
    }
  };

  if (isLoading && !debouncedSearchTerm) return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
        <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
      </div>
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
  
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary-800">Branches</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:w-64 pl-10 pr-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 whitespace-nowrap"
          >
            Add Branch
          </button>
        </div>
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
            {(isFetching && debouncedSearchTerm) || (isLoading && debouncedSearchTerm) ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <LoadingSpinner size="w-6 h-6" />
                    <span className="ml-2 text-gray-500">Searching...</span>
                  </div>
                </td>
              </tr>
            ) : (
              branches?.items?.map((branch) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-800">
            Page {currentPage} of {Math.ceil((branches?.total || 0) / itemsPerPage)}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage >= Math.ceil((branches?.total || 0) / itemsPerPage)}
            className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
          >
            Next
          </button>
        </div>
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
                  disabled={createBranch.isLoading || updateBranch.isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(createBranch.isLoading || updateBranch.isLoading) && <LoadingSpinner size="w-4 h-4" />}
                  {editingBranch ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setBranchToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={branchToDelete ? `branch "${branchToDelete.name}"` : ''}
      />
    </div>
  );
}

export default Branches;