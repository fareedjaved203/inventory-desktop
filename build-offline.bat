@echo off
echo Building offline PostgreSQL version...

REM Copy offline env file
copy backend\.env.offline backend\.env

REM Build the application
call build-simple.bat

echo Offline PostgreSQL build completed!