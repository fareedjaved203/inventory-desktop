@echo off
echo Setting up offline database...

REM Try common PostgreSQL installation paths
set "PSQL_PATH="
if exist "C:\Program Files\PostgreSQL\*\bin\psql.exe" (
    for /d %%i in ("C:\Program Files\PostgreSQL\*") do set "PSQL_PATH=%%i\bin\psql.exe"
)
if exist "C:\PostgreSQL\*\bin\psql.exe" (
    for /d %%i in ("C:\PostgreSQL\*") do set "PSQL_PATH=%%i\bin\psql.exe"
)

if "%PSQL_PATH%"=="" (
    echo PostgreSQL not found! Please install PostgreSQL first.
    echo Or manually create database using pgAdmin:
    echo 1. Open pgAdmin
    echo 2. Create database: hisabghar
    echo 3. Create user: postgres with password: admin
    pause
    exit /b
)

REM Create database and user
"%PSQL_PATH%" -U postgres -c "CREATE DATABASE hisabghar;"
"%PSQL_PATH%" -U postgres -c "CREATE USER postgres WITH PASSWORD 'admin';"
"%PSQL_PATH%" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE hisabghar TO postgres;"

echo Database created! The app will create tables automatically on first run.
echo Make sure PostgreSQL is running and start the app.
pause