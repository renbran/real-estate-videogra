# OSUS Videography Booking System - Deployment Guide

## 🚀 Production Deployment Options

### Option 1: Netlify (Recommended for Frontend)

1. **Connect Repository**
   - Connect your GitHub repository to Netlify
   - Select the `genspark_ai_developer` branch

2. **Build Settings**
   - Build command: `npm install --legacy-peer-deps && npm run build`
   - Publish directory: `dist`
   - Node version: 18.x

3. **Environment Variables**
   ```
   REACT_APP_USE_PRODUCTION_API=true
   REACT_APP_API_URL=https://your-api-domain.com/api
   REACT_APP_API_KEY=your_production_api_key
   REACT_APP_GOOGLE_MAPS_API_KEY=your_production_google_maps_key
   NODE_ENV=production
   ```

### Option 2: Vercel

1. **Import Project**
   - Import from GitHub repository
   - The `vercel.json` file will configure the deployment automatically

2. **Environment Variables**
   - Set the same environment variables as above in Vercel dashboard

### Option 3: Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t osus-videography .
   ```

2. **Run Container**
   ```bash
   docker run -p 80:80 osus-videography
   ```

### Option 4: Traditional Web Server

1. **Build the Application**
   ```bash
   npm install --legacy-peer-deps
   npm run build
   ```

2. **Upload `dist` Folder**
   - Upload the contents of the `dist` folder to your web server
   - Configure your web server to serve the `index.html` for all routes

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# API Configuration
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_API_KEY=your_production_api_key

# Google Maps
REACT_APP_GOOGLE_MAPS_API_KEY=your_production_google_maps_key

# Environment
REACT_APP_USE_PRODUCTION_API=true
NODE_ENV=production

# Optional: Database (if using direct connection)
REACT_APP_DB_HOST=your-database-host
REACT_APP_DB_NAME=osus_videography
REACT_APP_DB_USER=your-db-user
REACT_APP_DB_PASSWORD=your-db-password

# Optional: Email Service
REACT_APP_EMAIL_SERVICE_URL=https://your-email-service.com
REACT_APP_EMAIL_API_KEY=your_email_api_key

# Optional: Push Notifications
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key
```

## 🗺️ Google Maps Setup

1. **Get API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API and Places API
   - Create an API key with appropriate restrictions

2. **Configure API Key**
   - Add your domain to the HTTP referrer restrictions
   - Enable required APIs: Maps JavaScript API, Places API, Geocoding API

## 🔐 Backend API Requirements

The frontend expects a REST API with these endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user

### Bookings
- `GET /api/bookings` - List bookings (with filters)
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/approve` - Approve booking
- `POST /api/bookings/:id/decline` - Decline booking
- `DELETE /api/bookings/:id` - Delete booking

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users?role=agent` - List agents
- `GET /api/users?role=videographer` - List videographers

### Analytics (Optional)
- `GET /api/analytics` - Get analytics data

### Notifications (Optional)
- `POST /api/notifications/send` - Send notification

## 📋 Production Checklist

### Before Deployment
- [ ] Replace Google Maps API key with production key
- [ ] Configure production API endpoints
- [ ] Set up email service for notifications
- [ ] Configure push notification service (optional)
- [ ] Set up SSL certificate for HTTPS
- [ ] Configure database (if using backend)
- [ ] Set up monitoring and logging

### Security
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set secure headers
- [ ] Implement rate limiting
- [ ] Set up proper authentication
- [ ] Configure session management

### Performance
- [ ] Enable gzip compression
- [ ] Configure CDN (optional)
- [ ] Set up caching headers
- [ ] Monitor performance metrics
- [ ] Set up error tracking

## 🔍 Testing Production Build

1. **Local Testing**
   ```bash
   npm run build
   npx serve -l 3000 dist
   ```

2. **Validation Checklist**
   - [ ] All buttons are visible and clickable
   - [ ] Google Maps integration works
   - [ ] Location selection functions properly
   - [ ] Booking form submits correctly
   - [ ] Navigation works on all pages
   - [ ] Responsive design works on mobile
   - [ ] No console errors
   - [ ] All API calls work (or fallback gracefully)

## 🆘 Troubleshooting

### Common Issues

1. **"npm ci" fails**
   - Use `npm install --legacy-peer-deps` instead
   - Ensure package-lock.json is committed to repository

2. **Google Maps not loading**
   - Check API key configuration
   - Verify domain restrictions
   - Ensure required APIs are enabled

3. **Blank page after deployment**
   - Check browser console for errors
   - Verify base path configuration
   - Ensure all assets are served correctly

4. **API calls failing**
   - Check CORS configuration
   - Verify API URL and keys
   - Check network requests in browser dev tools

## 📞 Support

For deployment support, check:
1. Browser console errors
2. Network tab for failed requests
3. Environment variable configuration
4. API endpoint accessibility

The system includes fallback mechanisms for development, so most features will work even without a backend API configured.