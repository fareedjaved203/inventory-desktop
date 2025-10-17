import DataStorageManager from './DataStorageManager';
import { STORES } from './indexedDBSchema';
import axios from 'axios';

// Universal API wrapper that routes to offline/online storage
class API {
  // Products
  async getProducts(params = {}) {
    return DataStorageManager.read(STORES.products, params);
  }

  async createProduct(data) {
    return DataStorageManager.create(STORES.products, data);
  }

  async updateProduct(id, data) {
    return DataStorageManager.update(STORES.products, id, data);
  }

  async deleteProduct(id) {
    return DataStorageManager.delete(STORES.products, id);
  }

  async getNextBarcode() {
    return DataStorageManager.getNextBarcode();
  }

  async getLowStockProducts(params = {}) {
    return DataStorageManager.getLowStockProducts(params);
  }

  // Contacts
  async getContacts(params = {}) {
    return DataStorageManager.read(STORES.contacts, params);
  }

  async createContact(data) {
    return DataStorageManager.create(STORES.contacts, data);
  }

  async updateContact(id, data) {
    return DataStorageManager.update(STORES.contacts, id, data);
  }

  async deleteContact(id) {
    return DataStorageManager.delete(STORES.contacts, id);
  }

  // Sales
  async getSales(params = {}) {
    const salesResult = await DataStorageManager.read(STORES.sales, params);
    
    // For offline mode, items are already included from sync - don't overwrite them
    if (DataStorageManager.getOfflineMode() && salesResult.items) {
      for (const sale of salesResult.items) {
        // Only populate items if they don't already exist (backward compatibility)
        if (!sale.items || sale.items.length === 0) {
          // Get sale items from separate store (fallback for old data)
          const saleItemsResult = await DataStorageManager.readOffline(STORES.saleItems, {});
          const saleItems = saleItemsResult.items.filter(item => item.saleId === sale.id);
          
          // Populate product details for each item
          for (const item of saleItems) {
            if (item.productId && !item.product) {
              const productResult = await DataStorageManager.read(STORES.products, { id: item.productId });
              item.product = productResult.items?.[0] || productResult || { id: item.productId, name: 'Unknown Product' };
            }
          }
          
          sale.items = saleItems;
        }
        
        // Get contact details if not already populated
        if (sale.contactId && !sale.contact) {
          const contactResult = await DataStorageManager.read(STORES.contacts, { id: sale.contactId });
          sale.contact = contactResult.items?.[0] || contactResult;
        }
        
        // Ensure bill number exists (should be set during creation)
        if (!sale.billNumber) {
          // Generate proper numeric bill number as fallback
          sale.billNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
          // Update the sale in storage with the bill number
          await DataStorageManager.update(STORES.sales, sale.id, { billNumber: sale.billNumber });
        }
        if (!sale.saleDate) {
          sale.saleDate = sale.createdAt || new Date().toISOString();
        }
      }
      
      // Sort by sale date (latest first) in offline mode
      salesResult.items.sort((a, b) => new Date(b.saleDate || b.createdAt) - new Date(a.saleDate || a.createdAt));
    }
    
    return salesResult;
  }

  async createSale(data) {
    // Only handle offline mode logic here
    if (DataStorageManager.getOfflineMode()) {
      // Generate bill number using same mechanism as online mode
      let billNumber;
      let isUnique = false;
      
      while (!isUnique) {
        billNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
        
        const existingSales = await DataStorageManager.read(STORES.sales, { limit: 1000 });
        const existingSale = existingSales.items.find(sale => sale.billNumber === billNumber);
        
        if (!existingSale) {
          isUnique = true;
        }
      }
      
      data.billNumber = billNumber;
      data.saleDate = data.saleDate || new Date().toISOString();
      
      const sale = await DataStorageManager.create(STORES.sales, data);
      
      // Create sale items with product relationships (offline only)
      if (data.items && Array.isArray(data.items)) {
        const itemsWithProducts = [];
        for (const item of data.items) {
          // Get product details for offline mode
          const productResult = await DataStorageManager.read(STORES.products, { id: item.productId });
          const product = productResult.items?.[0] || productResult;
          
          const saleItem = {
            ...item,
            saleId: sale.id,
            product: product || { id: item.productId, name: 'Unknown Product' }
          };
          
          await DataStorageManager.create(STORES.saleItems, saleItem);
          itemsWithProducts.push(saleItem);
        }
        
        // Update sale with populated items
        sale.items = itemsWithProducts;
      }
      
      return sale;
    } else {
      // Online mode - just pass through to DataStorageManager
      return DataStorageManager.create(STORES.sales, data);
    }
  }

  async updateSale(id, data) {
    return DataStorageManager.update(STORES.sales, id, data);
  }

  async deleteSale(id) {
    return DataStorageManager.delete(STORES.sales, id);
  }

  // Branches
  async getBranches(params = {}) {
    return DataStorageManager.read(STORES.branches, params);
  }

  async createBranch(data) {
    return DataStorageManager.create(STORES.branches, data);
  }

  async updateBranch(id, data) {
    return DataStorageManager.update(STORES.branches, id, data);
  }

  async deleteBranch(id) {
    return DataStorageManager.delete(STORES.branches, id);
  }

  // Employees
  async getEmployees(params = {}) {
    return DataStorageManager.read(STORES.employees, params);
  }

  async createEmployee(data) {
    return DataStorageManager.create(STORES.employees, data);
  }

  async updateEmployee(id, data) {
    return DataStorageManager.update(STORES.employees, id, data);
  }

  async deleteEmployee(id) {
    return DataStorageManager.delete(STORES.employees, id);
  }

  // Expenses
  async getExpenses(params = {}) {
    return DataStorageManager.read(STORES.expenses, params);
  }

  async createExpense(data) {
    return DataStorageManager.create(STORES.expenses, data);
  }

  async updateExpense(id, data) {
    return DataStorageManager.update(STORES.expenses, id, data);
  }

  async deleteExpense(id) {
    return DataStorageManager.delete(STORES.expenses, id);
  }

  // Transport
  async getTransport(params = {}) {
    return DataStorageManager.read(STORES.transport, params);
  }

  async createTransport(data) {
    return DataStorageManager.create(STORES.transport, data);
  }

  async updateTransport(id, data) {
    return DataStorageManager.update(STORES.transport, id, data);
  }

  async deleteTransport(id) {
    return DataStorageManager.delete(STORES.transport, id);
  }

  // Bulk Purchases
  async getBulkPurchases(params = {}) {
    const purchasesResult = await DataStorageManager.read(STORES.bulkPurchases, params);
    
    // For offline mode, items are already included from sync - don't overwrite them
    if (DataStorageManager.getOfflineMode() && purchasesResult.items) {
      for (const purchase of purchasesResult.items) {
        // Get contact details if not already populated
        if (purchase.contactId && !purchase.contact) {
          const contactResult = await DataStorageManager.read(STORES.contacts, { id: purchase.contactId });
          purchase.contact = contactResult.items?.[0] || contactResult || { id: purchase.contactId, name: 'Unknown Contact' };
        }
        
        // Only populate items if they don't already exist (backward compatibility)
        if (!purchase.items || purchase.items.length === 0) {
          // Get purchase items from separate store (fallback for old data)
          const purchaseItemsResult = await DataStorageManager.readOffline(STORES.bulkPurchaseItems, {});
          const purchaseItems = purchaseItemsResult.items.filter(item => item.bulkPurchaseId === purchase.id);
          
          // Populate product details for each item
          for (const item of purchaseItems) {
            if (item.productId && !item.product) {
              const productResult = await DataStorageManager.read(STORES.products, { id: item.productId });
              item.product = productResult.items?.[0] || productResult || { id: item.productId, name: 'Unknown Product' };
            }
          }
          
          purchase.items = purchaseItems;
        }
        
        // Ensure invoice number exists (should be set during creation)
        if (!purchase.invoiceNumber) {
          // Generate invoice number as fallback
          purchase.invoiceNumber = `BP-${Date.now().toString().slice(-6)}`;
          // Update the purchase in storage with the invoice number
          await DataStorageManager.update(STORES.bulkPurchases, purchase.id, { invoiceNumber: purchase.invoiceNumber });
        }
      }
      
      // Sort by purchase date (latest first) in offline mode
      purchasesResult.items.sort((a, b) => new Date(b.purchaseDate || b.createdAt) - new Date(a.purchaseDate || a.createdAt));
    }
    
    return purchasesResult;
  }

  async createBulkPurchase(data) {
    // Generate invoice number using same mechanism as backend
    if (DataStorageManager.getOfflineMode()) {
      if (!data.invoiceNumber) {
        data.invoiceNumber = `BP-${Date.now().toString().slice(-6)}`;
      }
      data.purchaseDate = data.purchaseDate || new Date().toISOString();
    }
    
    const purchase = await DataStorageManager.create(STORES.bulkPurchases, data);
    
    // Create bulk purchase items
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        await DataStorageManager.create(STORES.bulkPurchaseItems, {
          ...item,
          bulkPurchaseId: purchase.id
        });
      }
    }
    
    return purchase;
  }

  async updateBulkPurchase(id, data) {
    return DataStorageManager.update(STORES.bulkPurchases, id, data);
  }

  async deleteBulkPurchase(id) {
    return DataStorageManager.delete(STORES.bulkPurchases, id);
  }

  // Sale Returns
  async getSaleReturns(params = {}) {
    return DataStorageManager.read(STORES.saleReturns, params);
  }

  async getReturns(params = {}) {
    return DataStorageManager.read(STORES.saleReturns, params);
  }

  async createSaleReturn(data) {
    const saleReturn = await DataStorageManager.create(STORES.saleReturns, data);
    
    // Create sale return items
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        await DataStorageManager.create(STORES.saleReturnItems, {
          ...item,
          saleReturnId: saleReturn.id
        });
      }
    }
    
    return saleReturn;
  }

  async updateSaleReturn(id, data) {
    return DataStorageManager.update(STORES.saleReturns, id, data);
  }

  async deleteSaleReturn(id) {
    return DataStorageManager.delete(STORES.saleReturns, id);
  }

  // Loan Transactions
  async getLoanTransactions(params = {}) {
    // For online mode, use direct API call to handle contactId properly
    if (!DataStorageManager.getOfflineMode()) {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/loans?${new URLSearchParams(params)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.json();
    }
    
    // For offline mode, use existing logic
    const result = await DataStorageManager.read(STORES.loanTransactions, params);
    
    // If contactId is provided, filter and calculate summary
    if (params.contactId) {
      const transactions = result.items.filter(t => t.contactId === params.contactId);
      
      const totalGiven = transactions
        .filter(t => t.type === 'GIVEN')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalReturnedByContact = transactions
        .filter(t => t.type === 'RETURNED_BY_CONTACT')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalTaken = transactions
        .filter(t => t.type === 'TAKEN')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalReturnedToContact = transactions
        .filter(t => t.type === 'RETURNED_TO_CONTACT')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      return {
        transactions,
        totalGiven,
        totalReturnedByContact,
        totalTaken,
        totalReturnedToContact
      };
    }
    
    return result;
  }

  async createLoanTransaction(data) {
    return DataStorageManager.create(STORES.loanTransactions, data);
  }

  async updateLoanTransaction(id, data) {
    return DataStorageManager.update(STORES.loanTransactions, id, data);
  }

  async deleteLoanTransaction(id) {
    return DataStorageManager.delete(STORES.loanTransactions, id);
  }

  // Shop Settings
  async getShopSettings(params = {}) {
    return DataStorageManager.read(STORES.shopSettings, params);
  }

  async createShopSettings(data) {
    return DataStorageManager.create(STORES.shopSettings, data);
  }

  async updateShopSettings(id, data) {
    return DataStorageManager.update(STORES.shopSettings, id, data);
  }

  // Dashboard Stats
  async getDashboardStats() {
    return DataStorageManager.getDashboardStats();
  }

  // Manufacturing - Generic HTTP methods for new endpoints
  async get(endpoint, config = {}) {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api${endpoint}`, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
        ...config.headers
      }
    });
    return response;
  }

  async post(endpoint, data, config = {}) {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api${endpoint}`, data, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
        ...config.headers
      }
    });
    return response.data;
  }

  async put(endpoint, data, config = {}) {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${import.meta.env.VITE_API_URL}/api${endpoint}`, data, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
        ...config.headers
      }
    });
    return response.data;
  }

  async delete(endpoint, config = {}) {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api${endpoint}`, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
        ...config.headers
      }
    });
    return response.data;
  }
}

export default new API();