import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import toast from 'react-hot-toast';
import API from '../utils/api';
import { z } from "zod";
import DeleteModal from "../components/DeleteModal";
import TableSkeleton from "../components/TableSkeleton";
import LoadingSpinner from '../components/LoadingSpinner';
import SaleDetailsModal from "../components/SaleDetailsModal";
import ReturnModal from "../components/ReturnModal";
import { debounce } from "lodash";
import GenerateTodayInvoiceButton from "../components/GenerateTodayInvoiceButton";
import { formatPakistaniCurrency } from "../utils/formatCurrency";
import { FaSearch, FaCalendarAlt } from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslation } from "../utils/translations";

const saleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
});

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  totalAmount: z.number().min(0, "Total amount cannot be negative"),
  paidAmount: z.number().min(0, "Paid amount cannot be negative"),
  saleDate: z.string().optional(),
});

function Sales() {
  const queryClient = useQueryClient();
  const searchInputRef = useRef(null);
  const location = useLocation();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [saleItems, setSaleItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [priceType, setPriceType] = useState("retail");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [productSelected, isProductSelected] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [saleForReturn, setSaleForReturn] = useState(null);
  const [returnType, setReturnType] = useState("partial");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [selectedContact, setSelectedContact] = useState(null);
  const [saleDate, setSaleDate] = useState("");
  const [showPendingPayments, setShowPendingPayments] = useState(
    location?.state?.showPendingPayments || false
  );
  const [showCreditBalance, setShowCreditBalance] = useState(
    location?.state?.showCreditBalance || false
  );
  const [debouncedProductSearchTerm, setDebouncedProductSearchTerm] =
    useState("");
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [debouncedContactSearchTerm, setDebouncedContactSearchTerm] =
    useState("");
  const [createNewContact, setCreateNewContact] = useState(false);
  const [newContactData, setNewContactData] = useState({ name: '', phoneNumber: '', address: '' });
  const [creatingContact, setCreatingContact] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [transportSearchTerm, setTransportSearchTerm] = useState('');
  const [debouncedTransportSearchTerm, setDebouncedTransportSearchTerm] = useState('');
  const [createNewTransport, setCreateNewTransport] = useState(false);
  const [newTransportData, setNewTransportData] = useState({ carNumber: '', driverName: '' });
  const [creatingTransport, setCreatingTransport] = useState(false);
  const [transportCost, setTransportCost] = useState('');
  const [loadingDate, setLoadingDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [changeDate, setChangeDate] = useState('');
  const [updatedAmount, setUpdatedAmount] = useState('');

  const updateSale = useMutation(
    async (updatedSale) => {
      return await API.updateSale(updatedSale.id, updatedSale);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["sales"]);
        queryClient.invalidateQueries(['sales-audit-trails']);
        setIsModalOpen(false);
        setSaleItems([]);
        setSelectedProduct(null);
        setQuantity("");
        setProductSearchTerm("");
        isProductSelected(false);
        setPriceType("retail");
        setSelectedContact(null);
        setContactSearchTerm("");
        setCreateNewContact(false);
        setNewContactData({ name: '', phoneNumber: '', address: '' });
        setSaleDate("");
        setDescription('');
        setSelectedTransport(null);
        setTransportSearchTerm('');
        setTransportCost('');
        setLoadingDate('');
        setArrivalDate('');
        setPaymentDescription('');
        setChangeDate('');
        setUpdatedAmount('');
        setValidationErrors({});
        setTempStockUpdates({});
        setTotalAmount(0);
        setDiscount(0);
        setPaidAmount("");
        setIsEditMode(false);
        setEditingSale(null);
        toast.success('Sale updated successfully!');
      },
    }
  );

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
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

  // Debounced transport search
  const debouncedTransportSearch = useCallback(
    debounce((term) => {
      setDebouncedTransportSearchTerm(term);
    }, 300),
    []
  );

  const handleTransportSearchChange = (value) => {
    setTransportSearchTerm(value);
    debouncedTransportSearch(value);
  };

  // Fetch products for dropdown with search
  const { data: products, isLoading: productsLoading } = useQuery(
    ["products", debouncedProductSearchTerm],
    async () => {
      const result = await API.getProducts({
        limit: 100,
        search: debouncedProductSearchTerm
      });
      return result.items;
    }
  );

  // Fetch contacts for dropdown with search
  const { data: contacts, isLoading: contactsLoading } = useQuery(
    ["contacts", debouncedContactSearchTerm],
    async () => {
      const result = await API.getContacts({
        limit: 100,
        search: debouncedContactSearchTerm
      });
      return result.items;
    }
  );

  // Fetch transport for dropdown with search
  const { data: transport, isLoading: transportLoading } = useQuery(
    ["transport", debouncedTransportSearchTerm],
    async () => {
      if (!debouncedTransportSearchTerm) return [];
      const result = await API.getTransport({ limit: 100 });
      return result.items?.filter(t => 
        t.carNumber?.toLowerCase().includes(debouncedTransportSearchTerm.toLowerCase()) ||
        t.driverName?.toLowerCase().includes(debouncedTransportSearchTerm.toLowerCase())
      ) || [];
    }
  );

  // Reset page when switching between views
  useEffect(() => {
    setCurrentPage(1);
  }, [showPendingPayments, showCreditBalance]);

  // Fetch sales
  const { data: sales, isLoading, isFetching } = useQuery(
    [
      "sales",
      selectedDate,
      debouncedSearchTerm,
      showPendingPayments,
      showCreditBalance,
      currentPage,
    ],
    async () => {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm
      };

      if (selectedDate) {
        const [year, month, day] = selectedDate.split("-");
        params.date = `${day}/${month}/${year}`;
      }

      return await API.getSales(params);
    }
  );

  // Fetch audit trail for sales that have been edited
  const { data: auditTrails } = useQuery(
    ['sales-audit-trails', sales?.items?.map(s => s.id)],
    async () => {
      if (!sales?.items?.length) return {};
      
      const auditPromises = sales.items
        .filter(sale => {
          const created = new Date(sale.createdAt);
          const updated = new Date(sale.updatedAt);
          return Math.abs(updated - created) > 1000; // More than 1 second difference
        })
        .map(async (sale) => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audit-trail/Sale/${sale.id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            });
            const auditData = await response.json();
            return { saleId: sale.id, auditData };
          } catch (error) {
            console.error('Error fetching audit trail:', error);
            return { saleId: sale.id, auditData: [] };
          }
        });
      
      const results = await Promise.all(auditPromises);
      return results.reduce((acc, { saleId, auditData }) => {
        acc[saleId] = auditData;
        return acc;
      }, {});
    },
    { enabled: Boolean(sales?.items?.length) }
  );

  // Maintain search input focus
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [sales]);

  const createSale = useMutation(
    async (saleData) => {
      return await API.createSale(saleData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["sales"]);
        queryClient.invalidateQueries(['sales-audit-trails']);
        queryClient.invalidateQueries(["products"]); // Refresh products to show updated stock
        setIsModalOpen(false);
        setSaleItems([]);
        setSelectedProduct(null);
        setQuantity("");
        setProductSearchTerm("");
        isProductSelected(false);
        setPriceType("retail");
        setSelectedContact(null);
        setContactSearchTerm("");
        setCreateNewContact(false);
        setNewContactData({ name: '', phoneNumber: '', address: '' });
        setSaleDate("");
        setDescription('');
        setSelectedTransport(null);
        setTransportSearchTerm('');
        setTransportCost('');
        setLoadingDate('');
        setArrivalDate('');
        setPaymentDescription('');
        setChangeDate('');
        setUpdatedAmount('');
        setValidationErrors({});
        setTempStockUpdates({});
        setTotalAmount(0);
        setDiscount(0);
        setPaidAmount("");
        setIsEditMode(false);
        setEditingSale(null);
        toast.success('Sale created successfully!');
      },
    }
  );

  const [deleteError, setDeleteError] = useState(null);

  const deleteSale = useMutation(
    async (saleId) => {
      return await API.deleteSale(saleId);
    },
    {
      onSuccess: () => {
        // Remove the deleted sale from cache
        queryClient.setQueryData(
          ['sales', selectedDate, debouncedSearchTerm, showPendingPayments, showCreditBalance, currentPage],
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              items: oldData.items.filter(sale => sale.id !== saleToDelete.id),
              total: oldData.total - 1
            };
          }
        );
        queryClient.invalidateQueries(["products"]); // Still need to refresh products for stock
        queryClient.invalidateQueries(['sales-audit-trails']);
        setDeleteError(null);
        setDeleteModalOpen(false);
        setSaleToDelete(null);
        toast.success('Sale deleted successfully!');
      },
      onError: (error) => {
        setDeleteError(
          error.response?.data?.error ||
            "An error occurred while deleting the sale"
        );
      },
    }
  );

  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [tempStockUpdates, setTempStockUpdates] = useState({});

  useEffect(() => {
    if (products) {
      setFilteredProducts(
        products.map((product) => ({
          ...product,
          quantity: product.quantity - (tempStockUpdates[product.id] || 0),
        }))
      );
    }
  }, [products, tempStockUpdates]);

  const handleAddItem = () => {
    if (!selectedProduct || !quantity) {
      setValidationErrors({
        ...validationErrors,
        product: !selectedProduct
          ? t('productIsRequired')
          : undefined,
        quantity: !quantity ? t('quantityIsRequired') : undefined,
      });
      return;
    }

    // Check if user typed something but didn't select from dropdown
    if (productSearchTerm && !selectedProduct) {
      setValidationErrors({
        ...validationErrors,
        product: t('pleaseSelectValidProduct'),
      });
      return;
    }

    const quantityNum = parseFloat(quantity);

    // Check if the selected quantity is available
    if (quantityNum > selectedProduct.quantity) {
      setValidationErrors({
        quantity: t('onlyUnitsAvailable').replace('{count}', selectedProduct.quantity),
      });
      return;
    }

    // Check if product already exists in sale items
    const existingItemIndex = saleItems.findIndex(
      (item) => item.productId === selectedProduct.id
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...saleItems];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantityNum;

      // Check if total quantity exceeds available stock
      if (newQuantity > selectedProduct.quantity) {
        setValidationErrors({
          quantity: `${t('onlyUnitsAvailable').replace('{count}', selectedProduct.quantity)} (${existingItem.quantity} ${t('alreadyAdded')})`,
        });
        return;
      }

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        subtotal: existingItem.price * newQuantity,
      };
      setSaleItems(updatedItems);
    } else {
      // Add new item
      const selectedPrice = priceType === "wholesale" && selectedProduct.wholesalePrice 
        ? selectedProduct.wholesalePrice 
        : (selectedProduct.retailPrice || selectedProduct.price || 0);
      
      const newItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: quantityNum,
        price: selectedPrice,
        priceType: priceType,
        subtotal: selectedPrice * quantityNum,
      };
      setSaleItems([...saleItems, newItem]);
    }

    // Update temporary stock
    setTempStockUpdates((prev) => ({
      ...prev,
      [selectedProduct.id]: (prev[selectedProduct.id] || 0) + quantityNum,
    }));

    setSelectedProduct(null);
    setQuantity("");
    setProductSearchTerm("");
    setPriceType("retail");
    setValidationErrors({});
    isProductSelected(false);
  };

  const handlePriceChange = (index, newPrice) => {
    const updatedItems = [...saleItems];
    const price = parseFloat(newPrice) || 0;
    updatedItems[index] = {
      ...updatedItems[index],
      price: price,
      subtotal: price * updatedItems[index].quantity,
    };
    setSaleItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const removedItem = saleItems[index];
    setSaleItems(saleItems.filter((_, i) => i !== index));

    // Restore temporary stock
    setTempStockUpdates((prev) => {
      const newUpdates = { ...prev };
      const currentReduction = newUpdates[removedItem.productId] || 0;
      const newReduction = currentReduction - removedItem.quantity;

      if (newReduction <= 0) {
        delete newUpdates[removedItem.productId];
      } else {
        newUpdates[removedItem.productId] = newReduction;
      }

      return newUpdates;
    });
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  // Update total amount when sale items or discount change
  useEffect(() => {
    const subtotal = calculateTotal();
    const discountPercentage = parseFloat(discount) || 0;
    const discountAmount = (subtotal * discountPercentage) / 100;
    setTotalAmount(Math.round(subtotal - discountAmount));
  }, [saleItems, discount]);

  // Global function for opening return modal from SaleDetailsModal
  useEffect(() => {
    window.openReturnModal = (sale, type = "partial") => {
      setSaleForReturn(sale);
      setReturnType(type);
      setReturnModalOpen(true);
    };
    return () => {
      delete window.openReturnModal;
    };
  }, []);

  // Listen for data storage invalidation events
  useEffect(() => {
    const handleDataInvalidation = () => {
      queryClient.invalidateQueries(["sales"]);
    };

    window.addEventListener('dataStorageInvalidate', handleDataInvalidation);
    return () => {
      window.removeEventListener('dataStorageInvalidate', handleDataInvalidation);
    };
  }, [queryClient]);

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setSaleItems(
      sale.items?.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        priceType: item.priceType || "retail",
        subtotal: item.price * item.quantity,
      }))
    );
    setTotalAmount(sale.totalAmount);
    const subtotal = sale.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const discountPercentage = subtotal > 0 ? ((sale.discount || 0) / subtotal) * 100 : 0;
    setDiscount(discountPercentage.toFixed(1));
    setPaidAmount(sale.paidAmount || 0);
    setSelectedContact(sale.contact || null);
    setSaleDate(new Date(sale.saleDate).toISOString().split("T")[0]);
    setDescription(sale.description || '');
    setTransportSearchTerm(sale.carNumber || '');
    setTransportCost(sale.transportCost || '');
    setLoadingDate(sale.loadingDate?.split('T')[0] || '');
    setArrivalDate(sale.arrivalDate?.split('T')[0] || '');
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let contactId = selectedContact?.id;
    
    // Create new contact if checkbox is checked
    if (createNewContact && newContactData.name && newContactData.phoneNumber) {
      try {
        setCreatingContact(true);
        const contactResponse = await API.createContact({
          ...newContactData,
          contactType: 'customer'
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



    // Validate contact if something is typed but not selected
    if (contactSearchTerm && !selectedContact && !createNewContact) {
      setValidationErrors({
        ...validationErrors,
        contact: t('pleaseSelectValidContact'),
      });
      return;
    }

    const parsedPaidAmount = parseFloat(paidAmount) || 0;

    if (totalAmount > 100000000) {
      setValidationErrors({
        ...validationErrors,
        total: t('saleTotalCannotExceed'),
      });
      return;
    }

    const employeeId = localStorage.getItem('employeeId');
    console.log('Employee ID from localStorage:', employeeId);
    const discountPercentage = parseFloat(discount) || 0;
    const discountAmount = (calculateTotal() * discountPercentage) / 100;
    
    const saleData = {
      items: saleItems?.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        priceType: item.priceType || "retail",
      })),
      totalAmount: Number(Math.round(totalAmount)),
      originalTotalAmount: Number(Math.round(calculateTotal())),
      discount: Number(discountAmount),
      paidAmount: Number(parsedPaidAmount),
      ...(contactId && { contactId }),
      ...(saleDate && { saleDate }),
      description: description || null,
      carNumber: transportSearchTerm || null,
      transportCost: transportCost ? Number(parseFloat(transportCost)) : null,
      loadingDate: loadingDate || null,
      arrivalDate: arrivalDate || null,
      ...(employeeId && { employeeId }),
      ...(paymentDescription && { paymentDescription }),
      ...(changeDate && { changeDate }),
    };
    console.log('Sale data being sent:', saleData);
    console.log('Change date value:', changeDate);
    console.log('Is edit mode:', isEditMode);
    console.log('Change date in saleData:', saleData.changeDate);

    // Validate that we have at least one item
    if (!saleItems || saleItems.length === 0) {
      setValidationErrors({
        items: "At least one item is required"
      });
      return;
    }

    try {
      saleSchema.parse(saleData);
      setValidationErrors({});

      if (isEditMode) {
        console.log('Calling updateSale.mutate with:', { ...saleData, id: editingSale.id });
        console.log('EditingSale ID:', editingSale.id);
        updateSale.mutate({ ...saleData, id: editingSale.id });
      } else {
        console.log('Calling createSale.mutate with:', saleData);
        createSale.mutate(saleData);
      }
    } catch (error) {
      console.error('Validation error:', error);
      if (error instanceof z.ZodError) {
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path.join(".")] = err.message;
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleDelete = (sale) => {
    setSaleToDelete(sale);
    setDeleteModalOpen(true);
  };

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

  const confirmDelete = () => {
    if (saleToDelete) {
      deleteSale.mutate(saleToDelete.id);
    }
  };

  if (isLoading && !debouncedSearchTerm && !selectedDate && !showPendingPayments && !showCreditBalance)
    return (
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

  return (
    <div className={`p-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800">
              {t('sales')}
            </h1>
            {showPendingPayments && (
              <span className="bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
                Pending Payments
              </span>
            )}
            {showCreditBalance && (
              <span className="bg-gradient-to-r from-green-50 to-green-100 text-green-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border border-green-200 shadow-sm">
                Credit Balance
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search bill number..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:w-48 md:w-64 pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <FaSearch />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
                <FaCalendarAlt />
              </div>
            </div>
            {(showPendingPayments || showCreditBalance) && (
              <button
                onClick={() => {
                  setShowPendingPayments(false);
                  setShowCreditBalance(false);
                }}
                className="px-3 py-2 text-sm border border-primary-200 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors"
              >
                {t('allSales')}
              </button>
            )}
            {!showPendingPayments && !showCreditBalance && (
              <>
                <button
                  onClick={() => {
                    setShowPendingPayments(true);
                    setShowCreditBalance(false);
                  }}
                  className="px-3 py-2 text-sm border border-yellow-200 rounded-lg text-yellow-700 hover:bg-yellow-50 transition-colors"
                >
                  {t('pendingPayments')}
                </button>
                <button
                  onClick={() => {
                    setShowCreditBalance(true);
                    setShowPendingPayments(false);
                  }}
                  className="px-3 py-2 text-sm border border-green-200 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
                >
                  {t('creditBalance')}
                </button>
              </>
            )}
            <button
              onClick={() => {
                // Reset all form states for new sale
                setIsEditMode(false);
                setEditingSale(null);
                setSaleItems([]);
                setSelectedProduct(null);
                setQuantity("");
                setProductSearchTerm("");
                isProductSelected(false);
                setDiscount(0);
                setPaidAmount("");
                setPriceType("retail");
                setSelectedContact(null);
                setContactSearchTerm("");
                setCreateNewContact(false);
                setNewContactData({ name: '', phoneNumber: '', address: '' });
                setSaleDate("");
                setDescription('');
                setSelectedTransport(null);
                setTransportSearchTerm('');
                setTransportCost('');
                setLoadingDate('');
                setArrivalDate('');
                setValidationErrors({});
                setTempStockUpdates({});
                setTotalAmount(0);
                setUpdatedAmount('');
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap w-full sm:w-auto"
            >
              New Sale
            </button>
            <GenerateTodayInvoiceButton sales={sales} />
          </div>
        </div>
      </div>

<div className="my-6 flex justify-between items-center">
      <div>
        {(selectedDate || debouncedSearchTerm) && (
          <div className="mt-2">
            <span className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border border-blue-200 shadow-sm">
              {sales?.total || 0} {t('results')}
            </span>
          </div>
        )}
      </div>

      <div>
        {selectedDate && (
          <button
            onClick={() => {
              setSelectedDate("");
              queryClient.invalidateQueries(["sales", ""]);
            }}
            className="px-3 py-2 text-sm border border-primary-600 bg-primary-600 rounded-lg hover:bg-primary-700 text-white"
          >
            {t('clear')}
          </button>
        )}
      </div>
</div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-100">
        <table
          className="w-full divide-y divide-gray-200"
          style={{ minWidth: "800px" }}
        >
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Bill Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Car Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Paid Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isFetching && (debouncedSearchTerm || selectedDate || showPendingPayments || showCreditBalance) ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <LoadingSpinner size="w-6 h-6" />
                    <span className="ml-2 text-gray-500">Searching...</span>
                  </div>
                </td>
              </tr>
            ) : (
              sales?.items?.map((sale) => (
              <tr
                key={sale.id}
                className={`hover:bg-primary-50 transition-colors ${auditTrails?.[sale.id]?.length > 0 ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-700">
                  #{sale.billNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {new Date(sale.saleDate).toLocaleDateString("en-GB", {
                    timeZone: "UTC",
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {sale.contact ? (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {sale.contact.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {sale.carNumber ? (
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {sale.carNumber}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td
                  className="px-6 py-4 text-gray-700"
                  style={{ minWidth: "300px" }}
                >
                  <div className="space-y-1">
                    {(() => {
                      // Debug logging
                      console.log('Sale items in component:', sale.items);
                      if (sale.items && sale.items.length > 0) {
                        console.log('First item in component:', sale.items[0]);
                        console.log('Product name in component:', sale.items[0].product?.name);
                      }
                      
                      // Calculate total returned quantity per product from returns data
                      const returnedQuantities = {};
                      if (Array.isArray(sale.returns)) {
                        sale.returns.forEach((returnRecord) => {
                          if (
                            returnRecord.items &&
                            Array.isArray(returnRecord.items)
                          ) {
                            returnRecord.items.forEach((returnItem) => {
                              if (returnItem.productId) {
                                returnedQuantities[returnItem.productId] =
                                  (returnedQuantities[returnItem.productId] ||
                                    0) + Number(returnItem.quantity);
                              }
                            });
                          }
                        });
                      }

                      // Consolidate items by product ID for display
                      console.log('Sale ================',sale);
                      const consolidatedItems = {};
                      if (Array.isArray(sale.items)) {
                        console.log('Processing sale items:', sale.items.length);
                        sale.items.forEach((item) => {
                          console.log('Processing item:', item, 'Product:', item.product);
                          if (consolidatedItems[item.product?.id]) {
                            consolidatedItems[item.product.id].quantity +=
                              item.quantity;
                          } else {
                            consolidatedItems[item.product?.id] = {
                              product: item.product,
                              quantity: Number(item.quantity),
                              returnedQuantity:
                                Number(returnedQuantities[item.product?.id]) || 0,
                            };
                          }
                        });
                      }
                      console.log('Consolidated items:', consolidatedItems);

                      return Object.values(consolidatedItems).map(
                        (item, index) => (
                          <div
                            key={item.product?.id || index}
                            className="text-sm flex items-center gap-2 flex-wrap"
                          >
                            <span className="whitespace-nowrap">
                              {item.product?.name || "Unknown Product"} x{" "}
                              {Number(item.quantity) % 1 === 0 ? item.quantity : Number(item.quantity).toFixed(2)} {item.product?.unit || ''}
                            </span>
                            {item.returnedQuantity > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">
                                -{Number(item.returnedQuantity)} returned
                              </span>
                            )}
                          </div>
                        )
                      );
                    })()}
                    {auditTrails?.[sale.id]?.length > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                        <div className="text-xs text-blue-700 font-medium mb-1">Payment Updates:</div>
                        {auditTrails[sale.id]
                          .filter(audit => audit.fieldName === 'paidAmount')
                          .slice(0, 2)
                          .map((audit, idx) => (
                            <div key={idx} className="text-xs text-blue-600">
                              {audit.description && (
                                <div className="italic">{audit.description}</div>
                              )}
                              <div>
                                {new Date(audit.changedAt).toLocaleDateString()} - 
                                Rs.{audit.oldValue} → Rs.{audit.newValue}
                              </div>
                            </div>
                          ))}
                        {auditTrails[sale.id].filter(audit => audit.fieldName === 'paidAmount').length > 2 && (
                          <div className="text-xs text-blue-500 italic">+{auditTrails[sale.id].filter(audit => audit.fieldName === 'paidAmount').length - 2} more updates</div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-800">
                  {formatPakistaniCurrency(sale.totalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    {(() => {
                      const originalAmount = Number(sale.totalAmount);
                      const returnedAmount = Array.isArray(sale.returns)
                        ? sale.returns.reduce(
                            (sum, ret) => sum + Number(ret.totalAmount || 0),
                            0
                          )
                        : 0;
                      const totalRefunded = Array.isArray(sale.returns)
                        ? sale.returns.reduce(
                            (sum, ret) =>
                              sum +
                              (ret.refundPaid
                                ? Number(ret.refundAmount || 0)
                                : 0),
                            0
                          )
                        : 0;
                      const netAmount = Math.max(
                        originalAmount - returnedAmount,
                        0
                      );
                      const balance =
                        netAmount - Number(sale.paidAmount || 0) + totalRefunded;

                      if (balance > 0) {
                        return (
                          <div className="flex items-center">
                            <span className="text-yellow-600 font-medium">
                              {formatPakistaniCurrency(sale.paidAmount)}
                            </span>
                            <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 rounded-full border border-yellow-200 shadow-sm">
                              {t('due')}: {formatPakistaniCurrency(balance)}
                            </span>
                          </div>
                        );
                      } else if (balance < 0) {
                        return (
                          <div className="flex items-center">
                            <span className="text-green-600 font-medium">
                              {formatPakistaniCurrency(sale.paidAmount)}
                            </span>
                            <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-red-50 to-red-100 text-red-800 rounded-full border border-red-200 shadow-sm">
                              {t('credit')}: {formatPakistaniCurrency(Math.abs(balance))}
                            </span>
                          </div>
                        );
                      } else {
                        // Check if there were returns and refunds
                        const hasReturns =
                          Array.isArray(sale.returns) && sale.returns.length > 0;
                        const hasRefunds =
                          hasReturns &&
                          sale.returns.some((ret) => ret.refundPaid);

                        return (
                          <div className="flex items-center">
                            <span className="text-green-600 font-medium">
                              {formatPakistaniCurrency(sale.paidAmount)}
                            </span>
                            {hasRefunds && (
                              <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-full border border-blue-200 shadow-sm">
                                {t('refunded')}
                              </span>
                            )}
                            {!hasRefunds && (
                              <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-green-50 to-green-100 text-green-800 rounded-full border border-green-200 shadow-sm">
                                {t('settled')}
                              </span>
                            )}
                          </div>
                        );
                      }
                    })()}
                    {auditTrails?.[sale.id]?.length > 0 && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Updated
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedSale(sale);
                        setDetailsModalOpen(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {t('view')}
                    </button>
                    <button
                      onClick={() => handleEdit(sale)}
                      className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(sale)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0"
                        />
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
            {language === 'ur' ? `صفحہ ${currentPage} از ${Math.ceil((sales?.total || 0) / itemsPerPage)}` : `Page ${currentPage} of ${Math.ceil((sales?.total || 0) / itemsPerPage)}`}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={
              currentPage >= Math.ceil((sales?.total || 0) / itemsPerPage)
            }
            className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
          >
            {t('next')}
          </button>
        </div>
      </div>

      {/* New Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] shadow-2xl border border-gray-200 flex flex-col">
            <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 rounded-t-xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isEditMode ? t('editSale') : t('newSale')}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form
                id="sale-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Product Selection Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Add Products
                  </h3>
                  <div className="space-y-3">
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={productSearchTerm}
                          onChange={(e) => {
                            handleProductSearchChange(e.target.value);
                            isProductSelected(false);
                            setSelectedProduct(null); // Reset selected product when search changes
                          }}
                          placeholder={t('searchProducts')}
                          className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {!productSelected && productSearchTerm && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-primary-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {productsLoading ? (
                                <div className="px-4 py-3 flex items-center justify-center">
                                  <LoadingSpinner size="w-4 h-4" />
                                  <span className="ml-2 text-gray-500 text-sm">Searching...</span>
                                </div>
                              ) : filteredProducts?.length > 0 ? (
                                filteredProducts.map((product) => (
                                  <div
                                    key={product.id}
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setProductSearchTerm(product.name);
                                      isProductSelected(true);
                                      setValidationErrors({
                                        ...validationErrors,
                                        product: undefined,
                                      });
                                    }}
                                    className="px-4 py-2 cursor-pointer hover:bg-primary-50 flex justify-between items-center"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {product.name}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {Number(product.quantity) % 1 === 0 ? product.quantity : Number(product.quantity).toFixed(2)} {product.unit || 'units'} in stock
                                      </div>
                                    </div>
                                    <div className="text-primary-600 font-medium">
                                      R: {product.retailPrice ? `Rs.${product.retailPrice}` : (product.price ? `Rs.${product.price}` : '-')}
                                      {product.wholesalePrice && (
                                        <span className="text-green-600 ml-2">
                                          W: Rs.{product.wholesalePrice}
                                        </span>
                                      )}
                                    </div>
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
                      {validationErrors.product && (
                        <p className="text-red-500 text-sm mt-1">
                          {validationErrors.product}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantity {selectedProduct && <span className="text-blue-600 font-semibold">({selectedProduct.unit || 'units'})</span>}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={quantity}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (value <= 0) {
                                setValidationErrors({...validationErrors, quantity: t('quantityMustBePositive')});
                              } else {
                                setValidationErrors({...validationErrors, quantity: undefined});
                              }
                              setQuantity(e.target.value);
                            }}
                            onWheel={(e) => e.target.blur()}
                            placeholder="0.00"
                            className="w-full px-3 py-2 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                          {selectedProduct && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 pointer-events-none">
                              {selectedProduct.unit || 'units'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price Type</label>
                        <select
                          value={priceType}
                          onChange={(e) => setPriceType(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="retail">🏪 Retail</option>
                          <option value="wholesale">📦 Wholesale</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md transition-all flex items-center gap-2 font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {t('add')}
                        </button>
                      </div>
                    </div>
                    {validationErrors.quantity && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.quantity}
                      </p>
                    )}
                    {validationErrors["items"] && (
                      <p className="text-red-500 text-sm">
                        {validationErrors["items"]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sale Items List */}
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200 rounded-t-xl">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {t('saleItems')} <span className="text-sm text-gray-500">({saleItems.length})</span>
                    </h3>
                  </div>
                  <div className="p-5">
                  {saleItems.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-400 font-medium">{t('noItemsAdded')}</p>
                      <p className="text-gray-400 text-sm mt-1">Add products to create a sale</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                    {saleItems?.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {item.productName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity</label>
                            <div className="bg-gray-100 px-3 py-2 rounded-lg font-semibold text-gray-800">{item.quantity}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                            <div className={`font-semibold text-xs px-3 py-2 rounded-lg text-center ${
                              item.priceType === 'wholesale' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.priceType === 'wholesale' ? '📦 Wholesale' : '🏪 Retail'}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                              Unit Price
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={(e) =>
                                handlePriceChange(index, e.target.value)
                              }
                              onWheel={(e) => e.target.blur()}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                              Subtotal
                            </label>
                            <div className="bg-primary-50 px-3 py-2 rounded-lg font-bold text-primary-700">
                              {formatPakistaniCurrency(item.subtotal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-5 py-4 border-t-2 border-primary-200 rounded-b-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-semibold">Subtotal:</span>
                      <span className="text-2xl font-bold text-primary-700">{formatPakistaniCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Additional Details
                  </h3>
                  <div className="space-y-4">
                {/* Sale Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t('saleDate')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">
                    {t('leaveEmpty')}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Description <span className="text-gray-400 text-xs">({t('optional')})</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter sale description..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                </div>
                </div>
                </div>

                {/* Contact & Transport Section */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-5 border border-green-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Contact & Transport
                  </h3>
                  <div className="space-y-4">
                {/* Contact Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t('contact')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="createNewContactSale"
                        checked={createNewContact}
                        onChange={(e) => {
                          setCreateNewContact(e.target.checked);
                          if (e.target.checked) {
                            setSelectedContact(null);
                            setContactSearchTerm('');
                          } else {
                            setNewContactData({ name: '', phoneNumber: '', address: '' });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="createNewContactSale" className="text-sm text-gray-600">
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
                            setSelectedContact(null);
                            setValidationErrors({
                              ...validationErrors,
                              contact: undefined,
                            });
                          }
                        }}
                        placeholder={t('searchContacts')}
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {contactSearchTerm && !selectedContact && (
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
                                    setSelectedContact(contact);
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
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.contact}
                    </p>
                  )}
                </div>

                {/* Car Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    Car Number <span className="text-gray-400 text-xs">({t('optional')})</span>
                  </label>
                  <input
                    type="text"
                    value={transportSearchTerm}
                    onChange={(e) => setTransportSearchTerm(e.target.value)}
                    placeholder="Enter car number..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Transport Details */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transport Cost <span className="text-gray-400 text-xs">({t('optional')})</span>
                    </label>
                    <input
                      type="number"
                      value={transportCost}
                      onChange={(e) => setTransportCost(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loading Date <span className="text-gray-400 text-xs">({t('optional')})</span>
                    </label>
                    <input
                      type="date"
                      value={loadingDate}
                      onChange={(e) => setLoadingDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arrival Date <span className="text-gray-400 text-xs">({t('optional')})</span>
                    </label>
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                </div>
                </div>

                {/* Payment Section */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Payment Details
                  </h3>
                  <div className="space-y-4">
                {/* Subtotal and Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('subtotal')}
                    </label>
                    <input
                      type="text"
                      value={`Rs.${calculateTotal().toFixed(2)}`}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 font-bold text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
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
                          const discountAmount = (calculateTotal() * percentage) / 100;
                          setTotalAmount(calculateTotal() - discountAmount);
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Total and Paid Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {t('totalAmount')}
                    </label>
                    <input
                      type="text"
                      value={`Rs.${(Number(totalAmount) || 0).toFixed(2)}`}
                      disabled
                      className="w-full px-4 py-2.5 border-2 border-amber-300 rounded-lg bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 font-bold text-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {t('paidAmount')}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setPaidAmount(e.target.value);
                        setUpdatedAmount(''); // Clear updated amount when paid amount is directly changed

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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-semibold text-lg"
                    />
                    {validationErrors.paidAmount && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.paidAmount}
                      </p>
                    )}
                    
                    {/* Updated Amount Input */}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Updated Amount ({t('optional')})
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={updatedAmount}
                        onChange={(e) => {
                          const newUpdatedAmount = parseFloat(e.target.value) || 0;
                          const oldUpdatedAmount = parseFloat(updatedAmount) || 0;
                          const currentPaid = parseFloat(paidAmount) || 0;
                          
                          const newPaidAmount = currentPaid - oldUpdatedAmount + newUpdatedAmount;
                          setPaidAmount(newPaidAmount.toString());
                          setUpdatedAmount(e.target.value);
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Enter additional payment amount"
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter additional payment to add to current paid amount
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Description and Change Date */}
                {isEditMode && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Update Reason ({t('optional')})
                      </label>
                      <input
                        type="text"
                        value={paymentDescription}
                        onChange={(e) => setPaymentDescription(e.target.value)}
                        placeholder="e.g., Received cash payment, Bank transfer..."
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Change Date ({t('optional')})
                      </label>
                      <input
                        type="datetime-local"
                        value={changeDate}
                        onChange={(e) => setChangeDate(e.target.value)}
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use current date/time
                      </p>
                    </div>
                  </div>
                )}

                {/* Total validation error */}
                {validationErrors.total && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 text-sm font-medium">
                      {validationErrors.total}
                    </p>
                  </div>
                )}
                </div>
                </div>
              </form>
            </div>
            <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
              <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                  setEditingSale(null);
                  setSaleItems([]);
                  setSelectedProduct(null);
                  setQuantity("");
                  setProductSearchTerm("");
                  isProductSelected(false);
                  setPriceType("retail");
                  setDiscount(0);
                  setPaidAmount("");
                  setSelectedContact(null);
                  setContactSearchTerm("");
                  setCreateNewContact(false);
                  setNewContactData({ name: '', phoneNumber: '', address: '' });
                  setSaleDate("");
                  setDescription('');
                  setSelectedTransport(null);
                  setTransportSearchTerm('');
                  setTransportCost('');
                  setLoadingDate('');
                  setArrivalDate('');
                  setPaymentDescription('');
                  setChangeDate('');
                  setValidationErrors({});
                  setTempStockUpdates({});
                  setTotalAmount(0);
                  setUpdatedAmount('');
                }}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('cancel')}
              </button>
              <button
                type="submit"
                form="sale-form"
                disabled={createSale.isLoading || updateSale.isLoading || creatingContact}
                className={`px-6 py-2.5 text-white rounded-lg shadow-lg flex items-center gap-2 font-semibold transition-all ${
                  createSale.isLoading || updateSale.isLoading || creatingContact
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:shadow-xl"
                }`}
              >
                {(createSale.isLoading || updateSale.isLoading || creatingContact) ? (
                  <LoadingSpinner size="w-5 h-5" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isEditMode ? t('updateSale') : t('createSale')}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSaleToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
        itemName={
          saleToDelete
            ? `sale from ${new Date(
                saleToDelete.saleDate
              ).toLocaleDateString()}`
            : ""
        }
        error={deleteError}
      />

      {/* Sale Details Modal */}
      <SaleDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
      />

      {/* Return Modal */}
      <ReturnModal
        isOpen={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          setSelectedSale(null);
          setReturnType("partial");
        }}
        sale={saleForReturn}
        returnType={returnType}
      />
    </div>
  );
}

export default Sales;
