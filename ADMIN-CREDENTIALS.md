# 🔐 VideoPro Admin Credentials

## 🎯 Your Admin Access Information

### **Admin Login Credentials**
```
📧 Email:    admin@videopro.com
🔑 Password: AdminPass123!
👤 Role:     admin
🎯 Tier:     elite
📊 Quota:    999 bookings/month
```

### **Access URLs**
```
🌐 Frontend: http://localhost:5001
🔧 Backend:  http://localhost:3001
📊 Health:   http://localhost:3001/health
```

## 🚀 How to Login

1. **Visit**: http://localhost:5001
2. **Click**: "Sign In" (if not already on login form)
3. **Enter**:
   - Email: `admin@videopro.com`
   - Password: `AdminPass123!`
4. **Click**: "Sign In"

## 🛠️ Admin Capabilities

As an admin, you have access to:

- ✅ **Manager Dashboard**: Full system overview
- ✅ **All Bookings**: View, approve, decline all bookings
- ✅ **User Management**: View all users and agents
- ✅ **Analytics**: System performance metrics
- ✅ **High Priority**: Admin bookings get top priority
- ✅ **Elite Tier**: 999 bookings per month quota

## 🎨 What You'll See

After logging in as admin, you'll see:
- **Manager Dashboard** (admin role shows manager view)
- **Navigation**: Dashboard, Bookings, Analytics, Users
- **Statistics**: System-wide booking and performance data
- **User Management**: All agents, videographers, and their details

## 🔧 Server Status

Both servers are currently running:

### **Backend Server**: ✅ RUNNING
- **URL**: http://localhost:3001
- **Database**: Production SQLite with your admin account
- **Authentication**: JWT tokens + bcrypt security

### **Frontend Server**: ✅ RUNNING
- **URL**: http://localhost:5001 (note: port 5001, not 5000)
- **Framework**: React + TypeScript + Vite
- **Features**: Full authentication, Google Maps integration

## 📋 Additional Admin Options

### **Option 2: Create More Admin Users**
You can run the admin creation script again with different credentials:
```bash
cd "/d/Booking System/real-estate-videogra/backend"
node scripts/create-admin.js
```

### **Option 3: Database Management**
Your production database is located at:
```
backend/data/videography_booking.db
```

## 🔒 Security Notes

- **Password**: Strong password with symbols and numbers
- **Hashing**: bcrypt with 12 rounds
- **Tokens**: JWT with 30-minute expiration
- **Role**: Admin role gives full system access

## 🎯 Quick Test Steps

1. Login with the credentials above
2. You should see the Manager Dashboard
3. Navigate through different sections
4. Test creating/viewing bookings
5. Google Maps integration should work for addresses

---

**Ready to go!** Your admin account is created and both servers are running. Login at http://localhost:5001 with the credentials above.