@echo off
echo ========================================
echo  VideoPro - Simple Startup Script
echo ========================================

echo Cleaning up any running processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
timeout /t 2 >nul

echo.
echo Starting Backend Server...
cd /d "D:\Booking System\real-estate-videogra\backend"
start "Backend" cmd /k "npm start"

echo Waiting for backend to start...
timeout /t 5 >nul

echo.
echo Starting Frontend Server...
cd /d "D:\Booking System\real-estate-videogra"
start "Frontend" cmd /k "npm run dev"

echo.
echo Waiting for frontend to start...
timeout /t 8 >nul

echo.
echo ========================================
echo  Both servers should now be running!
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5000
echo ========================================
echo.
echo Opening application in browser...
start http://localhost:5000

echo.
echo Press any key to exit this script...
pause >nul