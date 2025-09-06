@echo off
echo Building release installer with PostgreSQL support...

REM Update backend dependencies for PostgreSQL
echo Updating backend dependencies...
cd backend
npm install
cd ..

REM Build frontend and backend
call npm run build

REM Build installer without code signing
set CSC_IDENTITY_AUTO_DISCOVERY=false
npx electron-builder --win

echo.
echo Build complete! Files created in dist folder:
echo - Hisab Ghar Setup [version].exe (with PostgreSQL auto-install)
echo - latest.yml
echo.
echo The installer will automatically:
echo - Install Node.js if not present
echo - Install and configure PostgreSQL
echo - Create the hisabghar database
echo - Migrate existing SQLite data if found
echo.
echo Upload both files to GitHub releases for auto-updates.
pause