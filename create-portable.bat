@echo off
echo Creating portable version...

REM Build the app first
call npm run build

REM Create portable folder
mkdir portable 2>nul
cd portable

REM Copy necessary files
xcopy /E /I /Y ..\electron electron
xcopy /E /I /Y ..\backend backend
xcopy /E /I /Y ..\frontend\dist frontend\dist
xcopy /E /I /Y ..\node_modules node_modules

REM Copy package.json and other necessary files
copy ..\package.json .
copy ..\README-DESKTOP.md .

REM Create start script
echo @echo off > start.bat
echo echo Starting Inventory Management System... >> start.bat
echo node electron/main.js >> start.bat
echo pause >> start.bat

echo.
echo Portable version created in 'portable' folder!
echo Give the entire 'portable' folder to end users.
echo They just need to run 'start.bat' to use the app.
pause