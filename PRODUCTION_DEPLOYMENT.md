# VideoPro - Real Estate Videography Booking System
# Production Deployment Guide

## 🚀 Production Deployment Checklist

### Prerequisites
- [ ] Node.js 18+ installed on production server
- [ ] PostgreSQL database set up and accessible
- [ ] Domain name configured with SSL certificate
- [ ] Email service configured (Gmail, SendGrid, etc.)

### 1. Environment Setup

#### Backend (.env.production)
```bash
# Copy the template and update with production values
cp .env.production.template .env.production
```

**CRITICAL SECURITY SETTINGS:**
- Generate secure JWT_SECRET (64+ characters)
- Use strong database passwords
- Configure proper CORS origins
- Set up email service credentials

#### Frontend (vite.config.ts)
Update the API base URL in `src/lib/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://your-backend-domain.com/api'  // Update this!
  : 'http://localhost:3001/api'
```

### 2. Database Setup

#### PostgreSQL Production Database
```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE videography_booking_prod;
CREATE USER videography_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE videography_booking_prod TO videography_user;
```

#### Run Migrations
```bash
cd backend
NODE_ENV=production node scripts/migrate.js
```

#### Seed Initial Data (Optional)
```bash
NODE_ENV=production node scripts/seed.js
```

### 3. Build and Deploy

#### Backend Deployment
```bash
cd backend
npm install --production
pm2 start server.js --name "videography-backend"
```

#### Frontend Build
```bash
npm run build
# Deploy dist/ folder to your static hosting (Netlify, Vercel, etc.)
```

### 4. Server Configuration

#### Nginx Configuration (Recommended)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Security Hardening

#### Server Security
- [ ] Enable firewall (ufw/iptables)
- [ ] Configure fail2ban
- [ ] Regular security updates
- [ ] SSL certificate (Let's Encrypt)
- [ ] Database connection encryption

#### Application Security
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Helmet.js security headers
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries)

### 6. Monitoring and Maintenance

#### Process Management
```bash
# Using PM2 for production
npm install -g pm2
pm2 start server.js --name videography-backend
pm2 startup
pm2 save
```

#### Logging
```bash
# View logs
pm2 logs videography-backend

# Log rotation
pm2 install pm2-logrotate
```

#### Database Backups
```bash
# Automated daily backups
pg_dump videography_booking_prod > backup_$(date +%Y%m%d).sql
```

### 7. Performance Optimization

#### Frontend
- [ ] CDN for static assets
- [ ] Image optimization
- [ ] Code splitting
- [ ] Browser caching headers

#### Backend
- [ ] Database indexing
- [ ] Connection pooling
- [ ] API response caching
- [ ] Gzip compression

### 8. Testing Production Setup

#### Health Checks
```bash
# Backend health
curl https://your-domain.com/api/health

# Frontend
curl https://your-domain.com

# Database connection
psql -h your-db-host -U videography_user -d videography_booking_prod -c "SELECT 1;"
```

### 9. Go-Live Checklist

- [ ] Domain DNS configured
- [ ] SSL certificate installed and valid
- [ ] Backend health check returns 200
- [ ] Frontend loads without errors
- [ ] Database migrations completed
- [ ] Email notifications working
- [ ] User authentication working
- [ ] Booking creation/approval flow tested
- [ ] Dashboard functionality verified
- [ ] Mobile responsiveness tested

### 10. Post-Deployment

#### User Setup
1. Create initial manager account via database
2. Set up agent accounts through manager dashboard
3. Configure videographer account
4. Test complete booking workflow

#### Documentation Handover
- [ ] Admin credentials documented
- [ ] API documentation provided
- [ ] User training materials prepared
- [ ] Support contact information updated

---

## 📊 System Specifications

### Users Supported
- 50+ Real Estate Agents
- 1 Videographer
- Multiple Managers/Admins

### Features
- Multi-role dashboard system
- Intelligent booking optimization
- Real-time scheduling
- Email notifications
- Calendar integration
- Mobile-responsive design

### Technical Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Authentication**: JWT with bcrypt hashing
- **Security**: Helmet.js, CORS, rate limiting
- **UI**: Tailwind CSS + shadcn/ui components

---

## 🆘 Support and Maintenance

### Common Issues
1. **Database Connection**: Check credentials and network access
2. **CORS Errors**: Verify CORS_ORIGIN in backend .env
3. **Authentication Issues**: Check JWT_SECRET and token expiration
4. **Email Failures**: Verify SMTP credentials and settings

### Maintenance Schedule
- **Daily**: Monitor logs and system health
- **Weekly**: Database performance review
- **Monthly**: Security updates and backups verification
- **Quarterly**: Performance optimization review

### Contact Information
- Technical Support: [Your Contact Info]
- Emergency Contact: [24/7 Support if applicable]
- Documentation: [Link to detailed docs]

---
*VideoPro System v1.0 - Production Ready for Wednesday Delivery*