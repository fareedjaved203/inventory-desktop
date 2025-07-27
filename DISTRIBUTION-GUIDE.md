# Distribution Guide

## What to Give End Users

**Give them the `dist\win-unpacked` folder** - This contains:
- ✅ Compiled application (no source code)
- ✅ All necessary files
- ✅ Portable - no installation required

## End User Instructions

1. **Copy the `win-unpacked` folder** to their computer
2. **Run `Inventory Management System.exe`**
3. **That's it!** The app will:
   - Create database automatically
   - Store data in their user folder
   - Work completely offline

## File Structure for Distribution

```
win-unpacked/
├── Inventory Management System.exe  ← Main executable
├── resources/
├── locales/
└── [other system files]
```

## User Data Location

The SQLite database is automatically created at:
- `%APPDATA%\inventory-management-desktop\inventory.db`

## Requirements

- Windows 10 or later
- No additional software needed
- No internet connection required

## Troubleshooting

If users get "Windows protected your PC" warning:
1. Click "More info"
2. Click "Run anyway"
3. This happens because the app is unsigned (normal for free distribution)