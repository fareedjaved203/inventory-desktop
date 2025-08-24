@echo off
:: Run this file as Administrator
echo ============================================
echo Installing Node.js
echo ============================================

:: Install Node.js LTS
echo Installing Node.js LTS...
winget install -e --id OpenJS.NodeJS.LTS -h

echo ============================================
echo Installation complete!
echo ============================================

echo Node.js version:
node -v

echo npm version:
npm -v

pause
