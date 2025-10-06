import DataStorageManager from './DataStorageManager';
import { STORES } from './indexedDBSchema';

const sampleData = {
  products: [
    {
      id: 'prod1',
      name: 'Sample Product 1',
      sku: 'H00001',
      quantity: 100,
      purchasePrice: 50,
      salePrice: 75,
      lowStockThreshold: 10,
      isRawMaterial: false,
      description: 'Sample product for testing'
    },
    {
      id: 'prod2', 
      name: 'Sample Product 2',
      sku: 'H00002',
      quantity: 5,
      purchasePrice: 30,
      salePrice: 45,
      lowStockThreshold: 10,
      isRawMaterial: false,
      description: 'Low stock sample product'
    }
  ],
  contacts: [
    {
      id: 'contact1',
      name: 'Sample Customer',
      contactType: 'customer',
      phoneNumber: '03001234567',
      address: 'Sample Address'
    },
    {
      id: 'contact2',
      name: 'Sample Supplier', 
      contactType: 'supplier',
      phoneNumber: '03007654321',
      address: 'Supplier Address'
    }
  ],
  sales: [
    {
      id: 'sale1',
      billNumber: 'B001',
      total: 150,
      date: new Date().toISOString(),
      items: [
        { productId: 'prod1', quantity: 2, price: 75 }
      ]
    }
  ],
  expenses: [
    {
      id: 'expense1',
      description: 'Sample Expense',
      amount: 500,
      date: new Date().toISOString(),
      category: 'utilities'
    }
  ]
};

export async function seedOfflineData() {
  try {
    // Check if data already exists
    const existingProducts = await DataStorageManager.read(STORES.products, { limit: 1 });
    if (existingProducts.items && existingProducts.items.length > 0) {
      console.log('Offline data already exists, skipping seed');
      return;
    }

    console.log('Seeding offline data...');
    
    // Seed products
    for (const product of sampleData.products) {
      await DataStorageManager.create(STORES.products, product);
    }
    
    // Seed contacts
    for (const contact of sampleData.contacts) {
      await DataStorageManager.create(STORES.contacts, contact);
    }
    
    // Seed sales
    for (const sale of sampleData.sales) {
      await DataStorageManager.create(STORES.sales, sale);
    }
    
    // Seed expenses
    for (const expense of sampleData.expenses) {
      await DataStorageManager.create(STORES.expenses, expense);
    }
    
    console.log('Offline data seeded successfully');
  } catch (error) {
    console.error('Error seeding offline data:', error);
  }
}