@echo off
title Inventory System - Development Mode
color 0A

echo ===============================================
echo    INVENTORY SYSTEM - DEVELOPMENT MODE
echo ===============================================
echo.
echo Starting development servers...
echo.

:: Start backend
echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

:: Wait a bit for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend
echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

:: Wait for servers to start
timeout /t 5 /nobreak > nul

:: Start Electron
echo Starting Electron app...
npm run electron

echo.
echo Development mode started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
pause