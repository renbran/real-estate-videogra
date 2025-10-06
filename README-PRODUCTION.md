# VideoPro - Real Estate Videography Booking System

A complete, production-ready booking and optimization system for managing videography services across 50+ real estate agents and 1 videographer. Built with modern React frontend and robust Node.js backend.

## 🌟 Key Features

### Multi-Role Dashboard System
- **Agent Dashboard**: Submit bookings, track requests, view schedules
- **Manager Dashboard**: Approve bookings, optimize routes, view analytics  
- **Videographer Dashboard**: Manage schedule, update booking status

### Intelligent Booking Optimization
- Priority-based scheduling algorithm
- Agent tier consideration (Standard, Premium, Elite)
- Geographic clustering for route optimization
- Deadline urgency and property value weighting

### Production-Ready Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + PostgreSQL/SQLite
- **Authentication**: JWT with bcrypt hashing
- **Security**: Helmet.js, CORS, rate limiting
- **UI**: Tailwind CSS + shadcn/ui components

### Advanced Features
- Real-time notifications system
- Calendar export functionality
- Email integration for booking updates
- Mobile-responsive design
- Comprehensive error handling with fallbacks

## 🚀 Quick Start

### Development Setup

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd real-estate-videogra
   npm install
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   # SQLite will be configured automatically for development
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm start
   
   # Terminal 2: Frontend  
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:5001
   - Backend API: http://localhost:3001

### Demo Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Agent** | `sarah.j@realty.com` | `demo123` | Elite tier agent |
| **Manager** | `manager@realty.com` | `demo123` | Full system access |
| **Videographer** | `video@realty.com` | `demo123` | Schedule management |

## 📋 Production Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Domain with SSL certificate
- Email service (SMTP)

### Quick Production Deploy
```bash
# 1. Copy production config
cp backend/.env.production.template backend/.env
# Edit .env with your production values

# 2. Build frontend
npm run build

# 3. Deploy backend
cd backend
npm install --production
pm2 start server.js --name videography-backend

# 4. Configure web server (Nginx recommended)
# See PRODUCTION_DEPLOYMENT.md for detailed steps
```

**📖 Complete deployment guide**: See `PRODUCTION_DEPLOYMENT.md`

## 🏗️ System Architecture

### Frontend Architecture
```
src/
├── components/
│   ├── auth/           # Authentication system
│   ├── booking/        # Multi-step booking forms
│   ├── dashboard/      # Role-based dashboards
│   ├── calendar/       # Calendar integration
│   ├── maps/           # Google Maps features
│   └── ui/            # Reusable components
├── hooks/              # Custom React hooks
├── lib/                # API services & utilities
└── types/              # TypeScript definitions
```

### Backend Architecture
```
backend/
├── routes/             # API endpoints
│   ├── auth.js        # Authentication
│   ├── bookings.js    # Booking management
│   ├── users.js       # User management
│   └── notifications.js # Email system
├── middleware/         # Security & validation
├── config/            # Database configs
├── scripts/           # Migration & seeding
└── server.js          # Express application
```

## 🎯 Core Workflows

### 1. Booking Submission (Agent)
```
Agent Login → Submit Booking Form → Priority Calculation → Manager Queue
```

### 2. Booking Approval (Manager)  
```
Review Pending → Route Optimization → Approve/Decline → Schedule Assignment
```

### 3. Schedule Management (Videographer)
```
View Schedule → Update Status → Complete Booking → Analytics Update
```

## 📊 System Specifications

### Capacity
- **50+ Real Estate Agents** 
- **1 Videographer**
- **Multiple Managers/Admins**
- **Unlimited Bookings**

### Performance
- Sub-second API response times
- Optimized bundle size (580KB)
- Efficient database queries
- CDN-ready static assets

### Security
- JWT authentication
- Password hashing (bcrypt)
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention

## 🚨 Support & Maintenance

### Monitoring
```bash
pm2 status                    # Process health
pm2 logs videography-backend  # Application logs
curl /api/health             # Health check
```

### Common Issues
1. **Database Connection**: Check credentials in .env
2. **CORS Errors**: Verify CORS_ORIGIN setting  
3. **Auth Issues**: Check JWT_SECRET configuration
4. **Email Failures**: Verify SMTP settings

---

## 📈 Project Status

✅ **PRODUCTION READY** - Deployed and tested for 50+ user capacity  
🎯 **Wednesday Delivery** - Fully functional system ready for immediate use  
🔒 **Enterprise Security** - Production-grade security and authentication  
📱 **Mobile Optimized** - Responsive design for all devices  
🚀 **Scalable Architecture** - Built to handle growth and expansion  

---

*VideoPro v1.0 - Complete Real Estate Videography Booking Solution*