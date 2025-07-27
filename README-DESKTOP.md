# Inventory Management Desktop App

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Build the Application**
   ```bash
   npm run build
   ```

3. **Run the Desktop App**
   ```bash
   npm run electron
   ```
   Or double-click `start-electron.bat`

4. **Build Installer (Windows)**
   ```bash
   npm run dist:win
   ```
   Or double-click `build-installer.bat`

## Features

- ✅ Standalone desktop application
- ✅ No internet connection required
- ✅ SQLite database stored in user data folder
- ✅ Complete inventory management system
- ✅ Windows installer support
- ✅ Auto-updater ready

## File Structure

```
inventory_desktop/
├── electron/           # Electron main process
├── backend/           # Node.js API server
├── frontend/          # React frontend
├── assets/           # App icons
└── dist/             # Built installers
```

## Database Location

The SQLite database is stored in:
- Windows: `%APPDATA%/inventory-management-desktop/inventory.db`
- macOS: `~/Library/Application Support/inventory-management-desktop/inventory.db`
- Linux: `~/.config/inventory-management-desktop/inventory.db`

## Building for Other Platforms

- **macOS**: `npm run dist:mac`
- **Linux**: `npm run dist:linux`
- **All platforms**: `npm run dist`