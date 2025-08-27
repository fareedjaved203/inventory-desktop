@echo off
echo Building release installer...

REM Build frontend and backend
call npm run build

REM Build installer without code signing
set CSC_IDENTITY_AUTO_DISCOVERY=false
npx electron-builder --win

echo.
echo Build complete! Files created in dist folder:
echo - Hisab Ghar Setup [version].exe
echo - latest.yml
echo.
echo Upload both files to GitHub releases for auto-updates.
pause