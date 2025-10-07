const express = require('express');
const { google } = require('googleapis');
const ical = require('ical-generator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Google Calendar OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get Google Calendar authorization URL
router.get('/google/auth-url', authenticateToken, (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: req.user.id, // Pass user ID to identify user after callback
      prompt: 'consent' // Force consent screen to get refresh token
    });
    
    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    console.error('Google auth URL error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate authorization URL' });
  }
});

// Handle Google Calendar OAuth callback
router.post('/google/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getAccessToken(code);
    
    // Save tokens to database
    await pool.query(`
      INSERT INTO calendar_integrations 
      (user_id, provider, access_token, refresh_token, sync_enabled)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, provider) 
      DO UPDATE SET 
        access_token = $3,
        refresh_token = $4,
        sync_enabled = $5,
        updated_at = CURRENT_TIMESTAMP
    `, [
      req.user.id,
      'google',
      tokens.access_token,
      tokens.refresh_token,
      true
    ]);
    
    res.json({
      success: true,
      message: 'Google Calendar connected successfully'
    });
  } catch (error) {
    console.error('Google Calendar callback error:', error);
    res.status(500).json({ success: false, message: 'Failed to connect Google Calendar' });
  }
});

// Sync booking to Google Calendar
router.post('/sync/booking/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Get booking details
    const bookingResult = await pool.query(`
      SELECT b.*, u.name as agent_name, u.email as agent_email
      FROM bookings b
      JOIN users u ON b.agent_id = u.id
      WHERE b.id = $1
    `, [bookingId]);
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // Get user's calendar integration
    const integrationResult = await pool.query(`
      SELECT * FROM calendar_integrations 
      WHERE user_id = $1 AND provider = 'google' AND sync_enabled = true
    `, [req.user.id]);
    
    if (integrationResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Google Calendar not connected' });
    }
    
    const integration = integrationResult.rows[0];
    
    // Set up Google Calendar API with user tokens
    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token
    });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Create calendar event
    const eventStartTime = new Date(`${booking.scheduled_date}T${booking.scheduled_time || '09:00:00'}`);
    const eventEndTime = new Date(eventStartTime.getTime() + (booking.estimated_duration || 120) * 60000);
    
    const event = {
      summary: `Videography Session - ${booking.shoot_category}`,
      description: `
        Booking Number: ${booking.booking_number}
        Agent: ${booking.agent_name}
        Category: ${booking.shoot_category}
        Location: ${booking.location}
        ${booking.special_requirements ? `\\nSpecial Requirements: ${booking.special_requirements}` : ''}
      `.trim(),
      location: booking.location,
      start: {
        dateTime: eventStartTime.toISOString(),
        timeZone: integration.timezone || 'UTC'
      },
      end: {
        dateTime: eventEndTime.toISOString(),
        timeZone: integration.timezone || 'UTC'
      },
      attendees: [
        { email: booking.agent_email, displayName: booking.agent_name }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
          { method: 'popup', minutes: 15 } // 15 minutes before
        ]
      }
    };
    
    const response = await calendar.events.insert({
      calendarId: integration.calendar_id || 'primary',
      resource: event
    });
    
    // Save calendar event ID to booking
    await pool.query(`
      UPDATE bookings 
      SET internal_notes = COALESCE(internal_notes, '') || '\\nGoogle Calendar Event ID: ${response.data.id}'
      WHERE id = $1
    `, [bookingId]);
    
    res.json({
      success: true,
      data: {
        eventId: response.data.id,
        eventUrl: response.data.htmlLink,
        message: 'Booking synced to Google Calendar successfully'
      }
    });
    
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({ success: false, message: 'Failed to sync booking to calendar' });
  }
});

// Get user's calendar integrations
router.get('/integrations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, provider, sync_enabled, last_sync, timezone, created_at
      FROM calendar_integrations 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.user.id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get calendar integrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to load calendar integrations' });
  }
});

// Update calendar integration settings
router.put('/integrations/:integrationId', authenticateToken, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { syncEnabled, timezone, calendarId } = req.body;
    
    const result = await pool.query(`
      UPDATE calendar_integrations 
      SET sync_enabled = COALESCE($1, sync_enabled),
          timezone = COALESCE($2, timezone),
          calendar_id = COALESCE($3, calendar_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `, [syncEnabled, timezone, calendarId, integrationId, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Calendar integration not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update calendar integration error:', error);
    res.status(500).json({ success: false, message: 'Failed to update calendar integration' });
  }
});

// Remove calendar integration
router.delete('/integrations/:integrationId', authenticateToken, async (req, res) => {
  try {
    const { integrationId } = req.params;
    
    const result = await pool.query(`
      DELETE FROM calendar_integrations 
      WHERE id = $1 AND user_id = $2
      RETURNING provider
    `, [integrationId, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Calendar integration not found' });
    }
    
    res.json({
      success: true,
      message: `${result.rows[0].provider} calendar integration removed successfully`
    });
  } catch (error) {
    console.error('Remove calendar integration error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove calendar integration' });
  }
});

// Generate iCal feed for user's bookings
router.get('/ical/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { token } = req.query;
    
    // Verify access token (simple implementation - in production, use proper token validation)
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }
    
    // Get user's bookings for the next 3 months
    const result = await pool.query(`
      SELECT b.*, u.name as agent_name
      FROM bookings b
      JOIN users u ON b.agent_id = u.id
      WHERE (b.agent_id = $1 OR $1 IN (
        SELECT id FROM users WHERE role IN ('manager', 'admin')
      ))
      AND b.scheduled_date >= CURRENT_DATE
      AND b.scheduled_date <= CURRENT_DATE + INTERVAL '3 months'
      AND b.status = 'approved'
      ORDER BY b.scheduled_date, b.scheduled_time
    `, [userId]);
    
    const calendar = ical({ 
      domain: req.get('host'),
      name: 'VideoPro Bookings',
      description: 'Your videography booking schedule'
    });
    
    result.rows.forEach(booking => {
      const startTime = new Date(`${booking.scheduled_date}T${booking.scheduled_time || '09:00:00'}`);
      const endTime = new Date(startTime.getTime() + (booking.estimated_duration || 120) * 60000);
      
      calendar.createEvent({
        start: startTime,
        end: endTime,
        summary: `${booking.shoot_category} - ${booking.booking_number}`,
        description: `
          Agent: ${booking.agent_name}
          Location: ${booking.location}
          ${booking.special_requirements ? `Requirements: ${booking.special_requirements}` : ''}
        `.trim(),
        location: booking.location,
        uid: `booking-${booking.id}@${req.get('host')}`,
        sequence: 0,
        status: 'CONFIRMED'
      });
    });
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=\"videoproBookings.ics\"');
    res.send(calendar.toString());
    
  } catch (error) {
    console.error('iCal generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate calendar feed' });
  }
});

// Bulk sync all approved bookings to calendar
router.post('/sync/bulk', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    // Get user's approved bookings in date range
    const bookingsResult = await pool.query(`
      SELECT b.*, u.name as agent_name, u.email as agent_email
      FROM bookings b
      JOIN users u ON b.agent_id = u.id
      WHERE b.agent_id = $1 
        AND b.status = 'approved'
        AND b.scheduled_date >= $2
        AND b.scheduled_date <= $3
      ORDER BY b.scheduled_date, b.scheduled_time
    `, [req.user.id, startDate, endDate]);
    
    if (bookingsResult.rows.length === 0) {
      return res.json({
        success: true,
        message: 'No bookings to sync in the specified date range'
      });
    }
    
    // Get calendar integration
    const integrationResult = await pool.query(`
      SELECT * FROM calendar_integrations 
      WHERE user_id = $1 AND provider = 'google' AND sync_enabled = true
    `, [req.user.id]);
    
    if (integrationResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Google Calendar not connected' });
    }
    
    const integration = integrationResult.rows[0];
    
    // Set up Google Calendar API
    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token
    });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const syncResults = [];
    
    // Sync each booking
    for (const booking of bookingsResult.rows) {
      try {
        const eventStartTime = new Date(`${booking.scheduled_date}T${booking.scheduled_time || '09:00:00'}`);
        const eventEndTime = new Date(eventStartTime.getTime() + (booking.estimated_duration || 120) * 60000);
        
        const event = {
          summary: `Videography Session - ${booking.shoot_category}`,
          description: `
            Booking Number: ${booking.booking_number}
            Agent: ${booking.agent_name}
            Category: ${booking.shoot_category}
            Location: ${booking.location}
          `.trim(),
          location: booking.location,
          start: {
            dateTime: eventStartTime.toISOString(),
            timeZone: integration.timezone || 'UTC'
          },
          end: {
            dateTime: eventEndTime.toISOString(),
            timeZone: integration.timezone || 'UTC'
          },
          attendees: [
            { email: booking.agent_email, displayName: booking.agent_name }
          ]
        };
        
        const response = await calendar.events.insert({
          calendarId: integration.calendar_id || 'primary',
          resource: event
        });
        
        syncResults.push({
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          eventId: response.data.id,
          success: true
        });
        
      } catch (error) {
        console.error(`Failed to sync booking ${booking.id}:`, error);
        syncResults.push({
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          success: false,
          error: error.message
        });
      }
    }
    
    // Update last sync time
    await pool.query(`
      UPDATE calendar_integrations 
      SET last_sync = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [integration.id]);
    
    const successCount = syncResults.filter(r => r.success).length;
    const failureCount = syncResults.filter(r => !r.success).length;
    
    res.json({
      success: true,
      data: {
        syncResults,
        summary: {
          total: syncResults.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });
    
  } catch (error) {
    console.error('Bulk calendar sync error:', error);
    res.status(500).json({ success: false, message: 'Failed to perform bulk calendar sync' });
  }
});

// Set timezone for calendar integration
router.put('/timezone', authenticateToken, async (req, res) => {
  try {
    const { timezone } = req.body;
    
    // Validate timezone
    const validTimezones = Intl.supportedValuesOf('timeZone');
    if (!validTimezones.includes(timezone)) {
      return res.status(400).json({ success: false, message: 'Invalid timezone' });
    }
    
    await pool.query(`
      UPDATE calendar_integrations 
      SET timezone = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `, [timezone, req.user.id]);
    
    res.json({
      success: true,
      message: 'Timezone updated successfully'
    });
  } catch (error) {
    console.error('Update timezone error:', error);
    res.status(500).json({ success: false, message: 'Failed to update timezone' });
  }
});

module.exports = router;