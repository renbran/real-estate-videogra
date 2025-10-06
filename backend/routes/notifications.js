const express = require('express');
const nodemailer = require('nodemailer');
const { query } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Email transporter setup
const createEmailTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransporter({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_API_KEY
      }
    });
  } else if (process.env.EMAIL_SERVICE === 'smtp') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Development mode - log emails to console
  return nodemailer.createTransporter({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
};

// Generate iCal content for calendar invites
const generateICalContent = (booking, agent) => {
  const startDate = new Date(`${booking.scheduled_date}T${booking.scheduled_time || '09:00'}:00`);
  const endDate = new Date(startDate.getTime() + (booking.estimated_duration || 90) * 60000);
  
  const formatICalDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const uid = `booking-${booking.id}-${Date.now()}@videopro.com`;
  const now = new Date();
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VideoPro//Real Estate Videography Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICalDate(now)}`,
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${booking.shoot_category.replace('_', ' ').toUpperCase()} - ${booking.location}`,
    `DESCRIPTION:Booking #${booking.booking_number}\\nAgent: ${agent.name}\\nCategory: ${booking.shoot_category}\\nLocation: ${booking.location}\\nNotes: ${booking.special_requirements || 'None'}`,
    `LOCATION:${booking.location}`,
    `ORGANIZER:CN=VideoPro:MAILTO:${process.env.EMAIL_FROM}`,
    `ATTENDEE:CN=${agent.name}:MAILTO:${agent.email}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

// Email templates
const emailTemplates = {
  bookingApproved: (booking, agent) => ({
    subject: `Booking Approved - ${booking.booking_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Approved! 🎉</h2>
        <p>Hi ${agent.name},</p>
        <p>Great news! Your videography booking has been approved.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details</h3>
          <p><strong>Booking Number:</strong> ${booking.booking_number}</p>
          <p><strong>Category:</strong> ${booking.shoot_category.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Location:</strong> ${booking.location}</p>
          <p><strong>Scheduled Date:</strong> ${booking.scheduled_date}</p>
          <p><strong>Scheduled Time:</strong> ${booking.scheduled_time || 'TBD'}</p>
          <p><strong>Estimated Duration:</strong> ${booking.estimated_duration || 90} minutes</p>
        </div>
        
        ${booking.manager_notes ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>Manager Notes:</h4>
            <p>${booking.manager_notes}</p>
          </div>
        ` : ''}
        
        <p>Please ensure you arrive on time and prepared for the shoot. If you have any questions, contact the videography team.</p>
        
        <p>Best regards,<br>VideoPro Team</p>
      </div>
    `,
    text: `
Booking Approved!

Hi ${agent.name},

Your videography booking has been approved.

Booking Details:
- Booking Number: ${booking.booking_number}
- Category: ${booking.shoot_category.replace('_', ' ').toUpperCase()}
- Location: ${booking.location}
- Scheduled Date: ${booking.scheduled_date}
- Scheduled Time: ${booking.scheduled_time || 'TBD'}
- Duration: ${booking.estimated_duration || 90} minutes

${booking.manager_notes ? `Manager Notes: ${booking.manager_notes}` : ''}

Best regards,
VideoPro Team
    `
  }),
  
  bookingDeclined: (booking, agent, reason) => ({
    subject: `Booking Declined - ${booking.booking_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Booking Declined</h2>
        <p>Hi ${agent.name},</p>
        <p>Unfortunately, your videography booking request has been declined.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details</h3>
          <p><strong>Booking Number:</strong> ${booking.booking_number}</p>
          <p><strong>Category:</strong> ${booking.shoot_category.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Location:</strong> ${booking.location}</p>
          <p><strong>Requested Date:</strong> ${booking.preferred_date}</p>
        </div>
        
        ${reason ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>Reason:</h4>
            <p>${reason}</p>
          </div>
        ` : ''}
        
        <p>Please feel free to submit a new booking request with different dates or requirements.</p>
        
        <p>Best regards,<br>VideoPro Team</p>
      </div>
    `,
    text: `
Booking Declined

Hi ${agent.name},

Your videography booking request has been declined.

Booking Details:
- Booking Number: ${booking.booking_number}
- Category: ${booking.shoot_category.replace('_', ' ').toUpperCase()}
- Location: ${booking.location}
- Requested Date: ${booking.preferred_date}

${reason ? `Reason: ${reason}` : ''}

Please feel free to submit a new booking request.

Best regards,
VideoPro Team
    `
  }),
  
  newBookingNotification: (booking, agent) => ({
    subject: `New Booking Request - ${booking.booking_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Booking Request 📋</h2>
        <p>A new videography booking request has been submitted.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details</h3>
          <p><strong>Booking Number:</strong> ${booking.booking_number}</p>
          <p><strong>Agent:</strong> ${agent.name} (${agent.email})</p>
          <p><strong>Category:</strong> ${booking.shoot_category.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Location:</strong> ${booking.location}</p>
          <p><strong>Preferred Date:</strong> ${booking.preferred_date}</p>
          <p><strong>Priority Score:</strong> ${booking.priority_score}/100</p>
        </div>
        
        <p>Please review and approve/decline this booking request in the management dashboard.</p>
        
        <p>Best regards,<br>VideoPro System</p>
      </div>
    `,
    text: `
New Booking Request

A new videography booking request has been submitted.

Booking Details:
- Booking Number: ${booking.booking_number}
- Agent: ${agent.name} (${agent.email})
- Category: ${booking.shoot_category.replace('_', ' ').toUpperCase()}
- Location: ${booking.location}
- Preferred Date: ${booking.preferred_date}
- Priority Score: ${booking.priority_score}/100

Please review this booking in the management dashboard.

Best regards,
VideoPro System
    `
  })
};

// Send email notification
const sendEmail = async (to, template, attachments = []) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'VideoPro'} <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: template.subject,
      text: template.text,
      html: template.html,
      attachments: attachments
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sent (dev mode):', {
        to,
        subject: template.subject,
        messageId: result.messageId
      });
    }
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// POST /api/notifications/booking-approved
router.post('/booking-approved', authenticateToken, authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    // Get booking and agent details
    const result = await query(`
      SELECT 
        b.*,
        u.name as agent_name,
        u.email as agent_email
      FROM bookings b
      JOIN users u ON b.agent_id = u.id
      WHERE b.id = $1
    `, [bookingId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = result.rows[0];
    const agent = {
      name: booking.agent_name,
      email: booking.agent_email
    };
    
    // Generate email template
    const template = emailTemplates.bookingApproved(booking, agent);
    
    // Generate calendar invite
    let attachments = [];
    if (booking.scheduled_date && booking.scheduled_time) {
      const icalContent = generateICalContent(booking, agent);
      attachments.push({
        filename: `booking-${booking.booking_number}.ics`,
        content: icalContent,
        contentType: 'text/calendar'
      });
    }
    
    // Send email
    const emailResult = await sendEmail(agent.email, template, attachments);
    
    // Log notification
    await query(`
      INSERT INTO notifications (booking_id, user_id, type, title, message, email_sent, email_sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      bookingId,
      booking.agent_id,
      'booking_approved',
      template.subject,
      template.text,
      emailResult.success,
      emailResult.success ? new Date() : null
    ]);
    
    res.json({
      message: 'Approval notification sent successfully',
      emailSent: emailResult.success,
      error: emailResult.error
    });
    
  } catch (error) {
    console.error('Send approval notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /api/notifications/booking-declined
router.post('/booking-declined', authenticateToken, authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    
    // Get booking and agent details
    const result = await query(`
      SELECT 
        b.*,
        u.name as agent_name,
        u.email as agent_email
      FROM bookings b
      JOIN users u ON b.agent_id = u.id
      WHERE b.id = $1
    `, [bookingId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = result.rows[0];
    const agent = {
      name: booking.agent_name,
      email: booking.agent_email
    };
    
    // Generate email template
    const template = emailTemplates.bookingDeclined(booking, agent, reason);
    
    // Send email
    const emailResult = await sendEmail(agent.email, template);
    
    // Log notification
    await query(`
      INSERT INTO notifications (booking_id, user_id, type, title, message, email_sent, email_sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      bookingId,
      booking.agent_id,
      'booking_declined',
      template.subject,
      template.text,
      emailResult.success,
      emailResult.success ? new Date() : null
    ]);
    
    res.json({
      message: 'Decline notification sent successfully',
      emailSent: emailResult.success,
      error: emailResult.error
    });
    
  } catch (error) {
    console.error('Send decline notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /api/notifications/new-booking
router.post('/new-booking', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    // Get booking and agent details
    const bookingResult = await query(`
      SELECT 
        b.*,
        u.name as agent_name,
        u.email as agent_email
      FROM bookings b
      JOIN users u ON b.agent_id = u.id
      WHERE b.id = $1
    `, [bookingId]);
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    const agent = {
      name: booking.agent_name,
      email: booking.agent_email
    };
    
    // Get all managers and admins
    const managersResult = await query(`
      SELECT email FROM users 
      WHERE role IN ('manager', 'admin') AND is_active = true
    `);
    
    // Generate email template
    const template = emailTemplates.newBookingNotification(booking, agent);
    
    // Send to all managers
    const emailResults = [];
    for (const manager of managersResult.rows) {
      const emailResult = await sendEmail(manager.email, template);
      emailResults.push(emailResult);
      
      // Log notification
      await query(`
        INSERT INTO notifications (booking_id, user_id, type, title, message, email_sent, email_sent_at)
        VALUES ($1, (SELECT id FROM users WHERE email = $2), $3, $4, $5, $6, $7)
      `, [
        bookingId,
        manager.email,
        'new_booking',
        template.subject,
        template.text,
        emailResult.success,
        emailResult.success ? new Date() : null
      ]);
    }
    
    const successCount = emailResults.filter(r => r.success).length;
    
    res.json({
      message: 'New booking notifications sent',
      sent: successCount,
      total: managersResult.rows.length
    });
    
  } catch (error) {
    console.error('Send new booking notification error:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// GET /api/notifications - Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = 'false' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE user_id = $1';
    let params = [req.user.id];
    
    if (unread_only === 'true') {
      whereClause += ' AND read_at IS NULL';
    }
    
    params.push(limit, offset);
    
    const result = await query(`
      SELECT 
        n.*,
        b.booking_number,
        b.location
      FROM notifications n
      LEFT JOIN bookings b ON n.booking_id = b.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    
    res.json({ notifications: result.rows });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({
      message: 'Notification marked as read',
      notification: result.rows[0]
    });
    
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND read_at IS NULL',
      [req.user.id]
    );
    
    res.json({
      message: 'All notifications marked as read',
      count: result.rowCount
    });
    
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

module.exports = router;