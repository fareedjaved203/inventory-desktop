@echo off
echo Setting up Hisab Ghar database...

REM Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

REM Try different password combinations
set PGPASSWORD=postgres
psql -U postgres -h localhost -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    set PGPASSWORD=admin
    psql -U postgres -h localhost -c "SELECT 1;" >nul 2>&1
    if %errorlevel% neq 0 (
        echo Cannot connect to PostgreSQL. Please check installation.
        exit /b 1
    )
)

REM Create database if not exists
echo Creating hisabghar database...
psql -U postgres -h localhost -c "CREATE DATABASE hisabghar;" 2>nul
psql -U postgres -h localhost -c "CREATE USER hisabghar WITH PASSWORD 'hisabghar123';" 2>nul
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE hisabghar TO hisabghar;" 2>nul

REM Setup database schema
echo Setting up database schema...
cd backend
if exist "node_modules\.bin\prisma.cmd" (
    node_modules\.bin\prisma.cmd db push --accept-data-loss
) else (
    npx prisma db push --accept-data-loss
)

if %errorlevel% neq 0 (
    echo Database schema setup failed!
    exit /b 1
)

echo Database setup completed successfully!
exit /b 0