const express = require('express');
const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { registerValidation } = require('../middleware/validation');

const router = express.Router();

// GET /api/users - Get all users (admin/manager only)
router.get('/', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { role, is_active = 'true', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 0;
    
    if (role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
    }
    
    if (is_active !== 'all') {
      paramCount++;
      whereClause += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }
    
    // Add pagination
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;
    whereClause += ` ORDER BY created_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`;
    params.push(limit, offset);
    
    const result = await query(`
      SELECT 
        id, email, name, role, tier, monthly_quota, monthly_used,
        performance_score, phone, is_active, last_login, created_at
      FROM users
      ${whereClause}
    `, params);
    
    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM users
      ${whereClause.replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '')}
    `, params.slice(0, -2));
    
    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only see their own profile unless they're admin/manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await query(`
      SELECT 
        id, email, name, role, tier, monthly_quota, monthly_used,
        performance_score, phone, is_active, last_login, created_at
      FROM users
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), registerValidation, async (req, res) => {
  try {
    const { email, password, name, role, tier, phone, monthly_quota } = req.body;
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    // Set default values based on role
    let defaultQuota = monthly_quota;
    let defaultTier = tier;
    
    if (role === 'agent' && !defaultQuota) {
      defaultQuota = tier === 'elite' ? 8 : tier === 'premium' ? 4 : 2;
      defaultTier = defaultTier || 'standard';
    }
    
    const result = await query(`
      INSERT INTO users (email, password_hash, name, role, tier, monthly_quota, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, name, role, tier, monthly_quota, created_at
    `, [email, passwordHash, name, role, defaultTier, defaultQuota, phone]);
    
    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Users can only update their own profile unless they're admin
    const canUpdateUser = req.user.role === 'admin' || req.user.id === id;
    if (!canUpdateUser) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Define allowed fields based on role
    let allowedFields = ['name', 'phone'];
    
    if (req.user.role === 'admin') {
      allowedFields = allowedFields.concat([
        'role', 'tier', 'monthly_quota', 'performance_score', 'is_active'
      ]);
    } else if (req.user.role === 'manager') {
      allowedFields = allowedFields.concat(['tier', 'monthly_quota', 'performance_score']);
    }
    
    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateValues.push(id);
    const result = await query(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, name, role, tier, monthly_quota, monthly_used, 
                performance_score, phone, is_active, updated_at
    `, updateValues);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Deactivate user (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    const result = await query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, name, email',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User deactivated successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// GET /api/users/agents/stats - Get agent statistics (manager/admin only)
router.get('/agents/stats', authenticateToken, authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.tier,
        u.monthly_quota,
        u.monthly_used,
        u.performance_score,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
        AVG(CASE WHEN b.status = 'completed' THEN b.priority_score END) as avg_priority_score
      FROM users u
      LEFT JOIN bookings b ON u.id = b.agent_id
      WHERE u.role = 'agent' AND u.is_active = true
      GROUP BY u.id, u.name, u.email, u.tier, u.monthly_quota, u.monthly_used, u.performance_score
      ORDER BY u.performance_score DESC
    `);
    
    res.json({ agents: result.rows });
    
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({ error: 'Failed to fetch agent statistics' });
  }
});

// POST /api/users/:id/reset-quota - Reset monthly quota (admin only)
router.post('/:id/reset-quota', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'UPDATE users SET monthly_used = 0 WHERE id = $1 AND role = $2 RETURNING name, monthly_quota',
      [id, 'agent']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({
      message: 'Monthly quota reset successfully',
      agent: result.rows[0]
    });
    
  } catch (error) {
    console.error('Reset quota error:', error);
    res.status(500).json({ error: 'Failed to reset quota' });
  }
});

module.exports = router;