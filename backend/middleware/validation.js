const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('role')
    .isIn(['agent', 'manager', 'videographer', 'admin', 'executive'])
    .withMessage('Invalid role specified'),
  handleValidationErrors
];

const bookingValidation = [
  body('shoot_category')
    .isIn(['property', 'personal', 'company_event', 'marketing_content', 'special_project'])
    .withMessage('Invalid shoot category'),
  body('location')
    .isLength({ min: 5, max: 500 })
    .withMessage('Location must be between 5 and 500 characters'),
  body('preferred_date')
    .isISO8601()
    .withMessage('Please provide a valid preferred date'),
  body('backup_dates')
    .optional()
    .isArray({ min: 0, max: 3 })
    .withMessage('Maximum 3 backup dates allowed'),
  body('special_requirements')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Special requirements cannot exceed 1000 characters'),
  handleValidationErrors
];

const passwordResetValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

const passwordChangeValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

module.exports = {
  loginValidation,
  registerValidation,
  bookingValidation,
  passwordResetValidation,
  passwordChangeValidation,
  handleValidationErrors
};