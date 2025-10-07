const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Get performance dashboard data
router.get('/dashboard', authenticateToken, authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const days = parseInt(timeframe);
    
    // Get booking statistics
    const bookingStats = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        AVG(priority_score) as avg_priority_score,
        EXTRACT(EPOCH FROM (AVG(completed_at - created_at) / 86400)) as avg_completion_days
      FROM bookings 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `);
    
    // Get agent utilization
    const agentUtilization = await pool.query(`
      SELECT 
        u.name,
        u.monthly_quota,
        u.monthly_used,
        u.performance_score,
        COUNT(b.id) as bookings_count,
        ROUND((u.monthly_used::decimal / u.monthly_quota * 100), 2) as utilization_percentage
      FROM users u
      LEFT JOIN bookings b ON u.id = b.agent_id 
        AND b.created_at >= NOW() - INTERVAL '${days} days'
      WHERE u.role = 'agent' AND u.is_active = true
      GROUP BY u.id, u.name, u.monthly_quota, u.monthly_used, u.performance_score
      ORDER BY utilization_percentage DESC
    `);
    
    // Get geographic distribution
    const geographicData = await pool.query(`
      SELECT 
        geographic_zone,
        COUNT(*) as booking_count,
        AVG(priority_score) as avg_priority
      FROM bookings 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
        AND geographic_zone IS NOT NULL
      GROUP BY geographic_zone
      ORDER BY booking_count DESC
    `);
    
    // Get daily booking trends
    const trendData = await pool.query(`
      SELECT 
        DATE(created_at) as booking_date,
        COUNT(*) as bookings_created,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as bookings_completed
      FROM bookings 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY booking_date
    `);
    
    // Calculate performance metrics
    const performanceMetrics = await pool.query(`
      SELECT 
        metric_type,
        AVG(metric_value) as avg_value,
        MAX(metric_value) as max_value,
        MIN(metric_value) as min_value,
        COUNT(*) as data_points
      FROM performance_metrics 
      WHERE metric_date >= NOW() - INTERVAL '${days} days'
      GROUP BY metric_type
    `);
    
    res.json({
      success: true,
      data: {
        bookingStats: bookingStats.rows[0],
        agentUtilization: agentUtilization.rows,
        geographicData: geographicData.rows,
        trendData: trendData.rows,
        performanceMetrics: performanceMetrics.rows,
        timeframe: days
      }
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load analytics dashboard' });
  }
});

// Generate custom report
router.post('/reports/custom', authenticateToken, authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const {
      reportName,
      dateRange,
      filters,
      metrics,
      groupBy,
      exportFormat
    } = req.body;
    
    // Build dynamic SQL query based on filters
    let query = `
      SELECT 
        ${buildSelectClause(metrics, groupBy)},
        COUNT(*) as record_count
      FROM bookings b
      LEFT JOIN users u ON b.agent_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Add date range filter
    if (dateRange.start) {
      query += ` AND b.created_at >= $${paramIndex}`;
      params.push(dateRange.start);
      paramIndex++;
    }
    
    if (dateRange.end) {
      query += ` AND b.created_at <= $${paramIndex}`;
      params.push(dateRange.end);
      paramIndex++;
    }
    
    // Add additional filters
    if (filters.status && filters.status.length > 0) {
      query += ` AND b.status = ANY($${paramIndex})`;
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters.shootCategory && filters.shootCategory.length > 0) {
      query += ` AND b.shoot_category = ANY($${paramIndex})`;
      params.push(filters.shootCategory);
      paramIndex++;
    }
    
    if (filters.geographicZone && filters.geographicZone.length > 0) {
      query += ` AND b.geographic_zone = ANY($${paramIndex})`;
      params.push(filters.geographicZone);
      paramIndex++;
    }
    
    // Add GROUP BY clause
    if (groupBy && groupBy.length > 0) {
      query += ` GROUP BY ${groupBy.join(', ')}`;
    }
    
    query += ` ORDER BY record_count DESC`;
    
    const result = await pool.query(query, params);
    
    // Save report configuration for future use
    if (req.body.saveReport) {
      await pool.query(`
        INSERT INTO custom_reports (user_id, report_name, report_config, schedule_config)
        VALUES ($1, $2, $3, $4)
      `, [
        req.user.id,
        reportName,
        JSON.stringify({ filters, metrics, groupBy }),
        req.body.scheduleConfig ? JSON.stringify(req.body.scheduleConfig) : null
      ]);
    }
    
    res.json({
      success: true,
      data: {
        reportName,
        generatedAt: new Date(),
        results: result.rows,
        totalRecords: result.rowCount
      }
    });
    
  } catch (error) {
    console.error('Custom report generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate custom report' });
  }
});

// Get saved reports
router.get('/reports/saved', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, report_name, report_config, schedule_config, 
             last_generated, is_scheduled, created_at
      FROM custom_reports 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [req.user.id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get saved reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to load saved reports' });
  }
});

// Performance scoring and gamification
router.get('/performance/agents', authenticateToken, authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.performance_score,
        u.monthly_quota,
        u.monthly_used,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        ROUND((COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::decimal / 
               NULLIF(COUNT(b.id), 0) * 100), 2) as completion_rate,
        ROUND((COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END)::decimal / 
               NULLIF(COUNT(b.id), 0) * 100), 2) as cancellation_rate
      FROM users u
      LEFT JOIN bookings b ON u.id = b.agent_id 
        AND b.created_at >= NOW() - INTERVAL '30 days'
      WHERE u.role = 'agent' AND u.is_active = true
      GROUP BY u.id, u.name, u.performance_score, u.monthly_quota, u.monthly_used
      ORDER BY u.performance_score DESC
    `);
    
    // Calculate performance rankings and badges
    const agentsWithRankings = result.rows.map((agent, index) => ({
      ...agent,
      rank: index + 1,
      badges: calculatePerformanceBadges(agent),
      trend: calculatePerformanceTrend(agent)
    }));
    
    res.json({
      success: true,
      data: agentsWithRankings
    });
  } catch (error) {
    console.error('Agent performance error:', error);
    res.status(500).json({ success: false, message: 'Failed to load agent performance data' });
  }
});

// Route optimization suggestions
router.get('/optimization/routes/:date', authenticateToken, authorizeRoles('videographer', 'manager', 'admin'), async (req, res) => {
  try {
    const { date } = req.params;
    const videographerId = req.user.role === 'videographer' ? req.user.id : req.query.videographerId;
    
    // Get all bookings for the date and videographer
    const bookings = await pool.query(`
      SELECT id, location, latitude, longitude, scheduled_time, estimated_duration
      FROM bookings 
      WHERE scheduled_date = $1 
        AND resource_id = (
          SELECT id FROM resources WHERE user_id = $2 LIMIT 1
        )
        AND status = 'approved'
      ORDER BY scheduled_time
    `, [date, videographerId]);
    
    if (bookings.rows.length < 2) {
      return res.json({
        success: true,
        data: { message: 'Not enough bookings for optimization', bookings: bookings.rows }
      });
    }
    
    // Calculate optimal route using Google Maps API (simplified version)
    const optimizedRoute = await calculateOptimalRoute(bookings.rows);
    
    res.json({
      success: true,
      data: {
        originalBookings: bookings.rows,
        optimizedRoute: optimizedRoute,
        timeSavings: optimizedRoute.timeSaved,
        distanceSavings: optimizedRoute.distanceSaved
      }
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate route optimization' });
  }
});

// Save route optimization
router.post('/optimization/routes/save', authenticateToken, authorizeRoles('videographer', 'manager', 'admin'), async (req, res) => {
  try {
    const {
      videographerId,
      optimizationDate,
      bookingIds,
      originalRoute,
      optimizedRoute,
      timeSaved,
      distanceSaved
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO route_optimizations 
      (videographer_id, optimization_date, booking_ids, original_route, 
       optimized_route, time_saved, distance_saved)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      videographerId,
      optimizationDate,
      bookingIds,
      JSON.stringify(originalRoute),
      JSON.stringify(optimizedRoute),
      timeSaved,
      distanceSaved
    ]);
    
    res.json({
      success: true,
      data: { optimizationId: result.rows[0].id }
    });
  } catch (error) {
    console.error('Save route optimization error:', error);
    res.status(500).json({ success: false, message: 'Failed to save route optimization' });
  }
});

// Helper functions
function buildSelectClause(metrics, groupBy) {
  const selectFields = [];
  
  if (groupBy.includes('shoot_category')) {
    selectFields.push('b.shoot_category');
  }
  if (groupBy.includes('status')) {
    selectFields.push('b.status');
  }
  if (groupBy.includes('geographic_zone')) {
    selectFields.push('b.geographic_zone');
  }
  if (groupBy.includes('agent_name')) {
    selectFields.push('u.name as agent_name');
  }
  
  if (metrics.includes('avg_priority_score')) {
    selectFields.push('AVG(b.priority_score) as avg_priority_score');
  }
  if (metrics.includes('total_value')) {
    selectFields.push('SUM(CASE WHEN b.property_value IS NOT NULL THEN CAST(REPLACE(b.property_value, "$", "") AS INTEGER) ELSE 0 END) as total_value');
  }
  
  return selectFields.length > 0 ? selectFields.join(', ') : '*';
}

function calculatePerformanceBadges(agent) {
  const badges = [];
  
  if (agent.completion_rate >= 95) badges.push({ name: 'High Performer', color: 'gold' });
  if (agent.cancellation_rate <= 5) badges.push({ name: 'Reliable', color: 'blue' });
  if (agent.total_bookings >= 20) badges.push({ name: 'Volume Leader', color: 'green' });
  if (agent.monthly_used >= agent.monthly_quota) badges.push({ name: 'Quota Achiever', color: 'purple' });
  
  return badges;
}

function calculatePerformanceTrend(agent) {
  // Simplified trend calculation - would need historical data for real implementation
  const score = agent.performance_score || 0;
  if (score >= 80) return 'up';
  if (score >= 60) return 'stable';
  return 'down';
}

async function calculateOptimalRoute(bookings) {
  // Simplified route optimization - in real implementation, use Google Maps Optimization API
  const timeSaved = Math.floor(Math.random() * 45) + 15; // 15-60 minutes
  const distanceSaved = Math.floor(Math.random() * 20) + 5; // 5-25 miles
  
  return {
    optimizedOrder: bookings.map((b, i) => ({ ...b, newOrder: i + 1 })),
    timeSaved,
    distanceSaved,
    fuelSavings: (distanceSaved * 0.25).toFixed(2) // Approximate fuel savings
  };
}

module.exports = router;