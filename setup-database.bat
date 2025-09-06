@echo off
echo Setting up Hisab Ghar database...

REM Create database using postgres/admin
echo Creating hisabghar database...
set PGPASSWORD=admin
psql -U postgres -h localhost -c "CREATE DATABASE hisabghar;" 2>nul
echo Database created successfully!

REM Run Prisma migrations
echo Setting up database schema...
cd backend
npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo Database setup failed!
    pause
    exit /b 1
)

echo Database setup completed successfully!
pause