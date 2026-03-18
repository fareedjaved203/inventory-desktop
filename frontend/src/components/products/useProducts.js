import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { debounce } from 'lodash';
import API from '../../utils/api';
import { generateUserBarcode as generateUniqueBarcode } from '../../utils/barcodeGenerator';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU/Barcode is required'),
  categoryId: z.string().optional().nullable(),
  retailPrice: z.string().min(1, 'Retail price is required'),
  wholesalePrice: z.string().min(1, 'Wholesale price is required'),
  purchasePrice: z.string().min(1, 'Purchase price is required'),
  perUnitPurchasePrice: z.string().optional().nullable(),
  quantity: z.string().min(1, 'Quantity is required'),
  unit: z.string(),
  lowStockThreshold: z.string().min(1, 'Low stock threshold is required'),
  description: z.string().optional(),
  image: z.string().nullable().optional(),
  isRawMaterial: z.boolean().default(false)
});

const initialFormState = {
  name: '',
  sku: '',
  categoryId: '',
  retailPrice: '0',
  wholesalePrice: '0',
  purchasePrice: '0',
  perUnitPurchasePrice: '0',
  quantity: '0',
  unit: 'pcs',
  lowStockThreshold: '5',
  description: '',
  image: null,
  isRawMaterial: false
};

export function useProducts() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [validationErrors, setValidationErrors] = useState({});
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  
  const [damagedModalOpen, setDamagedModalOpen] = useState(false);
  const [selectedProductForDamage, setSelectedProductForDamage] = useState(null);
  const [damagedQuantity, setDamagedQuantity] = useState('');
  const [showDamaged, setShowDamaged] = useState(false);
  const [maxRestoreQuantity, setMaxRestoreQuantity] = useState(0);
  const [showRawMaterials, setShowRawMaterials] = useState(false);

  const itemsPerPage = 10;

  const debouncedSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
      setCurrentPage(1);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  const { data: categories } = useQuery(
    ['categories'],
    async () => await API.getCategories(),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: products, isLoading } = useQuery(
    ['products', currentPage, debouncedSearchTerm, showLowStock, selectedCategory, showDamaged, showRawMaterials],
    async () => {
      let endpoint = showDamaged ? '/products/damaged' : '/products';
      if (showRawMaterials) endpoint = '/products/raw-materials';
      
      const response = await API.get(endpoint, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm,
          lowStock: showLowStock,
          categoryId: selectedCategory || undefined
        }
      });
      return response.data;
    },
    { 
      keepPreviousData: true,
      staleTime: 30000 
    }
  );

  const createProduct = useMutation(
    async (newProduct) => {
      const formattedData = {
        ...newProduct,
        retailPrice: parseFloat(newProduct.retailPrice),
        wholesalePrice: parseFloat(newProduct.wholesalePrice),
        purchasePrice: parseFloat(newProduct.purchasePrice),
        perUnitPurchasePrice: newProduct.perUnitPurchasePrice ? parseFloat(newProduct.perUnitPurchasePrice) : 0,
        quantity: parseFloat(newProduct.quantity),
        lowStockThreshold: parseFloat(newProduct.lowStockThreshold)
      };
      
      if (!formattedData.categoryId) {
        delete formattedData.categoryId;
      }
      return await API.createProduct(formattedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        setIsModalOpen(false);
        setFormData(initialFormState);
        toast.success('Product created successfully');
      },
      onError: (error) => {
        if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error('Failed to create product');
        }
      }
    }
  );

  const updateProduct = useMutation(
    async ({ id, data }) => {
      const formattedData = {
        ...data,
        retailPrice: parseFloat(data.retailPrice),
        wholesalePrice: parseFloat(data.wholesalePrice),
        purchasePrice: parseFloat(data.purchasePrice),
        perUnitPurchasePrice: data.perUnitPurchasePrice ? parseFloat(data.perUnitPurchasePrice) : 0,
        quantity: parseFloat(data.quantity),
        lowStockThreshold: parseFloat(data.lowStockThreshold)
      };

      if (!formattedData.categoryId) {
        formattedData.categoryId = null;
      }
      return await API.updateProduct(id, formattedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        setIsModalOpen(false);
        setFormData(initialFormState);
        toast.success('Product updated successfully');
      },
      onError: (error) => {
        if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error('Failed to update product');
        }
      }
    }
  );

  const deleteProduct = useMutation(
    async (id) => await API.deleteProduct(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        setDeleteModalOpen(false);
        setProductToDelete(null);
        setDeleteError(null);
        toast.success('Product deleted successfully');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.error || 'Failed to delete product';
        setDeleteError(errorMessage);
        toast.error(errorMessage);
      }
    }
  );

  const markAsDamaged = useMutation(
    async ({ productId, quantity }) => await API.post(`/products/${productId}/damage`, { quantity }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        setDamagedModalOpen(false);
        setDamagedQuantity('');
        toast.success('Items marked as damaged');
      },
      onError: (error) => toast.error(error.response?.data?.error || 'Failed to mark as damaged')
    }
  );

  const restoreDamaged = useMutation(
    async ({ productId, quantity }) => await API.post(`/products/${productId}/restore`, { quantity }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        setDamagedModalOpen(false);
        setDamagedQuantity('');
        toast.success('Items restored successfully');
      },
      onError: (error) => toast.error(error.response?.data?.error || 'Failed to restore items')
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const validatedData = productSchema.parse(formData);
      setValidationErrors({});
      
      if (isEditMode) {
        updateProduct.mutate({ id: selectedProduct.id, data: validatedData });
      } else {
        createProduct.mutate(validatedData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
        toast.error('Please fix the errors in the form');
      }
    }
  };

  const handleEditProduct = (product) => {
    setIsEditMode(true);
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      categoryId: product.categoryId || '',
      retailPrice: (product.retailPrice ?? '0').toString(),
      wholesalePrice: (product.wholesalePrice ?? '0').toString(),
      purchasePrice: (product.purchasePrice ?? '0').toString(),
      perUnitPurchasePrice: (product.perUnitPurchasePrice ?? '0').toString(),
      quantity: (product.quantity ?? '0').toString(),
      unit: product.unit || 'pcs',
      lowStockThreshold: (product.lowStockThreshold ?? '5').toString(),
      description: product.description || '',
      image: product.image,
      isRawMaterial: !!product.isRawMaterial
    });
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct.mutate(productToDelete.id);
    }
  };

  const generateUserBarcode = async () => {
    // Retry up to 3 times to get a unique barcode
    for (let i = 0; i < 3; i++) {
        const barcode = await generateUniqueBarcode();
        // Check if barcode already exists
        const { data: existingProducts } = await API.get('/products', {
            params: { search: barcode, limit: 1 }
        });
        
        if (!existingProducts?.items?.length) {
            return barcode;
        }
    }
    throw new Error('Failed to generate unique barcode. Please try again or enter manually.');
  };

  const handleAddProduct = async () => {
    setIsEditMode(false);
    setSelectedProduct(null);
    setValidationErrors({});
    setIsGeneratingBarcode(true);
    
    try {
        const autoBarcode = await generateUserBarcode();
        setFormData({ ...initialFormState, sku: autoBarcode });
    } catch (error) {
        console.error('Failed to auto-generate barcode:', error);
        setFormData(initialFormState);
        toast.error('Could not auto-generate barcode. Please enter manually.');
    } finally {
        setIsGeneratingBarcode(false);
        setIsModalOpen(true);
    }
  };

  const handlePrint = (items) => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>Products Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #333; }
            .header-info { text-align: center; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; color: #333; }
            .low-stock { color: red; font-weight: bold; }
            @media print {
              body { font-size: 12pt; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>Products Report</h1>
          <div class="header-info">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            ${showLowStock ? '<p><strong>Filter: Low Stock Items Only</strong></p>' : ''}
            ${selectedCategory ? `<p><strong>Category: ${categories?.items?.find(c => c.id === selectedCategory)?.name || 'All'}</strong></p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU/Barcode</th>
                <th>Category</th>
                <th>In Stock</th>
                <th>Retail Price</th>
                <th>Wholesale Price</th>
                <th>Purchase Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(p => `
                <tr className="${p.quantity <= p.lowStockThreshold ? 'low-stock' : ''}">
                  <td>${p.name}</td>
                  <td>${p.sku}</td>
                  <td>${p.category?.name || 'Uncategorized'}</td>
                  <td class="${p.quantity <= p.lowStockThreshold ? 'low-stock' : ''}">${p.quantity}</td>
                  <td>Rs ${p.retailPrice}</td>
                  <td>Rs ${p.wholesalePrice}</td>
                  <td>Rs ${p.purchasePrice}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintLabel = (product) => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>Print Label - ${product.name}</title>
          <style>
            @page { margin: 0; size: 2in 1in; } /* Assuming standard 2x1 inch thermal label */
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 5px;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              box-sizing: border-box;
            }
            .product-name { 
              font-size: 10pt; 
              font-weight: bold; 
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
            }
            .product-price { 
              font-size: 11pt; 
              font-weight: bold; 
              margin-bottom: 2px;
            }
            .barcode-container {
              margin: 2px 0;
            }
            .barcode-number {
              font-size: 8pt;
              margin-top: 1px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
          <!-- Load JsBarcode for generating barcode SVG -->
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          <div class="product-name">${product.name}</div>
          <div class="product-price">Rs ${product.retailPrice}</div>
          <div class="barcode-container">
            <svg id="barcode"></svg>
          </div>
          <script>
            window.onload = function() {
              // Generate barcode
              JsBarcode("#barcode", "${product.sku}", {
                format: "CODE128",
                width: 1.5,
                height: 30,
                displayValue: true,
                fontSize: 12,
                margin: 0
              });
              
              // Print immediately after rendering
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDamaged = (product) => {
    setSelectedProductForDamage(product);
    if (showDamaged) {
      // In damaged view, we want to restore items
      setMaxRestoreQuantity(product.damagedQuantity || 0);
    } else {
      setMaxRestoreQuantity(product.quantity || 0);
    }
    setDamagedQuantity('');
    setDamagedModalOpen(true);
  };

  return {
    currentPage, setCurrentPage,
    searchTerm, setSearchTerm,
    isModalOpen, setIsModalOpen,
    isEditMode, setIsEditMode,
    selectedProduct, setSelectedProduct,
    deleteModalOpen, setDeleteModalOpen,
    productToDelete, setProductToDelete,
    formData, setFormData,
    validationErrors, setValidationErrors,
    isGeneratingBarcode, setIsGeneratingBarcode,
    showLowStock, setShowLowStock,
    selectedCategory, setSelectedCategory,
    deleteError, setDeleteError,
    damagedModalOpen, setDamagedModalOpen,
    selectedProductForDamage, setSelectedProductForDamage,
    damagedQuantity, setDamagedQuantity,
    showDamaged, setShowDamaged,
    maxRestoreQuantity, setMaxRestoreQuantity,
    showRawMaterials, setShowRawMaterials,
    categories,
    products,
    isLoading,
    generateUserBarcode,
    handleAddProduct,
    handlePrint,
    handlePrintLabel,
    handleDamaged,
    handleEditProduct,
    handleDeleteClick,
    confirmDelete,
    handleSubmit,
    createProduct,
    updateProduct,
    markAsDamaged,
    restoreDamaged,
    itemsPerPage
  };
}
