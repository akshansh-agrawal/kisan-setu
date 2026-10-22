@echo off
setlocal EnableExtensions
title Kisan Setu - Local Setup
cd /d "%~dp0"

echo.
echo ============================================================
echo                        KISAN SETU
echo ============================================================
echo.

if not exist "package.json" (
echo ERROR: package.json was not found.
echo Please run this file from the extracted Kisan Setu project folder.
pause
exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
echo ERROR: Node.js is not installed or not on PATH.
echo Install Node.js 18 LTS or newer from https://nodejs.org/ and reopen this file.
pause
exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
echo ERROR: npm was not found. Reinstall Node.js LTS with npm included.
pause
exit /b 1
)

for /f "tokens=1 delims=.v" %%V in ('node -p "process.versions.node"') do set NODE_MAJOR=%%V
if %NODE_MAJOR% LSS 18 (
echo ERROR: Node.js 18 or newer is required. Detected version:
node -v
pause
exit /b 1
)

rem Keep starter records separate from any existing project data.
set "DATA_DIR=%CD%\data-kisan-setu"
rem Force local application storage even if cloud database variables exist in the shell.
set "MONGODB_URI="
set "REDIS_URL="
if not exist "node_modules" (
echo [1/4] Installing dependencies. Internet is required the first time...
call npm.cmd install
if errorlevel 1 goto :failed
) else (
echo [1/4] Dependencies already installed; skipping npm install.
)

echo.
echo [2/4] Building frontend...
call npm.cmd run build
if errorlevel 1 goto :failed

echo.
echo [3/4] Preparing local marketplace data in:
echo       %DATA_DIR%
call npm.cmd run seed:data
if errorlevel 1 goto :failed

echo.
echo [4/4] Starting local server...
echo.
echo App URL: http://localhost:8787
echo Keep this window open while presenting.
echo One login per portal is created: Admin, Farmer, Bulk Buyer, Consumer, and Delivery Partner.
echo Complete the development OTP shown on screen or in this terminal.
echo Farmer profiles, listings, orders, and operations history are loaded.
echo Mandi figures are indicative reference estimates, not live prices.
echo Press Ctrl+C in this window to stop the server.
echo.
start "" "http://localhost:8787"
call npm.cmd start
echo.
echo Kisan Setu has stopped.
pause
exit /b 0

:failed
echo.
echo ERROR: A setup step failed. Read the message above.
echo Check README.md for troubleshooting steps.
pause
exit /b 1
