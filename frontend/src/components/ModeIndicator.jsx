import { useState, useEffect } from 'react';
import { FaDatabase, FaCloud, FaChevronDown, FaDownload, FaUpload } from 'react-icons/fa';
import DataStorageManager from '../utils/DataStorageManager';
import toast from 'react-hot-toast';

function ModeIndicator() {
  const [isOffline, setIsOffline] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setIsOffline(DataStorageManager.getOfflineMode());
  }, []);

  const toggleMode = () => {
    const newMode = !isOffline;
    DataStorageManager.setOfflineMode(newMode);
    setIsOffline(newMode);
    window.location.reload();
  };

  const handleSync = async (type) => {
    if (!isOffline) {
      toast.error('Switch to offline mode first');
      return;
    }

    setDropdownOpen(false);
    const userId = localStorage.getItem('userId');
    
    if (type === 'upload') {
      try {
        toast.loading('Uploading data...', { id: 'sync' });
        await syncContactsToServer(userId);
        await syncBulkPurchasesToServer(userId);
        await syncProductsToServer(userId);
        toast.success('Data uploaded successfully!', { id: 'sync' });
        window.dispatchEvent(new CustomEvent('contactsSyncComplete'));
        window.dispatchEvent(new CustomEvent('bulkPurchasesSyncComplete'));
        window.dispatchEvent(new CustomEvent('productsSyncComplete'));
      } catch (error) {
        toast.error('Failed to upload data: ' + error.message, { id: 'sync' });
      }
    } else if (type === 'download') {
      try {
        toast.loading('Downloading contacts...', { id: 'sync' });
        await syncContactsFromServer(userId);
        
        toast.loading('Downloading products...', { id: 'sync' });
        await syncProductsFromServer(userId);
        
        toast.loading('Downloading bulk purchases...', { id: 'sync' });
        await syncBulkPurchasesFromServer(userId);
        
        toast.loading('Downloading sales...', { id: 'sync' });
        await syncSalesFromServer(userId);
        
        toast.loading('Downloading expenses...', { id: 'sync' });
        await syncExpensesFromServer(userId);
        
        toast.loading('Downloading returns...', { id: 'sync' });
        await syncReturnsFromServer(userId);
        
        toast.success('Data downloaded successfully!', { id: 'sync' });
        window.dispatchEvent(new CustomEvent('contactsSyncComplete'));
        window.dispatchEvent(new CustomEvent('bulkPurchasesSyncComplete'));
        window.dispatchEvent(new CustomEvent('productsSyncComplete'));
        window.location.reload();
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download data: ' + error.message, { id: 'sync' });
      }
    }
  };

  const syncContactsToServer = async (userId) => {
    const localContacts = await DataStorageManager.readOffline('contacts', {});
    
    const token = localStorage.getItem('authToken');
    for (const contact of localContacts.items) {
      if (contact._syncStatus === 'pending') {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: contact.name,
            address: contact.address,
            phoneNumber: contact.phoneNumber,
            contactType: contact.contactType || 'customer'
          })
        });
        
        if (!response.ok) throw new Error('Failed to upload contact: ' + contact.name);
      }
    }
  };

  const clearAndReplaceStore = async (storeName, newData) => {
    if (!DataStorageManager.db) await DataStorageManager.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = DataStorageManager.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear all data
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add new data
        let completed = 0;
        const total = newData.length;
        
        if (total === 0) {
          resolve();
          return;
        }
        
        for (const item of newData) {
          const addRequest = store.add({
            ...item,
            userId: DataStorageManager.userId || 'offline-user',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) resolve();
          };
          
          addRequest.onerror = () => reject(addRequest.error);
        }
      };
      
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  };

  const syncContactsFromServer = async (userId) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contacts?limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch contacts from server');
    
    const serverData = await response.json();
    const serverContacts = serverData.items || [];
    
    // Clear and replace all contacts
    await clearAndReplaceStore('contacts', serverContacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      address: contact.address,
      phoneNumber: contact.phoneNumber,
      contactType: contact.contactType || 'customer',
      _syncStatus: 'synced'
    })));
  };

  const syncBulkPurchasesToServer = async (userId) => {
    const localBulkPurchases = await DataStorageManager.readOffline('bulkPurchases', {});
    const localBulkPurchaseItems = await DataStorageManager.readOffline('bulkPurchaseItems', {});
    
    const token = localStorage.getItem('authToken');
    for (const purchase of localBulkPurchases.items) {
      if (purchase._syncStatus === 'pending') {
        const purchaseItems = localBulkPurchaseItems.items.filter(item => item.bulkPurchaseId === purchase.id);
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bulk-purchases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            contactId: purchase.contactId,
            invoiceNumber: purchase.invoiceNumber,
            purchaseDate: purchase.purchaseDate,
            totalAmount: purchase.totalAmount,
            paidAmount: purchase.paidAmount,
            dueAmount: purchase.dueAmount,
            items: purchaseItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }))
          })
        });
        
        if (!response.ok) throw new Error('Failed to upload bulk purchase: ' + purchase.invoiceNumber);
      }
    }
  };

  const syncBulkPurchasesFromServer = async (userId) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bulk-purchases?limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch bulk purchases from server');
    
    const serverData = await response.json();
    const serverPurchases = serverData.items || [];
    
    // Prepare bulk purchases data
    const purchasesData = serverPurchases.map(purchase => ({
      id: purchase.id,
      contactId: purchase.contactId,
      invoiceNumber: purchase.invoiceNumber,
      purchaseDate: purchase.purchaseDate,
      totalAmount: purchase.totalAmount,
      paidAmount: purchase.paidAmount,
      dueAmount: purchase.dueAmount,
      _syncStatus: 'synced'
    }));
    
    // Prepare bulk purchase items data
    const itemsData = [];
    for (const purchase of serverPurchases) {
      if (purchase.items) {
        for (const item of purchase.items) {
          itemsData.push({
            id: item.id || `${purchase.id}_${item.productId}_${Date.now()}`,
            bulkPurchaseId: purchase.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            _syncStatus: 'synced'
          });
        }
      }
    }
    
    // Clear and replace both stores
    await clearAndReplaceStore('bulkPurchases', purchasesData);
    await clearAndReplaceStore('bulkPurchaseItems', itemsData);
  };

  const syncProductsToServer = async (userId) => {
    const localProducts = await DataStorageManager.readOffline('products', {});
    
    const token = localStorage.getItem('authToken');
    for (const product of localProducts.items) {
      if (product._syncStatus === 'pending') {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: product.name,
            sku: product.sku,
            price: product.price,
            quantity: product.quantity,
            description: product.description,
            lowStockThreshold: product.lowStockThreshold,
            isRawMaterial: product.isRawMaterial
          })
        });
        
        if (!response.ok) throw new Error('Failed to upload product: ' + product.name);
      }
    }
  };

  const syncProductsFromServer = async (userId) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products?limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch products from server');
    
    const serverData = await response.json();
    const serverProducts = serverData.items || [];
    
    // Clear and replace all products
    await clearAndReplaceStore('products', serverProducts.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity,
      description: product.description,
      lowStockThreshold: product.lowStockThreshold,
      isRawMaterial: product.isRawMaterial,
      _syncStatus: 'synced'
    })));
  };

  const syncSalesFromServer = async (userId) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sales?limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch sales from server');
    
    const serverData = await response.json();
    const serverSales = serverData.items || [];
    
    // Prepare sales data
    const salesData = serverSales.map(sale => ({
      id: sale.id,
      contactId: sale.contactId,
      billNumber: sale.billNumber,
      saleDate: sale.saleDate,
      totalAmount: sale.totalAmount,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      _syncStatus: 'synced'
    }));
    
    // Prepare sale items data
    const itemsData = [];
    for (const sale of serverSales) {
      if (sale.items) {
        for (const item of sale.items) {
          itemsData.push({
            id: item.id || `${sale.id}_${item.productId}_${Date.now()}`,
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            _syncStatus: 'synced'
          });
        }
      }
    }
    
    // Clear and replace both stores
    await clearAndReplaceStore('sales', salesData);
    await clearAndReplaceStore('saleItems', itemsData);
  };

  const syncExpensesFromServer = async (userId) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses?limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch expenses from server');
    
    const serverData = await response.json();
    const serverExpenses = serverData.items || [];
    
    // Clear and replace all expenses
    await clearAndReplaceStore('expenses', serverExpenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
      _syncStatus: 'synced'
    })));
  };

  const syncReturnsFromServer = async (userId) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/returns?limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch returns from server');
    
    const serverData = await response.json();
    const serverReturns = serverData.items || [];
    
    // Clear and replace all returns
    await clearAndReplaceStore('saleReturns', serverReturns.map(returnItem => ({
      id: returnItem.id,
      returnNumber: returnItem.returnNumber || returnItem.id,
      saleId: returnItem.saleId,
      sale: returnItem.sale || { billNumber: returnItem.billNumber || 'N/A' },
      items: returnItem.items || [],
      totalAmount: returnItem.totalAmount || 0,
      refundAmount: returnItem.refundAmount || 0,
      refundPaid: returnItem.refundPaid || false,
      reason: returnItem.reason || '',
      returnDate: returnItem.returnDate || returnItem.createdAt,
      _syncStatus: 'synced'
    })));
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Mode Indicator */}
        <div 
          onClick={toggleMode}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
            isOffline 
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          {isOffline ? <FaDatabase /> : <FaCloud />}
          <span>{isOffline ? 'Offline' : 'Online'}</span>
        </div>

        {/* Sync Dropdown - Only show in offline mode */}
        {isOffline && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Sync <FaChevronDown className="text-xs" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <button
                  onClick={() => handleSync('download')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                >
                  <FaDownload /> Download
                </button>
                <button
                  onClick={() => handleSync('upload')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                >
                  <FaUpload /> Upload
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}

export default ModeIndicator;