@echo off
echo Requesting administrative privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Success: Administrative privileges confirmed.
) else (
    echo Failure: Current permissions are inadequate.
    echo Please right-click this file and select "Run as administrator".
    pause
    exit
)

echo Opening Firewall Ports for Busan Design Platform...

echo 1. Opening Port 8000 (Backend API)...
netsh advfirewall firewall add rule name="BusanDesign_API" dir=in action=allow protocol=TCP localport=8000

echo 2. Opening Port 5173 (Frontend)...
netsh advfirewall firewall add rule name="BusanDesign_Frontend" dir=in action=allow protocol=TCP localport=5173

echo 3. Opening Port 3306 (Database)...
netsh advfirewall firewall add rule name="BusanDesign_DB" dir=in action=allow protocol=TCP localport=3306

echo.
echo ========================================================
echo Firewall rules added successfully!
echo You should now be able to access the site from other devices.
echo ========================================================
pause
