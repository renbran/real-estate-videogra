const nodemailer = require('nodemailer');
const { pool } = require('../config/database');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/email.log' })
  ]
});

// Create email transporter
const createTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Development mode - use Ethereal email
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.pass'
    }
  });
};

// Send booking confirmation email
async function sendBookingConfirmation(booking, agent) {
  try {
    const transporter = createTransporter();
    
    // Get company branding
    const brandingResult = await pool.query(`
      SELECT * FROM company_branding 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const branding = brandingResult.rows[0] || {
      company_name: 'VideoPro',
      primary_color: '#1e40af'
    };
    
    const emailContent = await generateBookingConfirmationEmail(booking, agent, branding);
    
    const mailOptions = {
      from: `${branding.company_name} <${process.env.SMTP_FROM || 'noreply@videoproBookings.com'}>`,
      to: agent.email,
      subject: `Booking Confirmation - ${booking.booking_number}`,
      html: emailContent,
      priority: 'normal'
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    // Log email sent
    await pool.query(`
      INSERT INTO notifications (booking_id, user_id, type, title, message, email_sent, email_sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `, [
      booking.id,
      agent.id,
      'email_confirmation',
      'Booking Confirmation Sent',
      `Confirmation email sent for booking ${booking.booking_number}`,
      true
    ]);
    
    logger.info(`Confirmation email sent successfully`, {
      bookingId: booking.id,
      recipient: agent.email,
      messageId: result.messageId
    });
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    logger.error('Failed to send confirmation email:', error);
    throw error;
  }
}

// Send booking approval email
async function sendBookingApproval(booking, agent, videographer) {
  try {
    const transporter = createTransporter();
    
    const brandingResult = await pool.query(`
      SELECT * FROM company_branding 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const branding = brandingResult.rows[0] || {
      company_name: 'VideoPro',
      primary_color: '#1e40af'
    };
    
    const emailContent = await generateBookingApprovalEmail(booking, agent, videographer, branding);
    
    const mailOptions = {
      from: `${branding.company_name} <${process.env.SMTP_FROM || 'noreply@videoproBookings.com'}>`,
      to: agent.email,
      cc: videographer ? videographer.email : null,
      subject: `Booking Approved - ${booking.booking_number}`,
      html: emailContent,
      priority: 'high'
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    // Log email sent
    await pool.query(`
      INSERT INTO notifications (booking_id, user_id, type, title, message, email_sent, email_sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `, [
      booking.id,
      agent.id,
      'email_approval',
      'Booking Approval Sent',
      `Approval email sent for booking ${booking.booking_number}`,
      true
    ]);
    
    logger.info(`Approval email sent successfully`, {
      bookingId: booking.id,
      recipient: agent.email,
      messageId: result.messageId
    });
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    logger.error('Failed to send approval email:', error);
    throw error;
  }
}

// Send daily booking reminders
async function sendBookingReminders() {
  try {
    // Get bookings scheduled for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    const bookingsResult = await pool.query(`
      SELECT b.*, a.name as agent_name, a.email as agent_email,
             v.name as videographer_name, v.email as videographer_email
      FROM bookings b
      JOIN users a ON b.agent_id = a.id
      LEFT JOIN resources r ON b.resource_id = r.id
      LEFT JOIN users v ON r.user_id = v.id
      WHERE b.scheduled_date = $1 
        AND b.status = 'approved'
        AND a.is_active = true
    `, [tomorrowDate]);
    
    if (bookingsResult.rows.length === 0) {
      logger.info('No bookings scheduled for tomorrow - no reminders to send');
      return { success: true, remindersSent: 0 };
    }
    
    const transporter = createTransporter();
    const brandingResult = await pool.query(`
      SELECT * FROM company_branding 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const branding = brandingResult.rows[0] || {
      company_name: 'VideoPro',
      primary_color: '#1e40af'
    };
    
    let remindersSent = 0;\n    \n    for (const booking of bookingsResult.rows) {\n      try {\n        const emailContent = await generateBookingReminderEmail(booking, branding);\n        \n        const mailOptions = {\n          from: `${branding.company_name} <${process.env.SMTP_FROM || 'noreply@videoproBookings.com'}>`,\n          to: booking.agent_email,\n          bcc: booking.videographer_email || null,\n          subject: `Reminder: Videography Session Tomorrow - ${booking.booking_number}`,\n          html: emailContent,\n          priority: 'high'\n        };\n        \n        const result = await transporter.sendMail(mailOptions);\n        \n        // Log reminder sent\n        await pool.query(`\n          INSERT INTO notifications (booking_id, user_id, type, title, message, email_sent, email_sent_at)\n          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)\n        `, [\n          booking.id,\n          booking.agent_id,\n          'email_reminder',\n          'Booking Reminder Sent',\n          `Reminder email sent for tomorrow's booking ${booking.booking_number}`,\n          true\n        ]);\n        \n        remindersSent++;\n        logger.info(`Reminder email sent for booking ${booking.booking_number}`);\n        \n        // Add small delay between emails to avoid overwhelming SMTP server\n        await new Promise(resolve => setTimeout(resolve, 1000));\n        \n      } catch (error) {\n        logger.error(`Failed to send reminder for booking ${booking.booking_number}:`, error);\n      }\n    }\n    \n    logger.info(`Daily reminder process completed - ${remindersSent} reminders sent`);\n    return { success: true, remindersSent };\n    \n  } catch (error) {\n    logger.error('Failed to send daily reminders:', error);\n    throw error;\n  }\n}\n\n// Send welcome email for new users\nasync function sendWelcomeEmail(user) {\n  try {\n    const transporter = createTransporter();\n    \n    const brandingResult = await pool.query(`\n      SELECT * FROM company_branding \n      ORDER BY created_at DESC \n      LIMIT 1\n    `);\n    \n    const branding = brandingResult.rows[0] || {\n      company_name: 'VideoPro',\n      primary_color: '#1e40af'\n    };\n    \n    const emailContent = await generateWelcomeEmail(user, branding);\n    \n    const mailOptions = {\n      from: `${branding.company_name} <${process.env.SMTP_FROM || 'noreply@videoproBookings.com'}>`,\n      to: user.email,\n      subject: `Welcome to ${branding.company_name}!`,\n      html: emailContent,\n      priority: 'normal'\n    };\n    \n    const result = await transporter.sendMail(mailOptions);\n    \n    logger.info(`Welcome email sent successfully`, {\n      userId: user.id,\n      recipient: user.email,\n      messageId: result.messageId\n    });\n    \n    return { success: true, messageId: result.messageId };\n    \n  } catch (error) {\n    logger.error('Failed to send welcome email:', error);\n    throw error;\n  }\n}\n\n// Email template generators\nasync function generateBookingConfirmationEmail(booking, agent, branding) {\n  return `\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        .email-container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }\n        .header { background: ${branding.primary_color}; color: white; padding: 30px 20px; text-align: center; }\n        .logo { max-height: 60px; margin-bottom: 15px; }\n        .content { padding: 30px 20px; background: #ffffff; }\n        .booking-card { background: #f8fafc; border-left: 4px solid ${branding.primary_color}; padding: 20px; margin: 20px 0; }\n        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }\n        .button { background: ${branding.secondary_color || '#f97316'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; }\n        .status-badge { background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }\n      </style>\n    </head>\n    <body>\n      <div class=\"email-container\">\n        <div class=\"header\">\n          ${branding.logo_url ? `<img src=\"${branding.logo_url}\" alt=\"${branding.company_name}\" class=\"logo\">` : ''}\n          <h1>${branding.company_name}</h1>\n          <p style=\"margin: 0; opacity: 0.9;\">Professional Videography Services</p>\n        </div>\n        <div class=\"content\">\n          <h2>🎬 Booking Confirmation</h2>\n          <p>Dear ${agent.name},</p>\n          <p>Thank you for your booking request. We've received your submission and our team is reviewing it.</p>\n          \n          <div class=\"booking-card\">\n            <h3 style=\"margin-top: 0; color: ${branding.primary_color};\">Booking Details</h3>\n            <table style=\"width: 100%; border-collapse: collapse;\">\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Booking Number:</td><td>${booking.booking_number}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Category:</td><td style=\"text-transform: capitalize;\">${booking.shoot_category}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Location:</td><td>${booking.location}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Preferred Date:</td><td>${new Date(booking.preferred_date).toLocaleDateString()}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Status:</td><td><span class=\"status-badge\">Pending Review</span></td></tr>\n            </table>\n          </div>\n          \n          <p><strong>What happens next?</strong></p>\n          <ul>\n            <li>Our team will review your request within 24 hours</li>\n            <li>You'll receive an email notification once approved</li>\n            <li>A videographer will be assigned to your booking</li>\n            <li>You'll get calendar invites and reminders</li>\n          </ul>\n          \n          <p>If you have any questions, please don't hesitate to contact our support team.</p>\n        </div>\n        <div class=\"footer\">\n          <p>&copy; ${new Date().getFullYear()} ${branding.company_name}. All rights reserved.</p>\n          <p>This is an automated message. Please do not reply to this email.</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  `;\n}\n\nasync function generateBookingApprovalEmail(booking, agent, videographer, branding) {\n  return `\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        .email-container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }\n        .header { background: ${branding.primary_color}; color: white; padding: 30px 20px; text-align: center; }\n        .content { padding: 30px 20px; background: #ffffff; }\n        .approved-badge { background: linear-gradient(135deg, #10b981, #065f46); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }\n        .booking-details { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }\n        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }\n        .important-info { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }\n      </style>\n    </head>\n    <body>\n      <div class=\"email-container\">\n        <div class=\"header\">\n          ${branding.logo_url ? `<img src=\"${branding.logo_url}\" alt=\"${branding.company_name}\" style=\"max-height: 60px; margin-bottom: 15px;\">` : ''}\n          <h1>${branding.company_name}</h1>\n        </div>\n        <div class=\"content\">\n          <div class=\"approved-badge\">\n            <h2 style=\"margin: 0; font-size: 24px;\">✅ Booking Approved!</h2>\n            <p style=\"margin: 10px 0 0 0; opacity: 0.9;\">Your videography session has been scheduled</p>\n          </div>\n          \n          <p>Dear ${agent.name},</p>\n          <p>Excellent news! Your booking request has been approved and scheduled. Here are your confirmed details:</p>\n          \n          <div class=\"booking-details\">\n            <h3 style=\"margin-top: 0; color: #0ea5e9;\">📅 Scheduled Session Details</h3>\n            <table style=\"width: 100%; border-collapse: collapse;\">\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Date:</td><td>${new Date(booking.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Time:</td><td>${booking.scheduled_time || 'TBD'}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Duration:</td><td>${booking.estimated_duration ? `${booking.estimated_duration} minutes` : '2 hours (estimated)'}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Videographer:</td><td>${videographer ? videographer.name : 'To be assigned'}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Location:</td><td>${booking.location}</td></tr>\n            </table>\n          </div>\n          \n          ${booking.special_requirements ? `\n          <div class=\"important-info\">\n            <h4 style=\"margin-top: 0;\">📋 Special Requirements</h4>\n            <p style=\"margin-bottom: 0;\">${booking.special_requirements}</p>\n          </div>\n          ` : ''}\n          \n          <p><strong>📲 Next Steps:</strong></p>\n          <ul>\n            <li>Add this session to your calendar (invitation will follow)</li>\n            <li>Prepare any materials or access requirements</li>\n            <li>Be ready 15 minutes before the scheduled time</li>\n            <li>You'll receive a reminder email 24 hours before</li>\n          </ul>\n          \n          ${videographer ? `\n          <p><strong>🎥 Your Videographer:</strong> ${videographer.name}<br>\n          Contact: <a href=\"mailto:${videographer.email}\">${videographer.email}</a></p>\n          ` : ''}\n        </div>\n        <div class=\"footer\">\n          <p>&copy; ${new Date().getFullYear()} ${branding.company_name}. All rights reserved.</p>\n          <p>Questions? Contact support or reply to this email.</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  `;\n}\n\nasync function generateBookingReminderEmail(booking, branding) {\n  return `\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        .email-container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }\n        .header { background: ${branding.primary_color}; color: white; padding: 30px 20px; text-align: center; }\n        .content { padding: 30px 20px; background: #ffffff; }\n        .reminder-badge { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }\n        .session-info { background: #fef7ed; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }\n        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }\n        .checklist { background: #f0f9ff; border-radius: 6px; padding: 15px; margin: 15px 0; }\n      </style>\n    </head>\n    <body>\n      <div class=\"email-container\">\n        <div class=\"header\">\n          ${branding.logo_url ? `<img src=\"${branding.logo_url}\" alt=\"${branding.company_name}\" style=\"max-height: 60px; margin-bottom: 15px;\">` : ''}\n          <h1>${branding.company_name}</h1>\n        </div>\n        <div class=\"content\">\n          <div class=\"reminder-badge\">\n            <h2 style=\"margin: 0; font-size: 24px;\">🔔 Session Reminder</h2>\n            <p style=\"margin: 10px 0 0 0; opacity: 0.9;\">Your videography session is tomorrow!</p>\n          </div>\n          \n          <p>Dear ${booking.agent_name},</p>\n          <p>This is a friendly reminder about your videography session scheduled for <strong>tomorrow</strong>.</p>\n          \n          <div class=\"session-info\">\n            <h3 style=\"margin-top: 0; color: #d97706;\">🎬 Tomorrow's Session</h3>\n            <table style=\"width: 100%; border-collapse: collapse;\">\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Date:</td><td>${new Date(booking.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Time:</td><td>${booking.scheduled_time || 'TBD'}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Location:</td><td>${booking.location}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Videographer:</td><td>${booking.videographer_name || 'Team Member'}</td></tr>\n              <tr><td style=\"padding: 8px 0; font-weight: 600;\">Booking #:</td><td>${booking.booking_number}</td></tr>\n            </table>\n          </div>\n          \n          <div class=\"checklist\">\n            <h4 style=\"margin-top: 0;\">✅ Pre-Session Checklist</h4>\n            <ul style=\"margin-bottom: 0;\">\n              <li>Confirm property access and key arrangements</li>\n              <li>Ensure all lights are working and spaces are clean</li>\n              <li>Remove personal items and clutter</li>\n              <li>Be available 15 minutes before scheduled time</li>\n              <li>Have contact information readily available</li>\n            </ul>\n          </div>\n          \n          ${booking.videographer_email ? `\n          <p><strong>🎥 Videographer Contact:</strong><br>\n          ${booking.videographer_name}<br>\n          Email: <a href=\"mailto:${booking.videographer_email}\">${booking.videographer_email}</a></p>\n          ` : ''}\n          \n          <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>\n        </div>\n        <div class=\"footer\">\n          <p>&copy; ${new Date().getFullYear()} ${branding.company_name}. All rights reserved.</p>\n          <p>Questions? Contact support immediately at <a href=\"mailto:support@videoproBookings.com\">support@videoproBookings.com</a></p>\n        </div>\n      </div>\n    </body>\n    </html>\n  `;\n}\n\nasync function generateWelcomeEmail(user, branding) {\n  return `\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        .email-container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }\n        .header { background: ${branding.primary_color}; color: white; padding: 30px 20px; text-align: center; }\n        .content { padding: 30px 20px; background: #ffffff; }\n        .welcome-badge { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }\n        .user-info { background: #f0f9ff; border-radius: 6px; padding: 15px; margin: 15px 0; }\n        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }\n        .feature-list { background: #fefffe; border: 1px solid #d1fae5; border-radius: 6px; padding: 15px; margin: 15px 0; }\n      </style>\n    </head>\n    <body>\n      <div class=\"email-container\">\n        <div class=\"header\">\n          ${branding.logo_url ? `<img src=\"${branding.logo_url}\" alt=\"${branding.company_name}\" style=\"max-height: 60px; margin-bottom: 15px;\">` : ''}\n          <h1>${branding.company_name}</h1>\n        </div>\n        <div class=\"content\">\n          <div class=\"welcome-badge\">\n            <h2 style=\"margin: 0; font-size: 24px;\">🎉 Welcome Aboard!</h2>\n            <p style=\"margin: 10px 0 0 0; opacity: 0.9;\">You're now part of the ${branding.company_name} family</p>\n          </div>\n          \n          <p>Dear ${user.name},</p>\n          <p>Welcome to ${branding.company_name}! We're excited to have you join our professional videography platform.</p>\n          \n          <div class=\"user-info\">\n            <h4 style=\"margin-top: 0;\">👤 Your Account Details</h4>\n            <table style=\"width: 100%; border-collapse: collapse;\">\n              <tr><td style=\"padding: 5px 0; font-weight: 600;\">Name:</td><td>${user.name}</td></tr>\n              <tr><td style=\"padding: 5px 0; font-weight: 600;\">Email:</td><td>${user.email}</td></tr>\n              <tr><td style=\"padding: 5px 0; font-weight: 600;\">Role:</td><td style=\"text-transform: capitalize;\">${user.role}</td></tr>\n              <tr><td style=\"padding: 5px 0; font-weight: 600;\">Monthly Quota:</td><td>${user.monthly_quota} bookings</td></tr>\n            </table>\n          </div>\n          \n          <div class=\"feature-list\">\n            <h4 style=\"margin-top: 0;\">🚀 What You Can Do</h4>\n            <ul>\n              <li>Book professional videography sessions instantly</li>\n              <li>Track your bookings and quota usage</li>\n              <li>Receive real-time notifications and reminders</li>\n              <li>Access performance analytics and reports</li>\n              <li>Sync with your Google Calendar</li>\n              <li>Upload and manage project files securely</li>\n            </ul>\n          </div>\n          \n          <p><strong>🏁 Getting Started:</strong></p>\n          <ol>\n            <li>Log in to your account using your email and password</li>\n            <li>Complete your profile information</li>\n            <li>Make your first booking request</li>\n            <li>Set up calendar integration (optional)</li>\n          </ol>\n          \n          <p>If you have any questions or need assistance, our support team is here to help 24/7.</p>\n        </div>\n        <div class=\"footer\">\n          <p>&copy; ${new Date().getFullYear()} ${branding.company_name}. All rights reserved.</p>\n          <p>Need help? Contact us at <a href=\"mailto:support@videoproBookings.com\">support@videoproBookings.com</a></p>\n        </div>\n      </div>\n    </body>\n    </html>\n  `;\n}\n\nmodule.exports = {\n  sendBookingConfirmation,\n  sendBookingApproval,\n  sendBookingReminders,\n  sendWelcomeEmail,\n  createTransporter\n};"