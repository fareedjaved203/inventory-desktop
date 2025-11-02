import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { formatPakistaniCurrency } from '../utils/formatCurrency';
import { FaBarcode, FaSearch, FaTrash, FaPlus, FaMinus, FaPrint, FaShoppingCart, FaTimes, FaEye, FaTh, FaList } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductImage from '../components/ProductImage';
import { debounce } from 'lodash';

function POS() {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [debouncedCustomerSearchTerm, setDebouncedCustomerSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState('default'); // 'default' or 'compact'
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const barcodeInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setShowCart(false);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
    setShowProductDropdown(true);
    setSelectedProductIndex(-1);
  };

  const handleSearchKeyDown = (e) => {
    if (!showProductDropdown || products.length === 0) return;

    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedProductIndex(prev => 
          prev < products.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedProductIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedProductIndex >= 0 && selectedProductIndex < products.length) {
          handleProductSelect(products[selectedProductIndex]);
        }
        break;
      case 'Escape':
        setShowProductDropdown(false);
        setSelectedProductIndex(-1);
        break;
    }
  };

  const handleProductSelect = (product) => {
    addToCart(product);
    setSearchTerm('');
    setShowProductDropdown(false);
    setSelectedProductIndex(-1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Debounced customer search
  const debouncedCustomerSearch = useCallback(
    debounce((term) => {
      setDebouncedCustomerSearchTerm(term);
    }, 300),
    []
  );

  const handleCustomerSearchChange = (value) => {
    setCustomerSearchTerm(value);
    debouncedCustomerSearch(value);
  };

  // Fetch products for search
  const { data: products = [], isLoading: productsLoading } = useQuery(
    ['pos-products', debouncedSearchTerm],
    async () => {
      const result = await API.getProducts({
        limit: 50,
        search: debouncedSearchTerm
      });
      return result.items || [];
    }
  );

  // Fetch all categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery(
    ['categories'],
    async () => {
      const response = await API.get('/categories');
      const cats = Array.isArray(response.data) ? response.data : (response.data?.items || []);
      // Add "Other Products" category for uncategorized products
      const otherCategory = {
        id: 'other',
        name: 'Other Products',
        color: '#6B7280',
        icon: '📦'
      };
      return [...cats, otherCategory];
    }
  );

  // Auto-select first category when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Fetch products for selected category
  const { data: categoryProducts = [], isLoading: categoryProductsLoading } = useQuery(
    ['category-products', selectedCategory?.id],
    async () => {
      if (!selectedCategory?.id) return [];
      if (selectedCategory.id === 'other') {
        // Fetch products without category
        const response = await API.getProducts({ limit: 100 });
        const allProducts = response.items || [];
        return allProducts.filter(product => !product.categoryId);
      }
      const response = await API.getProducts({ limit: 100 });
      const allProducts = response.items || [];
      return allProducts.filter(product => product.categoryId === selectedCategory.id);
    },
    {
      enabled: !!selectedCategory?.id
    }
  );

  // Fetch customers for search
  const { data: customers = [], isLoading: customersLoading } = useQuery(
    ['pos-customers', debouncedCustomerSearchTerm],
    async () => {
      const result = await API.getContacts({
        limit: 100,
        search: debouncedCustomerSearchTerm
      });
      return result.items || [];
    }
  );

  // Fetch shop settings
  const { data: shopSettings } = useQuery(['shop-settings'], async () => {
    const response = await API.get('/shop-settings');
    return response.data;
  });

  console.log(JSON.stringify(shopSettings));

  // Handle barcode scan/input
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setBarcodeLoading(true);
    try {
      const result = await API.getProducts({ sku: barcodeInput.trim().toUpperCase() });
      const products = result.items || [];
      
      if (products.length > 0) {
        addToCart(products[0]);
        setBarcodeInput('');
        toast.success('Product added to cart!');
      } else {
        toast.error('Product not found with this barcode');
      }
    } catch (error) {
      toast.error('Error searching for product');
    } finally {
      setBarcodeLoading(false);
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= Number(product.quantity)) {
          toast.error('Insufficient stock');
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (Number(product.quantity) <= 0) {
          toast.error('Product out of stock');
          return prevCart;
        }
        return [...prevCart, {
          id: product.id,
          name: product.name,
          price: Number(product.retailPrice || product.price),
          quantity: 1,
          maxQuantity: Number(product.quantity),
          unit: product.unit
        }];
      }
    });
  };

  // Update cart item quantity
  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          if (newQuantity > item.maxQuantity) {
            toast.error('Insufficient stock');
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount(0);
    setCustomerName('');
    setCustomerId('');
    setCustomerSearchTerm('');
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const change = paidAmount - total;

  // Create sale mutation
  const createSale = useMutation(
    async (saleData) => {
      return await API.createSale(saleData);
    },
    {
      onSuccess: (data) => {
        toast.success('Sale completed successfully!');
        clearCart();
        queryClient.invalidateQueries(['pos-products']);
        printReceipt(data);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to complete sale');
      }
    }
  );

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (createSale.isLoading) return;

    const saleData = {
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: total,
      paidAmount: paidAmount,
      discount: discountAmount,
      customerName: customerName || undefined,
      contactId: customerId || undefined
    };

    createSale.mutate(saleData);
  };

  // Print receipt function
  const printReceipt = (saleData) => {
    const receiptHtml = generateReceiptHtml(saleData);
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  // Preview receipt function
  const previewReceipt = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    const mockSaleData = { billNumber: 'PREVIEW' };
    const receiptHtml = generateReceiptHtml(mockSaleData);
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    }
  };

  // Generate receipt HTML for thermal printer
  const generateReceiptHtml = (saleData) => {
    const now = new Date();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt</title>
        <style>
          @media print {
            @page { 
              size: 80mm auto; 
              margin: 0; 
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            font-weight: 900;
            line-height: 1.2;
            margin: 0;
            padding: 5mm;
            width: 70mm;
            color: #000;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .shop-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .shop-info {
            font-size: 10px;
            margin-bottom: 1px;
          }
          .receipt-info {
            margin-bottom: 10px;
            font-size: 10px;
          }
          .items {
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .item {
            margin-bottom: 5px;
            font-size: 11px;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 5px;
          }
          .item-name {
            word-wrap: break-word;
            word-break: break-word;
            line-height: 1.3;
            white-space: normal;
            flex: 1;
            min-width: 0;
            max-width: 40mm;
          }
          .item-qty-price {
            white-space: nowrap;
            flex-shrink: 0;
          }
          .totals {
            margin-bottom: 10px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .total-line.grand-total {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #000;
            padding-top: 2px;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 5px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${shopSettings?.logo ? `
            <div style="text-align: center; margin-bottom: 5px;">
              <img src="${shopSettings.logo}" alt="Logo" style="max-width: 60mm; max-height: 20mm; filter: grayscale(100%) contrast(120%);" />
            </div>
          ` : ''}
          <div class="shop-name">${shopSettings?.shopName || 'HISAB GHAR'}</div>
        </div>
        
        <div class="receipt-info">
          <div>Receipt #: ${saleData.billNumber}</div>
          <div>Date: ${now.toLocaleDateString()}</div>
          <div>Time: ${now.toLocaleTimeString()}</div>
          ${customerName ? `<div>Customer: ${customerName}</div>` : ''}
        </div>
        
        <div class="items">
          ${cart.map(item => `
            <div class="item">
              <div class="item-row">
                <div class="item-name">${item.name}</div>
                <div class="item-qty-price">${item.quantity} x ${formatPakistaniCurrency(item.price)}</div>
              </div>
              <div style="text-align: right; font-size: 10px; margin-top: 2px;">
                ${formatPakistaniCurrency(item.price * item.quantity)}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${formatPakistaniCurrency(subtotal)}</span>
          </div>
          ${discount > 0 ? `
            <div class="total-line">
              <span>Discount (${discount}%):</span>
              <span>-${formatPakistaniCurrency(discountAmount)}</span>
            </div>
          ` : ''}
          <div class="total-line grand-total">
            <span>TOTAL:</span>
            <span>${formatPakistaniCurrency(total)}</span>
          </div>
          <div class="total-line">
            <span>Paid:</span>
            <span>${formatPakistaniCurrency(paidAmount)}</span>
          </div>
          ${change > 0 ? `
            <div class="total-line">
              <span>Change:</span>
              <span>${formatPakistaniCurrency(change)}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <div>
            <div>${shopSettings?.shopDescription2 || ''}</div>
            <div>${shopSettings?.userPhone1 || ''}</div>
          </div>
          <div style="margin-top: 10px; padding-top: 5px; border-top: 1px dashed #000; font-size: 10px;">Thank you for shopping with us!</div>
          <div>Visit again soon</div>
        </div>
      </body>
      </html>
    `;
  };

  // Focus barcode input on component mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* View Mode Toggle */}
      <div className="bg-white shadow-sm p-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('default')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'default'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FaTh className="inline mr-1" />
                Default
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FaList className="inline mr-1" />
                Compact
              </button>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Point of Sale</h1>
          </div>
        </div>
      </div>

      <div className={`flex-1 flex ${viewMode === 'default' ? 'flex-col lg:flex-row' : 'flex-col'} relative`}>
      {/* Mobile Cart Toggle Button - Only show in default view */}
      {isMobile && viewMode === 'default' && (
        <div className="fixed bottom-4 right-4 z-30">
          <button
            onClick={() => setShowCart(!showCart)}
            className="bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
          >
            <FaShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Mobile Cart Overlay - Only show in default view */}
      {isMobile && showCart && viewMode === 'default' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowCart(false)}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col p-2 lg:p-4 ${viewMode === 'default' ? 'lg:pr-96' : ''}`}>
        {/* Search & Barcode Input */}
        <div className="bg-white rounded-lg shadow-sm p-3 lg:p-4 mb-3 lg:mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            {/* Barcode Scanner */}
            <form onSubmit={handleBarcodeSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaBarcode className="inline mr-2" />
                Scan/Enter Barcode
              </label>
              <div className="flex">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan or type barcode..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm lg:text-base min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={barcodeLoading}
                  className="px-3 lg:px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 disabled:opacity-50 min-h-[44px]"
                >
                  {barcodeLoading ? <LoadingSpinner size="w-4 h-4" /> : <FaSearch />}
                </button>
              </div>
            </form>

            {/* Product Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSearch className="inline mr-2" />
                Search Products
              </label>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setShowProductDropdown(true)}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                placeholder="Search by name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm lg:text-base min-h-[44px]"
              />
              {/* Product Dropdown for Compact View */}
              {viewMode === 'compact' && showProductDropdown && debouncedSearchTerm && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {productsLoading ? (
                    <div className="p-4 text-center">
                      <LoadingSpinner size="w-6 h-6" />
                    </div>
                  ) : products.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No products found</div>
                  ) : (
                    products.map((product, index) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`p-3 cursor-pointer border-b last:border-b-0 flex justify-between items-center ${
                          index === selectedProductIndex ? 'bg-primary-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{product.name}</div>
                          <div className="text-sm text-gray-500">Stock: {Number(product.quantity)} {product.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary-600">{formatPakistaniCurrency(product.retailPrice || product.price)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact View - Retail POS Layout */}
        {viewMode === 'compact' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar with Total */}
            <div className="bg-white shadow-sm p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                  title="Clear Cart"
                  disabled={cart.length === 0}
                >
                  <FaTrash size={20} />
                </button>
                <span className="text-gray-600">Items: {cart.length}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Amount</div>
                <div className="text-3xl font-bold text-primary-600">{formatPakistaniCurrency(total)}</div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Toggle Sidebar Button */}
              <button
                onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                className="absolute top-4 right-4 z-10 bg-primary-600 text-white p-2 rounded-lg shadow-lg hover:bg-primary-700"
                title={showPaymentDetails ? 'Hide Payment Panel' : 'Show Payment Panel'}
              >
                {showPaymentDetails ? '→' : '←'}
              </button>

              {/* Sale Items List */}
              <div className="flex-1 bg-white overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FaShoppingCart className="text-6xl mb-4" />
                    <p className="text-xl">No items in cart</p>
                    <p className="text-sm">Search or scan products to add</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="border-b">
                        <th className="text-center p-3 font-semibold text-gray-700 w-12">#</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Product</th>
                        <th className="text-center p-3 font-semibold text-gray-700 w-32">Qty</th>
                        <th className="text-right p-3 font-semibold text-gray-700 w-32">Price</th>
                        <th className="text-right p-3 font-semibold text-gray-700 w-32">Total</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, index) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-center text-gray-600 font-medium">{index + 1}</td>
                          <td className="p-3">
                            <div className="font-medium text-gray-800">{item.name}</div>
                            <div className="text-xs text-gray-500">{formatPakistaniCurrency(item.price)} each</div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                >
                                  <FaMinus size={12} />
                                </button>
                                <span className="w-12 text-center font-semibold">{Number(item.quantity) % 1 === 0 ? item.quantity : Number(item.quantity).toFixed(2)}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                >
                                  <FaPlus size={12} />
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (val > 0) updateCartQuantity(item.id, val);
                                  }}
                                  onWheel={(e) => e.target.blur()}
                                  className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                                  placeholder="Qty"
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  placeholder={(item.price * item.quantity).toFixed(2)}
                                  onFocus={(e) => {
                                    if (!e.target.value) {
                                      e.target.value = (item.price * item.quantity).toFixed(2);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const amount = parseFloat(e.target.value);
                                    if (amount > 0) {
                                      const newQty = amount / item.price;
                                      updateCartQuantity(item.id, newQty);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const amount = parseFloat(e.target.value);
                                      if (amount > 0) {
                                        const newQty = amount / item.price;
                                        updateCartQuantity(item.id, newQty);
                                        e.target.blur();
                                      }
                                    }
                                  }}
                                  onWheel={(e) => e.target.blur()}
                                  className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right font-medium">{formatPakistaniCurrency(item.price)}</td>
                          <td className="p-3 text-right font-bold text-lg">{formatPakistaniCurrency(item.price * item.quantity)}</td>
                          <td className="p-3">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                            >
                              <FaTimes size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Right Sidebar - Payment Section */}
              {showPaymentDetails && (
                <div className="w-80 bg-gray-50 border-l flex flex-col h-full">
                  <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100% - 180px)' }}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                      <div className="text-xl font-bold text-gray-800">{formatPakistaniCurrency(subtotal)}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {discount > 0 && (
                        <div className="text-sm text-red-600 mt-1">-{formatPakistaniCurrency(discountAmount)}</div>
                      )}
                    </div>

                    <div className="border-t pt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                      <div className="text-2xl font-bold text-primary-600">{formatPakistaniCurrency(total)}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {change > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <div className="text-xs text-green-700">Change</div>
                        <div className="text-xl font-bold text-green-600">{formatPakistaniCurrency(change)}</div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 space-y-2 border-t bg-white">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaidAmount(total)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                      >
                        Exact
                      </button>
                      <button
                        onClick={previewReceipt}
                        disabled={cart.length === 0}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <FaEye /> Preview
                      </button>
                    </div>
                    <button
                      onClick={processSale}
                      disabled={createSale.isLoading || cart.length === 0}
                      className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {createSale.isLoading ? (
                        <LoadingSpinner size="w-5 h-5" />
                      ) : (
                        <>
                          <FaPrint /> Complete Sale
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Display Area - Only show in default view */}
        {viewMode === 'default' && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 flex-1 overflow-auto">
          {(productsLoading || categoriesLoading || categoryProductsLoading) ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner size="w-8 h-8" />
            </div>
          ) : debouncedSearchTerm ? (
            // Show search results
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Search Results</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {products.length} products found
                </span>
              </div>
              {products.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <FaSearch className="mx-auto text-4xl mb-4 opacity-30" />
                  <p className="text-lg">No products found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-xl p-3 cursor-pointer hover:border-primary-300 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="relative">
                        {product.image ? (
                          <ProductImage
                            filename={product.image}
                            alt={product.name}
                            className="w-full h-20 object-cover rounded-lg mb-3 group-hover:shadow-md transition-shadow"
                          />
                        ) : (
                          <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                            <FaShoppingCart className="text-gray-400 text-2xl" />
                          </div>
                        )}
                        {Number(product.quantity) <= 5 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap min-w-[70px] text-center">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mb-2 text-gray-800 line-clamp-2 leading-tight break-words overflow-hidden">{product.name}</h4>
                      <div className="space-y-1">
                        <p className="text-primary-600 font-bold text-lg">{formatPakistaniCurrency(product.retailPrice || product.price)}</p>
                        <p className="text-xs text-gray-500">Stock: {Number(product.quantity)} {product.unit}</p>
                        {product.sku && (
                          <p className="text-xs text-gray-400 truncate">SKU: {product.sku}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedCategory ? (
            // Show selected category products
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-gray-500" />
                  </button>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                    style={{ backgroundColor: selectedCategory.color }}
                  >
                    {selectedCategory.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedCategory.name}</h3>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {categoryProducts.length} products
                </span>
              </div>
              {categoryProductsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingSpinner size="w-8 h-8" />
                </div>
              ) : categoryProducts.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <FaShoppingCart className="mx-auto text-4xl mb-4 opacity-30" />
                  <p className="text-lg">No products in this category</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-xl p-3 cursor-pointer hover:border-primary-300 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="relative">
                        {product.image ? (
                          <ProductImage
                            filename={product.image}
                            alt={product.name}
                            className="w-full h-20 object-cover rounded-lg mb-3 group-hover:shadow-md transition-shadow"
                          />
                        ) : (
                          <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                            <FaShoppingCart className="text-gray-400 text-2xl" />
                          </div>
                        )}
                        {Number(product.quantity) <= 5 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap min-w-[70px] text-center">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mb-2 text-gray-800 line-clamp-2 leading-tight break-words overflow-hidden">{product.name}</h4>
                      <div className="space-y-1">
                        <p className="text-primary-600 font-bold text-lg">{formatPakistaniCurrency(product.retailPrice || product.price)}</p>
                        <p className="text-xs text-gray-500">Stock: {Number(product.quantity)} {product.unit}</p>
                        {product.sku && (
                          <p className="text-xs text-gray-400 truncate">SKU: {product.sku}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Show welcome message when no category selected
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FaShoppingCart className="text-6xl mb-4 opacity-30" />
              <h3 className="text-2xl font-semibold mb-2">Welcome to POS</h3>
              <p className="text-lg mb-4">Select a category below to browse products</p>
              <p className="text-sm">Or use the search bar to find specific items</p>
            </div>
          )}
        </div>
        )}

        {/* Categories Section - Only show in default view */}
        {viewMode === 'default' && (
        <div className="bg-white rounded-xl shadow-lg p-4 max-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Categories</h3>
            <span className="text-sm text-gray-500">
              {Array.isArray(categories) ? categories.length : 0} categories
            </span>
          </div>
          {!Array.isArray(categories) || categories.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No categories available</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[220px]">
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className={`group cursor-pointer rounded-lg p-4 transition-all duration-200 border w-40 ${
                      selectedCategory?.id === category.id
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg border-primary-600'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="text-center">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl mx-auto mb-3 shadow-sm ${
                          selectedCategory?.id === category.id ? 'bg-white bg-opacity-20' : ''
                        }`}
                        style={{ backgroundColor: selectedCategory?.id === category.id ? 'rgba(255,255,255,0.2)' : category.color }}
                      >
                        {category.icon}
                      </div>
                      <h4 className={`font-semibold text-sm mb-1 line-clamp-1 ${
                        selectedCategory?.id === category.id ? 'text-white' : 'text-gray-800 group-hover:text-primary-700'
                      }`}>
                        {category.name}
                      </h4>
                      <p className={`text-xs ${
                        selectedCategory?.id === category.id ? 'text-primary-100' : 'text-gray-500'
                      }`}>
                        Click to view
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Right Panel - Cart & Checkout - Only show in default view */}
      {viewMode === 'default' && (
        <div className={`
          ${isMobile 
            ? `fixed right-0 top-0 h-[90vh] w-full max-w-sm transform transition-transform duration-300 z-50 ${
                showCart ? 'translate-x-0' : 'translate-x-full'
              }` 
            : 'fixed right-4 top-16 w-80 xl:w-96 h-[90vh]'
          } 
          bg-white shadow-lg flex flex-col
        `}>
        {/* Cart Header */}
        <div className="p-3 lg:p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {isMobile && (
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-lg mr-2"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg lg:text-xl font-bold text-gray-800 flex items-center flex-1">
              <FaShoppingCart className="mr-2" />
              Cart ({cart.length})
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                title="Clear Cart"
              >
                <FaTrash />
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="overflow-auto p-2" style={{ height: '60vh' }}>
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <FaShoppingCart className="mx-auto text-4xl mb-4 opacity-50" />
              <p>Cart is empty</p>
              <p className="text-sm">Scan or search products to add</p>
            </div>
          ) : (
            <div className="space-y-1">
              {cart.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-2">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-medium text-xs flex-1 mr-2 leading-tight truncate">{item.name}</h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded w-6 h-6 flex items-center justify-center flex-shrink-0"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:bg-gray-400"
                      >
                        <FaMinus size={8} />
                      </button>
                      <span className="w-6 text-center font-medium text-xs">{Number(item.quantity) % 1 === 0 ? item.quantity : Number(item.quantity).toFixed(3)}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:bg-gray-400"
                      >
                        <FaPlus size={8} />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">{formatPakistaniCurrency(item.price)} each</div>
                      <div className="font-semibold text-xs">{formatPakistaniCurrency(item.price * item.quantity)}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="text-[10px] text-gray-500">Qty/{item.unit || 'unit'}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > 0) updateCartQuantity(item.id, val);
                        }}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Amount (Rs.)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder={(item.price * item.quantity).toFixed(2)}
                        onFocus={(e) => {
                          if (!e.target.value) {
                            e.target.value = (item.price * item.quantity).toFixed(2);
                          }
                        }}
                        onBlur={(e) => {
                          const amount = parseFloat(e.target.value);
                          if (amount > 0) {
                            const newQty = amount / item.price;
                            updateCartQuantity(item.id, newQty);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const amount = parseFloat(e.target.value);
                            if (amount > 0) {
                              const newQty = amount / item.price;
                              updateCartQuantity(item.id, newQty);
                              e.target.blur();
                            }
                          }
                        }}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Section */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-3 lg:p-4">
            {/* Totals */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatPakistaniCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount ({discount}%):</span>
                  <span>-{formatPakistaniCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatPakistaniCurrency(total)}</span>
              </div>
            </div>

            {/* Discount */}
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  Discount (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 h-8"
                />
              </div>
            </div>

            {/* Payment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Paid
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
              />
              {change > 0 && (
                <div className="mt-2 text-sm text-green-600">
                  Change: {formatPakistaniCurrency(change)}
                </div>
              )}
            </div>

            {/* Quick Payment Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setPaidAmount(total)}
                className="px-2 lg:px-3 py-3 bg-gray-200 text-gray-700 rounded-md text-xs lg:text-sm hover:bg-gray-300 active:bg-gray-400 min-h-[48px]"
              >
                Exact
              </button>
              <button
                onClick={previewReceipt}
                className="px-2 lg:px-3 py-3 bg-blue-200 text-blue-700 rounded-md text-xs lg:text-sm hover:bg-blue-300 active:bg-blue-400 flex items-center justify-center min-h-[48px]"
                title="Preview Receipt"
              >
                <FaEye />
              </button>
            </div>

            {/* Process Sale Button */}
            <button
              onClick={processSale}
              disabled={createSale.isLoading}
              className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[52px] text-sm lg:text-base"
            >
              {createSale.isLoading ? (
                <LoadingSpinner size="w-5 h-5" />
              ) : (
                <>
                  <FaPrint className="mr-2" />
                  <span className="hidden sm:inline">Complete Sale & Print</span>
                  <span className="sm:hidden">Complete Sale</span>
                </>
              )}
            </button>
          </div>
        )}
        </div>
      )}
      </div>
    </div>
  );
}

export default POS;