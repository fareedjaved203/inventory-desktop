@echo off
echo Migrating Hisab Ghar from SQLite to PostgreSQL...
echo.

REM Setup PostgreSQL
echo Step 1: Setting up PostgreSQL...
call scripts\setup-postgres.bat
if %errorlevel% neq 0 (
    echo PostgreSQL setup failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Step 3: Initializing database and migrating data...
cd ..
node scripts\init-database.js
if %errorlevel% neq 0 (
    echo Database initialization failed!
    pause
    exit /b 1
)

echo.
echo Migration completed successfully!
echo.
echo Your application is now using PostgreSQL instead of SQLite.
echo Database connection: postgresql://hisabghar:hisabghar123@localhost:5432/hisabghar
echo.
pause