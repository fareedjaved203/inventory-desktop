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
echo 1. Minutes
echo 2. Hours
echo 3. Days  
echo 4. Years
echo 5. Lifetime (50 Years)
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
set /a totalMinutes=%duration%
goto generate

:hours
cls
echo Enter number of hours (1-8760):
set /p duration="Hours: "
set unit=H
set /a totalMinutes=%duration% * 60
goto generate

:days
cls
echo Enter number of days (1-365):
set /p duration="Days: "
set unit=D
set /a totalMinutes=%duration% * 1440
goto generate

:years
cls
echo Enter number of years (1-10):
set /p duration="Years: "
set unit=Y
set /a totalMinutes=%duration% * 525600
goto generate

:lifetime
cls
echo Generating LIFETIME license (50 years)...
set duration=50
set unit=LIFETIME
set /a totalMinutes=50 * 525600
goto generate

:generate
cls
echo Generating license...

:: Generate random hex values
set /a rand1=%random% * 65536 + %random%
set /a rand2=%random% * 65536 + %random%

:: Get current timestamp and add duration (using UTC to match JavaScript)
powershell -command "$now = [int64](([datetime]::UtcNow).Subtract([datetime]'1970-01-01')).TotalSeconds; $expiry = $now + (%totalMinutes% * 60); Write-Host \"Current: $now\"; Write-Host \"Expiry: $expiry\"; Write-Host \"Minutes: %totalMinutes%\"; $high = [int]($expiry -shr 16); $low = $expiry -band 0xFFFF; Write-Host \"High: $high, Low: $low\"; $license = '{0:X4}-{1:X4}-{2:X4}-{3:X4}' -f %rand1%, %rand2%, $high, $low; Write-Host \"LICENSE:$license\"; Write-Host \"EXPIRY:$expiry\"" > temp_license.txt

:: Parse the output
for /f "tokens=1,2 delims=:" %%a in (temp_license.txt) do (
    if "%%a"=="LICENSE" set license=%%b
    if "%%a"=="EXPIRY" set expiry=%%b
)

:: Clean up
del temp_license.txt

echo.
echo ===============================================
echo LICENSE GENERATED SUCCESSFULLY!
echo ===============================================
echo License Key: %license%
echo Duration: %duration% %unit%
echo Expiry Timestamp: %expiry%
echo ===============================================
echo.
echo Copy this license key: %license%
echo.
pause
goto menu