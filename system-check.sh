#!/bin/bash

echo "🚀 VideoPro System Status & Health Check"
echo "========================================"

# Check if servers are running
echo ""
echo "🔍 Server Status Check:"
echo "----------------------"

# Backend check
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend: RUNNING (http://localhost:3001)"
    BACKEND_STATUS="UP"
else
    echo "❌ Backend: DOWN"
    BACKEND_STATUS="DOWN"
fi

# Frontend check  
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Frontend: RUNNING (http://localhost:5000)"
    FRONTEND_STATUS="UP"
else
    echo "❌ Frontend: DOWN"
    FRONTEND_STATUS="DOWN"
fi

# Database check
echo ""
echo "🗄️  Database Status:"
echo "-------------------"
cd backend
if node -e "
const { query, close } = require('./config/database-sqlite');
query('SELECT COUNT(*) as count FROM users').then(result => {
  console.log('✅ Database: CONNECTED');
  console.log('   Users:', result.rows[0].count);
  query('SELECT COUNT(*) as count FROM bookings').then(bookings => {
    console.log('   Bookings:', bookings.rows[0].count);
    close();
  });
}).catch(err => {
  console.log('❌ Database: ERROR -', err.message);
  close();
});
"; then
    DATABASE_STATUS="UP"
else
    DATABASE_STATUS="DOWN"
fi
cd ..

echo ""
echo "🎯 System Summary:"
echo "------------------"
echo "Backend:  $BACKEND_STATUS"
echo "Frontend: $FRONTEND_STATUS"  
echo "Database: $DATABASE_STATUS"

if [[ "$BACKEND_STATUS" == "UP" && "$FRONTEND_STATUS" == "UP" && "$DATABASE_STATUS" == "UP" ]]; then
    echo ""
    echo "🎉 ALL SYSTEMS OPERATIONAL!"
    echo ""
    echo "🌐 Access your application at: http://localhost:5000"
    echo ""
    echo "🔐 Demo Login Credentials:"
    echo "   Agent:        sarah.j@realty.com    / demo123"
    echo "   Manager:      manager@realty.com    / demo123" 
    echo "   Videographer: video@realty.com      / demo123"
    echo ""
    echo "✨ System is ready for testing and development!"
else
    echo ""
    echo "⚠️  Some services need attention. Run ./start-dev-servers.sh to start missing services."
fi