const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const winston = require('winston');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5000',
    credentials: true
  }
});
const PORT = process.env.PORT || 3001;

// Configure Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'osusVideography' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Middleware
app.use(compression());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/health', (req, res) => {
  const databaseType = process.env.DATABASE_URL 
    ? 'PostgreSQL (Production)' 
    : 'SQLite (Development)';
    
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: databaseType,
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
});

// API Routes - Load only existing routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  logger.info('✅ Auth routes loaded');
} catch (error) {
  logger.warn('⚠️  Auth routes not loaded:', error.message);
}

// Try to load other routes if they exist
const routesToLoad = [
  { path: '/api/bookings', file: './routes/bookings', name: 'Bookings' },
  { path: '/api/users', file: './routes/users', name: 'Users' },
  { path: '/api/notifications', file: './routes/notifications', name: 'Notifications' },
  { path: '/api/analytics', file: './routes/analytics', name: 'Analytics' },
  { path: '/api/files', file: './routes/files', name: 'Files' },
  { path: '/api/branding', file: './routes/branding', name: 'Branding' },
  { path: '/api/calendar', file: './routes/calendar', name: 'Calendar' },
  { path: '/api/maps', file: './routes/maps', name: 'Maps' }
];

routesToLoad.forEach(route => {
  try {
    const routeModule = require(route.file);
    app.use(route.path, routeModule);
    logger.info(`✅ ${route.name} routes loaded`);
  } catch (error) {
    logger.warn(`⚠️  ${route.name} routes not loaded: ${error.message}`);
  }
});

// WebSocket connections
io.on('connection', (socket) => {
  logger.info(`WebSocket connected: ${socket.id}`);
  
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined room`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

// Global Error Handler
app.use((error, req, res, next) => {
  logger.error('Application Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path
  });
  
  res.status(error.status || 500).json({ 
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start Server
server.listen(PORT, () => {
  logger.info(`🚀 OSUS Videography Backend Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🗄️  Database: SQLite (Development Mode)`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 API Base: http://localhost:${PORT}/api`);
  logger.info(`📊 WebSocket enabled for real-time updates`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  OSUS Properties Videography Booking System');
  console.log('  Backend API Server - v2.0.0');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`  ✅ Server: http://localhost:${PORT}`);
  console.log(`  ✅ Health: http://localhost:${PORT}/health`);
  console.log(`  ✅ API:    http://localhost:${PORT}/api`);
  console.log('');
  console.log('  📝 Demo Credentials:');
  console.log('     sarah.j@realty.com / demo123 (Agent)');
  console.log('     manager@realty.com / demo123 (Manager)');
  console.log('     admin@osusproperties.com / demo123 (Admin)');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
});

module.exports = { app, server, io };
