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
              message: 'Inventory Management System',
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
    
    // Check for updates
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  // Handle version request
  ipcMain.handle('get-version', () => {
    return app.getVersion();
  });

  // Handle update check from renderer
  ipcMain.handle('check-for-updates', async () => {
    if (!isDev) {
      try {
        autoUpdater.autoDownload = false; // Don't auto-download
        const result = await autoUpdater.checkForUpdatesAndNotify();
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
      console.log('Calling autoUpdater.quitAndInstall...');
      autoUpdater.quitAndInstall(true, true); // Force close and restart
      console.log('quitAndInstall called successfully');
    } catch (error) {
      console.error('Error in quitAndInstall:', error);
      throw error;
    }
  });

  // Auto-updater events
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
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

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!serverStarted) {
        console.log('Server startup timeout, continuing anyway...');
      }
      resolve();
    }, 15000);
  });
}

function setupDatabase() {
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

  // Always ensure database schema is up to date
  try {
    const { execSync } = require('child_process');
    const isDev = !app.isPackaged;
    const backendPath = isDev 
      ? path.join(__dirname, '../backend')
      : path.join(process.resourcesPath, 'backend');
    
    writeLog('Setting up database schema...');
    writeLog(`Backend path: ${backendPath}`);
    
    // Use db push to create/update schema
    writeLog('Running: npx prisma db push --force-reset');
    writeLog(`CWD: ${backendPath}`);
    writeLog(`DATABASE_URL: file:${dbPath}`);
    
    const result = execSync('npx prisma db push --force-reset', {
      cwd: backendPath,
      env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    writeLog(`Prisma output: ${result}`);
    writeLog('Database schema created/updated successfully');
  } catch (error) {
    writeLog(`Database setup error: ${error.message}`);
    writeLog(`Error details: ${JSON.stringify(error, null, 2)}`);
    writeLog(`Error stdout: ${error.stdout?.toString() || 'none'}`);
    writeLog(`Error stderr: ${error.stderr?.toString() || 'none'}`);
    
    // Try without force-reset
    try {
      const { execSync } = require('child_process');
      const isDev = !app.isPackaged;
      const backendPath = isDev 
        ? path.join(__dirname, '../backend')
        : path.join(process.resourcesPath, 'backend');
      
      writeLog('Trying fallback: npx prisma db push');
      const fallbackResult = execSync('npx prisma db push', {
        cwd: backendPath,
        env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      writeLog(`Fallback prisma output: ${fallbackResult}`);
      writeLog('Database schema created successfully (fallback)');
    } catch (fallbackError) {
      writeLog(`Database fallback setup failed: ${fallbackError.message}`);
      writeLog(`Fallback error details: ${JSON.stringify(fallbackError, null, 2)}`);
      writeLog(`Fallback stdout: ${fallbackError.stdout?.toString() || 'none'}`);
      writeLog(`Fallback stderr: ${fallbackError.stderr?.toString() || 'none'}`);
      // Show detailed error to user
      const errorMsg = `Failed to initialize database.\n\nError: ${fallbackError.message}\n\nCheck the log file at:\n${logPath}\n\nPlease ensure Node.js is installed and restart the application.`;
      dialog.showErrorBox('Database Setup Error', errorMsg);
    }
  }
}

app.whenReady().then(async () => {
  console.log('Electron app ready, setting up...');
  setupDatabase();
  
  try {
    console.log('Starting server...');
    await startServer();
    console.log('Creating window...');
    createWindow();
    
    // Wait a bit for server to fully start
    setTimeout(() => {
      const url = `http://localhost:${serverPort}`;
      console.log('Loading URL:', url);
      mainWindow.loadURL(url);
    }, 2000);
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