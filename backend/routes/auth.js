const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, withTransaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  loginValidation, 
  registerValidation, 
  passwordResetValidation, 
  passwordChangeValidation 
} = require('../middleware/validation');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Find user by email
    const result = await query(
      'SELECT id, email, password_hash, name, role, tier, is_active FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Generate tokens
    const tokens = generateTokens(user.id);
    
    // Set token expiration based on "remember me"
    const tokenExpiry = rememberMe ? '30d' : '30m';
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );
    
    // Return user data (excluding password hash)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier
    };
    
    res.json({
      message: 'Login successful',
      user: userData,
      accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: rememberMe ? '30 days' : '30 minutes'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register (Admin only)
router.post('/register', authenticateToken, registerValidation, async (req, res) => {
  try {
    // Only admins can create new users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can create new users' });
    }
    
    const { email, password, name, role, tier, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    // Set default values based on role
    let defaultQuota = null;
    let defaultTier = tier;
    
    if (role === 'agent') {
      defaultQuota = tier === 'elite' ? 8 : tier === 'premium' ? 4 : 2;
      defaultTier = defaultTier || 'standard';
    }
    
    // Create user
    const result = await query(`
      INSERT INTO users (email, password_hash, name, role, tier, monthly_quota, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, name, role, tier, created_at
    `, [email, passwordHash, name, role, defaultTier, defaultQuota, phone]);
    
    const newUser = result.rows[0];
    
    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'User registration failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const tokens = generateTokens(decoded.userId);
    
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', passwordResetValidation, async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await query(
      'SELECT id, name FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If an account with that email exists, a reset link has been sent' });
    }
    
    const user = result.rows[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Save reset token
    await query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );
    
    // TODO: Send email with reset link
    // For now, return the token in development mode
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        message: 'Password reset token generated',
        resetToken, // Remove this in production
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      });
    }
    
    res.json({ message: 'If an account with that email exists, a reset link has been sent' });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', passwordChangeValidation, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const result = await query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > CURRENT_TIMESTAMP',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const userId = result.rows[0].id;
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    // Update password and clear reset token
    await query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, userId]
    );
    
    res.json({ message: 'Password reset successful' });
    
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, email, name, role, tier, monthly_quota, monthly_used, 
        performance_score, phone, last_login, created_at
      FROM users 
      WHERE id = $1
    `, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  // In a more advanced setup, you might blacklist the token
  res.json({ message: 'Logout successful' });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, req.user.id]
    );
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router;