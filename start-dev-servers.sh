#!/bin/bash

echo "🚀 Starting VideoPro Development Servers"
echo "======================================="

# Kill any existing node processes
echo "🧹 Cleaning up existing processes..."
taskkill //F //IM node.exe 2>/dev/null || true

# Wait a moment
sleep 2

# Start backend server
echo "🔧 Starting Backend Server..."
cd backend
nohup node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Test backend
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend running on http://localhost:3001"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend server
echo "🎨 Starting Frontend Server..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 5

# Test frontend
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Frontend running on http://localhost:5000"
else
    echo "⚠️  Frontend may take additional time to start"
fi

echo ""
echo "🎉 Servers Status:"
echo "=================="
echo "Backend:  http://localhost:3001 (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:5000 (PID: $FRONTEND_PID)"
echo ""
echo "📋 Demo Login Credentials:"
echo "Agent:        sarah.j@realty.com    / demo123"
echo "Manager:      manager@realty.com    / demo123"
echo "Videographer: video@realty.com      / demo123"
echo ""
echo "📊 To check server status:"
echo "Backend:  curl http://localhost:3001/health"
echo "Frontend: curl http://localhost:5000"
echo ""
echo "🛑 To stop servers:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Logs:"
echo "Backend:  tail -f backend.log"
echo "Frontend: tail -f frontend.log"