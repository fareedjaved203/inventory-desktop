// IndexedDB Schema for Offline Storage
export const DB_NAME = 'HisabGharOffline';
export const DB_VERSION = 1;

export const STORES = {
  products: 'products',
  contacts: 'contacts',
  sales: 'sales',
  saleItems: 'saleItems',
  bulkPurchases: 'bulkPurchases',
  bulkPurchaseItems: 'bulkPurchaseItems',
  branches: 'branches',
  employees: 'employees',
  expenses: 'expenses',
  saleReturns: 'saleReturns',
  saleReturnItems: 'saleReturnItems',
  loanTransactions: 'loanTransactions',
  shopSettings: 'shopSettings',
  settings: 'settings'
};

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Products store
      if (!db.objectStoreNames.contains(STORES.products)) {
        const productStore = db.createObjectStore(STORES.products, { keyPath: 'id' });
        productStore.createIndex('userId', 'userId');
        productStore.createIndex('name', 'name');
        productStore.createIndex('sku', 'sku');
      }
      
      // Contacts store
      if (!db.objectStoreNames.contains(STORES.contacts)) {
        const contactStore = db.createObjectStore(STORES.contacts, { keyPath: 'id' });
        contactStore.createIndex('userId', 'userId');
        contactStore.createIndex('contactType', 'contactType');
      }
      
      // Sales store
      if (!db.objectStoreNames.contains(STORES.sales)) {
        const salesStore = db.createObjectStore(STORES.sales, { keyPath: 'id' });
        salesStore.createIndex('userId', 'userId');
        salesStore.createIndex('date', 'date');
      }
      
      // Sale Items store
      if (!db.objectStoreNames.contains(STORES.saleItems)) {
        const saleItemsStore = db.createObjectStore(STORES.saleItems, { keyPath: 'id' });
        saleItemsStore.createIndex('saleId', 'saleId');
        saleItemsStore.createIndex('productId', 'productId');
      }
      
      // Bulk Purchases store
      if (!db.objectStoreNames.contains(STORES.bulkPurchases)) {
        const bulkStore = db.createObjectStore(STORES.bulkPurchases, { keyPath: 'id' });
        bulkStore.createIndex('userId', 'userId');
        bulkStore.createIndex('date', 'date');
      }
      
      // Bulk Purchase Items store
      if (!db.objectStoreNames.contains(STORES.bulkPurchaseItems)) {
        const bulkItemsStore = db.createObjectStore(STORES.bulkPurchaseItems, { keyPath: 'id' });
        bulkItemsStore.createIndex('bulkPurchaseId', 'bulkPurchaseId');
        bulkItemsStore.createIndex('productId', 'productId');
      }
      
      // Branches store
      if (!db.objectStoreNames.contains(STORES.branches)) {
        const branchStore = db.createObjectStore(STORES.branches, { keyPath: 'id' });
        branchStore.createIndex('userId', 'userId');
      }
      
      // Employees store
      if (!db.objectStoreNames.contains(STORES.employees)) {
        const employeeStore = db.createObjectStore(STORES.employees, { keyPath: 'id' });
        employeeStore.createIndex('userId', 'userId');
        employeeStore.createIndex('branchId', 'branchId');
      }
      
      // Expenses store
      if (!db.objectStoreNames.contains(STORES.expenses)) {
        const expenseStore = db.createObjectStore(STORES.expenses, { keyPath: 'id' });
        expenseStore.createIndex('userId', 'userId');
        expenseStore.createIndex('date', 'date');
      }
      
      // Sale Returns store
      if (!db.objectStoreNames.contains(STORES.saleReturns)) {
        const returnStore = db.createObjectStore(STORES.saleReturns, { keyPath: 'id' });
        returnStore.createIndex('userId', 'userId');
        returnStore.createIndex('saleId', 'saleId');
      }
      
      // Sale Return Items store
      if (!db.objectStoreNames.contains(STORES.saleReturnItems)) {
        const returnItemsStore = db.createObjectStore(STORES.saleReturnItems, { keyPath: 'id' });
        returnItemsStore.createIndex('saleReturnId', 'saleReturnId');
        returnItemsStore.createIndex('productId', 'productId');
      }
      
      // Loan Transactions store
      if (!db.objectStoreNames.contains(STORES.loanTransactions)) {
        const loanStore = db.createObjectStore(STORES.loanTransactions, { keyPath: 'id' });
        loanStore.createIndex('userId', 'userId');
        loanStore.createIndex('contactId', 'contactId');
      }
      
      // Shop Settings store
      if (!db.objectStoreNames.contains(STORES.shopSettings)) {
        const settingsStore = db.createObjectStore(STORES.shopSettings, { keyPath: 'id' });
        settingsStore.createIndex('userId', 'userId');
      }
      
      // App Settings store
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }
    };
  });
};