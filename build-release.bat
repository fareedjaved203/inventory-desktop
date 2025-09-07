@echo off
echo Building release installer with PostgreSQL support...

REM Update backend dependencies for PostgreSQL
echo Updating backend dependencies...
cd backend

REM Clear npm cache and node_modules
echo Clearing cache...
npm cache clean --force
if exist node_modules rmdir /s /q node_modules

REM Install with verbose output
echo Installing dependencies...
npm install --verbose
if %errorlevel% neq 0 (
    echo Backend npm install failed!
    echo Trying with --force flag...
    npm install --force
    if %errorlevel% neq 0 (
        echo Backend npm install still failed!
        pause
        exit /b 1
    )
)
cd ..

REM Build frontend and backend
echo Building frontend and backend...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

REM Build installer without code signing
echo Building installer...
set CSC_IDENTITY_AUTO_DISCOVERY=false
set DEBUG=electron-builder
npx electron-builder --win --publish=never
if %errorlevel% neq 0 (
    echo Electron builder failed!
    pause
    exit /b 1
)

echo.
echo Build complete! Files created in dist folder:
dir dist\*.exe
echo.
echo The installer will automatically:
echo - Install Node.js if not present
echo - Install and configure PostgreSQL
echo - Create the hisabghar database
echo.
echo Upload files to GitHub releases for auto-updates.
pause