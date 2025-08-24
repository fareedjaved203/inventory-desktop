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
echo Generating LIFETIME license (30 years)...
set duration=30
set unit=LIFETIME
set /a totalMinutes=30 * 525600
goto generate

:generate
cls
echo Generating license...

:: Generate random hex values
set /a rand1=%random% * 65536 + %random%
set /a rand2=%random% * 65536 + %random%

:: Get current timestamp and calculate durations
powershell -command "$now = [int64](([datetime]::UtcNow).Subtract([datetime]'1970-01-01')).TotalSeconds; $activationWindow = 600; $durationSeconds = %totalMinutes% * 60; Write-Host \"Current: $now\"; Write-Host \"ActivationWindow: $activationWindow\"; Write-Host \"DurationSeconds: $durationSeconds\"; Write-Host \"Minutes: %totalMinutes%\"; $rand1 = Get-Random -Maximum 65536; $rand2 = Get-Random -Maximum 65536; $actWin = $activationWindow -band 0xFFFF; $durHigh = [int]($durationSeconds -shr 16); $durLow = $durationSeconds -band 0xFFFF; $checksum = ($rand1 + $rand2 + $durHigh + $durLow) -band 0xFFFF; $license = '{0:X4}-{1:X4}-{2:X4}-{3:X4}-{4:X4}' -f $rand1, $rand2, $durHigh, $durLow, $checksum; Write-Host \"LICENSE:$license\"; Write-Host \"DURATION:$durationSeconds\"" > temp_license.txt

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
echo Activation Window: 10 minutes
echo Expiry Timestamp: %expiry%
echo ===============================================
echo.
echo Copy this license key: %license%
echo.
pause
goto menu