@echo off
REM QUICK START SCRIPT FOR WINDOWS

echo.
echo ╔════════════════════════════════════════════╗
echo ║   College Merchandise Store - Quick Start   ║
echo ╚════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed.
    echo 📥 Download from: https://nodejs.org ^(LTS version^)
    pause
    exit /b 1
)

echo ✅ Node.js version:
node -v

echo ✅ npm version:
npm -v
echo.

REM Navigate to backend
cd backend

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════╗
echo ║        Starting Server (localhost:5000)    ║
echo ╚════════════════════════════════════════════╝
echo.
echo ✅ Open in browser: http://localhost:5000
echo ✅ Student: Login with name + email
echo ✅ Admin: Click "Go to Admin Panel"
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start server
call npm start

pause
