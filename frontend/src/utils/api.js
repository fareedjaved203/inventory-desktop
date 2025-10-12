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
    
    // Populate relationships for offline mode
    if (DataStorageManager.getOfflineMode() && salesResult.items) {
      for (const sale of salesResult.items) {
        // Get sale items
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
        
        // Get contact details
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
    }
    
    return salesResult;
  }

  async createSale(data) {
    // Generate bill number using same mechanism as online mode
    if (DataStorageManager.getOfflineMode()) {
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
    }
    
    const sale = await DataStorageManager.create(STORES.sales, data);
    
    // Create sale items with product relationships
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

  // Bulk Purchases
  async getBulkPurchases(params = {}) {
    return DataStorageManager.read(STORES.bulkPurchases, params);
  }

  async createBulkPurchase(data) {
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
    return DataStorageManager.read(STORES.loanTransactions, params);
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
    console.log('API.getDashboardStats called');
    return {
      totalProducts: 0,
      totalSales: 0,
      totalExpenses: 0,
      lowStockProducts: 0,
      totalCustomers: 0,
      totalSuppliers: 0,
      salesToday: 0,
      salesLast7Days: 0,
      salesLast30Days: 0,
      salesLast365Days: 0,
      profitToday: 0,
      profitLast7Days: 0,
      profitLast30Days: 0,
      profitLast365Days: 0,
      expensesToday: 0,
      expensesLast7Days: 0,
      expensesLast30Days: 0,
      expensesLast365Days: 0,
      totalPurchaseDueAmount: 0,
      totalSalesDueAmount: 0,
      totalDueCredits: 0
    };
  }
}

export default new API();