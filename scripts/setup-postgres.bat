@echo off
setlocal enabledelayedexpansion

echo Setting up PostgreSQL for Hisab Ghar...

REM Check if PostgreSQL is already installed
pg_config --version >nul 2>&1
if %errorlevel% == 0 (
    echo PostgreSQL is already installed.
    goto :setup_database
)

echo Installing PostgreSQL...

REM Download and install PostgreSQL silently
set POSTGRES_VERSION=16.1-1
set POSTGRES_URL=https://get.enterprisedb.com/postgresql/postgresql-%POSTGRES_VERSION%-windows-x64.exe
set POSTGRES_INSTALLER=%TEMP%\postgresql-installer.exe

echo Downloading PostgreSQL installer...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%POSTGRES_URL%' -OutFile '%POSTGRES_INSTALLER%'}"

if not exist "%POSTGRES_INSTALLER%" (
    echo Failed to download PostgreSQL installer.
    exit /b 1
)

echo Installing PostgreSQL (this may take a few minutes)...
"%POSTGRES_INSTALLER%" --mode unattended --superpassword "postgres" --servicename "postgresql" --servicepassword "postgres" --serverport 5432 --locale "English, United States" --enable-components server,commandlinetools

REM Wait for installation to complete
timeout /t 30 /nobreak >nul

REM Add PostgreSQL to PATH
set "POSTGRES_PATH=C:\Program Files\PostgreSQL\16\bin"
setx PATH "%PATH%;%POSTGRES_PATH%" /M >nul 2>&1

REM Update current session PATH
set "PATH=%PATH%;%POSTGRES_PATH%"

echo PostgreSQL installation completed.

:setup_database
echo Setting up Hisab Ghar database...

REM Wait for PostgreSQL service to start
echo Waiting for PostgreSQL service to start...
timeout /t 10 /nobreak >nul

REM Create database and user
echo Creating database and user...
set PGPASSWORD=postgres
psql -U postgres -h localhost -c "CREATE DATABASE hisabghar;" 2>nul
psql -U postgres -h localhost -c "CREATE USER hisabghar WITH PASSWORD 'hisabghar123';" 2>nul
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE hisabghar TO hisabghar;" 2>nul
psql -U postgres -h localhost -c "ALTER USER hisabghar CREATEDB;" 2>nul

echo Database setup completed successfully!
echo.
echo Database Details:
echo - Host: localhost
echo - Port: 5432
echo - Database: hisabghar
echo - Username: hisabghar
echo - Password: hisabghar123
echo.

REM Clean up installer
if exist "%POSTGRES_INSTALLER%" del "%POSTGRES_INSTALLER%"

exit /b 0