import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';
import { useForm } from 'react-hook-form';
import API from '../../utils/api';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function useContacts() {
  const queryClient = useQueryClient();
  const searchInputRef = useRef(null);
  
  // State variables
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  
  // Loan tracking state
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState('GIVEN');
  const [loanDescription, setLoanDescription] = useState('');
  const [activeTab, setActiveTab] = useState('given');
  
  // Statement state
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');
  const [statementData, setStatementData] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);
  const [contactTypeFilter, setContactTypeFilter] = useState('');
  const [showStatementPDFPreferences, setShowStatementPDFPreferences] = useState(false);
  const [statementPdfPreferences, setStatementPdfPreferences] = useState({});
  const [generatingStatement, setGeneratingStatement] = useState(false);

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  // Search logic
  const debouncedSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
    setPage(1); // Reset page on new search
  };

  // Fetch contacts
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

  // Fetch shop settings
  const { data: shopSettingsData } = useQuery(
    ['shop-settings'],
    async () => {
      return await API.getShopSettings();
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 3
    }
  );

  useEffect(() => {
    if (shopSettingsData) {
      localStorage.setItem('shopSettings', JSON.stringify(shopSettingsData));
    }
  }, [shopSettingsData]);

  useEffect(() => {
    const handleSyncComplete = () => {
      queryClient.invalidateQueries(['contacts']);
    };
    window.addEventListener('contactsSyncComplete', handleSyncComplete);
    return () => window.removeEventListener('contactsSyncComplete', handleSyncComplete);
  }, [queryClient]);

  // Contact Mutations
  const createContact = useMutation(
    async (data) => await API.createContact(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contacts']);
        setShowAddModal(false);
        setSelectedContact(null);
        reset();
        toast.success('Contact created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create contact');
      }
    }
  );

  const updateContact = useMutation(
    async ({ id, data }) => await API.updateContact(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contacts']);
        setShowAddModal(false);
        setSelectedContact(null);
        reset();
        toast.success('Contact updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update contact');
      }
    }
  );

  const deleteContact = useMutation(
    async (id) => await API.deleteContact(id),
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

  // Loan Data and Mutations
  const { data: loanData } = useQuery(
    ['loan-transactions', selectedContact?.id],
    async () => {
      if (!selectedContact?.id) return null;
      return await API.getLoanTransactions({ contactId: selectedContact.id });
    },
    { enabled: !!selectedContact?.id && showLoanModal }
  );

  const createLoanTransaction = useMutation(
    async (data) => await API.createLoanTransaction({ ...data, contactId: selectedContact.id }),
    {
      onSuccess: async () => {
        queryClient.invalidateQueries(['loan-transactions', selectedContact?.id]);
        await queryClient.invalidateQueries(['contacts']);
        // Update selectedContact with fresh balance from refetched data
        const freshContacts = queryClient.getQueryData(['contacts', page, debouncedSearchTerm, contactTypeFilter]);
        const updated = freshContacts?.items?.find(c => c.id === selectedContact?.id);
        if (updated) setSelectedContact(updated);
        setLoanAmount('');
        setLoanDescription('');
        toast.success('Ledger entry added successfully');
      },
      onError: (error) => toast.error('Failed to add transaction')
    }
  );

  const deleteLoanTransaction = useMutation(
    async (transactionId) => await API.deleteLoanTransaction(transactionId),
    {
      onSuccess: async () => {
        queryClient.invalidateQueries(['loan-transactions', selectedContact?.id]);
        await queryClient.invalidateQueries(['contacts']);
        const freshContacts = queryClient.getQueryData(['contacts', page, debouncedSearchTerm, contactTypeFilter]);
        const updated = freshContacts?.items?.find(c => c.id === selectedContact?.id);
        if (updated) setSelectedContact(updated);
        toast.success('Entry deleted');
      },
      onError: (error) => toast.error('Failed to delete transaction')
    }
  );

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

  const fetchStatementData = async (contactId, startDate, endDate) => {
    const contact = selectedContact;
    
    // Fetch related items
    const [salesResult, bulkPurchasesResult, loanResult] = await Promise.all([
      API.getSales({ limit: 1000 }),
      API.getBulkPurchases({ limit: 1000 }),
      API.getLoanTransactions({ contactId })
    ]);

    const contactSales = salesResult.items.filter(sale => sale.contactId === contactId);
    const contactPurchases = bulkPurchasesResult.items.filter(purchase => purchase.contactId === contactId);
    const loanTransactions = loanResult.transactions || [];
    
    const auditChanges = [];
    try {
      const token = localStorage.getItem('authToken');
      const auditResponse = await fetch(`/api/audit/contact/${contactId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        if (Array.isArray(auditData)) {
          auditChanges.push(...auditData);
        }
      }
    } catch (error) {
      console.warn('Could not fetch audit trail:', error);
    }
    
    const salesMap = new Map(contactSales.map(sale => [sale.id, sale]));
    const purchasesMap = new Map(contactPurchases.map(purchase => [purchase.id, purchase]));
    
    let filteredSales = contactSales;
    let filteredPurchases = contactPurchases;
    let filteredLoans = loanTransactions;
    
    if (startDate) {
      const start = new Date(startDate);
      filteredSales = filteredSales.filter(sale => new Date(sale.saleDate) >= start);
      filteredPurchases = filteredPurchases.filter(purchase => new Date(purchase.purchaseDate) >= start);
      filteredLoans = filteredLoans.filter(loan => new Date(loan.date || loan.createdAt) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredSales = filteredSales.filter(sale => new Date(sale.saleDate) <= end);
      filteredPurchases = filteredPurchases.filter(purchase => new Date(purchase.purchaseDate) <= end);
      filteredLoans = filteredLoans.filter(loan => new Date(loan.date || loan.createdAt) <= end);
    }
    
    const allTransactions = [
      ...filteredSales.map(sale => ({
        date: sale.saleDate,
        type: 'sale',
        description: `Sale #${sale.billNumber}`,
        saleDescription: sale.description || '',
        quantity: sale.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0,
        unitPrice: sale.items?.[0]?.price || 0,
        carNumber: sale.carNumber || '',
        loadingDate: sale.loadingDate || '',
        arrivalDate: sale.arrivalDate || '',
        debit: Number(sale.totalAmount) || 0,
        credit: 0,
        balance: 0
      })),
      ...filteredPurchases.map(purchase => ({
        date: purchase.purchaseDate,
        type: 'purchase',
        description: `Purchase #${purchase.invoiceNumber || purchase.id}`,
        saleDescription: purchase.description || '',
        quantity: purchase.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0,
        unitPrice: purchase.items?.[0]?.purchasePrice || purchase.items?.[0]?.price || 0,
        carNumber: purchase.carNumber || '',
        loadingDate: purchase.loadingDate || '',
        arrivalDate: purchase.arrivalDate || '',
        debit: 0,
        credit: Number(purchase.totalAmount) || 0,
        balance: 0
      })),
      ...filteredLoans.map(loan => {
        let debit = 0, credit = 0;
        if (loan.type === 'GIVEN') debit = Number(loan.amount) || 0;
        else if (loan.type === 'TAKEN') credit = Number(loan.amount) || 0;
        else if (loan.type === 'RETURNED_BY_CONTACT') credit = Number(loan.amount) || 0;
        else if (loan.type === 'RETURNED_TO_CONTACT') debit = Number(loan.amount) || 0;
        
        return {
          date: loan.date || loan.createdAt,
          type: 'loan',
          description: loan.description || `Loan ${loan.type}`,
          debit,
          credit,
          balance: 0
        };
      }),
      ...auditChanges
        .filter(audit => audit.tableName === 'Contact' && audit.recordId === contactId)
        .map(audit => ({
          type: 'LEDGER',
          date: new Date(audit.createdAt),
          sortDate: new Date(audit.createdAt),
          description: `Contact Updated - ${audit.action}`,
          debit: 0,
          credit: 0,
          reference: audit.id,
          data: audit
        })),
      ...filteredSales
        .filter(sale => {
          const firstAudit = auditChanges
            .filter(change => change.tableName === 'Sale' && change.recordId === sale.id && change.fieldName === 'paidAmount')
            .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt))[0];
          const originalPaidAmount = firstAudit ? Number(firstAudit.oldValue) : Number(sale.paidAmount);
          return originalPaidAmount > 0;
        })
        .map(sale => {
          const firstAudit = auditChanges
            .filter(change => change.tableName === 'Sale' && change.recordId === sale.id && change.fieldName === 'paidAmount')
            .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt))[0];
          const originalPaidAmount = firstAudit ? Number(firstAudit.oldValue) : Number(sale.paidAmount);
          return {
            date: sale.saleDate,
            type: 'payment',
            description: `Sale #${sale.billNumber} - Initial Payment`,
            saleDescription: '',
            debit: 0,
            credit: originalPaidAmount,
            balance: 0
          };
        }),
      ...filteredPurchases
        .filter(purchase => {
          const firstAudit = auditChanges
            .filter(change => change.tableName === 'BulkPurchase' && change.recordId === purchase.id && change.fieldName === 'paidAmount')
            .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt))[0];
          const originalPaidAmount = firstAudit ? Number(firstAudit.oldValue) : Number(purchase.paidAmount);
          return originalPaidAmount > 0;
        })
        .map(purchase => {
          const firstAudit = auditChanges
            .filter(change => change.tableName === 'BulkPurchase' && change.recordId === purchase.id && change.fieldName === 'paidAmount')
            .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt))[0];
          const originalPaidAmount = firstAudit ? Number(firstAudit.oldValue) : Number(purchase.paidAmount);
          return {
            date: purchase.purchaseDate,
            type: 'payment',
            description: `Purchase #${purchase.invoiceNumber || purchase.id} - Initial Payment`,
            saleDescription: '',
            debit: originalPaidAmount,
            credit: 0,
            balance: 0
          };
        }),
      ...auditChanges
        .filter(change => change.fieldName === 'paidAmount' && (change.tableName === 'Sale' || change.tableName === 'BulkPurchase') && change.oldValue !== null && change.oldValue !== undefined)
        .map(change => {
          const originalTransaction = change.tableName === 'Sale' ? salesMap.get(change.recordId) : purchasesMap.get(change.recordId);
          if (originalTransaction) {
            const isSale = change.tableName === 'Sale';
            const billNumber = isSale ? originalTransaction.billNumber : (originalTransaction.invoiceNumber || originalTransaction.id);
            const totalAmount = Number(originalTransaction.totalAmount) || 0;
            const currentPaidAmount = Number(change.newValue) || 0;
            const previousPaidAmount = Number(change.oldValue) || 0;
            const paymentDifference = currentPaidAmount - previousPaidAmount;
            const remainingAmount = totalAmount - currentPaidAmount;
            
            return {
              date: change.changedAt,
              type: 'update',
              description: `${isSale ? 'Sale' : 'Purchase'} #${billNumber} - Payment Updated${change.description ? ` - ${change.description}` : ''}`,
              saleDescription: change.description || '',
              debit: isSale ? 0 : paymentDifference,
              credit: isSale ? paymentDifference : 0,
              balance: 0,
              isEdit: true,
              editedAt: change.changedAt,
              updateDetails: {
                totalAmount: formatPakistaniCurrency(totalAmount),
                paidAmount: formatPakistaniCurrency(currentPaidAmount),
                remainingAmount: formatPakistaniCurrency(remainingAmount),
                paymentDifference: formatPakistaniCurrency(paymentDifference),
                fieldChanged: change.fieldName,
                oldValue: change.oldValue,
                newValue: change.newValue
              }
            };
          }
          return null;
        })
        .filter(Boolean)
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    
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

  const handleGenerateStatement = async () => {
    if (!selectedContact) return;
    try {
      setGeneratingStatement(true);
      let currentShopSettings = shopSettingsData;
      if (!currentShopSettings) {
        try {
          currentShopSettings = await API.getShopSettings();
        } catch (error) {
          try {
            const cachedSettings = queryClient.getQueryData(['shop-settings']);
            if (cachedSettings) {
              currentShopSettings = cachedSettings;
            } else {
              const localSettings = localStorage.getItem('shopSettings');
              if (localSettings) currentShopSettings = JSON.parse(localSettings);
            }
          } catch (cacheError) {
            currentShopSettings = null;
          }
        }
      }
      
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

  const generateThermalStatementHtml = (statementData, shopSettings, contact) => {
    const totalDebit = statementData.transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    const totalCredit = statementData.transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
    const finalBalance = statementData.closingBalance;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Customer Statement</title>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
          }
          body { font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.3; margin: 0; padding: 3mm; width: 74mm; color: #000; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 8px; }
          .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
          .customer-name { font-size: 13px; font-weight: bold; margin: 8px 0; text-align: center; border: 1px solid #000; padding: 3px; }
          .date-range { font-size: 10px; text-align: center; margin-bottom: 8px; color: #666; }
          .transaction { border-bottom: 1px dotted #ccc; padding: 3px 0; font-size: 10px; }
          .transaction-header { font-weight: bold; margin-bottom: 2px; }
          .transaction-details { display: flex; justify-content: space-between; margin-bottom: 1px; }
          .amount { font-weight: bold; }
          .debit { color: #d00; }
          .credit { color: #0a0; }
          .summary { border-top: 2px solid #000; margin-top: 8px; padding-top: 5px; }
          .summary-line { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 11px; }
          .final-balance { font-size: 12px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; margin-top: 5px; }
          .footer { text-align: center; font-size: 9px; margin-top: 8px; border-top: 1px dashed #000; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${shopSettings?.shopName || 'HISAB GHAR'}</div>
          <div style="font-size: 10px;">Customer Statement</div>
        </div>
        <div class="customer-name">${contact.name}</div>
        ${statementStartDate || statementEndDate ? `
          <div class="date-range">
            ${statementStartDate ? `From: ${new Date(statementStartDate).toLocaleDateString()}` : 'From: Beginning'}
            ${statementEndDate ? ` To: ${new Date(statementEndDate).toLocaleDateString()}` : ' To: Today'}
          </div>
        ` : ''}
        <div style="margin-bottom: 8px;">
          ${statementData.transactions.map(transaction => {
            if (transaction.type === 'update' && transaction.updateDetails) {
              return `
                <div class="transaction" style="background-color: #fff3cd; border-left: 3px solid #ffc107;">
                  <div class="transaction-header">${new Date(transaction.date).toLocaleDateString()} - PAYMENT UPDATE</div>
                  <div class="transaction-details"><span>${transaction.description}</span></div>
                  <div class="transaction-details" style="font-size: 9px; color: #666;">
                    <span>Total: ${transaction.updateDetails.totalAmount}</span>
                    <span>Now Paid: ${transaction.updateDetails.paidAmount}</span>
                  </div>
                  <div class="transaction-details" style="font-size: 9px; color: #666;">
                    <span>Remaining: ${transaction.updateDetails.remainingAmount}</span>
                    <span>Payment +${transaction.updateDetails.paymentDifference}</span>
                  </div>
                  ${transaction.saleDescription ? `
                    <div style="font-size: 8px; color: #888; margin-top: 2px;">${transaction.saleDescription}</div>
                  ` : ''}
                </div>`
              ;
            } else {
              return `
                <div class="transaction">
                  <div class="transaction-header">${new Date(transaction.date).toLocaleDateString()}</div>
                  <div class="transaction-details"><span>${transaction.description}</span></div>
                  <div class="transaction-details">
                    <span>Amount: ${formatPakistaniCurrency(transaction.debit || transaction.credit)}</span>
                    <span>Balance: ${formatPakistaniCurrency(transaction.balance)}</span>
                  </div>
                  ${transaction.saleDescription ? `
                    <div style="font-size: 9px; color: #666; margin-top: 2px;">${transaction.saleDescription}</div>
                  ` : ''}
                </div>`
              ;
            }
          }).join('')}
        </div>
        <div class="summary">
          <div class="summary-line">
            <span>Total Sales:</span>
            <span class="amount debit">${formatPakistaniCurrency(totalDebit)}</span>
          </div>
          <div class="summary-line">
            <span>Total Paid:</span>
            <span class="amount credit">${formatPakistaniCurrency(totalCredit)}</span>
          </div>
          <div class="summary-line final-balance">
            <span>${finalBalance >= 0 ? `${contact.name} owes:` : `We owe ${contact.name}:`}</span>
            <span class="amount ${finalBalance >= 0 ? 'debit' : 'credit'}">
              ${formatPakistaniCurrency(Math.abs(finalBalance))}
            </span>
          </div>
        </div>
        <div class="footer">
          <div>Generated: ${new Date().toLocaleDateString()}</div>
          <div>Thank you for your business!</div>
        </div>
      </body>
      </html>
    `;
  };

  return {
    // State
    showAddModal, setShowAddModal,
    showDeleteModal, setShowDeleteModal,
    selectedContact, setSelectedContact,
    page, setPage,
    searchTerm, setSearchTerm,
    debouncedSearchTerm,
    deleteError, setDeleteError,
    showLoanModal, setShowLoanModal,
    loanAmount, setLoanAmount,
    loanType, setLoanType,
    loanDescription, setLoanDescription,
    activeTab, setActiveTab,
    showStatementModal, setShowStatementModal,
    statementStartDate, setStatementStartDate,
    statementEndDate, setStatementEndDate,
    statementData, setStatementData,
    shopSettings, setShopSettings,
    contactTypeFilter, setContactTypeFilter,
    showStatementPDFPreferences, setShowStatementPDFPreferences,
    statementPdfPreferences, setStatementPdfPreferences,
    generatingStatement, setGeneratingStatement,
    
    // React Hook Form
    register, handleSubmit, reset, setValue, errors,
    
    // Queries & Data
    contactsData, isLoading, isFetching, error,
    loanData,
    
    // Mutations (loading states)
    isCreatingContact: createContact.isLoading,
    isUpdatingContact: updateContact.isLoading,
    isDeletingLoan: deleteLoanTransaction.isLoading,
    isCreatingLoan: createLoanTransaction.isLoading,
    
    // Handlers
    handleSearchChange,
    onSubmit,
    handleDelete,
    handleEdit,
    handleAddLoan,
    handleGenerateStatement,
    generateThermalStatementHtml,
    searchInputRef,
    
    // Derived functions exported for usage
    deleteLoanTransactionMutate: deleteLoanTransaction.mutate
  };
}
