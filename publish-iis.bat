@echo off

echo ========================================
echo Smart Solar Backend - IIS Deployment
echo ========================================

echo.
echo [1/3] Stopping SmartSolarPool...
%windir%\system32\inetsrv\appcmd.exe stop apppool /apppool.name:"SmartSolarPool"

if %ERRORLEVEL% NEQ 0 (
    echo Failed to stop SmartSolarPool.
    pause
    exit /b 1
)

echo.
echo [2/3] Publishing backend...

dotnet publish "D:\SLIIT\YEAR 4 SEM 2\SE4040 - Enterprise Applications Development\smart-solar-microgrid-trading-system\backend" -c Release -o "C:\inetpub\SmartSolarAPI"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo PUBLISH FAILED
    echo ========================================
    
    echo.
    echo Starting SmartSolarPool again...
    %windir%\system32\inetsrv\appcmd.exe start apppool /apppool.name:"SmartSolarPool"
    
    pause
    exit /b 1
)

echo.
echo [3/3] Starting SmartSolarPool...
%windir%\system32\inetsrv\appcmd.exe start apppool /apppool.name:"SmartSolarPool"

echo.
echo ========================================
echo DEPLOYMENT SUCCESSFUL
echo ========================================
echo.

pause