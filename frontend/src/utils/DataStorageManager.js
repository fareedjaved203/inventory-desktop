import axios from 'axios';
import { initDB, STORES } from './indexedDBSchema.js';

class DataStorageManager {
  constructor() {
    this.db = null;
    // Default to online mode
    const offlineMode = localStorage.getItem('offlineMode');
    this.isOfflineMode = offlineMode === null ? false : offlineMode === 'true';
    this.userId = localStorage.getItem('userId');
    this.initializeDB();
  }

  async initializeDB() {
    try {
      console.log('Initializing IndexedDB...');
      this.db = await initDB();
      console.log('IndexedDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      // Continue without IndexedDB
      this.db = null;
    }
  }

  setOfflineMode(enabled) {
    this.isOfflineMode = enabled;
    localStorage.setItem('offlineMode', enabled.toString());
  }

  getOfflineMode() {
    // Only check localStorage - no automatic network switching
    const offlineMode = localStorage.getItem('offlineMode');
    this.isOfflineMode = offlineMode === null ? false : offlineMode === 'true';
    return this.isOfflineMode;
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  invalidateRelatedCaches() {
    // Clear any cached relationship data by dispatching a custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dataStorageInvalidate', {
        detail: { timestamp: Date.now() }
      }));
    }
  }

  async postProcessResults(storeName, results, searchTerm) {
    console.log(`PostProcessResults called for ${storeName}, results count:`, results.length);
    
    // For stores that don't need processing, return results as-is
    if (storeName !== 'sales' && storeName !== 'purchases' && storeName !== 'bulkPurchases') {
      return results;
    }
    
    if (storeName === 'sales' && results.length > 0) {
      console.log('First sale before processing:', results[0]);
      console.log('First sale items before processing:', results[0].items?.length || 0);
      if (results[0].items && results[0].items.length > 0) {
        console.log('First sale item structure:', results[0].items[0]);
      }
    }
    
    const processedResults = [];
    
    for (const item of results) {
      let shouldInclude = true;
      
      // Handle contact name search for sales, purchases and bulk purchases
      if (item._needsContactCheck && searchTerm) {
        shouldInclude = false;
        const contactId = item.contactId || item.supplierId;
        if (contactId) {
          try {
            const contactResult = await this.readOffline('contacts', { id: contactId });
            const contact = contactResult.items?.[0];
            if (contact && contact.name && contact.name.toLowerCase().includes(searchTerm)) {
              shouldInclude = true;
              item.contact = contact;
            }
          } catch (error) {
            console.error('Error fetching contact:', error);
          }
        }
        delete item._needsContactCheck;
        delete item._searchTerm;
      }
      
      if (shouldInclude) {
        // Populate relationships for sales and bulk purchases
        if (storeName === 'sales') {
          // Get contact if not already populated
          if (item.contactId && !item.contact) {
            try {
              const contactResult = await this.readOffline('contacts', { id: item.contactId });
              item.contact = contactResult.items?.[0];
            } catch (error) {
              console.error('Error fetching contact:', error);
            }
          }
          
          // Items are already included in the downloaded data, no need to fetch separately
          // Just ensure products are populated if missing
          if (item.items && Array.isArray(item.items)) {
            for (const saleItem of item.items) {
              if (saleItem.productId && !saleItem.product) {
                try {
                  const productResult = await this.readOffline('products', { id: saleItem.productId });
                  saleItem.product = productResult.items?.[0] || { id: saleItem.productId, name: 'Unknown Product' };
                } catch (error) {
                  console.error('Error fetching product for sale item:', error);
                  saleItem.product = { id: saleItem.productId, name: 'Unknown Product' };
                }
              }
            }
          } else {
            // Fallback: if items not included, try to fetch from separate store (for backward compatibility)
            try {
              const saleItemsResult = await this.readOffline('saleItems', { limit: 10000 });
              const saleItems = saleItemsResult.items.filter(saleItem => saleItem.saleId === item.id);
              
              for (const saleItem of saleItems) {
                if (saleItem.productId && !saleItem.product) {
                  try {
                    const productResult = await this.readOffline('products', { id: saleItem.productId });
                    saleItem.product = productResult.items?.[0] || { id: saleItem.productId, name: 'Unknown Product' };
                  } catch (error) {
                    console.error('Error fetching product for sale item:', error);
                    saleItem.product = { id: saleItem.productId, name: 'Unknown Product' };
                  }
                }
              }
              
              item.items = saleItems;
            } catch (error) {
              console.error('Error fetching sale items:', error);
              item.items = [];
            }
          }
        }
        
        // Populate relationships for purchases
        if (storeName === 'purchases') {
          // Get supplier contact if not already populated
          if (item.supplierId && !item.contact) {
            try {
              const contactResult = await this.readOffline('contacts', { id: item.supplierId });
              item.contact = contactResult.items?.[0];
            } catch (error) {
              console.error('Error fetching supplier contact:', error);
            }
          }
          
          // Items are already included in the downloaded data, no need to fetch separately
          // Just ensure products are populated if missing
          if (item.items && Array.isArray(item.items)) {
            for (const purchaseItem of item.items) {
              if (purchaseItem.productId && !purchaseItem.product) {
                try {
                  const productResult = await this.readOffline('products', { id: purchaseItem.productId });
                  purchaseItem.product = productResult.items?.[0] || { id: purchaseItem.productId, name: 'Unknown Product' };
                } catch (error) {
                  console.error('Error fetching product for purchase item:', error);
                  purchaseItem.product = { id: purchaseItem.productId, name: 'Unknown Product' };
                }
              }
            }
          } else {
            // Fallback: if items not included, try to fetch from separate store (for backward compatibility)
            try {
              const purchaseItemsResult = await this.readOffline('purchaseItems', { limit: 10000 });
              const purchaseItems = purchaseItemsResult.items.filter(purchaseItem => purchaseItem.purchaseId === item.id);
              
              for (const purchaseItem of purchaseItems) {
                if (purchaseItem.productId && !purchaseItem.product) {
                  try {
                    const productResult = await this.readOffline('products', { id: purchaseItem.productId });
                    purchaseItem.product = productResult.items?.[0] || { id: purchaseItem.productId, name: 'Unknown Product' };
                  } catch (error) {
                    console.error('Error fetching product for purchase item:', error);
                    purchaseItem.product = { id: purchaseItem.productId, name: 'Unknown Product' };
                  }
                }
              }
              
              item.items = purchaseItems;
            } catch (error) {
              console.error('Error fetching purchase items:', error);
              item.items = [];
            }
          }
        }
        
        // Populate relationships for bulk purchases
        if (storeName === 'bulkPurchases') {
          // Get contact if not already populated
          if (item.contactId && !item.contact) {
            try {
              const contactResult = await this.readOffline('contacts', { id: item.contactId });
              item.contact = contactResult.items?.[0];
            } catch (error) {
              console.error('Error fetching contact:', error);
            }
          }
          
          // Items are already included in the downloaded data, no need to fetch separately
          // Just ensure products are populated if missing
          if (item.items && Array.isArray(item.items)) {
            for (const purchaseItem of item.items) {
              if (purchaseItem.productId && !purchaseItem.product) {
                try {
                  const productResult = await this.readOffline('products', { id: purchaseItem.productId });
                  purchaseItem.product = productResult.items?.[0] || { id: purchaseItem.productId, name: 'Unknown Product' };
                } catch (error) {
                  console.error('Error fetching product for purchase item:', error);
                  purchaseItem.product = { id: purchaseItem.productId, name: 'Unknown Product' };
                }
              }
            }
          } else {
            // Fallback: if items not included, try to fetch from separate store (for backward compatibility)
            try {
              const purchaseItemsResult = await this.readOffline('bulkPurchaseItems', { limit: 10000 });
              const purchaseItems = purchaseItemsResult.items.filter(purchaseItem => purchaseItem.bulkPurchaseId === item.id);
              
              for (const purchaseItem of purchaseItems) {
                if (purchaseItem.productId && !purchaseItem.product) {
                  try {
                    const productResult = await this.readOffline('products', { id: purchaseItem.productId });
                    purchaseItem.product = productResult.items?.[0] || { id: purchaseItem.productId, name: 'Unknown Product' };
                  } catch (error) {
                    console.error('Error fetching product for purchase item:', error);
                    purchaseItem.product = { id: purchaseItem.productId, name: 'Unknown Product' };
                  }
                }
              }
              
              item.items = purchaseItems;
            } catch (error) {
              console.error('Error fetching purchase items:', error);
              item.items = [];
            }
          }
        }
        
        processedResults.push(item);
      }
    }
    
    if (storeName === 'sales' && processedResults.length > 0) {
      console.log('First sale after processing:', processedResults[0]);
      console.log('First sale items after processing:', processedResults[0].items?.length || 0);
      if (processedResults[0].items && processedResults[0].items.length > 0) {
        console.log('First processed item:', processedResults[0].items[0]);
        console.log('Product name after processing:', processedResults[0].items[0].product?.name);
      }
    }
    
    return processedResults;
  }

  // Generic CRUD operations
  async create(storeName, data) {
    // Always use online APIs for employees and branches
    const useOnline = !this.getOfflineMode() || storeName === 'employees' || storeName === 'branches';
    const result = useOnline
      ? await this.createOnline(storeName, data)
      : await this.createOffline(storeName, data);
    
    // Invalidate related caches when products or contacts are created
    if (storeName === 'products' || storeName === 'contacts') {
      this.invalidateRelatedCaches();
    }
    
    return result;
  }

  async read(storeName, params = {}) {
    // Always use online APIs for employees and branches
    const useOnline = !this.getOfflineMode() || storeName === 'employees' || storeName === 'branches';
    if (useOnline) {
      return this.readOnline(storeName, params);
    }
    return this.readOffline(storeName, params);
  }

  async update(storeName, id, data) {
    // Always use online APIs for employees and branches
    const useOnline = !this.getOfflineMode() || storeName === 'employees' || storeName === 'branches';
    const result = useOnline
      ? await this.updateOnline(storeName, id, data)
      : await this.updateOffline(storeName, id, data);
    
    // Invalidate related caches when products or contacts are updated
    if (storeName === 'products' || storeName === 'contacts') {
      this.invalidateRelatedCaches();
    }
    
    return result;
  }

  async delete(storeName, id) {
    // Always use online APIs for employees and branches
    const useOnline = !this.getOfflineMode() || storeName === 'employees' || storeName === 'branches';
    const result = useOnline
      ? await this.deleteOnline(storeName, id)
      : await this.deleteOffline(storeName, id);
    
    // Invalidate related caches when products or contacts are deleted
    if (storeName === 'products' || storeName === 'contacts') {
      this.invalidateRelatedCaches();
    }
    
    return result;
  }

  // Offline operations
  async createOffline(storeName, data) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const newData = {
        ...data,
        id: data.id || this.generateId(),
        userId: this.userId || 'offline-user',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _syncStatus: 'pending'
      };
      
      // Generate saleItems ID if it's a sale item
      if (storeName === 'saleItems' && !newData.id) {
        newData.id = `${newData.saleId}_${newData.productId}_${Date.now()}`;
      }
      
      const request = store.add(newData);
      
      request.onsuccess = () => resolve(newData);
      request.onerror = () => {
        if (request.error.name === 'ConstraintError') {
          // Handle duplicate ID - update instead
          const putRequest = store.put(newData);
          putRequest.onsuccess = () => resolve(newData);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(request.error);
        }
      };
    });
  }

  async readOffline(storeName, params = {}) {
    console.log(`ReadOffline called for ${storeName}, userId: ${this.userId}`);
    if (!this.db) {
      await this.initializeDB();
    }
    
    if (!this.db) {
      console.log('DB still null, returning empty result');
      return {
        items: [],
        total: 0,
        page: parseInt(params.page) || 1,
        totalPages: 0
      };
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      if (params.id) {
        const request = store.get(params.id);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve({ items: [result], total: 1, page: 1, totalPages: 1 });
          } else {
            resolve({ items: [], total: 0, page: 1, totalPages: 0 });
          }
        };
        request.onerror = () => reject(request.error);
        return;
      }
      
      const results = [];
      
      // If no userId, get all records
      let request;
      if (!this.userId) {
        request = store.openCursor();
      } else {
        try {
          const index = store.index('userId');
          request = index.openCursor(this.userId);
        } catch (error) {
          // If userId index doesn't exist, fall back to all records
          request = store.openCursor();
        }
      }
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const item = cursor.value;
          
          // Filter by userId if no index available
          if (this.userId && !store.indexNames.contains('userId') && item.userId !== this.userId) {
            cursor.continue();
            return;
          }
          
          // Apply date filter for sales
          if (params.date && storeName === 'sales') {
            const itemDate = new Date(item.saleDate || item.createdAt);
            const [day, month, year] = params.date.split('/');
            const filterDate = new Date(year, month - 1, day);
            
            // Check if dates match (same day)
            if (itemDate.toDateString() !== filterDate.toDateString()) {
              cursor.continue();
              return;
            }
          }
          
          // Apply search filter
          if (params.search) {
            const searchLower = params.search.toLowerCase();
            let matchesSearch = 
              (item.name && item.name.toLowerCase().includes(searchLower)) ||
              (item.description && item.description.toLowerCase().includes(searchLower)) ||
              (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
              (item.billNumber && item.billNumber.toLowerCase().includes(searchLower)) ||
              (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(searchLower)) ||
              (item.id && item.id.toLowerCase().includes(searchLower));
            
            // For sales, purchases and bulk purchases, also search by contact name
            if ((storeName === 'sales' || storeName === 'purchases' || storeName === 'bulkPurchases') && (item.contactId || item.supplierId) && !matchesSearch) {
              // We'll need to check contact name - add to results for now and filter later
              results.push({ ...item, _needsContactCheck: true, _searchTerm: searchLower });
            } else if (matchesSearch) {
              results.push(item);
            }
          } else {
            results.push(item);
          }
          
          cursor.continue();
        } else {
          // Post-process results for contact name search and relationships
          this.postProcessResults(storeName, results, params.search).then(processedResults => {
            // Apply pagination
            const page = parseInt(params.page) || 1;
            const limit = parseInt(params.limit) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            
            const result = {
              items: processedResults.slice(startIndex, endIndex),
              total: processedResults.length,
              page,
              totalPages: Math.ceil(processedResults.length / limit)
            };
            
            console.log(`ReadOffline ${storeName}:`, result);
            if (storeName === 'sales' && result.items && result.items.length > 0) {
              console.log('=== FRONTEND SALES DATA ===');
              result.items.forEach((sale, index) => {
                console.log(`Frontend Sale ${index + 1}: ID=${sale.id}, Items=${sale.items?.length || 0}`);
                if (sale.items && sale.items.length > 0) {
                  console.log(`  First item structure:`, sale.items[0]);
                  console.log(`  Product name:`, sale.items[0].product?.name);
                } else {
                  console.log(`  NO ITEMS IN FRONTEND SALE`);
                }
              });
            }
            resolve(result);
          }).catch(reject);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async updateOffline(storeName, id, data) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('Item not found'));
          return;
        }
        
        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve(updated);
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteOffline(storeName, id) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(id);
      request.onsuccess = () => resolve({ success: true });
      request.onerror = () => reject(request.error);
    });
  }

  // Online operations (existing API calls)
  async createOnline(storeName, data) {
    try {
      const endpoint = this.getEndpoint(storeName);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  }

  async readOnline(storeName, params = {}) {
    try {
      const endpoint = this.getEndpoint(storeName);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      // Clean params - remove empty strings and undefined values
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
          cleanParams[key] = params[key];
        }
      });
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, { 
        params: cleanParams,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure response has proper structure
      const data = response.data || {};
      
      // Ensure consistent data structure for branches, employees, and shopSettings
      if (storeName === 'branches' || storeName === 'employees' || storeName === 'shopSettings') {
        // If backend returns items directly, wrap in expected structure
        if (Array.isArray(data)) {
          return {
            items: data,
            total: data.length,
            page: parseInt(params.page) || 1,
            totalPages: Math.ceil(data.length / (parseInt(params.limit) || 10))
          };
        }
        // If backend returns a single object (like shop settings), wrap it in items array
        if (storeName === 'shopSettings' && data && !data.items && typeof data === 'object') {
          return {
            items: [data],
            total: 1,
            page: 1,
            totalPages: 1
          };
        }
        // If backend already returns proper structure, use as is
        return data;
      }
      
      // Ensure all responses have items array
      if (!data.items && Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: parseInt(params.page) || 1,
          totalPages: Math.ceil(data.length / (parseInt(params.limit) || 10))
        };
      }
      
      return data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        throw new Error('Session expired. Please login again.');
      }
      console.error(`Error reading ${storeName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async updateOnline(storeName, id, data) {
    try {
      const endpoint = this.getEndpoint(storeName);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/${endpoint}/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  }

  async deleteOnline(storeName, id) {
    try {
      const endpoint = this.getEndpoint(storeName);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/${endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true };
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  }

  getEndpoint(storeName) {
    const endpoints = {
      [STORES.products]: 'products',
      [STORES.contacts]: 'contacts',
      [STORES.sales]: 'sales',
      [STORES.purchases]: 'purchases',
      [STORES.bulkPurchases]: 'bulk-purchases',
      [STORES.branches]: 'branches',
      [STORES.employees]: 'employees',
      [STORES.expenses]: 'expenses',
      [STORES.saleReturns]: 'returns',
      [STORES.loanTransactions]: 'loans',
      [STORES.shopSettings]: 'shop-settings'
    };
    return endpoints[storeName] || storeName;
  }

  // Special methods for specific operations
  async getNextBarcode() {
    if (this.getOfflineMode()) {
      const products = await this.readOffline(STORES.products, { limit: 10000 });
      const maxSku = products.items
        .filter(p => p.sku && p.sku.startsWith('H'))
        .map(p => parseInt(p.sku.substring(1)))
        .reduce((max, num) => Math.max(max, num || 0), 0);
      
      return { barcode: `H${(maxSku + 1).toString().padStart(5, '0')}` };
    }
    
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/next-barcode`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getLowStockProducts(params = {}) {
    if (this.getOfflineMode()) {
      // Get all products first without pagination
      const allProducts = await this.readOffline(STORES.products, { limit: 10000 });
      let lowStockItems = allProducts.items.filter(product => 
        Number(product.quantity) <= Number(product.lowStockThreshold || 10)
      );
      
      // Apply search filter if provided
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        lowStockItems = lowStockItems.filter(product =>
          (product.name && product.name.toLowerCase().includes(searchLower)) ||
          (product.description && product.description.toLowerCase().includes(searchLower)) ||
          (product.sku && product.sku.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return {
        items: lowStockItems.slice(startIndex, endIndex),
        total: lowStockItems.length,
        page: page,
        totalPages: Math.ceil(lowStockItems.length / limit)
      };
    }
    
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/low-stock`, { 
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getDashboardStats() {
    if (this.getOfflineMode()) {
      const [products, sales, expenses] = await Promise.all([
        this.readOffline(STORES.products, { limit: 10000 }),
        this.readOffline(STORES.sales, { limit: 10000 }),
        this.readOffline(STORES.expenses, { limit: 10000 })
      ]);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last365Days = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      
      const salesData = sales.items;
      const salesToday = salesData.filter(s => new Date(s.saleDate || s.createdAt) >= today)
        .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
      const salesLast7Days = salesData.filter(s => new Date(s.saleDate || s.createdAt) >= last7Days)
        .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
      const salesLast30Days = salesData.filter(s => new Date(s.saleDate || s.createdAt) >= last30Days)
        .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
      const salesLast365Days = salesData.filter(s => new Date(s.saleDate || s.createdAt) >= last365Days)
        .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
      
      const expensesData = expenses.items;
      const expensesToday = expensesData.filter(e => new Date(e.date || e.createdAt) >= today)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const expensesLast7Days = expensesData.filter(e => new Date(e.date || e.createdAt) >= last7Days)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const expensesLast30Days = expensesData.filter(e => new Date(e.date || e.createdAt) >= last30Days)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const expensesLast365Days = expensesData.filter(e => new Date(e.date || e.createdAt) >= last365Days)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      
      const lowStockCount = products.items.filter(p => Number(p.quantity || 0) <= Number(p.lowStockThreshold || 10)).length;
      
      return {
        totalProducts: products.items.length,
        totalInventory: products.items.reduce((sum, p) => sum + Number(p.quantity || 0), 0),
        lowStock: lowStockCount,
        totalSales: salesData.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0),
        salesToday,
        salesLast7Days,
        salesLast30Days,
        salesLast365Days,
        profitToday: 0,
        profitLast7Days: 0,
        profitLast30Days: 0,
        profitLast365Days: 0,
        expensesToday,
        expensesLast7Days,
        expensesLast30Days,
        expensesLast365Days,
        totalPurchaseDueAmount: 0,
        totalSalesDueAmount: salesData.reduce((sum, s) => sum + (Number(s.totalAmount || 0) - Number(s.paidAmount || 0)), 0),
        totalDueCredits: 0
      };
    }
    
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
}

export default new DataStorageManager();