@echo off
:: Run this file as Administrator
echo ============================================
echo Installing Node.js
echo ============================================

:: Install Node.js LTS
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent

echo ============================================
echo Installation complete!
echo ============================================

node -v
npm -v

pause
