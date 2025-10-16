import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { z } from 'zod';
import DeleteModal from '../components/DeleteModal';
import TableSkeleton from '../components/TableSkeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import PurchaseDetailsModal from '../components/PurchaseDetailsModal';
import { debounce } from 'lodash';
import { formatPakistaniCurrency } from '../utils/formatCurrency';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

const bulkPurchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  purchasePrice: z.number().positive("Purchase price must be positive"),
});

const bulkPurchaseSchema = z.object({
  contactId: z.string().min(1, "Contact is required"),
  items: z.array(bulkPurchaseItemSchema).min(1, "At least one item is required"),
  totalAmount: z.number().positive("Total amount must be positive"),
  paidAmount: z.number().min(0, "Paid amount cannot be negative"),
});

function BulkPurchasing() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const searchInputRef = useRef(null);
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [productSelected, isProductSelected] = useState(false);
  const [contactSelected, isContactSelected] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [debouncedContactSearchTerm, setDebouncedContactSearchTerm] = useState("");
  const [createNewContact, setCreateNewContact] = useState(false);
  const [newContactData, setNewContactData] = useState({ name: '', phoneNumber: '', address: '' });
  const [creatingContact, setCreatingContact] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [debouncedProductSearchTerm, setDebouncedProductSearchTerm] = useState("");
  const [createNewProduct, setCreateNewProduct] = useState(false);
  const [newProductData, setNewProductData] = useState({ name: '', isRawMaterial: false });
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [showPendingPayments, setShowPendingPayments] = useState(location.state?.showPendingPayments || false);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

  // Handle search by purchase ID or contact name
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

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

  // Reset page when switching between all purchases and pending payments
  useEffect(() => {
    setCurrentPage(1);
  }, [showPendingPayments]);

  // Fetch bulk purchases
  const { data: purchases, isLoading, isFetching } = useQuery(
    ['bulk-purchases', debouncedSearchTerm, currentPage, showPendingPayments],
    async () => {
      return await API.getBulkPurchases({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        pendingPayments: showPendingPayments
      });
    }
  );

  // Fetch contacts for dropdown with search
  const { data: contacts, isLoading: contactsLoading } = useQuery(
    ['contacts', debouncedContactSearchTerm],
    async () => {
      const result = await API.getContacts({
        limit: 100,
        search: debouncedContactSearchTerm
      });
      return result.items;
    }
  );

  // Fetch products for dropdown with search
  const { data: products, isLoading: productsLoading } = useQuery(
    ['products', debouncedProductSearchTerm],
    async () => {
      const result = await API.getProducts({
        limit: 100,
        search: debouncedProductSearchTerm
      });
      return result.items;
    }
  );



  // Maintain search input focus
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [purchases]);

  // Listen for sync events to refresh data
  useEffect(() => {
    const handleSyncComplete = () => {
      queryClient.invalidateQueries(['bulk-purchases']);
    };

    window.addEventListener('bulkPurchasesSyncComplete', handleSyncComplete);
    return () => window.removeEventListener('bulkPurchasesSyncComplete', handleSyncComplete);
  }, [queryClient]);

  const calculateSubtotal = () => {
    return purchaseItems.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
  };

  // Update total amount when purchase items or discount change
  useEffect(() => {
    const subtotal = calculateSubtotal();
    const discountPercentage = parseFloat(discount) || 0;
    const discountAmount = (subtotal * discountPercentage) / 100;
    setTotalAmount(subtotal - discountAmount);
  }, [purchaseItems, discount]);

  // Create bulk purchase mutation
  const createPurchase = useMutation(
    async (purchaseData) => {
      return await API.createBulkPurchase(purchaseData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bulk-purchases']);
        setIsModalOpen(false);
        resetForm();
        toast.success('Purchase created successfully!');
      },
    }
  );

  // Update bulk purchase mutation
  const updatePurchase = useMutation(
    async (updatedPurchase) => {
      return await API.updateBulkPurchase(updatedPurchase.id, updatedPurchase);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bulk-purchases']);
        setIsModalOpen(false);
        resetForm();
        toast.success('Purchase updated successfully!');
      },
    }
  );

  // Delete bulk purchase mutation
  const [deleteError, setDeleteError] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const deletePurchase = useMutation(
    async (purchaseId) => {
      return await API.deleteBulkPurchase(purchaseId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bulk-purchases']);
        setDeleteError(null);
        setDeleteModalOpen(false);
        setPurchaseToDelete(null);
        toast.success('Purchase deleted successfully!');
      },
      onError: (error) => {
        setDeleteError(error.response?.data?.error || 'An error occurred while deleting the purchase');
      }
    }
  );

  const resetForm = () => {
    setPurchaseItems([]);
    setSelectedContact(null);
    setSelectedProduct(null);
    setQuantity("");
    setPurchasePrice("");
    setContactSearchTerm("");
    setProductSearchTerm("");
    setTotalAmount(0);
    setDiscount(0);
    setPaidAmount(0);
    setValidationErrors({});
    isContactSelected(false);
    isProductSelected(false);
    setIsEditMode(false);
    setEditingPurchase(null);
    setCreateNewContact(false);
    setNewContactData({ name: '', phoneNumber: '', address: '' });
    setCreateNewProduct(false);
    setNewProductData({ name: '', isRawMaterial: false });
  };

  const handleAddItem = async () => {
    // Validate inputs first
    if (!quantity || !purchasePrice) {
      setValidationErrors({
        ...validationErrors,
        quantity: !quantity ? t('quantityIsRequired') : undefined,
        purchasePrice: !purchasePrice ? t('purchasePriceIsRequired') : undefined
      });
      return;
    }
    
    // Validate product selection or new product data
    if (!createNewProduct && !selectedProduct) {
      setValidationErrors({
        ...validationErrors,
        product: t('productIsRequired')
      });
      return;
    }
    
    if (createNewProduct && !newProductData.name) {
      setValidationErrors({
        ...validationErrors,
        product: 'Please fill all required product fields'
      });
      return;
    }
    
    let productToAdd = selectedProduct;
    
    // Create new product if checkbox is checked
    if (createNewProduct) {
      try {
        setCreatingProduct(true);
        const productResponse = await api.post('/api/products', {
          name: newProductData.name,
          quantity: 0,
          description: '',
          isRawMaterial: newProductData.isRawMaterial
        });
        productToAdd = productResponse.data;
      } catch (error) {
        const errorMessage = error.response?.data?.error === 'Product name must be unique' 
          ? 'This product is already added' 
          : error.response?.data?.error || 'Failed to create product';
        setValidationErrors({ product: errorMessage });
        return;
      } finally {
        setCreatingProduct(false);
      }
    }
    
    // Check if user typed something but didn't select from dropdown
    if (productSearchTerm && !selectedProduct && !createNewProduct) {
      setValidationErrors({
        ...validationErrors,
        product: t('pleaseSelectValidProduct')
      });
      return;
    }

    const quantityNum = parseInt(quantity);
    const priceNum = parseFloat(purchasePrice);
    
    const newItem = {
      productId: productToAdd.id,
      productName: productToAdd.name,
      quantity: quantityNum,
      purchasePrice: priceNum,
      subtotal: priceNum * quantityNum
    };

    setPurchaseItems([...purchaseItems, newItem]);
    setSelectedProduct(null);
    setQuantity("");
    setPurchasePrice("");
    setProductSearchTerm("");
    setValidationErrors({});
    isProductSelected(false);
    if (createNewProduct) {
      setNewProductData({ name: '', isRawMaterial: false });
    }
  };

  const handleRemoveItem = (index) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let contactId = selectedContact?.id;
    
    // Create new contact if checkbox is checked
    if (createNewContact && newContactData.name && newContactData.phoneNumber) {
      try {
        setCreatingContact(true);
        const contactResponse = await api.post('/api/contacts', {
          ...newContactData,
          contactType: 'supplier'
        });
        contactId = contactResponse.data.id;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to create contact';
        setValidationErrors({ contact: errorMessage });
        return;
      } finally {
        setCreatingContact(false);
      }
    }
    
    if (!contactId && !createNewContact) {
      setValidationErrors({
        ...validationErrors,
        contact: t('contactIsRequired')
      });
      return;
    }
    
    // Validate contact if something is typed but not selected
    if (contactSearchTerm && !selectedContact) {
      setValidationErrors({
        ...validationErrors,
        contact: t('pleaseSelectValidContact')
      });
      return;
    }

    if (purchaseItems.length === 0) {
      setValidationErrors({
        ...validationErrors,
        items: t('atLeastOneItemRequired')
      });
      return;
    }

    const parsedPaidAmount = parseFloat(paidAmount) || 0;
    if (parsedPaidAmount > totalAmount) {
      setValidationErrors({
        ...validationErrors,
        paidAmount: t('paidAmountCannotExceedTotal')
      });
      return;
    }

    const discountPercentage = parseFloat(discount) || 0;
    const discountAmount = (calculateSubtotal() * discountPercentage) / 100;
    
    const purchaseData = {
      contactId: contactId,
      items: purchaseItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice
      })),
      totalAmount: totalAmount,
      discount: discountAmount,
      paidAmount: parsedPaidAmount,
      purchaseDate: new Date().toISOString()
    };

    try {
      bulkPurchaseSchema.parse(purchaseData);
      setValidationErrors({});

      if (isEditMode) {
        updatePurchase.mutate({ ...purchaseData, id: editingPurchase.id });
      } else {
        createPurchase.mutate(purchaseData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path.join('.')] = err.message;
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setSelectedContact(purchase.contact);
    setContactSearchTerm(purchase.contact.name);
    isContactSelected(true);
    
    setPurchaseItems(purchase.items.map(item => ({
      productId: item.product?.id || item.productId,
      productName: item.product?.name || 'Unknown Product',
      quantity: item.quantity || 0,
      purchasePrice: item.purchasePrice || item.unitPrice || 0,
      subtotal: (item.purchasePrice || item.unitPrice || 0) * (item.quantity || 0)
    })));
    
    setTotalAmount(purchase.totalAmount);
    const subtotal = purchase.items?.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0) || 0;
    const discountPercentage = subtotal > 0 ? ((purchase.discount || 0) / subtotal) * 100 : 0;
    setDiscount(discountPercentage.toFixed(1));
    setPaidAmount(purchase.paidAmount);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (purchase) => {
    setPurchaseToDelete(purchase);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (purchaseToDelete) {
      deletePurchase.mutate(purchaseToDelete.id);
    }
  };

  if (isLoading && !debouncedSearchTerm && !showPendingPayments) return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="h-10 bg-gray-300 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
      </div>
      <TableSkeleton rows={10} columns={5} />
    </div>
  );

  return (
    <div className={`p-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800">{t('bulkPurchasing')}</h1>
          {showPendingPayments && (
            <span className="bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
              Pending Payments
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={language === 'ur' ? 'انوائس یا رابطے سے تلاش کریں...' : 'Search by invoice or contact...'}
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:w-48 md:w-64 pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {showPendingPayments && (
              <button
                onClick={() => setShowPendingPayments(false)}
                className="px-3 py-2 text-sm border border-primary-200 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors"
              >
                {t('allPurchases')}
              </button>
            )}
            {!showPendingPayments && (
              <button
                onClick={() => setShowPendingPayments(true)}
                className="px-3 py-2 text-sm border border-yellow-200 rounded-lg text-yellow-700 hover:bg-yellow-50 transition-colors"
              >
                {t('pendingPayments')}
              </button>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap w-full sm:w-auto"
            >
              {t('newPurchase')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-primary-50 to-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('invoiceNumber')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('contact')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('totalAmount')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('paidAmount')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isFetching && (debouncedSearchTerm || showPendingPayments) ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <LoadingSpinner size="w-6 h-6" />
                    <span className="ml-2 text-gray-500">Searching...</span>
                  </div>
                </td>
              </tr>
            ) : (
              purchases?.items?.map((purchase) => (
              <tr key={purchase.id} className={`hover:bg-primary-50 transition-colors ${purchase.totalAmount > purchase.paidAmount ? 'bg-yellow-50' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-700">
                  {purchase.invoiceNumber || `#${purchase.id.slice(-6)}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {new Date(purchase.purchaseDate).toLocaleDateString('en-GB')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {purchase.contact.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-800">
                  {formatPakistaniCurrency(purchase.totalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {purchase.totalAmount > purchase.paidAmount ? (
                    <div className="flex items-center">
                      <span className="text-yellow-600 font-medium">{formatPakistaniCurrency(purchase.paidAmount)}</span>
                      <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 rounded-full border border-yellow-200 shadow-sm">
                        {t('due')}: {formatPakistaniCurrency(purchase.totalAmount - purchase.paidAmount)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-green-600 font-medium">{formatPakistaniCurrency(purchase.paidAmount)}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPurchase(purchase);
                        setDetailsModalOpen(true);
                      }}
                      className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('view')}
                    </button>
                    <button
                      onClick={() => handleEdit(purchase)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(purchase)}
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

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
          >
            {t('previous')}
          </button>
          <span className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-800">
            {language === 'ur' ? `صفحہ ${currentPage} از ${Math.ceil((purchases?.total || 0) / itemsPerPage)}` : `Page ${currentPage} of ${Math.ceil((purchases?.total || 0) / itemsPerPage)}`}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage >= Math.ceil((purchases?.total || 0) / itemsPerPage)}
            className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
          >
            {t('next')}
          </button>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-xl h-[90vh] shadow-xl border border-gray-200 flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2">{isEditMode ? t('editPurchase') : t('newPurchase')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-2">
              <form id="purchase-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Contact Selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">{t('contact')}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="createNewContactPurchase"
                      checked={createNewContact}
                      onChange={(e) => {
                        setCreateNewContact(e.target.checked);
                        if (e.target.checked) {
                          setSelectedContact(null);
                          setContactSearchTerm('');
                          isContactSelected(false);
                        } else {
                          setNewContactData({ name: '', phoneNumber: '', address: '' });
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="createNewContactPurchase" className="text-sm text-gray-600">
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
                        isContactSelected(false);
                        setSelectedContact(null);
                      }}
                      placeholder={t('searchContacts')}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {!contactSelected && contactSearchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
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
                                setSelectedContact(contact);
                                setContactSearchTerm(contact.name);
                                isContactSelected(true);
                                setValidationErrors({
                                  ...validationErrors,
                                  contact: undefined
                                });
                              }}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                            >
                              <div className="font-medium">{contact.name}</div>
                              {contact.address && <div className="text-sm text-gray-600">{contact.address}</div>}
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

              {/* Product Selection */}
              <div className="space-y-4 mb-4">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">{t('addProducts')}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="createNewProductPurchase"
                          checked={createNewProduct}
                          onChange={(e) => {
                            setCreateNewProduct(e.target.checked);
                            if (e.target.checked) {
                              setSelectedProduct(null);
                              setProductSearchTerm('');
                              isProductSelected(false);
                            } else {
                              setNewProductData({ name: '', isRawMaterial: false });
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="createNewProductPurchase" className="text-sm text-gray-600">
                          Add New Product
                        </label>
                      </div>
                    </div>
                    {createNewProduct ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newProductData.name}
                          onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                          placeholder="Product name *"
                          className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isRawMaterial"
                            checked={newProductData.isRawMaterial || false}
                            onChange={(e) => setNewProductData({ ...newProductData, isRawMaterial: e.target.checked })}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <label htmlFor="isRawMaterial" className="text-sm text-gray-600">
                            Raw Material
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={productSearchTerm}
                          onChange={(e) => {
                            handleProductSearchChange(e.target.value);
                            isProductSelected(false);
                            setSelectedProduct(null);
                          }}
                          placeholder={t('searchProducts')}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {!productSelected && productSearchTerm && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {productsLoading ? (
                              <div className="px-4 py-3 flex items-center justify-center">
                                <LoadingSpinner size="w-4 h-4" />
                                <span className="ml-2 text-gray-500 text-sm">Searching...</span>
                              </div>
                            ) : products?.length > 0 ? (
                              products.map((product) => (
                                <div
                                  key={product.id}
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setProductSearchTerm(product.name);
                                    isProductSelected(true);
                                    setValidationErrors({
                                      ...validationErrors,
                                      product: undefined
                                    });
                                  }}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                                >
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-gray-600">{product.sku}</div>
                                  </div>
                                  <div className="text-blue-600 font-medium">Rs.{product.price}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-sm">
                                No products found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {validationErrors.product && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.product}</p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('quantity')}</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value <= 0) {
                            setValidationErrors({...validationErrors, quantity: t('quantityMustBePositive')});
                          } else {
                            setValidationErrors({...validationErrors, quantity: undefined});
                          }
                          setQuantity(e.target.value);
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder={t('qty')}
                        className="w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {validationErrors.quantity && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.quantity}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'ur' ? 'خریداری کی قیمت *' : 'Purchase Price *'}</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={purchasePrice}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value <= 0) {
                            setValidationErrors({...validationErrors, purchasePrice: t('priceMustBePositive')});
                          } else {
                            setValidationErrors({...validationErrors, purchasePrice: undefined});
                          }
                          setPurchasePrice(e.target.value);
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder={t('price')}
                        className="w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {validationErrors.purchasePrice && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.purchasePrice}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{language === 'ur' ? 'صرف پورے نمبر، اعشاریہ نہیں' : 'Whole numbers only, no decimals'}</p>
                    </div>
                    <div className="self-end">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={creatingProduct}
                        className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {creatingProduct && <LoadingSpinner size="w-4 h-4" />}
                        {t('add')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Items List */}
              <div className="border border-primary-100 rounded-lg p-4 bg-primary-50">
                <h3 className="font-medium mb-2 text-primary-800">{t('purchaseItems')}</h3>
                {purchaseItems.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">{t('noItemsAdded')}</p>
                ) : (
                  purchaseItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-primary-100 last:border-b-0">
                      <div>
                        <div className="font-medium text-primary-700">{item.productName}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} x Rs.{(item.purchasePrice || 0).toFixed(2)} = <span className="text-primary-800 font-medium">Rs.{(item.subtotal || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('remove')}
                      </button>
                    </div>
                  ))
                )}
                {validationErrors.items && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.items}</p>
                )}
              </div>

              {/* Subtotal and Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('subtotal')}
                  </label>
                  <input
                    type="text"
                    value={`Rs.${calculateSubtotal().toFixed(2)}`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-primary-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('discount')} (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => {
                      const percentage = parseFloat(e.target.value) || 0;
                      if (percentage <= 100) {
                        setDiscount(e.target.value);
                        const discountAmount = (calculateSubtotal() * percentage) / 100;
                        setTotalAmount(calculateSubtotal() - discountAmount);
                      }
                    }}
                    onWheel={(e) => e.target.blur()}
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Total and Paid Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('totalAmount')}
                  </label>
                  <input
                    type="text"
                    value={`Rs.${totalAmount.toFixed(2)}`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-primary-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('paidAmount')}</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setPaidAmount(e.target.value);

                      // Clear validation error if paid amount is now valid
                      if (
                        value <= totalAmount &&
                        validationErrors.paidAmount
                      ) {
                        setValidationErrors({
                          ...validationErrors,
                          paidAmount: undefined,
                        });
                      }
                    }}
                    onWheel={(e) => e.target.blur()}
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {validationErrors.paidAmount && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.paidAmount}</p>
                  )}
                </div>
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
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                form="purchase-form"
                disabled={createPurchase.isLoading || updatePurchase.isLoading || creatingContact || creatingProduct}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded shadow-sm hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(createPurchase.isLoading || updatePurchase.isLoading || creatingContact || creatingProduct) && <LoadingSpinner size="w-4 h-4" />}
                {isEditMode ? t('updatePurchase') : t('createPurchase')}
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
          setPurchaseToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
        itemName={purchaseToDelete ? `purchase from ${new Date(purchaseToDelete.purchaseDate).toLocaleDateString()}` : ''}
        error={deleteError}
      />

      {/* Purchase Details Modal */}
      <PurchaseDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedPurchase(null);
        }}
        purchase={selectedPurchase}
      />
    </div>
  );
}

export default BulkPurchasing;