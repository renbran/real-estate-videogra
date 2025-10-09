const { body, param, query, validationResult } = require('express-validator');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', {
      path: req.path,
      errors: errors.array(),
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

// Common validation rules
const validationRules = {
  // User validation
  userRegistration: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .matches(/^[\d\s\-\+\(\)]+$/)
      .withMessage('Invalid phone number format'),
    body('role')
      .isIn(['agent', 'manager', 'videographer', 'admin'])
      .withMessage('Invalid role')
  ],

  userLogin: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .matches(/^[\d\s\-\+\(\)]+$/)
      .withMessage('Invalid phone number format'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],

  // Booking validation
  createBooking: [
    body('agent_id')
      .notEmpty()
      .isUUID()
      .withMessage('Valid agent ID is required'),
    body('shoot_category')
      .isIn(['property', 'personal', 'company_event', 'marketing', 'special_project'])
      .withMessage('Invalid shoot category'),
    body('property_address')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Address must be between 5 and 500 characters'),
    body('preferred_date')
      .isISO8601()
      .withMessage('Valid date is required')
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (date < now) {
          throw new Error('Date cannot be in the past');
        }
        return true;
      }),
    body('backup_dates')
      .optional()
      .isArray({ min: 0, max: 3 })
      .withMessage('Up to 3 backup dates allowed'),
    body('special_requirements')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Special requirements must be less than 1000 characters'),
    body('is_flexible')
      .optional()
      .isBoolean()
      .withMessage('is_flexible must be boolean'),
    body('property_value')
      .optional()
      .isIn(['under_500k', '500k_1m', '1m_2m', '2m_5m', 'over_5m'])
      .withMessage('Invalid property value range'),
    body('complexity')
      .optional()
      .isIn(['basic', 'standard', 'premium', 'luxury'])
      .withMessage('Invalid complexity level')
  ],

  updateBooking: [
    param('id')
      .isUUID()
      .withMessage('Valid booking ID is required'),
    body('status')
      .optional()
      .isIn(['pending', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled', 'declined'])
      .withMessage('Invalid status'),
    body('scheduled_date')
      .optional()
      .isISO8601()
      .withMessage('Valid scheduled date is required'),
    body('assigned_videographer_id')
      .optional()
      .isUUID()
      .withMessage('Valid videographer ID is required')
  ],

  // Query parameter validation
  paginationParams: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .toInt()
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['created_at', 'updated_at', 'scheduled_date', 'priority_score', 'status'])
      .withMessage('Invalid sort field'),
    query('order')
      .optional()
      .isIn(['ASC', 'DESC', 'asc', 'desc'])
      .withMessage('Order must be ASC or DESC')
  ],

  dateRangeParams: [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Valid start date is required'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Valid end date is required')
      .custom((value, { req }) => {
        if (req.query.start_date && new Date(value) < new Date(req.query.start_date)) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
  ],

  // ID parameter validation
  uuidParam: [
    param('id')
      .isUUID()
      .withMessage('Valid UUID is required')
  ],

  // File upload validation
  fileUpload: [
    body('file_type')
      .optional()
      .isIn(['image', 'video', 'document', 'other'])
      .withMessage('Invalid file type'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ],

  // Notification validation
  createNotification: [
    body('user_id')
      .notEmpty()
      .isUUID()
      .withMessage('Valid user ID is required'),
    body('type')
      .isIn(['email', 'sms', 'push', 'in_app'])
      .withMessage('Invalid notification type'),
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority level')
  ]
};

// Sanitization helpers
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 10000); // Limit length
  }
  return input;
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizeObject(item) : sanitizeInput(item)
      );
    } else {
      sanitized[key] = sanitizeInput(value);
    }
  }
  return sanitized;
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

module.exports = {
  handleValidationErrors,
  validationRules,
  sanitizeInput,
  sanitizeObject,
  sanitizeRequest
};
