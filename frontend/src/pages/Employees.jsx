import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from '../utils/api';
import { z } from "zod";
import TableSkeleton from '../components/TableSkeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import DeleteModal from '../components/DeleteModal';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  branchId: z.string().min(1, "Branch is required"),
});

const employeeUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
  branchId: z.string().min(1, "Branch is required"),
});

const SIDEBAR_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pos', label: 'POS' },
  { key: 'products', label: 'Products' },
  { key: 'sales', label: 'Sales' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'bulk-purchases', label: 'Bulk Purchases' },
  { key: 'returns', label: 'Returns' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'branches', label: 'Branches' },
  { key: 'employees', label: 'Employees' },
  { key: 'settings', label: 'Settings' },
];

function Employees() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", phone: "", email: "", password: "", branchId: "", permissions: []
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

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

  const { data: employees, isLoading, isFetching, error } = useQuery(
    ["employees", debouncedSearchTerm, currentPage],
    async () => {
      try {
        const result = await API.getEmployees({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm
        });
        setApiError(null);
        return result;
      } catch (err) {
        console.error('Employees API error:', err);
        setApiError(err.message || 'Failed to fetch employees');
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

  const { data: branches } = useQuery(
    ["branches"],
    async () => {
      const result = await API.getBranches({ limit: 1000 });
      return result.items || [];
    },
    {
      staleTime: 0,
      cacheTime: 0
    }
  );

  const createEmployee = useMutation(
    async (employeeData) => {
      return await API.createEmployee(employeeData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["employees"]);
        queryClient.refetchQueries(["employees"]);
        setIsModalOpen(false);
        resetForm();
        setApiError(null);
        toast.success('Employee created successfully!');
      },
      onError: (error) => {
        setApiError(error.response?.data?.error || 'Failed to create employee');
      },
    }
  );

  const updateEmployee = useMutation(
    async ({ id, ...employeeData }) => {
      return await API.updateEmployee(id, employeeData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["employees"]);
        queryClient.refetchQueries(["employees"]);
        setIsModalOpen(false);
        resetForm();
        setApiError(null);
        toast.success('Employee updated successfully!');
      },
      onError: (error) => {
        setApiError(error.response?.data?.error || 'Failed to update employee');
      },
    }
  );

  const deleteEmployee = useMutation(
    async (id) => {
      return await API.deleteEmployee(id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["employees"]);
        queryClient.refetchQueries(["employees"]);
        toast.success('Employee deleted successfully!');
      },
    }
  );

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", phone: "", email: "", password: "", branchId: "", permissions: [] });
    setEditingEmployee(null);
    setValidationErrors({});
    setApiError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      const schema = editingEmployee ? employeeUpdateSchema : employeeSchema;
      const dataToValidate = editingEmployee && !formData.password 
        ? { ...formData, password: undefined }
        : formData;
      
      schema.parse(dataToValidate);
      setValidationErrors({});
      
      if (editingEmployee) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        updateEmployee.mutate({ id: editingEmployee.id, ...updateData });
      } else {
        createEmployee.mutate(formData);
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

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      phone: employee.phone,
      email: employee.email,
      password: "",
      branchId: employee.branchId,
      permissions: employee.permissions || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      deleteEmployee.mutate(employeeToDelete.id);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handlePermissionChange = (permission, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  if (isLoading && !debouncedSearchTerm) return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
        <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
      </div>
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
  
  if (error || apiError) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading employees</h3>
          <p className="text-red-600 text-sm mt-1">
            {apiError || error?.response?.data?.error || error?.message || 'Failed to load employees'}
          </p>
          <button 
            onClick={() => {
              setApiError(null);
              queryClient.invalidateQueries(["employees"]);
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
        <h1 className="text-3xl font-bold text-primary-800">Employees</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search employees..."
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
            Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Branch</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(isFetching && debouncedSearchTerm) || (isLoading && debouncedSearchTerm) ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <LoadingSpinner size="w-6 h-6" />
                    <span className="ml-2 text-gray-500">Searching...</span>
                  </div>
                </td>
              </tr>
            ) : (
              employees?.items?.map((employee) => (
                <tr key={employee.id} className="hover:bg-primary-50">
                  <td className="px-6 py-4 font-medium text-primary-700">
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{employee.email}</td>
                  <td className="px-6 py-4 text-gray-700">{employee.phone}</td>
                  <td className="px-6 py-4 text-gray-700">{employee.branch?.name}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {Array.isArray(employee.permissions) ? employee.permissions.length : 0} permissions
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(employee)}
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
            Page {currentPage} of {Math.ceil((employees?.total || 0) / itemsPerPage)}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage >= Math.ceil((employees?.total || 0) / itemsPerPage)}
            className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingEmployee ? "Edit Employee" : "Add Employee"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {validationErrors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {validationErrors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                )}
                {apiError && apiError.includes('email') && (
                  <p className="text-red-500 text-sm mt-1">{apiError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingEmployee && "(leave empty to keep current)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {validationErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Branch</option>
                  {(branches || []).map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {validationErrors.branchId && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.branchId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
                  {SIDEBAR_PERMISSIONS.map((permission) => (
                    <label key={permission.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.key)}
                        onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">{permission.label}</span>
                    </label>
                  ))}
                </div>
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
                  disabled={createEmployee.isLoading || updateEmployee.isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(createEmployee.isLoading || updateEmployee.isLoading) && <LoadingSpinner size="w-4 h-4" />}
                  {editingEmployee ? "Update" : "Create"}
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
          setEmployeeToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={employeeToDelete ? `employee "${employeeToDelete.firstName} ${employeeToDelete.lastName}"` : ''}
      />
    </div>
  );
}

export default Employees;