const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const winston = require('winston');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

// Use SQLite for development if no PostgreSQL is configured
const usePostgres = process.env.DATABASE_URL || process.env.DB_HOST;
console.log(`🗄️  Database: ${usePostgres ? 'PostgreSQL' : 'SQLite (Development)'}`);

if (!usePostgres) {
  // Initialize SQLite database
  const { createTables, seedData } = require('./scripts/migrate-sqlite');
  
  // Run migration on startup for development
  setTimeout(async () => {
    try {
      await createTables();
      await seedData();
      console.log('🎉 Development database ready!');
    } catch (error) {
      console.error('❌ Database setup failed:', error);
    }
  }, 1000);
}

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookingRoutes = require('./routes/bookings');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const filesRoutes = require('./routes/files');
const brandingRoutes = require('./routes/branding');
const calendarRoutes = require('./routes/calendar');
const mapsRoutes = require('./routes/maps');

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
  defaultMeta: { service: 'videoproBackend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Compression middleware for better performance
app.use(compression());

// Security Middleware with enhanced configuration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.LOGIN_RATE_LIMIT_MAX || 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '50mb' })); // Increased for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (uploads, branding assets)
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Enhanced Health Check
app.get('/health', async (req, res) => {
  try {
    const { pool } = usePostgres 
      ? require('./config/database') 
      : { pool: null };
      
    let dbStatus = 'unknown';
    let dbLatency = null;
    
    if (pool) {
      const start = Date.now();
      try {
        await pool.query('SELECT 1');
        dbLatency = Date.now() - start;
        dbStatus = 'connected';
      } catch (error) {
        dbStatus = 'disconnected';
        logger.error('Database health check failed:', error);
      }
    } else {
      dbStatus = 'sqlite';
    }
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        latency: dbLatency ? `${dbLatency}ms` : null
      },
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      },
      services: {
        googleMaps: process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'missing',
        email: process.env.SMTP_HOST ? 'configured' : 'missing'
      }
    };
    
    res.status(200).json(healthCheck);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/maps', mapsRoutes);

// Real-time WebSocket connections
io.on('connection', (socket) => {
  logger.info('User connected to WebSocket:', socket.id);
  
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined room`);
  });
  
  socket.on('disconnect', () => {
    logger.info('User disconnected from WebSocket:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Enhanced Global Error Handler
app.use((error, req, res, next) => {
  logger.error('Application Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false,
      error: 'Validation Error', 
      details: error.message 
    });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid token' 
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false,
      error: 'Token expired' 
    });
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large'
    });
  }
  
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Service unavailable'
    });
  }
  
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    requestId: req.id || 'unknown'
  });
});

// Setup automated tasks
setupAutomatedTasks();

// Graceful shutdown handling
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
  logger.info(`🚀 VideoPro Backend Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📊 Real-time updates enabled via WebSocket`);
  console.log(`🚀 VideoPro Backend Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Automated tasks function
function setupAutomatedTasks() {
  // Daily backup at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting automated daily backup');
    try {
      if (usePostgres) {
        const { exec } = require('child_process');
        const backupPath = `./backups/backup-${new Date().toISOString().split('T')[0]}.sql`;
        
        exec(`pg_dump ${process.env.DATABASE_URL} > ${backupPath}`, (error, stdout, stderr) => {
          if (error) {
            logger.error('Backup failed:', error);
          } else {
            logger.info(`Backup completed: ${backupPath}`);
          }
        });
      }
    } catch (error) {
      logger.error('Automated backup error:', error);
    }
  });
  
  // Send daily reminder emails at 8 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('Sending daily booking reminders');
    try {
      const { sendBookingReminders } = require('./utils/emailService');
      await sendBookingReminders();
    } catch (error) {
      logger.error('Reminder email error:', error);
    }
  });
  
  // Generate route optimizations every hour during business hours
  cron.schedule('0 9-17 * * 1-5', async () => {
    logger.info('Generating route optimizations');
    try {
      const { generateDailyOptimizations } = require('./utils/routeOptimizer');
      await generateDailyOptimizations();
    } catch (error) {
      logger.error('Route optimization error:', error);
    }
  });
  
  // Clean up old files monthly
  cron.schedule('0 3 1 * *', async () => {
    logger.info('Starting monthly file cleanup');
    try {
      const { cleanupOldFiles } = require('./utils/fileCleanup');
      await cleanupOldFiles();
    } catch (error) {
      logger.error('File cleanup error:', error);
    }
  });
  
  logger.info('Automated tasks scheduled successfully');
}

module.exports = app;