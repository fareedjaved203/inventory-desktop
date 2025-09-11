const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

const isDev = process.env.NODE_ENV === 'development';
const serverPort = 3000;

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
          label: 'Show Logs',
          click: () => {
            const logsPath = app.getPath('userData');
            shell.openPath(logsPath);
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
    
    // Load .env file
    const envPath = path.join(cwd, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            let value = trimmedLine.substring(equalIndex + 1).trim();
            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            envVars[key] = value;
          }
        }
      });
      Object.assign(process.env, envVars);
    }
    
    const sqliteUrl = `file:${dbPath}`;
    
    const env = {
      ...process.env,
      PORT: serverPort,
      NODE_ENV: isDev ? 'development' : undefined,
      ELECTRON_APP: 'true',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres.aosisusebnmoddyhovag:fareedjaved203@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1',
      DIRECT_URL: process.env.DIRECT_URL || 'postgresql://postgres.aosisusebnmoddyhovag:fareedjaved203@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
    };
    
    console.log('Environment variables:');
    console.log('DATABASE_URL:', env.DATABASE_URL);
    console.log('DIRECT_URL:', env.DIRECT_URL);
    console.log('PORT:', env.PORT);

    serverProcess = spawn('node', [serverPath], {
      env: {
        ...process.env,
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
      
      // Log errors to file for debugging
      const errorLogPath = path.join(app.getPath('userData'), 'server-errors.log');
      try {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(errorLogPath, `[${timestamp}] ${error}\n`);
      } catch (e) {
        console.error('Failed to write error log:', e);
      }
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