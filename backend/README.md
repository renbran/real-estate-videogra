# VideoPro Backend API

Production-ready Node.js backend for the VideoPro videography booking system.

## Features

- 🔐 JWT-based authentication with bcrypt password hashing
- 👥 Role-based access control (Agent, Manager, Videographer, Admin, Executive)
- 📋 Complete booking management with audit trail
- 📧 Email notifications with calendar invites
- 🗄️ PostgreSQL database with proper indexing
- 🛡️ Security middleware (Helmet, CORS, Rate limiting)
- ✅ Input validation and sanitization

## Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup:**
   ```bash
   # Create PostgreSQL database
   createdb videography_booking
   
   # Run migrations and seed data
   npm run migrate
   npm run seed
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with these variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=videography_booking
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=VideoPro

# Security
BCRYPT_ROUNDS=12

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/change-password` - Change password

### Bookings
- `GET /api/bookings` - Get bookings (with filters)
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/:id/history` - Get booking audit history

### Users
- `GET /api/users` - Get all users (admin/manager only)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user (admin only)
- `GET /api/users/agents/stats` - Get agent statistics
- `POST /api/users/:id/reset-quota` - Reset monthly quota

### Notifications
- `POST /api/notifications/booking-approved` - Send approval notification
- `POST /api/notifications/booking-declined` - Send decline notification
- `POST /api/notifications/new-booking` - Send new booking notification
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

## Demo Users

After running `npm run seed`, you can login with these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@videopro.com | password123 |
| Manager | manager@videopro.com | password123 |
| Videographer | videographer@videopro.com | password123 |
| Agent (Elite) | sarah.johnson@realty.com | password123 |
| Agent (Premium) | mike.chen@realty.com | password123 |
| Agent (Standard) | lisa.rodriguez@realty.com | password123 |

## Testing

Test the API using curl or Postman:

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah.johnson@realty.com","password":"password123"}'

# Get bookings (with auth token)
curl -X GET http://localhost:3001/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Production Deployment

1. **Set environment to production:**
   ```env
   NODE_ENV=production
   ```

2. **Use environment-specific database:**
   ```env
   DB_HOST=your-production-db-host
   ```

3. **Configure email service:**
   ```env
   EMAIL_SERVICE=sendgrid
   EMAIL_API_KEY=your-production-api-key
   ```

4. **Run with PM2 (recommended):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "videopro-backend"
   ```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT tokens with expiration
- Rate limiting (100 requests per 15 minutes)
- Login rate limiting (5 attempts per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection protection
- Role-based access control

## Database Schema

The system uses PostgreSQL with the following main tables:

- `users` - User accounts with role-based access
- `bookings` - Main booking records with all category fields
- `booking_audit` - Audit trail for all booking changes
- `notifications` - In-app and email notifications
- `resources` - Available resources (videographers, equipment)
- `resource_types` - Resource type definitions
- `system_settings` - Configurable system settings

## Monitoring

- Health check endpoint: `/health`
- Database connection monitoring
- Error logging with stack traces
- Request/response logging in development mode

## Support

For issues or questions, contact the development team or check the API documentation.