class SyncManager {
  constructor() {
    this.userId = localStorage.getItem('userId');
    this.worker = null;
  }

  createWorker() {
    if (!this.worker) {
      this.worker = new Worker('/sync-worker.js');
    }
    return this.worker;
  }

  async uploadData(onProgress = () => {}) {
    if (!this.userId) throw new Error('User not authenticated');
    
    return new Promise((resolve, reject) => {
      const worker = this.createWorker();
      
      worker.onmessage = (e) => {
        const { type, message, progress, error } = e.data;
        
        if (type === 'PROGRESS') {
          onProgress(message, progress);
        } else if (type === 'SUCCESS') {
          onProgress(message, progress);
          resolve({ success: true, message });
        } else if (type === 'ERROR') {
          reject(new Error(error));
        }
      };
      
      worker.postMessage({
        type: 'UPLOAD_DATA',
        data: {
          userId: this.userId,
          apiUrl: import.meta.env.VITE_API_URL,
          authToken: localStorage.getItem('authToken')
        }
      });
    });
  }

  async downloadData(onProgress = () => {}) {
    if (!this.userId) throw new Error('User not authenticated');
    
    return new Promise((resolve, reject) => {
      const worker = this.createWorker();
      
      worker.onmessage = (e) => {
        const { type, message, progress, error } = e.data;
        
        if (type === 'PROGRESS') {
          onProgress(message, progress);
        } else if (type === 'SUCCESS') {
          onProgress(message, progress);
          resolve({ success: true, message });
        } else if (type === 'ERROR') {
          reject(new Error(error));
        }
      };
      
      worker.postMessage({
        type: 'DOWNLOAD_DATA',
        data: {
          userId: this.userId,
          apiUrl: import.meta.env.VITE_API_URL,
          authToken: localStorage.getItem('authToken')
        }
      });
    });
  }

  async clearOfflineData() {
    if (!DataStorageManager.db) await DataStorageManager.initializeDB();
    
    for (const storeName of Object.values(STORES)) {
      if (storeName === 'settings') continue;
      
      const transaction = DataStorageManager.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear all data for current user
      const index = store.index('userId');
      const cursor = await index.openCursor(this.userId);
      
      while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
      }
    }
  }

  async getDataStats() {
    const stats = {};
    
    for (const storeName of Object.values(STORES)) {
      if (storeName === 'settings') continue;
      
      const data = await DataStorageManager.readOffline(storeName, { limit: 10000 });
      stats[storeName] = data.total || 0;
    }
    
    return stats;
  }
}

export default new SyncManager();