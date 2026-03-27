@echo off
title License Generator (Device-Bound)
color 0A

:menu
cls
echo ===============================================
echo     LICENSE GENERATOR v2.0 (Device-Bound)
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
echo Generating device-bound license...
echo.

powershell -command ^
  "$secret = 'HisabGhar2025$ecure!Key';" ^
  "$deviceId = '%deviceId%';" ^
  "$durationSeconds = %totalMinutes% * 60;" ^
  "$now = [int64](([datetime]::UtcNow).Subtract([datetime]'1970-01-01')).TotalSeconds;" ^
  "$devHash = $deviceId.Substring(0, [Math]::Min(8, $deviceId.Length)).ToUpper();" ^
  "$rand = Get-Random -Maximum 65536;" ^
  "$durHigh = [int]($durationSeconds -shr 16);" ^
  "$durLow = $durationSeconds -band 0xFFFF;" ^
  "$tsHex = '{0:X8}' -f [int]$now;" ^
  "$randHex = '{0:X4}' -f $rand;" ^
  "$durHighHex = '{0:X4}' -f $durHigh;" ^
  "$durLowHex = '{0:X4}' -f $durLow;" ^
  "$payload = \"$devHash-$randHex-$durHighHex-$durLowHex-$tsHex\";" ^
  "$hmac = New-Object System.Security.Cryptography.HMACSHA256;" ^
  "$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret);" ^
  "$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload));" ^
  "$hmacHex = ([BitConverter]::ToString($hash) -replace '-','').Substring(0,8);" ^
  "$license = \"$payload-$hmacHex\";" ^
  "Write-Host \"LICENSE:$license\";" ^
  "Write-Host \"DURATION:$durationSeconds\";" ^
  "Write-Host \"DEADLINE:5 minutes\"" > temp_license.txt

:: Parse the output
for /f "tokens=1,2 delims=:" %%a in (temp_license.txt) do (
    if "%%a"=="LICENSE" set license=%%b
)

:: Clean up
del temp_license.txt

echo ===============================================
echo    LICENSE GENERATED SUCCESSFULLY!
echo ===============================================
echo.
echo License Key: %license%
echo Duration:    %duration% %unit%
echo Device ID:   %deviceId%
echo Activation:  Must activate within 5 MINUTES
echo.
echo IMPORTANT: This key is bound to the device above.
echo It cannot be used on any other machine, and cannot
echo be reused once activated or after 5 minutes.
echo ===============================================
echo.
echo Copy this license key: %license%
echo.
pause
goto menu
