// Web Worker for handling sync operations
self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  try {
    if (type === 'UPLOAD_DATA') {
      await uploadData(data);
    } else if (type === 'DOWNLOAD_DATA') {
      await downloadData(data);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
};

async function uploadData({ userId, apiUrl, authToken }) {
  try {
    // Open IndexedDB in worker
    const db = await openDB();
    
    self.postMessage({ type: 'PROGRESS', message: 'Collecting data...', progress: 10 });
    
    const allData = {};
    const stores = ['products', 'contacts', 'sales', 'saleItems', 'bulkPurchases', 'bulkPurchaseItems', 'branches', 'employees', 'expenses', 'saleReturns', 'saleReturnItems', 'loanTransactions', 'shopSettings'];
    
    for (let i = 0; i < stores.length; i++) {
      const storeName = stores[i];
      const progress = 10 + (i / stores.length) * 40;
      
      self.postMessage({ 
        type: 'PROGRESS', 
        message: `Collecting ${storeName}...`, 
        progress 
      });
      
      const data = await getStoreData(db, storeName, userId);
      allData[storeName] = data;
    }
    
    self.postMessage({ type: 'PROGRESS', message: 'Uploading to server...', progress: 60 });
    
    const response = await fetch(`${apiUrl}/api/sync/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        userId,
        data: allData,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    self.postMessage({ 
      type: 'SUCCESS', 
      message: 'Data uploaded successfully',
      progress: 100 
    });
    
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
}

async function downloadData({ userId, apiUrl, authToken }) {
  try {
    self.postMessage({ type: 'PROGRESS', message: 'Downloading from server...', progress: 10 });
    
    const response = await fetch(`${apiUrl}/api/sync/download/${userId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    const serverData = await response.json();
    
    self.postMessage({ type: 'PROGRESS', message: 'Clearing local data...', progress: 30 });
    
    const db = await openDB();
    await clearUserData(db, userId);
    
    self.postMessage({ type: 'PROGRESS', message: 'Storing downloaded data...', progress: 50 });
    
    const stores = Object.keys(serverData.data || {});
    for (let i = 0; i < stores.length; i++) {
      const storeName = stores[i];
      const items = serverData.data[storeName];
      const progress = 50 + (i / stores.length) * 40;
      
      self.postMessage({ 
        type: 'PROGRESS', 
        message: `Storing ${storeName}...`, 
        progress 
      });
      
      if (items && Array.isArray(items)) {
        await storeData(db, storeName, items);
      }
    }
    
    self.postMessage({ 
      type: 'SUCCESS', 
      message: 'Data downloaded successfully',
      progress: 100 
    });
    
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HisabGharOffline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getStoreData(db, storeName, userId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('userId');
    const request = index.getAll(userId);
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function clearUserData(db, userId) {
  const stores = ['products', 'contacts', 'sales', 'saleItems', 'bulkPurchases', 'bulkPurchaseItems', 'branches', 'employees', 'expenses', 'saleReturns', 'saleReturnItems', 'loanTransactions', 'shopSettings'];
  
  for (const storeName of stores) {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const index = store.index('userId');
    const request = index.openCursor(userId);
    
    await new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

async function storeData(db, storeName, items) {
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  
  for (const item of items) {
    store.add(item);
  }
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}