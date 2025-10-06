@echo off
echo Starting VideoPro Development Servers...

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d \"%~dp0backend\" && npm start"

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d \"%~dp0\" && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5000
echo.
echo Press any key to exit this script (servers will continue running)...
pause >nul