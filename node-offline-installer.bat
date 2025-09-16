@echo off
:: Offline Node.js installer - no internet required
echo ============================================
echo Installing Node.js (Offline)
echo ============================================

:: Check if Node.js already installed
node -v >nul 2>&1
if %errorlevel% == 0 (
    echo Node.js is already installed!
    node -v
    npm -v
    pause
    exit /b 0
)

:: Look for bundled Node.js installer
set BUNDLED_INSTALLER=%~dp0node-v18.19.0-x64.msi
if exist "%BUNDLED_INSTALLER%" (
    echo Installing bundled Node.js...
    msiexec /i "%BUNDLED_INSTALLER%" /quiet /norestart
    echo Installation complete!
) else (
    echo ERROR: Node.js installer not found!
    echo Please download node-v18.19.0-x64.msi from https://nodejs.org
    echo and place it in the same folder as this script.
    pause
    exit /b 1
)

echo ============================================
echo Verifying installation...
echo ============================================
node -v
npm -v
pause