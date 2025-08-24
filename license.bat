@echo off
title License Generator
color 0A

:menu
cls
echo ===============================================
echo           LICENSE GENERATOR v1.0
echo ===============================================
echo.
echo Select license duration:
echo 1. Hours
echo 2. Days  
echo 3. Years
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto hours
if "%choice%"=="2" goto days
if "%choice%"=="3" goto years
if "%choice%"=="4" exit
goto menu

:hours
cls
echo Enter number of hours (1-8760):
set /p duration="Hours: "
set unit=H
goto generate

:days
cls
echo Enter number of days (1-365):
set /p duration="Days: "
set unit=D
goto generate

:years
cls
echo Enter number of years (1-10):
set /p duration="Years: "
set unit=Y
goto generate

:generate
cls
echo Generating license...

:: Generate random components
set /a rand1=%random% * 32768 + %random%
set /a rand2=%random% * 32768 + %random%
set /a timestamp=%random% * 1000 + %random%

:: Create license key format: XXXX-XXXX-XXXX-XXXX
for /f %%i in ('powershell -command "'{0:X4}-{1:X4}-{2:X4}-{3:X4}' -f %rand1%, %rand2%, %timestamp%, (%duration% + %random%)"') do set license=%%i

:: Generate expiry timestamp (current time + duration)
for /f %%i in ('powershell -command "[int64](([datetime]::Now.AddHours(%duration% * (if('%unit%'=='H'){1}elseif('%unit%'=='D'){24}else{8760}))).Subtract([datetime]'1970-01-01')).TotalSeconds"') do set expiry=%%i

:: Create license file
echo {> license_%license%.json
echo   "key": "%license%",>> license_%license%.json
echo   "expiry": %expiry%,>> license_%license%.json
echo   "duration": "%duration%%unit%",>> license_%license%.json
echo   "generated": "%date% %time%">> license_%license%.json
echo }>> license_%license%.json

echo.
echo ===============================================
echo LICENSE GENERATED SUCCESSFULLY!
echo ===============================================
echo License Key: %license%
echo Duration: %duration% %unit%
echo File: license_%license%.json
echo ===============================================
echo.
pause
goto menu