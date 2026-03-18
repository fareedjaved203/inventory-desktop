import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { debounce } from 'lodash';
import API from '../../utils/api';
import { useTranslation } from '../../utils/translations';

const bulkPurchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be positive"),
  purchasePrice: z.number().positive("Purchase price must be positive"),
  perUnitCost: z.number().positive().optional(),
});

const bulkPurchaseSchema = z.object({
  contactId: z.string().min(1, "Contact is required"),
  items: z.array(bulkPurchaseItemSchema).min(1, "At least one item is required"),
  totalAmount: z.number().positive("Total amount must be positive"),
  paidAmount: z.number().min(0, "Paid amount cannot be negative"),
});

export function useBulkPurchasing(language) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const t = useTranslation(language);

  // State
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
  const [priceInputMode, setPriceInputMode] = useState('perUnit');
  const [totalCost, setTotalCost] = useState('');
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [transportSearchTerm, setTransportSearchTerm] = useState('');
  const [debouncedTransportSearchTerm, setDebouncedTransportSearchTerm] = useState('');
  const [transportCost, setTransportCost] = useState('');
  const [loadingDate, setLoadingDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [changeDate, setChangeDate] = useState('');
  const [updatedAmount, setUpdatedAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Debounced functions
  const debouncedSearch = useCallback(debounce((term) => setDebouncedSearchTerm(term), 300), []);
  const debouncedContactSearch = useCallback(debounce((term) => setDebouncedContactSearchTerm(term), 300), []);
  const debouncedProductSearch = useCallback(debounce((term) => setDebouncedProductSearchTerm(term), 300), []);
  const debouncedTransportSearch = useCallback(debounce((term) => setDebouncedTransportSearchTerm(term), 300), []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };
  
  const handleContactSearchChange = (value) => {
    setContactSearchTerm(value);
    debouncedContactSearch(value);
  };

  const handleProductSearchChange = (value) => {
    setProductSearchTerm(value);
    debouncedProductSearch(value);
  };

  const handleTransportSearchChange = (value) => {
    setTransportSearchTerm(value);
    debouncedTransportSearch(value);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [showPendingPayments]);

  // Queries
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

  const { data: auditTrails } = useQuery(
    ['audit-trails', purchases?.items?.map(p => p.id)],
    async () => {
      if (!purchases?.items?.length) return {};
      
      const auditPromises = purchases.items
        .filter(purchase => {
          const created = new Date(purchase.createdAt);
          const updated = new Date(purchase.updatedAt);
          return Math.abs(updated - created) > 1000;
        })
        .map(async (purchase) => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audit-trail/BulkPurchase/${purchase.id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            });
            const auditData = await response.json();
            return { purchaseId: purchase.id, auditData };
          } catch (error) {
            console.error('Error fetching audit trail:', error);
            return { purchaseId: purchase.id, auditData: [] };
          }
        });
      
      const results = await Promise.all(auditPromises);
      return results.reduce((acc, { purchaseId, auditData }) => {
        acc[purchaseId] = auditData;
        return acc;
      }, {});
    },
    { enabled: Boolean(purchases?.items?.length) }
  );

  const { data: contacts, isLoading: contactsLoading } = useQuery(
    ['contacts', debouncedContactSearchTerm],
    async () => {
      const result = await API.getContacts({ limit: 100, search: debouncedContactSearchTerm });
      return result.items;
    }
  );

  const { data: products, isLoading: productsLoading } = useQuery(
    ['products', debouncedProductSearchTerm],
    async () => {
      const result = await API.getProducts({ limit: 100, search: debouncedProductSearchTerm });
      return result.items;
    }
  );

  const { data: transport, isLoading: transportLoading } = useQuery(
    ['transport', debouncedTransportSearchTerm],
    async () => {
      if (!debouncedTransportSearchTerm) return [];
      const result = await API.getTransport({ limit: 100 });
      return result.items?.filter(t => 
        t.carNumber?.toLowerCase().includes(debouncedTransportSearchTerm.toLowerCase()) ||
        t.driverName?.toLowerCase().includes(debouncedTransportSearchTerm.toLowerCase())
      ) || [];
    }
  );

  const { data: lastBulkPurchase } = useQuery(
    ['last-bulk-purchase', selectedProduct?.id],
    async () => {
      if (!selectedProduct?.id) return null;
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bulk-purchases?productId=${selectedProduct.id}&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      return result.items?.[0] || null;
    },
    { enabled: Boolean(selectedProduct?.id) }
  );

  useEffect(() => {
    const handleSyncComplete = () => {
      queryClient.invalidateQueries(['bulk-purchases']);
    };
    window.addEventListener('bulkPurchasesSyncComplete', handleSyncComplete);
    return () => window.removeEventListener('bulkPurchasesSyncComplete', handleSyncComplete);
  }, [queryClient]);

  const calculateSubtotal = () => {
    return purchaseItems.reduce((sum, item) => {
      const subtotal = item.isTotalCostItem ? item.purchasePrice : (item.quantity * item.purchasePrice);
      return sum + subtotal;
    }, 0);
  };

  useEffect(() => {
    const subtotal = calculateSubtotal();
    const discountPercentage = parseFloat(discount) || 0;
    const discountAmount = (subtotal * discountPercentage) / 100;
    setTotalAmount(subtotal - discountAmount);
  }, [purchaseItems, discount]);

  const resetForm = () => {
    setPurchaseItems([]);
    setSelectedContact(null);
    setSelectedProduct(null);
    setQuantity("");
    setPurchasePrice("");
    setTotalCost("");
    setPriceInputMode('perUnit');
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
    setSelectedTransport(null);
    setTransportSearchTerm('');
    setTransportCost('');
    setLoadingDate('');
    setArrivalDate('');
    setPaymentDescription('');
    setChangeDate('');
    setUpdatedAmount('');
    setPurchaseDate('');
    setDescription('');
  };

  // Mutations
  const createPurchase = useMutation(
    async (purchaseData) => await API.createBulkPurchase(purchaseData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bulk-purchases']);
        queryClient.invalidateQueries(['audit-trails']);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        setIsModalOpen(false);
        resetForm();
        toast.success('Purchase created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create purchase');
      }
    }
  );

  const updatePurchase = useMutation(
    async (updatedPurchase) => await API.updateBulkPurchase(updatedPurchase.id, updatedPurchase),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bulk-purchases']);
        queryClient.invalidateQueries(['audit-trails']);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        setIsModalOpen(false);
        resetForm();
        toast.success('Purchase updated successfully!');
      },
    }
  );

  const deletePurchase = useMutation(
    async (purchaseId) => await API.deleteBulkPurchase(purchaseId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bulk-purchases']);
        queryClient.invalidateQueries(['audit-trails']);
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

  const handleAddItem = async () => {
    const priceValue = priceInputMode === 'perUnit' ? purchasePrice : totalCost;
    if (!quantity || !priceValue) {
      setValidationErrors({
        ...validationErrors,
        quantity: !quantity ? t('quantityIsRequired') : undefined,
        purchasePrice: !priceValue ? (priceInputMode === 'perUnit' ? t('purchasePriceIsRequired') : 'Total cost is required') : undefined
      });
      return;
    }
    
    if (!createNewProduct && !selectedProduct) {
      setValidationErrors({ ...validationErrors, product: t('productIsRequired') });
      return;
    }
    
    if (createNewProduct && !newProductData.name) {
      setValidationErrors({ ...validationErrors, product: 'Please fill all required product fields' });
      return;
    }
    
    let productToAdd = selectedProduct;
    
    if (createNewProduct) {
      try {
        setCreatingProduct(true);
        const productResponse = await API.post('/products', {
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
    
    if (productSearchTerm && !selectedProduct && !createNewProduct) {
      setValidationErrors({ ...validationErrors, product: t('pleaseSelectValidProduct') });
      return;
    }

    const quantityNum = parseFloat(quantity);
    let priceNum, subtotal, itemPurchasePrice;
    
    if (priceInputMode === 'perUnit') {
      priceNum = parseFloat(purchasePrice);
      subtotal = priceNum * quantityNum;
      itemPurchasePrice = priceNum;
    } else {
      const totalCostNum = parseFloat(totalCost);
      priceNum = totalCostNum / quantityNum;
      subtotal = totalCostNum;
      itemPurchasePrice = totalCostNum;
    }
    
    const newItem = {
      productId: productToAdd.id,
      productName: productToAdd.name,
      quantity: quantityNum,
      purchasePrice: itemPurchasePrice,
      subtotal: subtotal,
      isTotalCostItem: priceInputMode === 'totalCost',
      ...(priceInputMode === 'totalCost' && { perUnitCost: priceNum })
    };
    
    setPurchaseItems([...purchaseItems, newItem]);
    setSelectedProduct(null);
    setQuantity("");
    setPurchasePrice("");
    setTotalCost("");
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
    
    if (createNewContact && newContactData.name && newContactData.phoneNumber) {
      try {
        setCreatingContact(true);
        const contactResponse = await API.post('/contacts', {
          ...newContactData,
          contactType: 'supplier'
        });
        contactId = contactResponse.id;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to create contact';
        setValidationErrors({ contact: errorMessage });
        return;
      } finally {
        setCreatingContact(false);
      }
    }
    
    if (!contactId && !createNewContact) {
      setValidationErrors({ ...validationErrors, contact: t('contactIsRequired') });
      return;
    }
    
    if (contactSearchTerm && !selectedContact) {
      setValidationErrors({ ...validationErrors, contact: t('pleaseSelectValidContact') });
      return;
    }

    if (purchaseItems.length === 0) {
      setValidationErrors({ ...validationErrors, items: t('atLeastOneItemRequired') });
      return;
    }

    const parsedPaidAmount = parseFloat(paidAmount) || 0;
    const discountPercentage = parseFloat(discount) || 0;
    const discountAmount = (calculateSubtotal() * discountPercentage) / 100;
    
    const purchaseData = {
      contactId: contactId,
      items: purchaseItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        ...(item.isTotalCostItem && { perUnitCost: item.perUnitCost })
      })),
      totalAmount: totalAmount,
      discount: discountAmount,
      paidAmount: parsedPaidAmount,
      ...(purchaseDate && { purchaseDate }),
      description: description || null,
      carNumber: transportSearchTerm || null,
      transportCost: transportCost ? Number(parseFloat(transportCost)) : null,
      loadingDate: loadingDate || null,
      arrivalDate: arrivalDate || null,
      ...(paymentDescription && { paymentDescription }),
      ...(changeDate && { changeDate })
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
    
    setPurchaseItems(purchase.items.map(item => {
      const quantity = Number(item.quantity) || 0;
      const purchasePrice = Number(item.purchasePrice || item.unitPrice) || 0;
      const isTotalCostItem = item.isTotalCostItem;
      const subtotal = isTotalCostItem ? purchasePrice : (purchasePrice * quantity);
      
      return {
        productId: item.product?.id || item.productId,
        productName: item.product?.name || 'Unknown Product',
        quantity: quantity,
        purchasePrice: purchasePrice,
        subtotal: subtotal,
        product: item.product,
        isTotalCostItem: isTotalCostItem,
        ...(isTotalCostItem && { perUnitCost: purchasePrice / quantity })
      };
    }));
    
    setTotalAmount(Number(purchase.totalAmount));
    const subtotal = purchase.items?.reduce((sum, item) => sum + (Number(item.purchasePrice) * Number(item.quantity)), 0) || 0;
    const discountPercentage = subtotal > 0 ? ((Number(purchase.discount) || 0) / subtotal) * 100 : 0;
    setDiscount(discountPercentage.toFixed(1));
    setPaidAmount(Number(purchase.paidAmount));
    setTransportSearchTerm(purchase.carNumber || '');
    setTransportCost(purchase.transportCost || '');
    setLoadingDate(purchase.loadingDate?.split('T')[0] || '');
    setArrivalDate(purchase.arrivalDate?.split('T')[0] || '');
    setPurchaseDate(new Date(purchase.purchaseDate).toISOString().split('T')[0]);
    setDescription(purchase.description || '');
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

  return {
    state: {
      isModalOpen, setIsModalOpen,
      currentPage, setCurrentPage,
      itemsPerPage,
      searchTerm, setSearchTerm,
      validationErrors, setValidationErrors,
      purchaseItems, setPurchaseItems,
      selectedProduct, setSelectedProduct,
      quantity, setQuantity,
      purchasePrice, setPurchasePrice,
      isEditMode, setIsEditMode,
      editingPurchase, setEditingPurchase,
      deleteModalOpen, setDeleteModalOpen,
      purchaseToDelete, setPurchaseToDelete,
      productSelected, isProductSelected,
      contactSelected, isContactSelected,
      debouncedSearchTerm,
      selectedContact, setSelectedContact,
      contactSearchTerm, setContactSearchTerm,
      debouncedContactSearchTerm,
      createNewContact, setCreateNewContact,
      newContactData, setNewContactData,
      creatingContact, setCreatingContact,
      productSearchTerm, setProductSearchTerm,
      debouncedProductSearchTerm,
      createNewProduct, setCreateNewProduct,
      newProductData, setNewProductData,
      creatingProduct, setCreatingProduct,
      totalAmount, setTotalAmount,
      discount, setDiscount,
      paidAmount, setPaidAmount,
      showPendingPayments, setShowPendingPayments,
      priceInputMode, setPriceInputMode,
      totalCost, setTotalCost,
      selectedTransport, setSelectedTransport,
      transportSearchTerm, setTransportSearchTerm,
      debouncedTransportSearchTerm,
      transportCost, setTransportCost,
      loadingDate, setLoadingDate,
      arrivalDate, setArrivalDate,
      paymentDescription, setPaymentDescription,
      changeDate, setChangeDate,
      updatedAmount, setUpdatedAmount,
      purchaseDate, setPurchaseDate,
      description, setDescription,
      deleteError, setDeleteError,
      detailsModalOpen, setDetailsModalOpen,
      selectedPurchase, setSelectedPurchase
    },
    queries: {
      purchases, isLoading, isFetching,
      auditTrails,
      contacts, contactsLoading,
      products, productsLoading,
      transport, transportLoading,
      lastBulkPurchase
    },
    mutations: {
      createPurchase,
      updatePurchase,
      deletePurchase
    },
    handlers: {
      handleSearchChange,
      handleContactSearchChange,
      handleProductSearchChange,
      handleTransportSearchChange,
      handleAddItem,
      handleRemoveItem,
      handleSubmit,
      handleEdit,
      handleDelete,
      confirmDelete,
      calculateSubtotal,
      resetForm
    }
  };
}
