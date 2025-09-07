@echo off
echo Building release installer with PostgreSQL support...

REM Install backend dependencies from scratch
echo Installing backend dependencies...
cd backend

REM Clean install - remove everything and reinstall
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

REM Fresh install of all dependencies
echo Fresh install of all dependencies...
npm install
if %errorlevel% neq 0 (
    echo Backend npm install failed!
    pause
    exit /b 1
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