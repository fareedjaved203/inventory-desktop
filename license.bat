@echo off
title License Generator (Device-Bound)
color 0A

:menu
cls
echo ===============================================
echo     LICENSE GENERATOR v3.0 (Device-Bound)
echo ===============================================
echo.
echo STEP 1: Enter the Device ID from the app
echo         (Settings ^> License Management ^> Device ID)
echo.
set /p deviceId="Device ID: "

if "%deviceId%"=="" (
    echo ERROR: Device ID is required!
    pause
    goto menu
)

echo.
echo Select license duration:
echo 1. Minutes
echo 2. Hours
echo 3. Days  
echo 4. Years
echo 5. Lifetime (30 Years)
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto minutes
if "%choice%"=="2" goto hours
if "%choice%"=="3" goto days
if "%choice%"=="4" goto years
if "%choice%"=="5" goto lifetime
if "%choice%"=="6" exit
goto menu

:minutes
cls
echo Enter number of minutes (1-1440):
set /p duration="Minutes: "
set unit=M
set durationArg=%duration%m
goto generate

:hours
cls
echo Enter number of hours (1-8760):
set /p duration="Hours: "
set unit=H
set durationArg=%duration%h
goto generate

:days
cls
echo Enter number of days (1-365):
set /p duration="Days: "
set unit=D
set durationArg=%duration%d
goto generate

:years
cls
echo Enter number of years (1-10):
set /p duration="Years: "
set unit=Y
set durationArg=%duration%y
goto generate

:lifetime
cls
echo Generating LIFETIME license (30 years)...
set duration=30
set unit=LIFETIME
set durationArg=lifetime
goto generate

:generate
cls
echo Generating device-bound license...
echo.

node "%~dp0generate-license.js" %deviceId% %durationArg%

echo.
pause
goto menu
