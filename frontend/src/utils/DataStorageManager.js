import axios from 'axios';
import { initDB, STORES } from './indexedDBSchema.js';

class DataStorageManager {
  constructor() {
    this.db = null;
    // Always default to offline mode (IndexedDB)
    const offlineMode = localStorage.getItem('offlineMode');
    this.isOfflineMode = offlineMode === null ? true : offlineMode === 'true';
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
    this.isOfflineMode = offlineMode === null ? true : offlineMode === 'true';
    return this.isOfflineMode;
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Generic CRUD operations
  async create(storeName, data) {
    if (this.getOfflineMode()) {
      return this.createOffline(storeName, data);
    }
    return this.createOnline(storeName, data);
  }

  async read(storeName, params = {}) {
    if (this.getOfflineMode()) {
      return this.readOffline(storeName, params);
    }
    return this.readOnline(storeName, params);
  }

  async update(storeName, id, data) {
    if (this.getOfflineMode()) {
      return this.updateOffline(storeName, id, data);
    }
    return this.updateOnline(storeName, id, data);
  }

  async delete(storeName, id) {
    if (this.getOfflineMode()) {
      return this.deleteOffline(storeName, id);
    }
    return this.deleteOnline(storeName, id);
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
        userId: this.userId,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _syncStatus: 'pending'
      };
      
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
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        return;
      }
      
      const results = [];
      
      // If no userId, get all records
      let request;
      if (!this.userId) {
        request = store.openCursor();
      } else {
        const index = store.index('userId');
        request = index.openCursor(this.userId);
      }
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const item = cursor.value;
          
          // Apply search filter
          if (params.search) {
            const searchLower = params.search.toLowerCase();
            const matchesSearch = 
              (item.name && item.name.toLowerCase().includes(searchLower)) ||
              (item.description && item.description.toLowerCase().includes(searchLower)) ||
              (item.sku && item.sku.toLowerCase().includes(searchLower));
            
            if (matchesSearch) {
              results.push(item);
            }
          } else {
            results.push(item);
          }
          
          cursor.continue();
        } else {
          // Apply pagination
          const page = parseInt(params.page) || 1;
          const limit = parseInt(params.limit) || 10;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          
          const result = {
            items: results.slice(startIndex, endIndex),
            total: results.length,
            page,
            totalPages: Math.ceil(results.length / limit)
          };
          
          console.log(`ReadOffline ${storeName}:`, result);
          resolve(result);
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
    const endpoint = this.getEndpoint(storeName);
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, data);
    return response.data;
  }

  async readOnline(storeName, params = {}) {
    const endpoint = this.getEndpoint(storeName);
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, { params });
    return response.data;
  }

  async updateOnline(storeName, id, data) {
    const endpoint = this.getEndpoint(storeName);
    const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/${endpoint}/${id}`, data);
    return response.data;
  }

  async deleteOnline(storeName, id) {
    const endpoint = this.getEndpoint(storeName);
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/${endpoint}/${id}`);
    return { success: true };
  }

  getEndpoint(storeName) {
    const endpoints = {
      [STORES.products]: 'products',
      [STORES.contacts]: 'contacts',
      [STORES.sales]: 'sales',
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
    
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/next-barcode`);
    return response.data;
  }

  async getLowStockProducts(params = {}) {
    if (this.getOfflineMode()) {
      const products = await this.readOffline(STORES.products, params);
      const lowStockItems = products.items.filter(product => 
        Number(product.quantity) <= Number(product.lowStockThreshold || 10)
      );
      
      return {
        items: lowStockItems,
        total: lowStockItems.length,
        page: params.page || 1,
        totalPages: Math.ceil(lowStockItems.length / (params.limit || 10))
      };
    }
    
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/low-stock`, { params });
    return response.data;
  }
}

export default new DataStorageManager();