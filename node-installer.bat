@echo off
:: Run this file as Administrator
echo ============================================
echo Installing Node.js
echo ============================================

:: Try winget first with SSL bypass
echo Attempting winget installation...
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent --disable-interactivity

:: Check if Node.js was installed
node -v >nul 2>&1
if %errorlevel% == 0 (
    echo Node.js installed successfully via winget!
    goto :success
)

:: Fallback: Download and install manually
echo Winget failed, downloading Node.js manually...
set NODE_URL=https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi
set TEMP_FILE=%TEMP%\nodejs-installer.msi

:: Download using PowerShell with SSL bypass
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { (New-Object Net.WebClient).DownloadFile('%NODE_URL%', '%TEMP_FILE%'); Write-Host 'Download successful' } catch { Write-Host 'Download failed:' $_.Exception.Message; exit 1 }"

if exist "%TEMP_FILE%" (
    echo Installing Node.js from downloaded file...
    msiexec /i "%TEMP_FILE%" /quiet /norestart
    del "%TEMP_FILE%"
) else (
    echo Failed to download Node.js installer
    echo Please download Node.js manually from https://nodejs.org
    pause
    exit /b 1
)

:success
echo ============================================
echo Installation complete!
echo ============================================

node -v
npm -v

echo.
echo Node.js is now installed and ready to use.
pause
