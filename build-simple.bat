@echo off
echo Simple build without backend rebuild...

REM Skip backend npm install, use existing node_modules
echo Skipping backend dependencies (using existing)...

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
echo Running: npx electron-builder --win --publish=never
npx electron-builder --win --publish=never > build.log 2>&1
set BUILD_ERROR=%errorlevel%
echo Build finished with exit code: %BUILD_ERROR%
if %BUILD_ERROR% neq 0 (
    echo Electron builder failed! Check build.log for details:
    type build.log
    pause
    exit /b 1
)

echo Build complete!
pause