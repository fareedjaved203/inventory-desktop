const { app, BrowserWindow, Menu, shell, dialog, ipcMain, net } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

const isDev = process.env.NODE_ENV === 'development';
const serverPort = 3000;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload script path:', preloadPath);
  console.log('Preload script exists:', fs.existsSync(preloadPath));
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Hisab Ghar',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: preloadPath
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Show Logs',
          click: () => {
            const logsPath = app.getPath('userData');
            shell.openPath(logsPath);
          }
        },
        {
          label: 'Show Server Logs',
          click: () => {
            const serverLogPath = path.join(app.getPath('userData'), 'server.log');
            if (fs.existsSync(serverLogPath)) {
              shell.openPath(serverLogPath);
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'No Server Logs',
                message: 'Server log file not found.',
                detail: 'The server may not have started yet or no errors have occurred.'
              });
            }
          }
        },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Hisab Ghar',
              detail: 'Version 1.0.0\nA complete inventory management solution'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Handle external links - allow new windows for receipts
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow about:blank and data URLs for receipts
    if (url === 'about:blank' || url.startsWith('data:') || url.startsWith('blob:')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 400,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        }
      };
    }
    // Open external URLs in default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Don't check for updates automatically
    // Updates will only be checked when user requests
  });

  // Add F12 key handler for dev tools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Show window immediately when content starts loading to display splash screen
  mainWindow.webContents.once('did-start-loading', () => {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  // Handle version request
  ipcMain.handle('get-version', () => {
    return app.getVersion();
  });

  // Handle retry request
  ipcMain.handle('retry-connection', () => {
    loadApp(5);
  });

  // Handle update check from renderer
  ipcMain.handle('check-for-updates', async () => {
    if (!isDev) {
      try {
        autoUpdater.autoDownload = false; // Never auto-download
        autoUpdater.autoInstallOnAppQuit = false; // Never auto-install
        const result = await autoUpdater.checkForUpdates();
        console.log('Update check result:', result);
        return result;
      } catch (error) {
        console.error('Update check failed:', error);
        throw error;
      }
    }
    throw new Error('Updates not available in development mode');
  });

  // Handle manual download with retry mechanism and timeout
  ipcMain.handle('download-update', async () => {
    if (!isDev) {
      let retries = 3;
      while (retries > 0) {
        try {
          console.log(`Attempting download, retries left: ${retries}`);
          
          // Create a timeout promise (5 minutes)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Download timeout after 5 minutes')), 300000);
          });
          
          // Race between download and timeout
          await Promise.race([
            autoUpdater.downloadUpdate(),
            timeoutPromise
          ]);
          
          return true;
        } catch (error) {
          console.error(`Download attempt failed:`, error);
          retries--;
          if (retries === 0) {
            throw new Error(`Download failed after 3 attempts: ${error.message}`);
          }
          // Wait 3 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    return false;
  });

  // Handle opening external URLs
  ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
  });

  // Handle opening logs folder
  ipcMain.handle('open-logs', () => {
    const logsPath = app.getPath('userData');
    shell.openPath(logsPath);
  });

  // Handle image file selection and storage
  ipcMain.handle('select-product-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const sourcePath = result.filePaths[0];
      const imagesDir = path.join(app.getPath('userData'), 'product-images');
      
      // Create images directory if it doesn't exist
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      // Generate unique filename
      const ext = path.extname(sourcePath);
      const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
      const destPath = path.join(imagesDir, filename);
      
      try {
        // Copy file to app data directory
        fs.copyFileSync(sourcePath, destPath);
        return { success: true, filename, path: destPath };
      } catch (error) {
        console.error('Failed to copy image:', error);
        return { success: false, error: error.message };
      }
    }
    
    return { success: false, canceled: true };
  });

  // Handle getting image path for display
  ipcMain.handle('get-product-image-path', (event, filename) => {
    if (!filename) return null;
    const imagePath = path.join(app.getPath('userData'), 'product-images', filename);
    return fs.existsSync(imagePath) ? imagePath : null;
  });

  // Handle deleting product image
  ipcMain.handle('delete-product-image', (event, filename) => {
    if (!filename) return { success: true };
    
    try {
      const imagePath = path.join(app.getPath('userData'), 'product-images', filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to delete image:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle saving and opening Urdu invoice
  ipcMain.handle('save-and-open-urdu-invoice', (event, htmlContent, filename) => {
    const os = require('os');
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, filename);
    
    try {
      fs.writeFileSync(filePath, htmlContent, 'utf8');
      shell.openExternal(`file://${filePath}`);
    } catch (error) {
      console.error('Failed to save and open Urdu invoice:', error);
    }
  });

  // Handle manual update install
  ipcMain.handle('install-update', () => {
    console.log('Install update requested');
    try {
      // Show installation dialog
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Installing Update',
        message: 'Update Installation in Progress',
        detail: 'The application will close and reopen automatically after installation.\n\nThis may take 2-3 minutes. Please wait...',
        buttons: ['OK'],
        defaultId: 0
      }).then(() => {
        console.log('Calling autoUpdater.quitAndInstall...');
        // Small delay to ensure dialog is shown
        setTimeout(() => {
          autoUpdater.quitAndInstall(true, true);
        }, 1000);
      });
      console.log('Installation dialog shown');
    } catch (error) {
      console.error('Error in install process:', error);
      throw error;
    }
  });

  // Configure auto-updater with better settings
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  
  // Set download timeout and retry settings
  autoUpdater.requestHeaders = {
    'Cache-Control': 'no-cache'
  };
  
  // Configure updater settings for better reliability
  if (autoUpdater.httpExecutor) {
    autoUpdater.httpExecutor.maxRedirects = 10;
  }

  // Auto-updater events
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    console.log('Update is ready to install');
    // Notify renderer that update is ready
    mainWindow.webContents.send('update-downloaded');
  });

  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent);
    const speed = Math.round(progress.bytesPerSecond / 1024); // KB/s
    const transferred = Math.round(progress.transferred / 1024 / 1024); // MB
    const total = Math.round(progress.total / 1024 / 1024); // MB
    
    console.log(`Download progress: ${percent}% (${transferred}/${total} MB) at ${speed} KB/s`);
    mainWindow.webContents.send('download-progress', {
      ...progress,
      percent,
      speed,
      transferredMB: transferred,
      totalMB: total
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    let errorMessage = error.message;
    
    // Provide more user-friendly error messages
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Network connection failed. Please check your internet connection and try again.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Download timed out. Please check your internet connection and try again.';
    } else if (error.message.includes('EACCES') || error.message.includes('permission')) {
      errorMessage = 'Permission denied. Please run the application as administrator and try again.';
    }
    
    mainWindow.webContents.send('update-error', errorMessage);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    
    if (errorCode !== -3) { // -3 is ERR_ABORTED (user navigation)
      console.log('Connection failed, will retry automatically...');
      setTimeout(() => loadApp(5), 2000);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Check if server is ready
  const checkServer = () => {
    return new Promise((resolve) => {
      const request = net.request(`http://localhost:${serverPort}/api/health`);
      request.on('response', (response) => {
        resolve(response.statusCode === 200);
      });
      request.on('error', () => {
        resolve(false);
      });
      request.end();
    });
  };

  // Load the application URL with retry mechanism
  const loadApp = async (retries = 10) => {
    const url = `http://localhost:${serverPort}`;
    console.log('Checking server readiness...', `(attempt ${11 - retries})`);
    
    const serverReady = await checkServer();
    if (!serverReady && retries > 0) {
      console.log(`Server not ready, retrying in 1 second... (${retries} attempts left)`);
      setTimeout(() => loadApp(retries - 1), 1000);
      return;
    }
    
    if (!serverReady) {
      console.error('Server failed to start after all retries');
      dialog.showErrorBox('Server Error', 'The application server failed to start. Please restart the application.');
      app.quit();
      return;
    }
    
    console.log('Server ready, loading application...');
    try {
      await mainWindow.loadURL(url);
      console.log('Successfully loaded application');
    } catch (err) {
      console.error('Failed to load URL:', err);
      setTimeout(() => loadApp(3), 2000);
    }
  };

  // Load app immediately after window creation
  loadApp();
}

function startServer() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged;
    let serverPath, cwd;
    
    if (isDev) {
      serverPath = path.join(__dirname, '../backend/src/index.js');
      cwd = path.join(__dirname, '../backend');
    } else {
      serverPath = path.join(process.resourcesPath, 'backend/src/index.js');
      cwd = path.join(process.resourcesPath, 'backend');
    }
    
    console.log('Starting server...');
    console.log('Server path:', serverPath);
    console.log('Working directory:', cwd);
    console.log('Node version:', process.version);
    console.log('Platform:', process.platform);
    
    // Check if server file exists
    if (!fs.existsSync(serverPath)) {
      const error = new Error(`Server file not found: ${serverPath}`);
      console.error(error.message);
      reject(error);
      return;
    }
    
    // Check if working directory exists
    if (!fs.existsSync(cwd)) {
      const error = new Error(`Working directory not found: ${cwd}`);
      console.error(error.message);
      reject(error);
      return;
    }
    
    const env = {
      ...process.env,
      PORT: serverPort,
      NODE_ENV: isDev ? 'development' : 'production',
      ELECTRON_APP: 'true',
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL
    };
    
    console.log('Environment variables:');
    console.log('- PORT:', env.PORT);
    console.log('- NODE_ENV:', env.NODE_ENV);
    console.log('- ELECTRON_APP:', env.ELECTRON_APP);
    console.log('- DATABASE_URL:', env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('- DIRECT_URL:', env.DIRECT_URL ? 'Set' : 'Not set');

    serverProcess = spawn('node', [serverPath], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd
    });

    let serverStarted = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      console.log(`[SERVER STDOUT] ${output}`);
      
      // Write to log file
      const logPath = path.join(app.getPath('userData'), 'server.log');
      try {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] STDOUT: ${output}\n`);
      } catch (e) {
        console.error('Failed to write server log:', e);
      }
      
      if (output.includes(`Server is running on port ${serverPort}`) && !serverStarted) {
        serverStarted = true;
        console.log('Server started successfully!');
        setTimeout(resolve, 1000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      console.error(`[SERVER STDERR] ${error}`);
      
      // Write to log file
      const logPath = path.join(app.getPath('userData'), 'server.log');
      try {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] STDERR: ${error}\n`);
      } catch (e) {
        console.error('Failed to write server log:', e);
      }
    });

    serverProcess.on('close', (code, signal) => {
      console.log(`Server process exited with code ${code}, signal: ${signal}`);
      const logPath = path.join(app.getPath('userData'), 'server.log');
      try {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] Process exited with code ${code}, signal: ${signal}\n`);
      } catch (e) {
        console.error('Failed to write exit log:', e);
      }
      
      if (!serverStarted) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!serverStarted) {
        console.error('Server startup timeout');
        reject(new Error('Server startup timeout'));
      }
    }, 15000);
  });
}

async function setupDatabase() {
  const userDataPath = app.getPath('userData');
  const logPath = path.join(userDataPath, 'setup.log');
  
  function writeLog(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    try {
      fs.appendFileSync(logPath, logMessage);
    } catch (e) {
      console.error('Failed to write log:', e);
    }
  }
  
  writeLog('Setting up database...');
  writeLog(`User data path: ${userDataPath}`);
  
  // Ensure user data directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
    writeLog('Created user data directory');
  }

  writeLog('Using PostgreSQL database - no migration needed');
}

app.whenReady().then(async () => {
  console.log('Electron app ready, setting up...');
  await setupDatabase();
  
  // Start server and window in parallel
  const serverPromise = startServer();
  createWindow();
  
  try {
    await serverPromise;
    console.log('Server ready, application fully loaded');
  } catch (error) {
    console.error('Server failed to start:', error);
    // Don't quit immediately, let the retry mechanism handle it
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});