import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { useForm } from 'react-hook-form';
import DeleteModal from '../components/DeleteModal';
import TableSkeleton from '../components/TableSkeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomerStatementPDF from '../components/CustomerStatementPDF';
import StatementPDFPreferencesModal from '../components/StatementPDFPreferencesModal';
import UrduStatementHTML from '../components/UrduStatementHTML';
import { debounce } from 'lodash';
import { FaSearch, FaBuilding, FaMapMarkerAlt, FaPhone, FaUserPlus, FaDollarSign, FaFileAlt } from 'react-icons/fa';
import { formatPakistaniCurrency } from '../utils/formatCurrency';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';
import { PDFDownloadLink } from '@react-pdf/renderer';
import DataStorageManager from '../utils/DataStorageManager';

function Contacts() {
  const queryClient = useQueryClient();
  const searchInputRef = useRef(null);
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState('GIVEN');
  const [loanDescription, setLoanDescription] = useState('');
  const [loanTransactions, setLoanTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('given');
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');
  const [statementData, setStatementData] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);
  const [contactTypeFilter, setContactTypeFilter] = useState('');
  const [showStatementPDFPreferences, setShowStatementPDFPreferences] = useState(false);
  const [statementPdfPreferences, setStatementPdfPreferences] = useState({});
  const [generatingStatement, setGeneratingStatement] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

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

  // Fetch contacts with React Query
  const { data: contactsData, isLoading, isFetching, error } = useQuery(
    ['contacts', page, debouncedSearchTerm, contactTypeFilter],
    async () => {
      return await API.getContacts({
        page: page.toString(),
        search: debouncedSearchTerm,
        contactType: contactTypeFilter
      });
    }
  );

  // Maintain search input focus
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [contactsData]);

  // Fetch shop settings with stale time to ensure they're always available
  const { data: shopSettingsData } = useQuery(
    ['shop-settings'],
    async () => {
      return await API.getShopSettings();
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 3
    }
  );

  // Listen for sync events to refresh data
  useEffect(() => {
    const handleSyncComplete = () => {
      queryClient.invalidateQueries(['contacts']);
    };

    window.addEventListener('contactsSyncComplete', handleSyncComplete);
    return () => window.removeEventListener('contactsSyncComplete', handleSyncComplete);
  }, [queryClient]);

  // Cache shop settings in localStorage whenever they're loaded
  useEffect(() => {
    if (shopSettingsData) {
      localStorage.setItem('shopSettings', JSON.stringify(shopSettingsData));
    }
  }, [shopSettingsData]);

  // Create contact mutation
  const createContact = useMutation(
    async (data) => {
      return await API.createContact(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contacts']);
        setShowAddModal(false);
        setSelectedContact(null);
        reset();
        toast.success('Contact created successfully!');
      },
      onError: (error) => {
        return error.response?.data?.error || 'Failed to create contact';
      }
    }
  );

  // Update contact mutation
  const updateContact = useMutation(
    async ({ id, data }) => {
      return await API.updateContact(id, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contacts']);
        setShowAddModal(false);
        setSelectedContact(null);
        reset();
        toast.success('Contact updated successfully!');
      },
      onError: (error) => {
        return error.response?.data?.error || 'Failed to update contact';
      }
    }
  );

  // Delete contact mutation
  const deleteContact = useMutation(
    async (id) => {
      return await API.deleteContact(id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contacts']);
        setShowDeleteModal(false);
        setSelectedContact(null);
        setDeleteError(null);
        toast.success('Contact deleted successfully!');
      },
      onError: (error) => {
        setDeleteError(error.response?.data?.error || 'Failed to delete contact');
      }
    }
  );

  // Fetch loan transactions for selected contact
  const { data: loanData } = useQuery(
    ['loan-transactions', selectedContact?.id],
    async () => {
      if (!selectedContact?.id) return null;
      return await API.getLoanTransactions({ contactId: selectedContact.id });
    },
    { enabled: !!selectedContact?.id && showLoanModal }
  );

  // Create loan transaction mutation
  const createLoanTransaction = useMutation(
    async (data) => {
      return await API.createLoanTransaction({ ...data, contactId: selectedContact.id });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['loan-transactions', selectedContact?.id]);
        setLoanAmount('');
        setLoanDescription('');
      }
    }
  );

  // Delete loan transaction mutation
  const deleteLoanTransaction = useMutation(
    async (transactionId) => {
      return await API.deleteLoanTransaction(transactionId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['loan-transactions', selectedContact?.id]);
      }
    }
  );

  // Fetch customer statement data
  const fetchStatementData = async (contactId, startDate, endDate) => {
    // Get contact details - use the selectedContact directly since we already have it
    const contact = selectedContact;
    
    // Get all sales for this contact
    const salesResult = await API.getSales({ limit: 1000 });
    const contactSales = salesResult.items.filter(sale => sale.contactId === contactId);
    
    // Get all transports to link with sales
    const transportsResult = await API.getTransport({ limit: 1000 });
    const transports = transportsResult.items || [];
    
    // Get loan transactions for this contact
    const loanResult = await API.getLoanTransactions({ contactId });
    const loanTransactions = loanResult.transactions || [];
    
    // Filter by date range if provided
    let filteredSales = contactSales;
    let filteredLoans = loanTransactions;
    
    if (startDate) {
      const start = new Date(startDate);
      filteredSales = filteredSales.filter(sale => new Date(sale.saleDate) >= start);
      filteredLoans = filteredLoans.filter(loan => new Date(loan.date || loan.createdAt) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      filteredSales = filteredSales.filter(sale => new Date(sale.saleDate) <= end);
      filteredLoans = filteredLoans.filter(loan => new Date(loan.date || loan.createdAt) <= end);
    }
    
    // Combine and sort transactions by date
    const allTransactions = [
      ...filteredSales.map(sale => {
        // Find the transport for this sale
        const transport = transports.find(t => t.id === sale.transportId);
        
        return {
          date: sale.saleDate,
          type: 'sale',
          description: `Sale #${sale.billNumber}`,
          saleDescription: sale.description || '',
          quantity: sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
          unitPrice: sale.items?.[0]?.price || 0,
          carNumber: transport?.carNumber || '',
          loadingDate: sale.loadingDate || '',
          arrivalDate: sale.arrivalDate || '',
          debit: Number(sale.totalAmount) || 0, // Total sale amount increases customer debt
          credit: Number(sale.paidAmount) || 0, // Amount paid by customer reduces debt
          balance: 0 // Will be calculated
        };
      }),
      ...filteredLoans.map(loan => {
        let debit = 0, credit = 0;
        if (loan.type === 'GIVEN') {
          debit = Number(loan.amount) || 0; // Money given to customer increases their debt to us
        } else if (loan.type === 'TAKEN') {
          credit = Number(loan.amount) || 0; // Money taken from customer reduces their debt (we owe them)
        } else if (loan.type === 'RETURNED_BY_CONTACT') {
          credit = Number(loan.amount) || 0; // Customer returned money, reduces their debt
        } else if (loan.type === 'RETURNED_TO_CONTACT') {
          debit = Number(loan.amount) || 0; // We returned money to customer, increases their debt
        }
        
        return {
          date: loan.date || loan.createdAt,
          type: 'loan',
          description: loan.description || `Loan ${loan.type}`,
          debit,
          credit,
          balance: 0 // Will be calculated
        };
      })
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate running balance
    let runningBalance = 0;
    allTransactions.forEach(transaction => {
      runningBalance += (transaction.debit || 0) - (transaction.credit || 0);
      transaction.balance = runningBalance;
    });
    
    return {
      contact: contact || { name: 'Unknown Contact', phoneNumber: '', address: '' },
      openingBalance: 0,
      closingBalance: runningBalance,
      transactions: allTransactions,
      startDate,
      endDate
    };
  };

  const onSubmit = (data) => {
    if (selectedContact) {
      updateContact.mutate({ id: selectedContact.id, data });
    } else {
      createContact.mutate(data);
    }
  };

  const handleDelete = () => {
    if (selectedContact) {
      deleteContact.mutate(selectedContact.id);
    }
  };

  const handleEdit = (contact) => {
    setSelectedContact(contact);
    setValue('name', contact.name);
    setValue('address', contact.address);
    setValue('phoneNumber', contact.phoneNumber);
    setValue('contactType', contact.contactType || 'customer');
    setShowAddModal(true);
  };

  const handleAddLoan = () => {
    if (!loanAmount || parseFloat(loanAmount) <= 0) return;
    
    createLoanTransaction.mutate({
      amount: parseFloat(loanAmount),
      type: loanType,
      description: loanDescription
    });
  };

  const handleGenerateStatement = async () => {
    if (!selectedContact) return;
    
    try {
      setGeneratingStatement(true);
      
      // Ensure shop settings are loaded - try multiple sources
      let currentShopSettings = shopSettingsData;
      if (!currentShopSettings) {
        try {
          // Try API first
          currentShopSettings = await API.getShopSettings();
        } catch (error) {
          console.warn('Could not fetch shop settings from API, trying cache');
          try {
            // Try from query cache
            const cachedSettings = queryClient.getQueryData(['shop-settings']);
            if (cachedSettings) {
              currentShopSettings = cachedSettings;
            } else {
              // Try localStorage as fallback
              const localSettings = localStorage.getItem('shopSettings');
              if (localSettings) {
                currentShopSettings = JSON.parse(localSettings);
              }
            }
          } catch (cacheError) {
            console.warn('Could not get shop settings from cache either');
            currentShopSettings = null;
          }
        }
      }
      
      // Cache settings in localStorage for offline use
      if (currentShopSettings) {
        localStorage.setItem('shopSettings', JSON.stringify(currentShopSettings));
      }
      
      const data = await fetchStatementData(selectedContact.id, statementStartDate, statementEndDate);
      setStatementData(data);
      setShopSettings(currentShopSettings);
    } catch (error) {
      console.error('Error fetching statement data:', error);
      toast.error('Failed to generate statement');
    } finally {
      setGeneratingStatement(false);
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
      <TableSkeleton rows={10} columns={4} />
    </div>
  );
  if (error) return (
    <div className="p-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error.message || 'Failed to fetch contacts'}</span>
      </div>
    </div>
  );

  return (
    <div className={`p-6 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800">{t('contacts')}</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('searchContacts')}
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:w-48 md:w-64 pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <FaSearch />
            </div>
          </div>
          <select
            value={contactTypeFilter}
            onChange={(e) => setContactTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Contacts</option>
            <option value="customer">Customers</option>
            <option value="supplier">Suppliers</option>
          </select>
          <button
            onClick={() => {
              setShowAddModal(true);
              setSelectedContact(null);
              reset();
            }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap flex items-center gap-2 w-full sm:w-auto"
          >
            <FaUserPlus />
            Add Contact
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-100">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                {t('name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                {t('type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                {t('address')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                {t('phoneNumber')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isFetching && debouncedSearchTerm ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <LoadingSpinner size="w-6 h-6" />
                    <span className="ml-2 text-gray-500">Searching...</span>
                  </div>
                </td>
              </tr>
            ) : (
              contactsData?.items?.map((contact) => (
              <tr key={contact.id} className="hover:bg-primary-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-700">{contact.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    (contact.contactType || 'customer') === 'customer' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {(contact.contactType || 'customer') === 'customer' ? 'Customer' : 'Supplier'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{contact.address || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{contact.phoneNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowLoanModal(true);
                      }}
                      className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('loans')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowStatementModal(true);
                        setStatementStartDate('');
                        setStatementEndDate('');
                        setStatementData(null);
                        // Load PDF preferences
                        const saved = localStorage.getItem('statementPdfPreferences');
                        if (saved) {
                          setStatementPdfPreferences(JSON.parse(saved));
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <FaFileAlt className="w-4 h-4" />
                      {t('statement')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      {t('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-primary-100 text-primary-700 px-4 py-2 rounded hover:bg-primary-200 disabled:opacity-50 border border-primary-200"
        >
          {t('previous')}
        </button>
        <span className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-800">
          {language === 'ur' ? `صفحہ ${page} از ${contactsData?.totalPages || 1}` : `Page ${page} of ${contactsData?.totalPages || 1}`}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(contactsData?.totalPages || 1, p + 1))}
          disabled={page === (contactsData?.totalPages || 1)}
          className="bg-primary-100 text-primary-700 px-4 py-2 rounded hover:bg-primary-200 disabled:opacity-50 border border-primary-200"
        >
          {t('next')}
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
              <FaBuilding className="text-primary-600" />
              {selectedContact ? t('editContact') : t('addNewContact')}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaBuilding className="text-primary-500" /> {t('name')}
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contactType')}
                  </label>
                  <select
                    {...register('contactType')}
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                  </select>
                  {errors.contactType && (
                    <p className="text-red-500 text-sm mt-1">{errors.contactType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaMapMarkerAlt className="text-primary-500" /> {t('address')}
                  </label>
                  <textarea
                    {...register('address')}
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows="3"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaPhone className="text-primary-500" /> {t('phoneNumber')}
                  </label>
                  <input
                    {...register('phoneNumber', { 
                      required: 'Phone number is required',
                      maxLength: {
                        value: 11,
                        message: 'Phone number must not exceed 11 characters'
                      },
                      pattern: {
                        value: /^[0-9]+$/,
                        message: 'Phone number must contain only numbers'
                      }
                    })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedContact(null);
                    reset();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createContact.isLoading || updateContact.isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(createContact.isLoading || updateContact.isLoading) && <LoadingSpinner size="w-4 h-4" />}
                  {selectedContact ? t('update') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedContact && (
        <DeleteModal
          isOpen={showDeleteModal}
          itemName={selectedContact.name}
          onConfirm={handleDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedContact(null);
            setDeleteError(null);
          }}
          error={deleteError}
        />
      )}

      {/* Loan Tracking Modal */}
      {showLoanModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl h-[90vh] shadow-xl border border-gray-200 flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
                <FaDollarSign className="text-green-600" />
                {language === 'ur' ? 'قرض کی نگرانی' : 'Loan Tracking'} - {selectedContact.name}
              </h2>
              
              {/* Tabs */}
              <div className="flex space-x-1 mb-6">
                <button
                  onClick={() => {
                    setActiveTab('given');
                    setLoanType('GIVEN');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'given'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {language === 'ur' ? 'دیا گیا قرض' : 'Loan Given'}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('taken');
                    setLoanType('TAKEN');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'taken'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {language === 'ur' ? 'لیا گیا قرض' : 'Loan Taken'}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-1 py-2">
              {/* Money Given Tab */}
              {activeTab === 'given' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="text-sm font-medium text-green-700">Total Loan Given</h3>
                      <p className="text-2xl font-bold text-green-800">
                        {formatPakistaniCurrency(loanData?.totalGiven || 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h3 className="text-sm font-medium text-purple-700">Loan Returned by {selectedContact.name}</h3>
                      <p className="text-2xl font-bold text-purple-800">
                        {formatPakistaniCurrency(loanData?.totalReturnedByContact || 0)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Outstanding Balance */}
                  <div className={`p-4 rounded-lg border ${
                    (loanData?.totalGiven || 0) - (loanData?.totalReturnedByContact || 0) >= 0
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <h3 className={`text-sm font-medium ${
                      (loanData?.totalGiven || 0) - (loanData?.totalReturnedByContact || 0) >= 0
                        ? 'text-yellow-700'
                        : 'text-green-700'
                    }`}>
                      {(loanData?.totalGiven || 0) - (loanData?.totalReturnedByContact || 0) >= 0
                        ? `${selectedContact.name} has to pay you`
                        : `You have to pay ${selectedContact.name}`
                      }
                    </h3>
                    <p className={`text-xl font-bold ${
                      (loanData?.totalGiven || 0) - (loanData?.totalReturnedByContact || 0) >= 0
                        ? 'text-yellow-800'
                        : 'text-green-800'
                    }`}>
                      {formatPakistaniCurrency(Math.abs((loanData?.totalGiven || 0) - (loanData?.totalReturnedByContact || 0)))}
                    </p>
                  </div>

                  {/* Add Transaction */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-medium mb-4 text-green-800">Add Transaction</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={loanType}
                          onChange={(e) => setLoanType(e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="GIVEN">Give Loan</option>
                          <option value="RETURNED_BY_CONTACT">Received Back</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="number"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={loanDescription}
                          onChange={(e) => setLoanDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Optional note"
                        />
                      </div>
                      <div className="self-end">
                        <button
                          onClick={handleAddLoan}
                          disabled={createLoanTransaction.isLoading}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {createLoanTransaction.isLoading && <LoadingSpinner size="w-4 h-4" />}
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div>
                    <h3 className="font-medium mb-4 text-green-800">Transaction History</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {loanData?.transactions?.filter(t => t.type === 'GIVEN' || t.type === 'RETURNED_BY_CONTACT').map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 bg-white border border-green-200 rounded-lg">
                          <div>
                            <div className="font-medium">
                              {transaction.type === 'GIVEN' ? '💸 Loan Given' : '💰 Loan Received Back'}
                            </div>
                            {transaction.description && (
                              <div className="text-sm text-gray-600">{transaction.description}</div>
                            )}
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`font-bold ${
                              transaction.type === 'GIVEN' ? 'text-green-600' : 'text-purple-600'
                            }`}>
                              {formatPakistaniCurrency(transaction.amount)}
                            </div>
                            <button
                              onClick={() => deleteLoanTransaction.mutate(transaction.id)}
                              disabled={deleteLoanTransaction.isLoading}
                              className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">No transactions yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Money Taken Tab */}
              {activeTab === 'taken' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="text-sm font-medium text-blue-700">Total Loan Taken</h3>
                      <p className="text-2xl font-bold text-blue-800">
                        {formatPakistaniCurrency(loanData?.totalTaken || 0)}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="text-sm font-medium text-orange-700">Loan Returned to {selectedContact.name}</h3>
                      <p className="text-2xl font-bold text-orange-800">
                        {formatPakistaniCurrency(loanData?.totalReturnedToContact || 0)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Outstanding Debt */}
                  <div className={`p-4 rounded-lg border ${
                    (loanData?.totalTaken || 0) - (loanData?.totalReturnedToContact || 0) >= 0
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <h3 className={`text-sm font-medium ${
                      (loanData?.totalTaken || 0) - (loanData?.totalReturnedToContact || 0) >= 0
                        ? 'text-red-700'
                        : 'text-blue-700'
                    }`}>
                      {(loanData?.totalTaken || 0) - (loanData?.totalReturnedToContact || 0) >= 0
                        ? `You have to pay ${selectedContact.name}`
                        : `${selectedContact.name} has to pay you`
                      }
                    </h3>
                    <p className={`text-xl font-bold ${
                      (loanData?.totalTaken || 0) - (loanData?.totalReturnedToContact || 0) >= 0
                        ? 'text-red-800'
                        : 'text-blue-800'
                    }`}>
                      {formatPakistaniCurrency(Math.abs((loanData?.totalTaken || 0) - (loanData?.totalReturnedToContact || 0)))}
                    </p>
                  </div>

                  {/* Add Transaction */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium mb-4 text-blue-800">Add Transaction</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={loanType}
                          onChange={(e) => setLoanType(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="TAKEN">Take Loan</option>
                          <option value="RETURNED_TO_CONTACT">Return Loan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="number"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={loanDescription}
                          onChange={(e) => setLoanDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Optional note"
                        />
                      </div>
                      <div className="self-end">
                        <button
                          onClick={handleAddLoan}
                          disabled={createLoanTransaction.isLoading}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {createLoanTransaction.isLoading && <LoadingSpinner size="w-4 h-4" />}
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div>
                    <h3 className="font-medium mb-4 text-blue-800">Transaction History</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {loanData?.transactions?.filter(t => t.type === 'TAKEN' || t.type === 'RETURNED_TO_CONTACT').map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 bg-white border border-blue-200 rounded-lg">
                          <div>
                            <div className="font-medium">
                              {transaction.type === 'TAKEN' ? '💵 Loan Taken' : '💳 Loan Returned'}
                            </div>
                            {transaction.description && (
                              <div className="text-sm text-gray-600">{transaction.description}</div>
                            )}
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`font-bold ${
                              transaction.type === 'TAKEN' ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {formatPakistaniCurrency(transaction.amount)}
                            </div>
                            <button
                              onClick={() => deleteLoanTransaction.mutate(transaction.id)}
                              disabled={deleteLoanTransaction.isLoading}
                              className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">No transactions yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0 mt-6 flex justify-end border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  setShowLoanModal(false);
                  setSelectedContact(null);
                  setLoanAmount('');
                  setLoanDescription('');
                  setActiveTab('given');
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Statement Modal */}
      {showStatementModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
              <FaFileAlt className="text-blue-600" />
              {t('customerStatement')} - {selectedContact.name}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('startDateOptional')}
                  </label>
                  <input
                    type="date"
                    value={statementStartDate}
                    onChange={(e) => setStatementStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('endDateOptional')}
                  </label>
                  <input
                    type="date"
                    value={statementEndDate}
                    onChange={(e) => setStatementEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>• {t('leaveDatesEmpty')}</p>
                <p>• {t('statementIncludes')}</p>
                <p>• {t('runningBalanceShows')}</p>
                <p>• {t('salesIncreaseDebt')}</p>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateStatement}
                    disabled={generatingStatement}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingStatement ? <LoadingSpinner size="w-4 h-4" /> : <FaFileAlt />}
                    {generatingStatement ? 'Generating...' : t('generateStatement')}
                  </button>
                  
                  <button
                    onClick={() => setShowStatementPDFPreferences(true)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    PDF Settings
                  </button>
                </div>
                
                <div className="flex gap-2">
                  {statementData && shopSettings && (
                    <>
                      {statementPdfPreferences.urduVersion ? (
                        <UrduStatementHTML
                          statementData={statementData}
                          shopSettings={shopSettings}
                          startDate={statementStartDate}
                          endDate={statementEndDate}
                          preferences={statementPdfPreferences}
                        />
                      ) : (
                        <PDFDownloadLink
                          document={
                            <CustomerStatementPDF 
                              statementData={statementData}
                              shopSettings={shopSettings}
                              startDate={statementStartDate}
                              endDate={statementEndDate}
                              preferences={statementPdfPreferences}
                            />
                          }
                          fileName={`${selectedContact.name.replace(/[^a-zA-Z0-9]/g, '_')}_Statement_${new Date().toISOString().split('T')[0]}.pdf`}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                        >
                          {({ loading }) => (
                            loading ? t('preparingPDF') : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                {t('downloadPDF')}
                              </>
                            )
                          )}
                        </PDFDownloadLink>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {statementData && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-3">{t('statementSummary')}:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{t('openingBalance')}:</span>
                      <span className={`ml-2 font-medium ${
                        statementData.openingBalance >= 0 ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                        {formatPakistaniCurrency(Math.abs(statementData.openingBalance))}
                        {statementData.openingBalance >= 0 ? ` (${t('receivable')})` : ` (${t('payable')})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('closingBalance')}:</span>
                      <span className={`ml-2 font-medium ${
                        statementData.closingBalance >= 0 ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                        {formatPakistaniCurrency(Math.abs(statementData.closingBalance))}
                        {statementData.closingBalance >= 0 ? ` (${t('customerOwes')})` : ` (${t('weOwe')})`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-600">{t('totalTransactions')}:</span>
                    <span className="ml-2 font-medium">{statementData.transactions?.length || 0}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowStatementModal(false);
                  setSelectedContact(null);
                  setStatementStartDate('');
                  setStatementEndDate('');
                  setStatementData(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <StatementPDFPreferencesModal
        isOpen={showStatementPDFPreferences}
        onClose={() => setShowStatementPDFPreferences(false)}
        onSave={(prefs) => setStatementPdfPreferences(prefs)}
      />
    </div>
  );
}

export default Contacts;