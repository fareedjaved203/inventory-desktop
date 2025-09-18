@echo off
echo Building Supabase version...

REM Copy Supabase env file
copy backend\.env.online backend\.env

REM Build the application
call build-simple.bat

echo Supabase build completed!