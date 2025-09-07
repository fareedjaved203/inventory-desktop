@echo off
setlocal enabledelayedexpansion

echo Setting up PostgreSQL for Hisab Ghar...

REM Check if PostgreSQL is already installed
psql --version >nul 2>&1
if %errorlevel% == 0 (
    echo PostgreSQL is already installed.
    goto :setup_database
)

echo Installing PostgreSQL...

REM Try portable PostgreSQL first
set POSTGRES_VERSION=16.1-1
set POSTGRES_URL=https://get.enterprisedb.com/postgresql/postgresql-%POSTGRES_VERSION%-windows-x64.exe
set POSTGRES_INSTALLER=%TEMP%\postgresql-installer.exe

echo Downloading PostgreSQL installer...
powershell -ExecutionPolicy Bypass -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%POSTGRES_URL%' -OutFile '%POSTGRES_INSTALLER%' -TimeoutSec 300; exit 0 } catch { exit 1 }"

if not exist "%POSTGRES_INSTALLER%" (
    echo Failed to download PostgreSQL installer.
    echo Trying alternative installation method...
    
    REM Try chocolatey if available
    choco install postgresql --version=16.1 -y >nul 2>&1
    if %errorlevel% == 0 (
        echo PostgreSQL installed via Chocolatey
        goto :setup_paths
    )
    
    echo PostgreSQL installation failed. Please install manually.
    exit /b 1
)

echo Installing PostgreSQL (this may take several minutes)...
"%POSTGRES_INSTALLER%" --mode unattended --superpassword "postgres" --servicename "postgresql" --servicepassword "postgres" --serverport 5432 --locale "English, United States" --enable-components server,commandlinetools --disable-components pgAdmin,stackbuilder

if %errorlevel% neq 0 (
    echo PostgreSQL installation failed.
    exit /b 1
)

:setup_paths
REM Add PostgreSQL to PATH
for /d %%i in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%i\bin\psql.exe" (
        set "POSTGRES_PATH=%%i\bin"
        goto :path_found
    )
)

:path_found
if defined POSTGRES_PATH (
    setx PATH "%PATH%;%POSTGRES_PATH%" /M >nul 2>&1
    set "PATH=%PATH%;%POSTGRES_PATH%"
)

echo PostgreSQL installation completed.

:setup_database
echo Setting up Hisab Ghar database...

REM Wait for PostgreSQL service to start
echo Waiting for PostgreSQL service to start...
net start postgresql >nul 2>&1
timeout /t 15 /nobreak >nul

REM Create database and user
echo Creating database and user...
set PGPASSWORD=postgres
psql -U postgres -h localhost -c "CREATE DATABASE IF NOT EXISTS hisabghar;" 2>nul
psql -U postgres -h localhost -c "CREATE USER hisabghar WITH PASSWORD 'hisabghar123';" 2>nul
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE hisabghar TO hisabghar;" 2>nul
psql -U postgres -h localhost -c "ALTER USER hisabghar CREATEDB;" 2>nul

echo Database setup completed!

REM Clean up installer
if exist "%POSTGRES_INSTALLER%" del "%POSTGRES_INSTALLER%" >nul 2>&1

exit /b 0