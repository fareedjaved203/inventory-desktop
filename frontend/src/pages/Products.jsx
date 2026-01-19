import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';
import DataStorageManager from '../utils/DataStorageManager';
import { STORES } from '../utils/indexedDBSchema';
import { z } from 'zod';
import DeleteModal from '../components/DeleteModal';
import TableSkeleton from '../components/TableSkeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import { debounce } from 'lodash';
import { formatPakistaniCurrency } from '../utils/formatCurrency';
import { generateUserBarcode } from '../utils/barcodeGenerator';
import { FaSearch, FaBoxOpen, FaTag, FaDollarSign, FaWarehouse, FaBarcode, FaPrint, FaFilePdf } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';
import ProductImageUpload from '../components/ProductImageUpload';
import ProductImage from '../components/ProductImage';


const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  retailPrice: z.number().positive("Retail price must be positive").max(100000000, "Retail price cannot exceed Rs.10 Crores").nullable().optional(),
  wholesalePrice: z.number().positive("Wholesale price must be positive").max(100000000, "Wholesale price cannot exceed Rs.10 Crores").nullable().optional(),
  purchasePrice: z.number().min(0, "Purchase price must be non-negative").max(100000000, "Purchase price cannot exceed Rs.10 Crores").nullable().optional(),
  perUnitPurchasePrice: z.number().min(0, "Per unit cost must be non-negative").nullable().optional(),
  sku: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  unit: z.enum(["pcs", "dozen", "kg", "gram", "ltr", "ml", "ft", "metre", "sqft", "carton", "roll", "sheet", "drum", "packet", "bottle", "bag", "pair", "set", "ton", "ohm"]).optional(),
  unitValue: z.union([z.number().positive("Unit value must be positive"), z.null(), z.undefined()]).optional(),
  lowStockThreshold: z.number().min(0, "Low stock threshold must be non-negative"),
  isRawMaterial: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

function Products() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const searchInputRef = useRef(null);
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [validationErrors, setValidationErrors] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showLowStock, setShowLowStock] = useState(location.state?.showLowStock || false);
  const [showDamaged, setShowDamaged] = useState(false);
  const [showRawMaterials, setShowRawMaterials] = useState(false);
  const [damagedModalOpen, setDamagedModalOpen] = useState(false);
  const [selectedProductForDamage, setSelectedProductForDamage] = useState(null);
  const [damagedQuantity, setDamagedQuantity] = useState('');
  const [maxRestoreQuantity, setMaxRestoreQuantity] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    purchasePrice: '',
    sku: '',
    quantity: '',
    unit: 'pcs',
    unitValue: '',
    lowStockThreshold: '10',
    isRawMaterial: false,
    perUnitPurchasePrice: '',
    categoryId: '',
    image: null,
  });
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [selectedProductForLabel, setSelectedProductForLabel] = useState(null);

  // Reset page when switching between filters
  useEffect(() => {
    setCurrentPage(1);
  }, [showLowStock, showDamaged, showRawMaterials]);

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

  const { data: products, isLoading, isFetching } = useQuery(
    ['products', debouncedSearchTerm, currentPage, showLowStock, showDamaged, showRawMaterials],
    async () => {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: !showDamaged ? debouncedSearchTerm : ''
      };
      
      if (showLowStock) {
        return await DataStorageManager.getLowStockProducts(params);
      }
      
      if (showRawMaterials) {
        params.isRawMaterial = true;
      }
      
      return await DataStorageManager.read(STORES.products, params);
    }
  );

  const { data: categories } = useQuery(
    ['categories'],
    async () => {
      return await DataStorageManager.read(STORES.categories, { limit: 100 });
    }
  );

    // Maintain search input focus
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [products]);

  // Listen for sync events to refresh data
  useEffect(() => {
    const handleSyncComplete = () => {
      queryClient.invalidateQueries(['products']);
    };

    window.addEventListener('productsSyncComplete', handleSyncComplete);
    return () => window.removeEventListener('productsSyncComplete', handleSyncComplete);
  }, [queryClient]);

  const updateProduct = useMutation(
    async (updatedProduct) => {
      console.log("payload of product:", updatedProduct)
      return await DataStorageManager.update(STORES.products, updatedProduct.id, updatedProduct);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        setIsModalOpen(false);
        setFormData({ name: '', description: '', retailPrice: '', wholesalePrice: '', purchasePrice: '', sku: '', quantity: '', unit: 'pcs', unitValue: '', lowStockThreshold: '10', isRawMaterial: false, perUnitPurchasePrice: '', categoryId: '', image: null });
        setIsEditMode(false);
        setValidationErrors({});
        toast.success('Product updated successfully!');
      },
      onError: (error) => {
        console.error('Update product error:', error);
        setValidationErrors({
          name: error.response?.data?.error || 'Failed to update product'
        });
      }
    }
  );

  const [deleteError, setDeleteError] = useState(null);

  const deleteProduct = useMutation(
    async (productId) => {
      return await DataStorageManager.delete(STORES.products, productId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        setDeleteError(null);
        setDeleteModalOpen(false);
        setProductToDelete(null);
        toast.success('Product deleted successfully!');
      },
      onError: (error) => {
        setDeleteError(error.response?.data?.error || 'An error occurred while deleting the product');
      }
    }
  );

  const createProduct = useMutation(
    async (newProduct) => {
      return await DataStorageManager.create(STORES.products, newProduct);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        setIsModalOpen(false);
        setFormData({ name: '', description: '', retailPrice: '', wholesalePrice: '', purchasePrice: '', sku: '', quantity: '', unit: 'pcs', unitValue: '', lowStockThreshold: '10', isRawMaterial: false, perUnitPurchasePrice: '', categoryId: '', image: null });
        setValidationErrors({});
        toast.success('Product created successfully!');
      },
      onError: (error) => {
        setValidationErrors({
          name: error.response?.data?.error || 'Failed to create product'
        });
      }
    }
  );

  const markAsDamaged = useMutation(
    async ({ productId, quantity }) => {
      // Update product quantity by reducing damaged amount
      const product = await DataStorageManager.read(STORES.products, { id: productId });
      if (product.items?.[0]) {
        const updatedProduct = {
          ...product.items[0],
          quantity: Math.max(0, product.items[0].quantity - quantity)
        };
        return await DataStorageManager.update(STORES.products, productId, updatedProduct);
      }
      throw new Error('Product not found');
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        setDamagedModalOpen(false);
        setSelectedProductForDamage(null);
        setDamagedQuantity('');
        toast.success('Product marked as damaged!');
      }
    }
  );

  const restoreDamaged = useMutation(
    async ({ productId, quantity }) => {
      // Update product quantity by adding restored amount
      const product = await DataStorageManager.read(STORES.products, { id: productId });
      if (product.items?.[0]) {
        const updatedProduct = {
          ...product.items[0],
          quantity: product.items[0].quantity + quantity
        };
        return await DataStorageManager.update(STORES.products, productId, updatedProduct);
      }
      throw new Error('Product not found');
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        setDamagedModalOpen(false);
        setSelectedProductForDamage(null);
        setDamagedQuantity('');
        setMaxRestoreQuantity(0);
        toast.success('Product restored successfully!');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check for empty required fields first
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = t('nameIsRequired');
    }
    if (!formData.quantity.trim()) {
      errors.quantity = t('quantityIsRequired');
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const productData = {
      ...formData,
      retailPrice: formData.retailPrice && formData.retailPrice.trim() ? parseFloat(formData.retailPrice) : null,
      wholesalePrice: formData.wholesalePrice && formData.wholesalePrice.trim() ? parseFloat(formData.wholesalePrice) : null,
      unitValue: formData.unitValue && formData.unitValue.trim() ? parseFloat(formData.unitValue) : null,
      purchasePrice: formData.purchasePrice && formData.purchasePrice.trim() ? parseFloat(formData.purchasePrice) : null,
      perUnitPurchasePrice: formData.perUnitPurchasePrice && formData.perUnitPurchasePrice.toString().trim() ? parseFloat(formData.perUnitPurchasePrice) : null,
      quantity: parseFloat(formData.quantity),
      lowStockThreshold: parseFloat(formData.lowStockThreshold),
      isRawMaterial: formData.isRawMaterial,
      categoryId: formData.categoryId || null,
      image: formData.image,
    };
    
    console.log('Form data:', formData);
    console.log('Product data being sent:', productData);

    try {
      const validatedData = productSchema.parse(productData);
      console.log('After Zod validation:', validatedData);
      setValidationErrors({});

      if (isEditMode) {
        // Ensure id is included for updates
        updateProduct.mutate({ ...validatedData, id: formData.id });
      } else {
        createProduct.mutate(validatedData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Zod validation error:', error.errors);
        const errors = {};
        error.errors.forEach((err) => {
          const path = err.path[0];
          if (path === 'name' && err.code === 'too_small') {
            errors[path] = t('nameIsRequired');
          } else if ((path === 'retailPrice' || path === 'wholesalePrice') && err.code === 'too_small') {
            errors[path] = t('priceMustBePositive');
          } else if (path === 'quantity' && err.code === 'too_small') {
            errors[path] = t('quantityMustBePositive');
          } else if (path === 'lowStockThreshold' && err.code === 'too_small') {
            errors[path] = t('lowStockThresholdMustBeNonNegative');
          } else {
            errors[path] = err.message;
          }
        });
        setValidationErrors(errors);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  const handleEdit = (product) => {
    setFormData({
      id: product.id,
      name: product.name || '',
      description: product.description || '',
      retailPrice: product.retailPrice ? product.retailPrice.toString() : (product.price ? product.price.toString() : ''),
      wholesalePrice: product.wholesalePrice ? product.wholesalePrice.toString() : '',
      purchasePrice: product.purchasePrice ? product.purchasePrice.toString() : '',
      sku: product.sku || '',
      quantity: product.quantity ? product.quantity.toString() : '0',
      unit: product.unit || 'pcs',
      unitValue: product.unitValue ? product.unitValue.toString() : '',
      lowStockThreshold: (product.lowStockThreshold || 10).toString(),
      isRawMaterial: product.isRawMaterial || false,
      perUnitPurchasePrice: product.perUnitPurchasePrice ? product.perUnitPurchasePrice.toString() : '',
      categoryId: product.categoryId || '',
      image: product.image || null,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct.mutate(productToDelete.id);
    }
  };

  if (isLoading && !debouncedSearchTerm && !showLowStock && !showDamaged && !showRawMaterials) return (
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800">{t('products')}</h1>
          {showLowStock && (
            <span className="bg-orange-100 text-orange-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
              Low Stock Items
            </span>
          )}
          {showDamaged && (
            <span className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
              Damaged Items
            </span>
          )}
          {showRawMaterials && (
            <span className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
              Raw Materials
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
          {!showDamaged && (
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={showLowStock ? "Search low stock products..." : "Search products..."}
                value={searchTerm}
                onChange={handleSearchChange}
                className={`w-full sm:w-64 pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  showLowStock 
                    ? 'border-orange-200 focus:ring-orange-500' 
                    : 'border-primary-200 focus:ring-primary-500'
                }`}
              />
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                showLowStock ? 'text-orange-400' : 'text-primary-400'
              }`}>
                <FaSearch />
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {(showLowStock || showDamaged || showRawMaterials) && (
              <button
                onClick={() => {
                  setShowLowStock(false);
                  setShowDamaged(false);
                  setShowRawMaterials(false);
                }}
                className="px-3 py-2 text-sm border border-primary-200 rounded-lg text-primary-700 hover:bg-primary-50"
              >
                Show All Products
              </button>
            )}
            {!showLowStock && !showDamaged && !showRawMaterials && (
              <>
                <button
                  onClick={() => {
                    setShowLowStock(true);
                    setShowDamaged(false);
                    setShowRawMaterials(false);
                  }}
                  className="px-3 py-2 text-sm border border-orange-200 rounded-lg text-orange-700 hover:bg-orange-50"
                >
                  Low Stock
                </button>
                <button
                  onClick={() => {
                    setShowDamaged(true);
                    setShowLowStock(false);
                    setShowRawMaterials(false);
                  }}
                  className="px-3 py-2 text-sm border border-red-200 rounded-lg text-red-700 hover:bg-red-50"
                >
                  Damaged Items
                </button>
                <button
                  onClick={() => {
                    setShowRawMaterials(true);
                    setShowLowStock(false);
                    setShowDamaged(false);
                  }}
                  className="px-3 py-2 text-sm border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50"
                >
                  Raw Materials
                </button>
              </>
            )}
            <button
              onClick={async () => {
                try {
                  // Fetch 1000 products via API for the report
                  const response = await API.get('/products', {
                    params: {
                      limit: 1000,
                      page: 1
                    }
                  });
                  const allProducts = response.data;
                  
                  const printWindow = window.open('', '_blank', 'width=800,height=600');
                  const reportHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <title>Products Stock Report</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        .company { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                        .report-title { font-size: 18px; color: #666; }
                        .date { font-size: 12px; color: #888; margin-top: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; font-weight: bold; }
                        .number { text-align: right; }
                        .low-stock { background-color: #fff3cd; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                        @media print { body { margin: 0; } }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="company">HISAB GHAR</div>
                        <div class="report-title">Products Stock Report</div>
                        <div class="date">Generated on: ${new Date().toLocaleDateString('en-PK', { 
                          year: 'numeric', month: 'long', day: 'numeric', 
                          hour: '2-digit', minute: '2-digit' 
                        })}</div>
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>Description</th>
                            <th>SKU/Barcode</th>
                            <th class="number">Current Stock</th>
                            <th>Unit</th>
                            <th class="number">Retail Price</th>
                            <th class="number">Inventory Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${allProducts?.items?.map(product => `
                            <tr class="${product.quantity <= (product.lowStockThreshold || 10) ? 'low-stock' : ''}">
                              <td><strong>${product.name}</strong></td>
                              <td>${product.description || '-'}</td>
                              <td>${product.sku || '-'}</td>
                              <td class="number"><strong>${product.quantity}</strong></td>
                              <td>${product.unit || 'pcs'}</td>
                              <td class="number">${product.retailPrice ? formatPakistaniCurrency(product.retailPrice) : (product.price ? formatPakistaniCurrency(product.price) : '-')}</td>
                              <td class="number">${product.purchasePrice && product.quantity ? formatPakistaniCurrency(product.purchasePrice * product.quantity) : '-'}</td>
                            </tr>
                          `).join('') || '<tr><td colspan="7" style="text-align: center;">No products found</td></tr>'}
                        </tbody>
                      </table>
                      <div class="footer">
                        <p>Total Products: ${allProducts?.total || 0} | Low Stock Items highlighted in yellow</p>
                        <p>Report generated by Hisab Ghar Inventory Management System</p>
                      </div>
                    </body>
                    </html>
                  `;
                  printWindow.document.write(reportHtml);
                  printWindow.document.close();
                  setTimeout(() => { printWindow.print(); }, 500);
                } catch (error) {
                  console.error('Error generating report:', error);
                  toast.error('Failed to generate report');
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-2 text-sm rounded-lg hover:from-red-700 hover:to-red-800 shadow-sm whitespace-nowrap w-full sm:w-auto flex items-center gap-2"
            >
              <FaFilePdf className="w-4 h-4" />
              Stock Report
            </button>
            <button
              onClick={async () => {
                setIsEditMode(false);
                setFormData({
                  name: '',
                  description: '',
                  retailPrice: '',
                  wholesalePrice: '',
                  purchasePrice: '',
                  sku: '',
                  quantity: '0',
                  unit: 'pcs',
                  unitValue: '',
                  lowStockThreshold: '10',
                  isRawMaterial: false,
                  perUnitPurchasePrice: '',
                  categoryId: '',
                  image: null
                });
                setValidationErrors({});
                setIsModalOpen(true);
                
                // Auto-generate barcode for new products
                setIsGeneratingBarcode(true);
                try {
                  const barcode = await generateUserBarcode();
                  setFormData(prev => ({ ...prev, sku: barcode }));
                } catch (error) {
                  console.error('Failed to generate barcode:', error);
                } finally {
                  setIsGeneratingBarcode(false);
                }
              }}
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap w-full sm:w-auto"
            >
              {t('addProduct')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{language === 'ur' ? 'نام' : 'Name'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider hidden md:table-cell">{t('sku')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{language === 'ur' ? 'ریٹیل قیمت' : 'Retail Price'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider hidden xl:table-cell">{language === 'ur' ? 'ہول سیل قیمت' : 'Wholesale Price'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider hidden lg:table-cell">{language === 'ur' ? 'خریداری کی قیمت' : 'Purchase Price'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider hidden xl:table-cell">Per Unit Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider hidden sm:table-cell">{t('quantity')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider hidden lg:table-cell">Inventory Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isFetching && (debouncedSearchTerm || showLowStock || showDamaged || showRawMaterials) ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <LoadingSpinner size="w-6 h-6" />
                    <span className="ml-2 text-gray-500">Searching...</span>
                  </div>
                </td>
              </tr>
            ) : (
              products?.items?.filter(product => {
                if (showRawMaterials) {
                  return product.isRawMaterial === true;
                }
                if (showDamaged) {
                  return product.quantity === 0;
                }
                return true;
              })?.map((product) => (
                <tr key={product.id} className="hover:bg-primary-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <ProductImage
                          filename={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-10 h-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center ${product.image ? 'hidden' : 'flex'}`}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="font-medium text-primary-700">{product.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell text-gray-600">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-800">
                    {product.retailPrice ? formatPakistaniCurrency(product.retailPrice) : (product.price ? formatPakistaniCurrency(product.price) : '-')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell font-medium text-green-800">
                    {product.wholesalePrice ? formatPakistaniCurrency(product.wholesalePrice) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell font-medium text-blue-800">
                    {product.purchasePrice ? formatPakistaniCurrency(product.purchasePrice) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell font-medium text-purple-800">
                    {product.perUnitPurchasePrice ? (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                        {formatPakistaniCurrency(product.perUnitPurchasePrice)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className={`${
                      product.quantity <= (product.lowStockThreshold || 10)
                        ? 'text-orange-700 bg-orange-50 border border-orange-200' 
                        : 'text-green-700 bg-green-50 border border-green-200'
                    } px-2 py-1 rounded-full text-xs font-medium`}>
                      {Number(product.quantity) % 1 === 0 ? product.quantity : Number(product.quantity).toFixed(2)} {product.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell font-medium text-slate-800">
                    {product.unit === 'pcs' && product.purchasePrice && product.quantity
                      ? formatPakistaniCurrency(product.purchasePrice * product.quantity)
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {showDamaged ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedProductForDamage(product);
                              setDamagedQuantity('');
                              setMaxRestoreQuantity(product.quantity);
                              setDamagedModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Restore
                          </button>
                          <button
                            onClick={() => restoreDamaged.mutate({ productId: product.id, quantity: product.quantity })}
                            className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Restore All
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              const printWindow = window.open('', '_blank', 'width=400,height=600');
                              const displayPrice = product.retailPrice || product.price;
                              const labelHtml = `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <meta charset="utf-8">
                                  <title>Product Label</title>
                                  <style>
                                    @media print { @page { size: 2.25in 1.25in; margin: 0.1in; } }
                                    body { font-family: Arial, sans-serif; font-size: 8px; margin: 0; padding: 2px; width: 2.05in; height: 1.05in; border: 1px solid #000; }
                                    .label { display: flex; flex-direction: column; height: 100%; justify-content: space-between; text-align: center; }
                                    .name { font-size: 9px; font-weight: bold; margin-bottom: 2px; }
                                    .price { font-size: 12px; font-weight: bold; margin: 2px 0; }
                                    .shop { font-size: 6px; color: #666; margin-top: 1px; }
                                  </style>
                                </head>
                                <body>
                                  <div class="label">
                                    <div class="name">${product.name}</div>
                                    <div class="price">${displayPrice ? formatPakistaniCurrency(displayPrice) : 'No Price Set'}</div>
                                    <div>
                                      ${product.sku ? '<div style="font-size:8px;">[BARCODE: ' + product.sku + ']</div>' : '<div style="font-size:8px;color:#666;">NO BARCODE</div>'}
                                    </div>
                                    <div class="shop">HISAB GHAR</div>
                                  </div>
                                </body>
                                </html>
                              `;
                              printWindow.document.write(labelHtml);
                              printWindow.document.close();
                              setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
                            }}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                            title="Print Label"
                          >
                            <FaPrint className="w-4 h-4" />
                            Label
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProductForDamage(product);
                              setMaxRestoreQuantity(product.quantity);
                              setDamagedModalOpen(true);
                            }}
                            className="text-orange-600 hover:text-orange-900 inline-flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                          Damage
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Delete
                        </button>
                      </>
                    )}
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
            Page {currentPage} of {Math.ceil((products?.total || 0) / itemsPerPage)}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage >= Math.ceil((products?.total || 0) / itemsPerPage)}
            className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl h-[90vh] shadow-xl border border-gray-200 flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
                <FaBoxOpen className="text-primary-600" />
                {isEditMode ? (language === 'ur' ? 'پروڈکٹ میں تبدیلی' : 'Edit Product') : (language === 'ur' ? 'نیا پروڈکٹ شامل کریں' : 'Add New Product')}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-2">
              <form id="product-form" onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Section 1: Product Classification */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <FaTag /> Product Classification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                      <input
                        type="checkbox"
                        id="isRawMaterial"
                        checked={formData.isRawMaterial}
                        onChange={(e) => setFormData({ ...formData, isRawMaterial: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isRawMaterial" className="text-sm font-medium text-blue-800">
                        Raw Material <span className="text-xs text-blue-600">(For Manufacturing)</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        <option value="">No Category</option>
                        {categories?.items?.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Basic Information */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FaBoxOpen /> Basic Information
                  </h3>
                  <div className="space-y-3">
                    <ProductImageUpload
                      value={formData.image}
                      onChange={(filename) => setFormData({ ...formData, image: filename })}
                    />
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (validationErrors.name) {
                            const newErrors = { ...validationErrors };
                            delete newErrors.name;
                            setValidationErrors(newErrors);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        placeholder="Enter unique product name"
                      />
                      {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        rows="2"
                        placeholder="Product description (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <FaBarcode /> Barcode/SKU
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          disabled={isGeneratingBarcode}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          placeholder={isGeneratingBarcode ? 'Generating...' : 'Enter or generate'}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            setIsGeneratingBarcode(true);
                            try {
                              const barcode = await generateUserBarcode();
                              setFormData({ ...formData, sku: barcode });
                            } catch (error) {
                              console.error('Failed to generate barcode:', error);
                            } finally {
                              setIsGeneratingBarcode(false);
                            }
                          }}
                          disabled={isGeneratingBarcode}
                          className="px-3 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 disabled:opacity-50"
                        >
                          {isGeneratingBarcode ? <LoadingSpinner size="w-4 h-4" /> : <FaBarcode />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Pricing */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                    <FaDollarSign /> Pricing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Retail Price (MRP)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={formData.retailPrice}
                        onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="Individual customer price"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Wholesale Price</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={formData.wholesalePrice}
                        onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="Bulk/reseller price"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Cost & Inventory */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <FaWarehouse /> Cost & Inventory
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={formData.purchasePrice}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            const quantity = parseFloat(formData.quantity);
                            if (value && quantity && quantity > 0) {
                              const perUnitCost = value / quantity;
                              setFormData({ ...formData, purchasePrice: e.target.value, perUnitPurchasePrice: perUnitCost.toFixed(2) });
                            } else {
                              setFormData({ ...formData, purchasePrice: e.target.value });
                            }
                          }}
                          onWheel={(e) => e.target.blur()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          placeholder="Total cost"
                        />
                      </div>
                      {['kg', 'gram', 'ltr', 'ml', 'ton', 'ohm'].includes(formData.unit) && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Per Unit Cost</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.perUnitPurchasePrice || ''}
                            onChange={(e) => setFormData({ ...formData, perUnitPurchasePrice: e.target.value })}
                            onWheel={(e) => e.target.blur()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-gray-50"
                            placeholder="Auto-calculated"
                          />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.quantity}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            const purchasePrice = parseFloat(formData.purchasePrice);
                            if (purchasePrice && value && value > 0) {
                              const perUnitCost = purchasePrice / value;
                              setFormData({ ...formData, quantity: e.target.value, perUnitPurchasePrice: perUnitCost.toFixed(2) });
                            } else {
                              setFormData({ ...formData, quantity: e.target.value });
                            }
                          }}
                          onWheel={(e) => e.target.blur()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          placeholder="Stock quantity"
                        />
                        {validationErrors.quantity && <p className="text-red-500 text-xs mt-1">{validationErrors.quantity}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                        <select
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        >
                          <option value="pcs">Pieces</option>
                          <option value="dozen">Dozen</option>
                          <option value="kg">Kilogram</option>
                          <option value="gram">Gram</option>
                          <option value="ltr">Liter</option>
                          <option value="ml">Milliliter</option>
                          <option value="ft">Feet</option>
                          <option value="metre">Meter</option>
                          <option value="sqft">Square Feet</option>
                          <option value="carton">Carton</option>
                          <option value="roll">Roll</option>
                          <option value="sheet">Sheet</option>
                          <option value="drum">Drum</option>
                          <option value="packet">Packet</option>
                          <option value="bottle">Bottle</option>
                          <option value="bag">Bag</option>
                          <option value="pair">Pair</option>
                          <option value="set">Set</option>
                          <option value="ton">Ton</option>
                          <option value="ohm">Ohm</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Low Stock Alert</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.lowStockThreshold}
                        onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        placeholder="Alert when stock reaches this level"
                      />
                    </div>
                  </div>
                </div>
                </div>
              </form>
            </div>
            <div className="flex-shrink-0 mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setValidationErrors({});
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={createProduct.isLoading || updateProduct.isLoading}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(createProduct.isLoading || updateProduct.isLoading) && <LoadingSpinner size="w-4 h-4" />}
                {isEditMode ? t('update') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Damaged Items Modal */}
      {damagedModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-200">
            <h2 className={`text-2xl font-bold mb-6 border-b pb-2 flex items-center gap-2 ${
              showDamaged ? 'text-blue-800 border-blue-100' : 'text-red-800 border-red-100'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${
                showDamaged ? 'text-blue-600' : 'text-red-600'
              }`}>
                <path strokeLinecap="round" strokeLinejoin="round" d={showDamaged ? "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" : "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"} />
              </svg>
              {showDamaged ? 'Restore Items' : 'Mark as Damaged'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <input
                  type="text"
                  value={selectedProductForDamage?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {showDamaged ? 'Damaged Quantity' : 'Available Quantity'}
                </label>
                <input
                  type="text"
                  value={selectedProductForDamage?.quantity || 0}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {showDamaged ? 'Quantity to Restore' : 'Quantity to Damage'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxRestoreQuantity}
                  value={damagedQuantity}
                  onChange={(e) => setDamagedQuantity(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    showDamaged 
                      ? 'border-blue-200 focus:ring-blue-500' 
                      : 'border-red-200 focus:ring-red-500'
                  }`}
                  placeholder={showDamaged ? 'Enter quantity to restore' : 'Enter quantity to mark as damaged'}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDamagedModalOpen(false);
                  setSelectedProductForDamage(null);
                  setDamagedQuantity('');
                  setMaxRestoreQuantity(0);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (damagedQuantity && selectedProductForDamage) {
                    if (showDamaged) {
                      restoreDamaged.mutate({
                        productId: selectedProductForDamage.id,
                        quantity: parseInt(damagedQuantity)
                      });
                    } else {
                      markAsDamaged.mutate({
                        productId: selectedProductForDamage.id,
                        quantity: parseInt(damagedQuantity)
                      });
                    }
                  }
                }}
                disabled={!damagedQuantity || parseInt(damagedQuantity) <= 0 || parseInt(damagedQuantity) > maxRestoreQuantity}
                className={`px-4 py-2 bg-gradient-to-r text-white rounded shadow-sm disabled:bg-gray-400 ${
                  showDamaged 
                    ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    : 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                }`}
              >
                {showDamaged ? 'Restore Items' : 'Mark as Damaged'}
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
          setProductToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
        itemName={productToDelete ? `product "${productToDelete.name}"` : ''}
        error={deleteError}
      />
    </div>
  );
}

export default Products;