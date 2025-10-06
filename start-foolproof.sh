#!/bin/bash
echo "========================================"
echo "  VideoPro - BULLETPROOF Startup"
echo "========================================"

echo "Cleaning up processes..."
cmd //c "taskkill /F /IM node.exe >nul 2>&1"
cmd //c "taskkill /F /IM npm.exe >nul 2>&1"
sleep 3

echo ""
echo "Starting SIMPLE Backend (no database complexity)..."
cd "d:\Booking System\real-estate-videogra\backend"
cmd //c "start \"VideoPro-Backend\" cmd /k \"node server-simple.js\"" &

echo "Waiting for backend..."
sleep 5

echo ""
echo "Testing backend..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend is working!"
else
    echo "❌ Backend failed to start"
    read -p "Press Enter to exit..."
    exit 1
fi

echo ""
echo "Starting Frontend..."
cd "d:\Booking System\real-estate-videogra"
cmd //c "start \"VideoPro-Frontend\" cmd /k \"npm run dev\"" &

echo "Waiting for frontend..."
sleep 8

echo ""
echo "========================================"
echo "  🎉 SYSTEM IS READY!"
echo "  Backend:  http://localhost:3001 (Simple Mode)"
echo "  Frontend: http://localhost:5000"
echo "========================================"
echo ""
echo "Opening application..."
sleep 2
cmd //c "start http://localhost:5000"

echo ""
echo "💡 Both servers are running in separate windows"
echo "💡 Close those windows to stop the servers"
echo ""
read -p "Press Enter to close this launcher..."