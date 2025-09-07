import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from '../utils/axios';
import { z } from "zod";

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
  { key: 'products', label: 'Products' },
  { key: 'sales', label: 'Sales' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'bulk-purchases', label: 'Bulk Purchases' },
  { key: 'returns', label: 'Returns' },
  { key: 'loans', label: 'Loans' },
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

  const { data: employees = [], isLoading, error } = useQuery(
    ["employees"],
    async () => {
      try {
        const response = await api.get('/api/employees', {
          headers: { 'Cache-Control': 'no-cache' }
        });
        console.log('Employees API response:', response.data);
        setApiError(null);
        return Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error('Employees API error:', err);
        setApiError(err.response?.data?.error || err.message || 'Failed to fetch employees');
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

  const { data: branches } = useQuery(
    ["branches"],
    async () => {
      const response = await api.get('/api/branches', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      return response.data || [];
    },
    {
      staleTime: 0,
      cacheTime: 0
    }
  );

  const createEmployee = useMutation(
    async (employeeData) => {
      const response = await api.post('/api/employees', employeeData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["employees"]);
        setIsModalOpen(false);
        resetForm();
        setApiError(null);
      },
      onError: (error) => {
        setApiError(error.response?.data?.error || 'Failed to create employee');
      },
    }
  );

  const updateEmployee = useMutation(
    async ({ id, ...employeeData }) => {
      const response = await api.put(`/api/employees/${id}`, employeeData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["employees"]);
        setIsModalOpen(false);
        resetForm();
        setApiError(null);
      },
      onError: (error) => {
        setApiError(error.response?.data?.error || 'Failed to update employee');
      },
    }
  );

  const deleteEmployee = useMutation(
    async (id) => {
      await api.delete(`/api/employees/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["employees"]);
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
    if (confirm(`Delete employee "${employee.firstName} ${employee.lastName}"?`)) {
      deleteEmployee.mutate(employee.id);
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

  if (isLoading) return <div className="p-4">Loading...</div>;
  
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-800">Employees</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800"
        >
          Add Employee
        </button>
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
            {Array.isArray(employees) && employees.map((employee) => (
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
            ))}
          </tbody>
        </table>
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
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800"
                >
                  {editingEmployee ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;