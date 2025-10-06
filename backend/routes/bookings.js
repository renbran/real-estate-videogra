const express = require('express');
const { query, withTransaction } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { bookingValidation } = require('../middleware/validation');

const router = express.Router();

// Generate unique booking number
const generateBookingNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `VB-${date}-${random}`;
};

// Calculate priority score (moved from frontend)
const calculatePriorityScore = (booking, agent) => {
  let score = 0;
  
  // Base score for advance notice (10 points max)
  if (booking.preferred_date) {
    const daysInAdvance = Math.floor(
      (new Date(booking.preferred_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    score += Math.min(daysInAdvance >= 7 ? 10 : daysInAdvance * 1.4, 10);
  }
  
  // Agent tier bonus
  if (agent.tier === 'elite') score += 15;
  else if (agent.tier === 'premium') score += 10;
  else score += 5;
  
  // Property value bonus
  const propertyValuePoints = {
    'under_500k': 5,
    '500k_1m': 10,
    '1m_2m': 20,
    'over_2m': 25
  };
  if (booking.property_value) {
    score += propertyValuePoints[booking.property_value] || 0;
  }
  
  // Shoot complexity bonus
  const complexityPoints = {
    'quick': 0,
    'standard': 5,
    'complex': 10
  };
  if (booking.shoot_complexity) {
    score += complexityPoints[booking.shoot_complexity] || 0;
  }
  
  // Flexibility bonus
  if (booking.is_flexible) score += 5;
  
  // Urgency penalty (rush jobs get lower priority unless justified)
  if (booking.urgency_level === 'rush') score -= 10;
  else if (booking.urgency_level === 'priority') score -= 5;
  
  return Math.round(Math.max(0, Math.min(100, score)));
};

// GET /api/bookings - Get all bookings (with filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, agent_id, date_from, date_to, category, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 0;
    
    // Filter by status
    if (status) {
      paramCount++;
      whereClause += ` AND b.status = $${paramCount}`;
      params.push(status);
    }
    
    // Filter by agent (agents can only see their own, others see all)
    if (req.user.role === 'agent') {
      paramCount++;
      whereClause += ` AND b.agent_id = $${paramCount}`;
      params.push(req.user.id);
    } else if (agent_id) {
      paramCount++;
      whereClause += ` AND b.agent_id = $${paramCount}`;
      params.push(agent_id);
    }
    
    // Filter by date range
    if (date_from) {
      paramCount++;
      whereClause += ` AND b.preferred_date >= $${paramCount}`;
      params.push(date_from);
    }
    
    if (date_to) {
      paramCount++;
      whereClause += ` AND b.preferred_date <= $${paramCount}`;
      params.push(date_to);
    }
    
    // Filter by category
    if (category) {
      paramCount++;
      whereClause += ` AND b.shoot_category = $${paramCount}`;
      params.push(category);
    }
    
    // Add pagination
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;
    whereClause += ` ORDER BY b.created_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`;
    params.push(limit, offset);
    
    const bookingsQuery = `
      SELECT 
        b.*,
        u.name as agent_name,
        u.email as agent_email,
        u.tier as agent_tier,
        r.name as resource_name
      FROM bookings b
      LEFT JOIN users u ON b.agent_id = u.id
      LEFT JOIN resources r ON b.resource_id = r.id
      ${whereClause}
    `;
    
    const result = await query(bookingsQuery, params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      ${whereClause.replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '')}
    `;
    const countResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset
    
    res.json({
      bookings: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    let whereClause = 'WHERE b.id = $1';
    let params = [id];
    
    // Agents can only see their own bookings
    if (req.user.role === 'agent') {
      whereClause += ' AND b.agent_id = $2';
      params.push(req.user.id);
    }
    
    const result = await query(`
      SELECT 
        b.*,
        u.name as agent_name,
        u.email as agent_email,
        u.tier as agent_tier,
        r.name as resource_name,
        approver.name as approved_by_name
      FROM bookings b
      LEFT JOIN users u ON b.agent_id = u.id
      LEFT JOIN resources r ON b.resource_id = r.id
      LEFT JOIN users approver ON b.approved_by = approver.id
      ${whereClause}
    `, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ booking: result.rows[0] });
    
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// POST /api/bookings - Create new booking
router.post('/', authenticateToken, authorizeRoles('agent', 'executive'), bookingValidation, async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      agent_id: req.user.id,
      booking_number: generateBookingNumber(),
      status: 'pending'
    };
    
    await withTransaction(async (client) => {
      // Get agent details for priority calculation
      const agentResult = await client.query(
        'SELECT tier, monthly_quota, monthly_used FROM users WHERE id = $1',
        [req.user.id]
      );
      
      if (agentResult.rows.length === 0) {
        throw new Error('Agent not found');
      }
      
      const agent = agentResult.rows[0];
      
      // Check monthly quota (except for executives and company events)
      if (req.user.role === 'agent' && bookingData.shoot_category !== 'company_event') {
        if (agent.monthly_used >= agent.monthly_quota) {
          return res.status(400).json({ 
            error: 'Monthly booking quota exceeded',
            quota: agent.monthly_quota,
            used: agent.monthly_used
          });
        }
      }
      
      // Calculate priority score
      const priorityScore = calculatePriorityScore(bookingData, agent);
      bookingData.priority_score = priorityScore;
      
      // Auto-approve company events from executives
      if (req.user.role === 'executive' && bookingData.shoot_category === 'company_event') {
        bookingData.status = 'approved';
        bookingData.approved_by = req.user.id;
        bookingData.approved_at = new Date();
      }
      
      // Estimate duration based on complexity
      if (!bookingData.estimated_duration) {
        const durationMap = {
          'quick': 45,
          'standard': 90,
          'complex': 180
        };
        bookingData.estimated_duration = durationMap[bookingData.shoot_complexity] || 90;
      }
      
      // Insert booking
      const insertQuery = `
        INSERT INTO bookings (
          booking_number, agent_id, shoot_category, location, formatted_address,
          place_id, latitude, longitude, geographic_zone, preferred_date, backup_dates,
          scheduled_date, scheduled_time, estimated_duration, status, priority_score,
          is_flexible, urgency_level, property_value, property_type, bedrooms,
          shoot_complexity, property_status, access_method, square_footage,
          special_features, services_needed, personal_shoot_type, personal_shoot_size,
          personal_shoot_location, personal_shoot_duration, outfit_changes,
          makeup_styling_needed, usage_type, event_name, company_event_type,
          event_start_time, event_end_time, expected_attendees, coverage_type,
          deliverables_needed, event_organizer, budget_code, project_title,
          marketing_content_type, script_status, talent_participants,
          marketing_location, production_time, post_production_complexity,
          strategic_importance, project_description, project_complexity,
          deadline_criticality, executive_sponsor_id, budget_available,
          special_requirements, delivery_timeline, file_delivery_method,
          additional_emails, internal_notes, approved_by, approved_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
          $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58,
          $59, $60, $61, $62, $63, $64, $65
        ) RETURNING *
      `;
      
      const values = [
        bookingData.booking_number,
        bookingData.agent_id,
        bookingData.shoot_category,
        bookingData.location,
        bookingData.formatted_address,
        bookingData.place_id,
        bookingData.latitude,
        bookingData.longitude,
        bookingData.geographic_zone,
        bookingData.preferred_date,
        bookingData.backup_dates,
        bookingData.scheduled_date,
        bookingData.scheduled_time,
        bookingData.estimated_duration,
        bookingData.status,
        bookingData.priority_score,
        bookingData.is_flexible,
        bookingData.urgency_level,
        bookingData.property_value,
        bookingData.property_type,
        bookingData.bedrooms,
        bookingData.shoot_complexity,
        bookingData.property_status,
        bookingData.access_method,
        bookingData.square_footage,
        bookingData.special_features,
        bookingData.services_needed,
        bookingData.personal_shoot_type,
        bookingData.personal_shoot_size,
        bookingData.personal_shoot_location,
        bookingData.personal_shoot_duration,
        bookingData.outfit_changes,
        bookingData.makeup_styling_needed,
        bookingData.usage_type,
        bookingData.event_name,
        bookingData.company_event_type,
        bookingData.event_start_time,
        bookingData.event_end_time,
        bookingData.expected_attendees,
        bookingData.coverage_type,
        bookingData.deliverables_needed,
        bookingData.event_organizer,
        bookingData.budget_code,
        bookingData.project_title,
        bookingData.marketing_content_type,
        bookingData.script_status,
        bookingData.talent_participants,
        bookingData.marketing_location,
        bookingData.production_time,
        bookingData.post_production_complexity,
        bookingData.strategic_importance,
        bookingData.project_description,
        bookingData.project_complexity,
        bookingData.deadline_criticality,
        bookingData.executive_sponsor_id,
        bookingData.budget_available,
        bookingData.special_requirements,
        bookingData.delivery_timeline,
        bookingData.file_delivery_method,
        bookingData.additional_emails,
        bookingData.internal_notes,
        bookingData.approved_by,
        bookingData.approved_at
      ];
      
      const bookingResult = await client.query(insertQuery, values);
      const newBooking = bookingResult.rows[0];
      
      // Update agent's monthly usage if it's a regular booking
      if (req.user.role === 'agent' && bookingData.shoot_category !== 'company_event') {
        await client.query(
          'UPDATE users SET monthly_used = monthly_used + 1 WHERE id = $1',
          [req.user.id]
        );
      }
      
      // Create audit log
      await client.query(`
        INSERT INTO booking_audit (booking_id, action, new_values, changed_by, notes)
        VALUES ($1, 'created', $2, $3, 'Booking created')
      `, [newBooking.id, JSON.stringify(newBooking), req.user.id]);
      
      res.status(201).json({
        message: 'Booking created successfully',
        booking: newBooking,
        priorityScore: priorityScore,
        autoApproved: bookingData.status === 'approved'
      });
    });
    
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    await withTransaction(async (client) => {
      // Get current booking
      let whereClause = 'WHERE id = $1';
      let params = [id];
      
      // Agents can only update their own bookings
      if (req.user.role === 'agent') {
        whereClause += ' AND agent_id = $2';
        params.push(req.user.id);
      }
      
      const currentResult = await client.query(
        `SELECT * FROM bookings ${whereClause}`,
        params
      );
      
      if (currentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found or access denied' });
      }
      
      const currentBooking = currentResult.rows[0];
      
      // Agents can't update approved/completed bookings
      if (req.user.role === 'agent' && ['approved', 'completed'].includes(currentBooking.status)) {
        return res.status(403).json({ error: 'Cannot modify approved or completed bookings' });
      }
      
      // Build update query dynamically
      const allowedFields = [
        'location', 'formatted_address', 'place_id', 'latitude', 'longitude',
        'preferred_date', 'backup_dates', 'special_requirements', 'property_value',
        'shoot_complexity', 'property_status', 'internal_notes'
      ];
      
      // Managers can update additional fields
      if (['manager', 'admin'].includes(req.user.role)) {
        allowedFields.push(
          'status', 'scheduled_date', 'scheduled_time', 'resource_id',
          'manager_notes', 'priority_score'
        );
      }
      
      // Videographers can update specific fields
      if (req.user.role === 'videographer') {
        allowedFields.push('videographer_notes', 'actual_duration', 'completion_notes');
      }
      
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
      
      // Add approval fields if status is being changed to approved
      if (updateData.status === 'approved' && currentBooking.status !== 'approved') {
        updateFields.push(`approved_by = $${paramIndex}`);
        updateValues.push(req.user.id);
        paramIndex++;
        
        updateFields.push(`approved_at = CURRENT_TIMESTAMP`);
      }
      
      // Add completion timestamp if status is being changed to completed
      if (updateData.status === 'completed' && currentBooking.status !== 'completed') {
        updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
      }
      
      updateValues.push(id);
      const updateQuery = `
        UPDATE bookings 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, updateValues);
      const updatedBooking = result.rows[0];
      
      // Create audit log
      await client.query(`
        INSERT INTO booking_audit (booking_id, action, old_values, new_values, changed_by)
        VALUES ($1, 'updated', $2, $3, $4)
      `, [
        id,
        JSON.stringify(currentBooking),
        JSON.stringify(updatedBooking),
        req.user.id
      ]);
      
      res.json({
        message: 'Booking updated successfully',
        booking: updatedBooking
      });
    });
    
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// DELETE /api/bookings/:id - Soft delete booking
router.delete('/:id', authenticateToken, authorizeRoles('agent', 'manager', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await withTransaction(async (client) => {
      let whereClause = 'WHERE id = $1';
      let params = [id];
      
      // Agents can only delete their own pending bookings
      if (req.user.role === 'agent') {
        whereClause += ' AND agent_id = $2 AND status = $3';
        params.push(req.user.id, 'pending');
      }
      
      const result = await client.query(
        `UPDATE bookings SET status = 'cancelled' ${whereClause} RETURNING *`,
        params
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found or cannot be cancelled' });
      }
      
      const cancelledBooking = result.rows[0];
      
      // Refund quota if it was an agent booking
      if (cancelledBooking.agent_id && cancelledBooking.shoot_category !== 'company_event') {
        await client.query(
          'UPDATE users SET monthly_used = GREATEST(0, monthly_used - 1) WHERE id = $1',
          [cancelledBooking.agent_id]
        );
      }
      
      // Create audit log
      await client.query(`
        INSERT INTO booking_audit (booking_id, action, old_values, changed_by, notes)
        VALUES ($1, 'cancelled', $2, $3, 'Booking cancelled')
      `, [id, JSON.stringify(cancelledBooking), req.user.id]);
      
      res.json({
        message: 'Booking cancelled successfully',
        booking: cancelledBooking
      });
    });
    
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// GET /api/bookings/:id/history - Get booking audit history
router.get('/:id/history', authenticateToken, authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        ba.*,
        u.name as changed_by_name
      FROM booking_audit ba
      LEFT JOIN users u ON ba.changed_by = u.id
      WHERE ba.booking_id = $1
      ORDER BY ba.changed_at DESC
    `, [id]);
    
    res.json({ history: result.rows });
    
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({ error: 'Failed to fetch booking history' });
  }
});

module.exports = router;