const express = require('express');
const bcrypt = require('bcryptjs');
const { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  authenticateToken 
} = require('../middleware/auth');
const { 
  validationRules, 
  handleValidationErrors 
} = require('../middleware/validation');
const winston = require('winston');

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

// Determine if using PostgreSQL or SQLite
const usePostgres = process.env.DATABASE_URL || process.env.DB_HOST;
const db = usePostgres 
  ? require('../config/database')
  : require('../config/database-sqlite');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (with admin approval for production)
 */
router.post('/register', 
  validationRules.userRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, name, phone, role = 'agent' } = req.body;

      // Check if user already exists
      const existingUser = usePostgres
        ? await db.query('SELECT id FROM users WHERE email = $1', [email])
        : await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
              if (err) reject(err);
              else resolve(row ? { rows: [row] } : { rows: [] });
            });
          });

      if (existingUser.rows && existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'User already exists with this email'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create user
      const userId = require('uuid').v4();
      const createdAt = new Date().toISOString();

      if (usePostgres) {
        await db.query(
          `INSERT INTO users (id, email, password_hash, name, phone, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, email, password_hash, name, phone, role, createdAt, createdAt]
        );
      } else {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO users (id, email, password_hash, name, phone, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, email, password_hash, name, phone, role, createdAt, createdAt],
            (err) => err ? reject(err) : resolve()
          );
        });
      }

      logger.info(`New user registered: ${email} (${role})`);

      const user = { id: userId, email, name, role };
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: userId,
            email,
            name,
            role
          },
          token,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login',
  validationRules.userLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const result = usePostgres
        ? await db.query(
            'SELECT id, email, password_hash, name, role, tier, monthly_quota, monthly_used FROM users WHERE email = $1',
            [email]
          )
        : await new Promise((resolve, reject) => {
            db.get(
              'SELECT id, email, password_hash, name, role, tier, monthly_quota, monthly_used FROM users WHERE email = ?',
              [email],
              (err, row) => {
                if (err) reject(err);
                else resolve(row ? { rows: [row] } : { rows: [] });
              }
            );
          });

      if (!result.rows || result.rows.length === 0) {
        logger.warn(`Failed login attempt: ${email} (user not found)`);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        logger.warn(`Failed login attempt: ${email} (invalid password)`);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Update last login
      const lastLogin = new Date().toISOString();
      if (usePostgres) {
        await db.query('UPDATE users SET last_login = $1 WHERE id = $2', [lastLogin, user.id]);
      } else {
        db.run('UPDATE users SET last_login = ? WHERE id = ?', [lastLogin, user.id]);
      }

      logger.info(`User logged in: ${email} (${user.role})`);

      const userPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
        monthly_quota: user.monthly_quota,
        monthly_used: user.monthly_used
      };

      const token = generateToken(userPayload);
      const refreshToken = generateRefreshToken(userPayload);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userPayload,
          token,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    // Get current user data
    const result = usePostgres
      ? await db.query(
          'SELECT id, email, name, role, tier, monthly_quota, monthly_used FROM users WHERE id = $1',
          [decoded.id]
        )
      : await new Promise((resolve, reject) => {
          db.get(
            'SELECT id, email, name, role, tier, monthly_quota, monthly_used FROM users WHERE id = ?',
            [decoded.id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row ? { rows: [row] } : { rows: [] });
            }
          );
        });

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    const newToken = generateToken(user);

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = usePostgres
      ? await db.query(
          'SELECT id, email, name, phone, role, tier, monthly_quota, monthly_used, created_at, last_login FROM users WHERE id = $1',
          [req.user.id]
        )
      : await new Promise((resolve, reject) => {
          db.get(
            'SELECT id, email, name, phone, role, tier, monthly_quota, monthly_used, created_at, last_login FROM users WHERE id = ?',
            [req.user.id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row ? { rows: [row] } : { rows: [] });
            }
          );
        });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticateToken, (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters'
      });
    }

    // Get current password hash
    const result = usePostgres
      ? await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
      : await new Promise((resolve, reject) => {
          db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], (err, row) => {
            if (err) reject(err);
            else resolve(row ? { rows: [row] } : { rows: [] });
          });
        });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    if (usePostgres) {
      await db.query('UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3', 
        [newPasswordHash, new Date().toISOString(), req.user.id]);
    } else {
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
          [newPasswordHash, new Date().toISOString(), req.user.id],
          (err) => err ? reject(err) : resolve()
        );
      });
    }

    logger.info(`Password changed for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

module.exports = router;
