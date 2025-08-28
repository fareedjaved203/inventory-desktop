const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

const isDev = process.env.NODE_ENV === 'development';
const serverPort = 3001;

function createWindow() {
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
      preload: path.join(__dirname, 'preload.js')
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

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    
    // Don't check for updates automatically
    // Updates will only be checked when user requests
  });

  // Handle version request
  ipcMain.handle('get-version', () => {
    return app.getVersion();
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

  // Handle manual download
  ipcMain.handle('download-update', async () => {
    if (!isDev) {
      try {
        await autoUpdater.downloadUpdate();
        return true;
      } catch (error) {
        console.error('Download failed:', error);
        throw error;
      }
    }
    return false;
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

  // Configure auto-updater to never auto-download or auto-install
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

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
    console.log('Download progress:', Math.round(progress.percent) + '%');
    mainWindow.webContents.send('download-progress', progress);
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    mainWindow.webContents.send('update-error', error.message);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged;
    let serverPath, cwd;
    
    if (isDev) {
      serverPath = path.join(__dirname, '../backend/src/index.js');
      cwd = path.join(__dirname, '../backend');
    } else {
      // For packaged app, use the unpacked backend
      serverPath = path.join(process.resourcesPath, 'backend/src/index.js');
      cwd = path.join(process.resourcesPath, 'backend');
    }
    
    const dbPath = path.join(app.getPath('userData'), 'inventory.db');
    
    console.log('Starting server...');
    console.log('Server path:', serverPath);
    console.log('Database path:', dbPath);
    console.log('Is dev:', isDev);
    console.log('Is packaged:', app.isPackaged);
    
    // Set environment variables for the server
    const env = {
      ...process.env,
      PORT: serverPort,
      NODE_ENV: isDev ? 'development' : undefined,
      ELECTRON_APP: 'true',
      DATABASE_URL: `file:${dbPath}`
    };

    serverProcess = spawn('node', [serverPath], {
      env: {
        ...env,
        ELECTRON_CWD: process.cwd()
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd
    });

    let serverStarted = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[SERVER] ${output}`);
      if (output.includes(`Server is running on port ${serverPort}`) && !serverStarted) {
        serverStarted = true;
        console.log('Server started successfully!');
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`[SERVER ERROR] ${error}`);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Timeout after 8 seconds (reduced from 15 for faster startup)
    setTimeout(() => {
      if (!serverStarted) {
        console.log('Server startup timeout, continuing anyway...');
      }
      resolve();
    }, 8000);
  });
}

async function setupDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'inventory.db');
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
  writeLog(`Database path: ${dbPath}`);
  writeLog(`Log path: ${logPath}`);
  
  // Ensure user data directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
    writeLog('Created user data directory');
  }

  // Only create schema if database doesn't exist or is empty
  const dbExists = fs.existsSync(dbPath);
  
  if (!dbExists) {
    writeLog('Database does not exist, creating new database...');
    
    // Try Prisma CLI first, then fallback to direct SQLite
    try {
      const { execSync } = require('child_process');
      const isDev = !app.isPackaged;
      const backendPath = isDev 
        ? path.join(__dirname, '../backend')
        : path.join(process.resourcesPath, 'backend');
      
      writeLog('Trying Prisma CLI setup...');
      writeLog(`Backend path: ${backendPath}`);
      
      const result = execSync('npx prisma db push', {
        cwd: backendPath,
        env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 15000 // 15 second timeout (reduced from 30s for faster startup)
      });
      
      writeLog(`Prisma output: ${result}`);
      writeLog('Database schema created with Prisma CLI');
    } catch (error) {
      writeLog(`Prisma CLI failed: ${error.message}`);
      
      // Fallback to direct SQLite schema creation
      try {
        writeLog('Using fallback SQLite schema creation...');
        const { createDatabaseSchema } = require('./create-schema');
        await createDatabaseSchema(dbPath);
        writeLog('Database schema created with SQLite fallback');
      } catch (sqliteError) {
        writeLog(`SQLite fallback failed: ${sqliteError.message}`);
        
        // Final fallback - show user-friendly error
        const errorMsg = `Failed to initialize database.\n\nThis might be because Node.js is not installed on your system.\n\nPlease install Node.js from https://nodejs.org and restart the application.\n\nLog file: ${logPath}`;
        dialog.showErrorBox('Database Setup Error', errorMsg);
        throw sqliteError;
      }
    }
  } else {
    writeLog('Database already exists, skipping schema creation');
  }
}

app.whenReady().then(async () => {
  console.log('Electron app ready, setting up...');
  await setupDatabase();
  
  try {
    console.log('Starting server...');
    await startServer();
    console.log('Creating window...');
    createWindow();
    
    // Wait a bit for server to fully start (reduced from 2s to 1s for faster startup)
    setTimeout(() => {
      const url = isDev ? 'http://localhost:5173' : `http://localhost:${serverPort}`;
      console.log('Loading URL:', url);
      mainWindow.loadURL(url).catch(err => {
        console.error('Failed to load URL:', err);
        // Fallback to backend URL if frontend fails
        if (isDev) {
          mainWindow.loadURL(`http://localhost:${serverPort}`);
        }
      });
    }, 1000);
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Startup Error', 'Failed to start the application server.');
    app.quit();
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