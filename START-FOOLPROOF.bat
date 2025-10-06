@echo off
echo ========================================
echo  VideoPro - BULLETPROOF Startup
echo ========================================

echo Cleaning up processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
timeout /t 3 >nul

echo.
echo Starting SIMPLE Backend (no database complexity)...
cd /d "D:\Booking System\real-estate-videogra\backend"
start "VideoPro-Backend" cmd /k "node server-simple.js"

echo Waiting for backend...
timeout /t 5 >nul

echo.
echo Testing backend...
curl -s http://localhost:3001/health >nul
if %errorlevel%==0 (
    echo ✅ Backend is working!
) else (
    echo ❌ Backend failed to start
    pause
    exit /b 1
)

echo.
echo Starting Frontend...
cd /d "D:\Booking System\real-estate-videogra"
start "VideoPro-Frontend" cmd /k "npm run dev"

echo Waiting for frontend...
timeout /t 8 >nul

echo.
echo ========================================
echo  🎉 SYSTEM IS READY!
echo  Backend:  http://localhost:3001 (Simple Mode)
echo  Frontend: http://localhost:5000
echo ========================================
echo.
echo Opening application...
timeout /t 2 >nul
start http://localhost:5000

echo.
echo 💡 Both servers are running in separate windows
echo 💡 Close those windows to stop the servers
echo.
echo Press any key to close this launcher...
pause >nul