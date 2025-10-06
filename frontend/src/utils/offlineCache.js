// IndexedDB cache for offline data
class OfflineCache {
  constructor() {
    this.dbName = 'HisabGharCache';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create stores for different data types
        const stores = ['products', 'contacts', 'sales', 'bulk-purchases', 'returns', 'expenses'];
        
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'cacheKey' });
          }
        });
      };
    });
  }

  async set(storeName, key, data) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    await store.put({
      cacheKey: key,
      data: data,
      timestamp: Date.now()
    });
  }

  async get(storeName, key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && this.isValid(result.timestamp)) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  isValid(timestamp) {
    // Cache is valid for 1 hour
    return Date.now() - timestamp < 60 * 60 * 1000;
  }

  generateKey(endpoint, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${paramString}`;
  }
}

export const offlineCache = new OfflineCache();