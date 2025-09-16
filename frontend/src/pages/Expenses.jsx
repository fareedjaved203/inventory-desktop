import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/axios';
import { z } from 'zod';
import DeleteModal from '../components/DeleteModal';
import TableSkeleton from '../components/TableSkeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import { debounce } from 'lodash';
import { formatPakistaniCurrency } from '../utils/formatCurrency';
import { FaSearch, FaDollarSign, FaReceipt, FaCalendarAlt, FaTag } from 'react-icons/fa';

const expenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  receiptNumber: z.string().optional(),
  contactId: z.union([z.string(), z.null(), z.undefined()]).optional(),
  productId: z.union([z.string(), z.null(), z.undefined()]).optional(),
});

const expenseCategories = [
  'Office Supplies',
  'Utilities',
  'Electricity',
  'Gas',
  'Rent',
  'Transportation',
  'Marketing',
  'Equipment',
  'Maintenance',
  'Insurance',
  'Professional Services',
  'Bank Charges',
  'Taxes',
  'Employee Salaries',
  'Inventory Purchase',
  'Other'
];

const paymentMethods = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Cheque',
  'Online Payment'
];

function Expenses() {
  const queryClient = useQueryClient();
  const searchInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [validationErrors, setValidationErrors] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    paymentMethod: '',
    receiptNumber: '',
    contactId: '',
    contactName: '',
    productId: '',
    productName: '',
  });
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [debouncedContactSearchTerm, setDebouncedContactSearchTerm] = useState('');
  const [createNewContact, setCreateNewContact] = useState(false);
  const [newContactData, setNewContactData] = useState({ name: '', phoneNumber: '', address: '' });
  const [creatingContact, setCreatingContact] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [debouncedProductSearchTerm, setDebouncedProductSearchTerm] = useState('');

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

  const { data: expenses, isLoading, isFetching } = useQuery(
    ['expenses', debouncedSearchTerm, currentPage],
    async () => {
      const response = await api.get(
        `/api/expenses?page=${currentPage}&limit=${itemsPerPage}&search=${debouncedSearchTerm}`
      );
      return response.data;
    }
  );

  // Debounced contact search
  const debouncedContactSearch = useCallback(
    debounce((term) => {
      setDebouncedContactSearchTerm(term);
    }, 300),
    []
  );

  const handleContactSearchChange = (value) => {
    setContactSearchTerm(value);
    debouncedContactSearch(value);
  };

  const { data: contacts = [], isLoading: contactsLoading } = useQuery(
    ['contacts', debouncedContactSearchTerm],
    async () => {
      const searchParam = debouncedContactSearchTerm
        ? `&search=${debouncedContactSearchTerm}`
        : '';
      const response = await api.get(`/api/contacts?limit=100${searchParam}`);
      return Array.isArray(response.data) ? response.data : response.data?.items || [];
    }
  );

  // Debounced product search
  const debouncedProductSearch = useCallback(
    debounce((term) => {
      setDebouncedProductSearchTerm(term);
    }, 300),
    []
  );

  const handleProductSearchChange = (value) => {
    setProductSearchTerm(value);
    debouncedProductSearch(value);
  };

  const { data: rawMaterials = [], isLoading: rawMaterialsLoading } = useQuery(
    ['raw-materials', debouncedProductSearchTerm],
    async () => {
      const searchParam = debouncedProductSearchTerm
        ? `&search=${debouncedProductSearchTerm}`
        : '';
      const response = await api.get(`/api/products/raw-materials?limit=100${searchParam}`);
      return Array.isArray(response.data) ? response.data : response.data?.items || [];
    },
    {
      enabled: formData.category === 'Raw Materials'
    }
  );

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [expenses]);

  const createExpense = useMutation(
    async (expenseData) => {
      const response = await api.post('/api/expenses', expenseData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['expenses']);
        setIsModalOpen(false);
        resetForm();
        toast.success('Expense created successfully!');
      },
      onError: (error) => {
        setValidationErrors({
          amount: error.response?.data?.error || 'Failed to create expense'
        });
      }
    }
  );

  const updateExpense = useMutation(
    async (updatedExpense) => {
      const response = await api.put(
        `/api/expenses/${updatedExpense.id}`,
        updatedExpense
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['expenses']);
        setIsModalOpen(false);
        resetForm();
        toast.success('Expense updated successfully!');
      },
      onError: (error) => {
        setValidationErrors({
          amount: error.response?.data?.error || 'Failed to update expense'
        });
      }
    }
  );

  const deleteExpense = useMutation(
    async (expenseId) => {
      const response = await api.delete(`/api/expenses/${expenseId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['expenses']);
        setDeleteModalOpen(false);
        setExpenseToDelete(null);
        toast.success('Expense deleted successfully!');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      paymentMethod: '',
      receiptNumber: '',
      contactId: '',
      contactName: '',
      productId: '',
      productName: '',
    });
    setEditingExpense(null);
    setValidationErrors({});
    setContactSearchTerm('');
    setProductSearchTerm('');
    setCreateNewContact(false);
    setNewContactData({ name: '', phoneNumber: '', address: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let contactId = formData.contactId;
    
    // Create new contact if checkbox is checked AND contact data is complete
    if (createNewContact && newContactData.name && newContactData.phoneNumber) {
      try {
        setCreatingContact(true);
        const contactResponse = await api.post('/api/contacts', newContactData);
        contactId = contactResponse.data.id;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to create contact';
        setValidationErrors({ contact: errorMessage });
        return;
      } finally {
        setCreatingContact(false);
      }
    }
    // If createNewContact is checked but data is incomplete, proceed without contact
    
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      contactId: contactId || null,
      productId: formData.productId || null,
    };

    try {
      expenseSchema.parse(expenseData);
      setValidationErrors({});

      if (editingExpense) {
        updateExpense.mutate({ ...expenseData, id: editingExpense.id });
      } else {
        createExpense.mutate(expenseData);
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

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      date: new Date(expense.date).toISOString().split('T')[0],
      category: expense.category,
      description: expense.description || '',
      paymentMethod: expense.paymentMethod || '',
      receiptNumber: expense.receiptNumber || '',
      contactId: expense.contactId || '',
      contactName: expense.contact?.name || '',
      productId: expense.productId || '',
      productName: expense.product?.name || '',
    });
    setContactSearchTerm(expense.contact?.name || '');
    setProductSearchTerm(expense.product?.name || '');
    setIsModalOpen(true);
  };

  const handleDelete = (expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      deleteExpense.mutate(expenseToDelete.id);
    }
  };

  if (isLoading && !debouncedSearchTerm) return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="h-10 bg-gray-300 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
      </div>
      <TableSkeleton rows={10} columns={6} />
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800">Expenses</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:w-64 pl-10 pr-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <FaSearch />
            </div>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              resetForm();
            }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap flex items-center gap-2"
          >
            <FaDollarSign />
            Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider hidden lg:table-cell">Payment Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isFetching && debouncedSearchTerm ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <LoadingSpinner size="w-6 h-6" />
                    <span className="ml-2 text-gray-500">Searching...</span>
                  </div>
                </td>
              </tr>
            ) : (
              expenses?.items?.map((expense) => (
                <tr key={expense.id} className="hover:bg-primary-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-primary-700">{expense.category}</div>
                    {expense.product?.name && (
                      <div className="text-sm text-gray-600">{expense.product.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">
                    {formatPakistaniCurrency(expense.amount)}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell text-gray-600">
                    {expense.description || '-'}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell text-gray-600">
                    {expense.paymentMethod || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
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
            Page {currentPage} of {Math.ceil((expenses?.total || 0) / itemsPerPage)}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage >= Math.ceil((expenses?.total || 0) / itemsPerPage)}
            className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md h-[90vh] shadow-xl border border-gray-200 flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
                <FaDollarSign className="text-primary-600" />
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-2">
              <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaDollarSign className="text-primary-500" /> Amount *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter amount"
                />
                {validationErrors.amount && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaCalendarAlt className="text-primary-500" /> Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {validationErrors.date && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaTag className="text-primary-500" /> Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value, productId: '', productName: '' });
                    setProductSearchTerm('');
                  }}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Category</option>
                  {expenseCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>
                )}
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Optional description"
                />
              </div>

                            <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Vendor/Supplier</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="createNewContact"
                      checked={createNewContact}
                      onChange={(e) => {
                        setCreateNewContact(e.target.checked);
                        if (e.target.checked) {
                          setFormData({ ...formData, contactId: '', contactName: '' });
                          setContactSearchTerm('');
                        } else {
                          setNewContactData({ name: '', phoneNumber: '', address: '' });
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="createNewContact" className="text-sm text-gray-600">
                      Add New Contact
                    </label>
                  </div>
                </div>
                {createNewContact ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newContactData.name}
                      onChange={(e) => setNewContactData({ ...newContactData, name: e.target.value })}
                      placeholder="Contact name *"
                      className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={newContactData.phoneNumber}
                      onChange={(e) => setNewContactData({ ...newContactData, phoneNumber: e.target.value })}
                      placeholder="Phone number *"
                      className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={newContactData.address}
                      onChange={(e) => setNewContactData({ ...newContactData, address: e.target.value })}
                      placeholder="Address (optional)"
                      className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={contactSearchTerm}
                      onChange={(e) => {
                        handleContactSearchChange(e.target.value);
                        if (!e.target.value) {
                          setFormData({ ...formData, contactId: '', contactName: '' });
                        }
                      }}
                      placeholder="Type to search vendor (optional)"
                      className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {contactSearchTerm && !formData.contactId && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-primary-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {contactsLoading ? (
                            <div className="px-4 py-3 flex items-center justify-center">
                              <LoadingSpinner size="w-4 h-4" />
                              <span className="ml-2 text-gray-500 text-sm">Searching...</span>
                            </div>
                          ) : contacts?.length > 0 ? (
                            contacts.map((contact) => (
                              <div
                                key={contact.id}
                                onClick={() => {
                                  setFormData({ ...formData, contactId: contact.id, contactName: contact.name });
                                  setContactSearchTerm(contact.name);
                                }}
                                className="px-4 py-2 cursor-pointer hover:bg-primary-50"
                              >
                                <div className="font-medium">{contact.name}</div>
                                {contact.phoneNumber && (
                                  <div className="text-sm text-gray-600">
                                    {contact.phoneNumber}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-sm">
                              No contacts found
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}
                {validationErrors.contact && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.contact}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Payment Method</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaReceipt className="text-primary-500" /> Receipt Number
                </label>
                <input
                  type="text"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional receipt number"
                />
              </div>

              </form>
            </div>
            <div className="flex-shrink-0 mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
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
                form="expense-form"
                disabled={createExpense.isLoading || updateExpense.isLoading || creatingContact}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(createExpense.isLoading || updateExpense.isLoading || creatingContact) && <LoadingSpinner size="w-4 h-4" />}
                {editingExpense ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={expenseToDelete ? `expense "${expenseToDelete.category}"` : ''}
      />
    </div>
  );
}

export default Expenses;