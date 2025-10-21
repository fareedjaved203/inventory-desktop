const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke('get-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  saveAndOpenUrduInvoice: (htmlContent, filename) => ipcRenderer.invoke('save-and-open-urdu-invoice', htmlContent, filename),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (event, error) => callback(error)),
  
  // Image handling
  selectProductImage: () => ipcRenderer.invoke('select-product-image'),
  getProductImagePath: (filename) => ipcRenderer.invoke('get-product-image-path', filename),
  deleteProductImage: (filename) => ipcRenderer.invoke('delete-product-image', filename)
});