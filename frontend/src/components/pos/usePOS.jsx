import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';
import API from '../../utils/api';

export function usePOS() {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed'); // 'percentage' or 'fixed'
  const [paidAmount, setPaidAmount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [balance, setBalance] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [debouncedCustomerSearchTerm, setDebouncedCustomerSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [createNewContact, setCreateNewContact] = useState(false);
  const [newContactData, setNewContactData] = useState({ name: '', phoneNumber: '', address: '' });
  const [creatingContact, setCreatingContact] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState('default'); // 'default' or 'compact'
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [showCategories, setShowCategories] = useState(true);
  const [showSearchInputs, setShowSearchInputs] = useState(() => {
    const saved = localStorage.getItem('posShowSearchInputs');
    return saved ? JSON.parse(saved) : true;
  });
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

  const handleSearchKeyDown = (e, products) => {
    if (!showProductDropdown || !products || products.length === 0) return;

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
      default:
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
      
      // Apply custom order from localStorage
      const savedOrder = JSON.parse(localStorage.getItem('categoryOrder') || '[]');
      if (savedOrder.length > 0) {
        cats.sort((a, b) => {
          const indexA = savedOrder.indexOf(a.id);
          const indexB = savedOrder.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      }
      
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

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = viewMode === 'compact' 
    ? (discountType === 'percentage' ? (subtotal * discount) / 100 : discount)
    : (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const change = paidAmount - total;
  
  // Auto-calculate balance when cash received changes and auto-fill paid amount
  useEffect(() => {
    if (cashReceived > 0) {
      setBalance(cashReceived - total);
      setPaidAmount(total); // Auto-fill paid amount with total when cash is received
    } else if (cashReceived === 0) {
      setBalance(0);
    }
  }, [cashReceived, total]);

  // Reset payment fields when cart becomes empty
  useEffect(() => {
    if (cart.length === 0) {
      setDiscount(0);
      setDiscountType('fixed');
      setPaidAmount(0);
      setCashReceived(0);
      setBalance(0);
    }
  }, [cart.length]);

  // Handle barcode scan/input
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setBarcodeLoading(true);
    try {
      const result = await API.getProducts({ sku: barcodeInput.trim().toUpperCase() });
      const productsFromBarcode = result.items || [];
      
      if (productsFromBarcode.length > 0) {
        addToCart(productsFromBarcode[0]);
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
  const addToCart = async (product) => {
    // Check raw materials for manufactured products
    if (product.isManufactured && product.recipe?.ingredients) {
      const insufficientMaterials = [];
      
      for (const ingredient of product.recipe.ingredients) {
        const required = Number(ingredient.quantity);
        const available = Number(ingredient.rawMaterial.quantity);
        
        if (available < required) {
          insufficientMaterials.push(`${ingredient.rawMaterial.name} (need ${required}, have ${available})`);
        }
      }

      if (insufficientMaterials.length > 0) {
        const errorLines = ['Insufficient raw materials:'];
        insufficientMaterials.forEach(msg => {
          errorLines.push(`• ${msg}`);
        });
        toast.error(errorLines.join('\n'), { duration: 5000 });
      }
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (!product.isManufactured && existingItem.quantity >= Number(product.quantity)) {
          toast.error('Insufficient stock');
          return prevCart;
        }
        
        // Check raw materials when adding more of manufactured product
        if (product.isManufactured && product.recipe?.ingredients) {
          const insufficientMaterials = [];
          const currentConsumption = existingItem.quantity;
          
          for (const ingredient of product.recipe.ingredients) {
            const requiredPerUnit = Number(ingredient.quantity);
            const totalAvailable = Number(ingredient.rawMaterial.quantity);
            const alreadyUsed = requiredPerUnit * currentConsumption;
            const remaining = totalAvailable - alreadyUsed;
            
            if (remaining < requiredPerUnit) {
              insufficientMaterials.push(`${ingredient.rawMaterial.name} (need ${requiredPerUnit}, have ${Math.max(0, remaining)})`);
            }
          }
          
          if (insufficientMaterials.length > 0) {
            toast.error(
              <div>
                <div className="font-semibold">Insufficient raw materials:</div>
                {insufficientMaterials.map((msg, idx) => (
                  <div key={idx} className="text-sm">• {msg}</div>
                ))}
              </div>,
              { duration: 5000 }
            );
          }
        }
        
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (!product.isManufactured && Number(product.quantity) <= 0) {
          toast.error('Product out of stock');
          return prevCart;
        }
        return [...prevCart, {
          id: product.id,
          name: product.name,
          price: Number(product.retailPrice || product.price),
          quantity: 1,
          maxQuantity: product.isManufactured ? Infinity : Number(product.quantity),
          unit: product.unit,
          isManufactured: product.isManufactured,
          recipe: product.recipe
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
          
          // Check raw materials when incrementing manufactured products
          if (item.isManufactured && item.recipe?.ingredients && newQuantity > item.quantity) {
            const insufficientMaterials = [];
            
            // Calculate how much is already consumed by current cart quantity
            const currentConsumption = item.quantity;
            
            for (const ingredient of item.recipe.ingredients) {
              const requiredPerUnit = Number(ingredient.quantity);
              const totalAvailable = Number(ingredient.rawMaterial.quantity);
              const alreadyUsed = requiredPerUnit * currentConsumption;
              const remaining = totalAvailable - alreadyUsed;
              
              if (remaining < requiredPerUnit) {
                insufficientMaterials.push(`${ingredient.rawMaterial.name} (need ${requiredPerUnit}, have ${Math.max(0, remaining)})`);
              }
            }
            
            if (insufficientMaterials.length > 0) {
              toast.error(
                <div>
                  <div className="font-semibold">Insufficient raw materials:</div>
                  {insufficientMaterials.map((msg, idx) => (
                    <div key={idx} className="text-sm">• {msg}</div>
                  ))}
                </div>,
                { duration: 5000 }
              );
            }
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
    setDiscountType('fixed');
    setPaidAmount(0);
    setCashReceived(0);
    setBalance(0);
    setCustomerName('');
    setCustomerId('');
    setCustomerSearchTerm('');
    setSelectedContact(null);
    setCreateNewContact(false);
    setNewContactData({ name: '', phoneNumber: '', address: '' });
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
            font-size: 11px;
            font-weight: 700;
            line-height: 1.3;
            margin: 0;
            padding: 5mm;
            width: 70mm;
            color: #000;
          }
          .header {
            text-align: center;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .shop-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .shop-info {
            font-size: 9px;
            line-height: 1.4;
            margin-bottom: 2px;
          }
          .divider {
            border-bottom: 1px dashed #000;
            margin: 8px 0;
          }
          .receipt-info {
            font-size: 10px;
            margin-bottom: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          th {
            text-align: left;
            font-size: 10px;
            padding: 4px 2px;
            border-bottom: 1px solid #000;
            border-right: 1px solid #000;
          }
          th:last-child { border-right: none; }
          th.center { text-align: center; }
          th.right { text-align: right; }
          td {
            padding: 4px 2px;
            font-size: 10px;
            vertical-align: top;
            border-right: 1px solid #000;
          }
          td:last-child { border-right: none; }
          td.center { text-align: center; }
          td.right { text-align: right; }
          .totals {
            border-top: 1px dashed #000;
            padding-top: 6px;
            margin-bottom: 8px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 11px;
          }
          .total-line.grand {
            font-size: 13px;
            font-weight: bold;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px solid #000;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            border-top: 1px dashed #000;
            padding-top: 6px;
            margin-top: 8px;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${shopSettings?.logo ? `
            <div style="text-align: center; margin-bottom: 5px;">
              <img src="${shopSettings.logo}" alt="Logo" style="max-width: 50mm; max-height: 18mm; filter: grayscale(100%) contrast(200%) brightness(100%);" onerror="this.style.display='none'" />
            </div>
          ` : ''}
          <div class="shop-name">${shopSettings?.shopName || 'HISAB GHAR'}</div>
          ${shopSettings?.shopDescription2 ? `<div class="shop-info">${shopSettings.shopDescription2}</div>` : ''}
          ${shopSettings?.userPhone1 ? `<div class="shop-info">Contact# ${shopSettings.userPhone1}</div>` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="receipt-info">
          <div class="info-row">
            ${shopSettings?.userName1 ? `<span>Cashier: ${shopSettings.userName1}</span>` : ''}
            <span>${now.toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span>Number: ${saleData.billNumber}</span>
            <span>${now.toLocaleTimeString()}</span>
          </div>
          ${customerName && `<div class="info-row"><span>Customer:</span><span>${customerName}</span></div>` }
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">0</th>
              <th style="width: 42%;">Descriptions</th>
              <th class="center" style="width: 15%;">Qty</th>
              <th class="right" style="width: 17%;">Rate</th>
              <th class="right" style="width: 18%;">Amnt</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td style="word-wrap: break-word;">${item.name}</td>
                <td class="center">${Number(item.quantity).toFixed(1)}</td>
                <td class="right">${Number(item.price).toFixed(1)}</td>
                <td class="right">${Number(item.price * item.quantity).toFixed(1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-line">
            <span>Total Rs :</span>
            <span>${Number(subtotal).toFixed(1)}</span>
          </div>
          ${discountAmount > 0 ? `
            <div class="total-line">
              <span>Total Disc: Rs :</span>
              <span>${Number(discountAmount).toFixed(1)}</span>
            </div>
          ` : ''}
          <div class="total-line">
            <span>Sub Total Rs :</span>
            <span>${Number(total).toFixed(1)}</span>
          </div>
          <div class="total-line grand">
            <span>Paid Rs :</span>
            <span>${Number(cashReceived || paidAmount || total).toFixed(1)}</span>
          </div>
          ${cashReceived > 0 && balance !== 0 ? `
            <div class="total-line">
              <span>Change Rs :</span>
              <span>${Number(balance).toFixed(1)}</span>
            </div>
          ` : '<div class="total-line"><span>Change Rs :</span><span>0.0</span></div>'}
        </div>
        
        <div class="footer">
          <div style="margin-bottom: 6px; font-weight: bold;">Thank You for Visiting Us!</div>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #000; font-size: 10px;">
            Powered By Hisab Ghar 03142740270
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Print receipt function
  const printReceipt = useCallback((saleData) => {
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
  }, [generateReceiptHtml]);

  // Preview receipt function
  const previewReceipt = useCallback(() => {
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
  }, [cart, generateReceiptHtml]);

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
        queryClient.invalidateQueries(['category-products']);
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

    let contactId = selectedContact?.id;
    
    // Create new contact if checkbox is checked
    if (createNewContact && newContactData.name && newContactData.phoneNumber) {
      setCreatingContact(true);
      try {
        const contactResponse = await API.createContact({
          ...newContactData,
          contactType: 'customer'
        });
        setCreatingContact(false);
        
        if (contactResponse.id) {
          contactId = contactResponse.id
          toast.success('Customer created successfully!');
        } else {
          toast.error('Failed to create customer');
          return;
        }
      } catch (error) {
        setCreatingContact(false);
         toast.error('Failed to create customer');
         return;
      }
    }

    const saleData = {
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: total,
      paidAmount: paidAmount,
      discount: discountAmount,
      ...(contactId && { contactId })
    };

    createSale.mutate(saleData);
  };

  return {
    cart, setCart,
    searchTerm, setSearchTerm,
    debouncedSearchTerm, setDebouncedSearchTerm,
    showProductDropdown, setShowProductDropdown,
    barcodeInput, setBarcodeInput,
    discount, setDiscount,
    discountType, setDiscountType,
    paidAmount, setPaidAmount,
    cashReceived, setCashReceived,
    balance, setBalance,
    customerName, setCustomerName,
    customerId, setCustomerId,
    customerSearchTerm, setCustomerSearchTerm,
    debouncedCustomerSearchTerm, setDebouncedCustomerSearchTerm,
    selectedContact, setSelectedContact,
    createNewContact, setCreateNewContact,
    newContactData, setNewContactData,
    creatingContact, setCreatingContact,
    showCustomerDropdown, setShowCustomerDropdown,
    showCart, setShowCart,
    isMobile, setIsMobile,
    viewMode, setViewMode,
    barcodeLoading, setBarcodeLoading,
    selectedCategory, setSelectedCategory,
    showPaymentDetails, setShowPaymentDetails,
    selectedProductIndex, setSelectedProductIndex,
    showCategories, setShowCategories,
    showSearchInputs, setShowSearchInputs,
    barcodeInputRef, searchInputRef,
    products, productsLoading,
    categories, categoriesLoading,
    categoryProducts, categoryProductsLoading,
    customers, customersLoading,
    shopSettings,
    subtotal, discountAmount, total, change,
    handleSearchChange, handleSearchKeyDown, handleProductSelect,
    handleCustomerSearchChange, handleBarcodeSubmit,
    addToCart, updateCartQuantity, removeFromCart, clearCart,
    processSale, previewReceipt, createSale
  };
}
