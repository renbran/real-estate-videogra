const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'branding');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for logos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Logo must be an image file (JPEG, PNG, SVG, WebP)'), false);
    }
  }
});

// Get current branding configuration
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM company_branding 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    let branding = result.rows[0];
    
    // If no branding exists, create default
    if (!branding) {
      const defaultResult = await pool.query(`
        INSERT INTO company_branding 
        (company_name, primary_color, secondary_color, accent_color)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, ['VideoPro', '#1e40af', '#f97316', '#10b981']);
      
      branding = defaultResult.rows[0];
    }
    
    res.json({
      success: true,
      data: branding
    });
    
  } catch (error) {
    console.error('Get branding config error:', error);
    res.status(500).json({ success: false, message: 'Failed to load branding configuration' });
  }
});

// Update branding configuration
router.put('/config', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const {
      companyName,
      primaryColor,
      secondaryColor,
      accentColor,
      customCss,
      emailTemplate
    } = req.body;
    
    // Validate hex colors
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return res.status(400).json({ success: false, message: 'Invalid primary color format' });
    }
    
    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return res.status(400).json({ success: false, message: 'Invalid secondary color format' });
    }
    
    if (accentColor && !hexColorRegex.test(accentColor)) {
      return res.status(400).json({ success: false, message: 'Invalid accent color format' });
    }
    
    // Check if branding config exists
    const existingResult = await pool.query('SELECT id FROM company_branding LIMIT 1');
    
    let result;
    if (existingResult.rows.length > 0) {
      // Update existing
      result = await pool.query(`
        UPDATE company_branding 
        SET company_name = COALESCE($1, company_name),
            primary_color = COALESCE($2, primary_color),
            secondary_color = COALESCE($3, secondary_color),
            accent_color = COALESCE($4, accent_color),
            custom_css = COALESCE($5, custom_css),
            email_template = COALESCE($6, email_template),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `, [
        companyName,
        primaryColor,
        secondaryColor,
        accentColor,
        customCss,
        emailTemplate,
        existingResult.rows[0].id
      ]);
    } else {
      // Create new
      result = await pool.query(`
        INSERT INTO company_branding 
        (company_name, primary_color, secondary_color, accent_color, custom_css, email_template)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        companyName || 'VideoPro',
        primaryColor || '#1e40af',
        secondaryColor || '#f97316',
        accentColor || '#10b981',
        customCss,
        emailTemplate
      ]);
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update branding config error:', error);
    res.status(500).json({ success: false, message: 'Failed to update branding configuration' });
  }
});

// Upload logo
router.post('/logo', authenticateToken, authorizeRoles('admin', 'manager'), logoUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo file provided' });
    }
    
    // Process logo - create optimized versions
    const logoPath = req.file.path;
    const logoDir = path.dirname(logoPath);
    const logoName = path.parse(req.file.filename).name;
    
    // Create different sizes
    const logoVariants = [
      { suffix: '_small', width: 100, height: 50 },
      { suffix: '_medium', width: 200, height: 100 },
      { suffix: '_large', width: 400, height: 200 }
    ];
    
    const processedLogos = [];
    
    for (const variant of logoVariants) {
      try {
        const outputPath = path.join(logoDir, `${logoName}${variant.suffix}.png`);
        
        await sharp(logoPath)
          .resize(variant.width, variant.height, {
            fit: 'inside',
            withoutEnlargement: true,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({ quality: 90 })
          .toFile(outputPath);
          
        processedLogos.push({
          size: variant.suffix.replace('_', ''),
          path: `/uploads/branding/${path.basename(outputPath)}`,
          width: variant.width,
          height: variant.height
        });
      } catch (error) {
        console.error(`Error processing logo variant ${variant.suffix}:`, error);
      }
    }
    
    // Save logo URL to database
    const logoUrl = `/uploads/branding/${req.file.filename}`;
    
    await pool.query(`
      UPDATE company_branding 
      SET logo_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM company_branding ORDER BY created_at DESC LIMIT 1)
    `, [logoUrl]);
    
    res.json({
      success: true,
      data: {
        originalLogo: logoUrl,
        processedLogos,
        filename: req.file.filename,
        size: req.file.size
      }
    });
    
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload logo' });
  }
});

// Upload favicon
router.post('/favicon', authenticateToken, authorizeRoles('admin', 'manager'), logoUpload.single('favicon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No favicon file provided' });
    }
    
    // Process favicon - create .ico format
    const faviconPath = req.file.path;
    const faviconDir = path.dirname(faviconPath);
    const faviconName = path.parse(req.file.filename).name;
    
    // Create favicon sizes
    const faviconSizes = [16, 32, 48];
    const faviconFiles = [];
    
    for (const size of faviconSizes) {
      try {
        const outputPath = path.join(faviconDir, `${faviconName}_${size}x${size}.png`);
        
        await sharp(faviconPath)
          .resize(size, size, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toFile(outputPath);
          
        faviconFiles.push({
          size: `${size}x${size}`,
          path: `/uploads/branding/${path.basename(outputPath)}`
        });
      } catch (error) {
        console.error(`Error processing favicon size ${size}:`, error);
      }
    }
    
    // Save favicon URL to database
    const faviconUrl = `/uploads/branding/${req.file.filename}`;
    
    await pool.query(`
      UPDATE company_branding 
      SET favicon_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM company_branding ORDER BY created_at DESC LIMIT 1)
    `, [faviconUrl]);
    
    res.json({
      success: true,
      data: {
        originalFavicon: faviconUrl,
        processedFavicons: faviconFiles,
        filename: req.file.filename
      }
    });
    
  } catch (error) {
    console.error('Favicon upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload favicon' });
  }
});

// Get email template with branding
router.get('/email-template/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    // Get branding configuration
    const brandingResult = await pool.query(`
      SELECT * FROM company_branding 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const branding = brandingResult.rows[0] || {
      company_name: 'VideoPro',
      primary_color: '#1e40af',
      secondary_color: '#f97316',
      logo_url: null
    };
    
    // Load email template based on type
    const templates = {
      booking_confirmation: generateBookingConfirmationTemplate(branding),
      booking_approved: generateBookingApprovedTemplate(branding),
      booking_declined: generateBookingDeclinedTemplate(branding),
      reminder: generateReminderTemplate(branding),
      welcome: generateWelcomeTemplate(branding)
    };
    
    const template = templates[type];
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    res.json({
      success: true,
      data: {
        template,
        branding,
        type
      }
    });
    
  } catch (error) {
    console.error('Get email template error:', error);
    res.status(500).json({ success: false, message: 'Failed to load email template' });
  }
});

// Generate CSS variables for frontend
router.get('/css-variables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM company_branding 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const branding = result.rows[0] || {
      primary_color: '#1e40af',
      secondary_color: '#f97316',
      accent_color: '#10b981'
    };
    
    const cssVariables = `
      :root {
        --brand-primary: ${branding.primary_color};
        --brand-secondary: ${branding.secondary_color};
        --brand-accent: ${branding.accent_color};
        --brand-primary-rgb: ${hexToRgb(branding.primary_color)};
        --brand-secondary-rgb: ${hexToRgb(branding.secondary_color)};
        --brand-accent-rgb: ${hexToRgb(branding.accent_color)};
      }
      
      ${branding.custom_css || ''}
    `;
    
    res.setHeader('Content-Type', 'text/css');
    res.send(cssVariables);
    
  } catch (error) {
    console.error('Generate CSS variables error:', error);
    res.status(500).send('/* Error loading brand variables */');
  }
});

// Helper functions
function hexToRgb(hex) {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}

function generateBookingConfirmationTemplate(branding) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: ${branding.primary_color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        .button { background: ${branding.secondary_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          ${branding.logo_url ? `<img src="${branding.logo_url}" alt="${branding.company_name}" style="max-height: 50px;">` : ''}
          <h1>${branding.company_name}</h1>
        </div>
        <div class="content">
          <h2>Booking Confirmation</h2>
          <p>Dear {{agentName}},</p>
          <p>Your booking request has been received and is being processed.</p>
          <p><strong>Booking Details:</strong></p>
          <ul>
            <li>Booking Number: {{bookingNumber}}</li>
            <li>Category: {{category}}</li>
            <li>Location: {{location}}</li>
            <li>Preferred Date: {{preferredDate}}</li>
          </ul>
          <p>You will receive an email notification once your booking is approved.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${branding.company_name}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateBookingApprovedTemplate(branding) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: ${branding.primary_color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        .approved { background: #10b981; color: white; padding: 10px; border-radius: 4px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          ${branding.logo_url ? `<img src="${branding.logo_url}" alt="${branding.company_name}" style="max-height: 50px;">` : ''}
          <h1>${branding.company_name}</h1>
        </div>
        <div class="content">
          <div class="approved">
            <h2>✅ Booking Approved!</h2>
          </div>
          <p>Dear {{agentName}},</p>
          <p>Great news! Your booking has been approved and scheduled.</p>
          <p><strong>Scheduled Details:</strong></p>
          <ul>
            <li>Date: {{scheduledDate}}</li>
            <li>Time: {{scheduledTime}}</li>
            <li>Videographer: {{videographerName}}</li>
            <li>Location: {{location}}</li>
          </ul>
          <p>Please ensure you are available and prepared for the scheduled time.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${branding.company_name}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateBookingDeclinedTemplate(branding) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: ${branding.primary_color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        .declined { background: #ef4444; color: white; padding: 10px; border-radius: 4px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          ${branding.logo_url ? `<img src="${branding.logo_url}" alt="${branding.company_name}" style="max-height: 50px;">` : ''}
          <h1>${branding.company_name}</h1>
        </div>
        <div class="content">
          <div class="declined">
            <h2>❌ Booking Declined</h2>
          </div>
          <p>Dear {{agentName}},</p>
          <p>We regret to inform you that your booking request could not be approved at this time.</p>
          <p><strong>Reason:</strong> {{declineReason}}</p>
          <p>Please contact your manager for more information or to discuss alternative arrangements.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${branding.company_name}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateReminderTemplate(branding) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: ${branding.primary_color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        .reminder { background: ${branding.secondary_color}; color: white; padding: 10px; border-radius: 4px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          ${branding.logo_url ? `<img src="${branding.logo_url}" alt="${branding.company_name}" style="max-height: 50px;">` : ''}
          <h1>${branding.company_name}</h1>
        </div>
        <div class="content">
          <div class="reminder">
            <h2>🔔 Booking Reminder</h2>
          </div>
          <p>Dear {{agentName}},</p>
          <p>This is a reminder about your upcoming videography session.</p>
          <p><strong>Tomorrow's Schedule:</strong></p>
          <ul>
            <li>Date: {{scheduledDate}}</li>
            <li>Time: {{scheduledTime}}</li>
            <li>Location: {{location}}</li>
            <li>Videographer: {{videographerName}}</li>
          </ul>
          <p>Please be ready 15 minutes before the scheduled time.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${branding.company_name}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateWelcomeTemplate(branding) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: ${branding.primary_color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        .welcome { background: ${branding.accent_color}; color: white; padding: 15px; border-radius: 4px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          ${branding.logo_url ? `<img src="${branding.logo_url}" alt="${branding.company_name}" style="max-height: 50px;">` : ''}
          <h1>${branding.company_name}</h1>
        </div>
        <div class="content">
          <div class="welcome">
            <h2>🎉 Welcome to ${branding.company_name}!</h2>
          </div>
          <p>Dear {{userName}},</p>
          <p>Welcome to our professional videography booking platform!</p>
          <p>Your account has been created with the following details:</p>
          <ul>
            <li>Role: {{userRole}}</li>
            <li>Email: {{userEmail}}</li>
            <li>Monthly Quota: {{monthlyQuota}} bookings</li>
          </ul>
          <p>You can now log in and start booking professional videography services.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${branding.company_name}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;