const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow various file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt|mp4|mov|avi|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Upload file endpoint
router.post('/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { bookingId } = req.body;
    const uploadedFiles = [];
    
    for (const file of req.files) {
      // Encrypt file if needed
      const encryptionKey = crypto.randomBytes(32).toString('hex');
      let encryptedPath = file.path;
      let isEncrypted = false;
      
      // Encrypt sensitive files (documents, videos)
      if (['.pdf', '.doc', '.docx', '.mp4', '.mov', '.avi'].includes(path.extname(file.originalname).toLowerCase())) {
        encryptedPath = await encryptFile(file.path, encryptionKey);
        isEncrypted = true;
      }
      
      // Generate thumbnail for images
      let thumbnailPath = null;
      if (file.mimetype.startsWith('image/')) {
        thumbnailPath = await generateThumbnail(file.path);
      }
      
      // Save file record to database
      const result = await pool.query(`
        INSERT INTO file_storage 
        (booking_id, user_id, filename, original_filename, file_size, 
         mime_type, file_path, is_encrypted, encryption_key)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, filename, file_size, uploaded_at
      `, [
        bookingId || null,
        req.user.id,
        file.filename,
        file.originalname,
        file.size,
        file.mimetype,
        encryptedPath,
        isEncrypted,
        isEncrypted ? encryptionKey : null
      ]);
      
      uploadedFiles.push({
        ...result.rows[0],
        originalName: file.originalname,
        mimeType: file.mimetype,
        thumbnailPath
      });
    }
    
    res.json({
      success: true,
      data: {
        files: uploadedFiles,
        totalUploaded: uploadedFiles.length
      }
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'File upload failed',
      error: error.message 
    });
  }
});

// Get user's files
router.get('/my-files', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, bookingId, fileType } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT f.*, b.booking_number
      FROM file_storage f
      LEFT JOIN bookings b ON f.booking_id = b.id
      WHERE f.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;
    
    if (bookingId) {
      query += ` AND f.booking_id = $${paramIndex}`;
      params.push(bookingId);
      paramIndex++;
    }
    
    if (fileType) {
      query += ` AND f.mime_type LIKE $${paramIndex}`;
      params.push(`${fileType}/%`);
      paramIndex++;
    }
    
    query += ` ORDER BY f.uploaded_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM file_storage WHERE user_id = $1`;
    const countParams = [req.user.id];
    if (bookingId) {
      countQuery += ` AND booking_id = $2`;
      countParams.push(bookingId);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalFiles = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        files: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalFiles,
          pages: Math.ceil(totalFiles / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve files' });
  }
});

// Download file
router.get('/download/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get file information
    const result = await pool.query(`
      SELECT * FROM file_storage 
      WHERE id = $1 AND (user_id = $2 OR $3 = ANY(ARRAY['manager', 'admin']))
    `, [fileId, req.user.id, req.user.role]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    const file = result.rows[0];
    
    // Decrypt file if encrypted
    let filePath = file.file_path;
    if (file.is_encrypted) {
      filePath = await decryptFile(file.file_path, file.encryption_key);
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }
    
    // Update download count
    await pool.query(`
      UPDATE file_storage 
      SET download_count = download_count + 1, last_accessed = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [fileId]);
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename=\"${file.original_filename}\"`);
    res.setHeader('Content-Type', file.mime_type);
    
    // Stream file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
    
    // Clean up temporary decrypted file if it was encrypted
    if (file.is_encrypted && filePath !== file.file_path) {
      fileStream.on('end', async () => {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Error cleaning up temporary file:', error);
        }
      });
    }
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ success: false, message: 'File download failed' });
  }
});

// Delete file
router.delete('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get file information
    const result = await pool.query(`
      SELECT * FROM file_storage 
      WHERE id = $1 AND (user_id = $2 OR $3 = ANY(ARRAY['manager', 'admin']))
    `, [fileId, req.user.id, req.user.role]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    const file = result.rows[0];
    
    // Delete file from disk
    try {
      await fs.unlink(file.file_path);
    } catch (error) {
      console.warn('Could not delete file from disk:', error.message);
    }
    
    // Delete from database
    await pool.query('DELETE FROM file_storage WHERE id = $1', [fileId]);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
    
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ success: false, message: 'File deletion failed' });
  }
});

// Get storage usage statistics
router.get('/storage/usage', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_file_size,
        COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as image_count,
        COUNT(CASE WHEN mime_type LIKE 'video/%' THEN 1 END) as video_count,
        COUNT(CASE WHEN mime_type LIKE 'application/%' THEN 1 END) as document_count,
        SUM(download_count) as total_downloads
      FROM file_storage 
      WHERE user_id = $1
    `, [req.user.id]);
    
    const usage = result.rows[0];
    const maxStorage = 100 * 1024 * 1024 * 1024; // 100GB in bytes
    const usagePercentage = (usage.total_size / maxStorage * 100).toFixed(2);
    
    res.json({
      success: true,
      data: {
        ...usage,
        total_size_gb: (usage.total_size / (1024 * 1024 * 1024)).toFixed(2),
        max_storage_gb: 100,
        usage_percentage: parseFloat(usagePercentage),
        remaining_gb: ((maxStorage - usage.total_size) / (1024 * 1024 * 1024)).toFixed(2)
      }
    });
    
  } catch (error) {
    console.error('Storage usage error:', error);
    res.status(500).json({ success: false, message: 'Failed to get storage usage' });
  }
});

// Helper functions
async function encryptFile(filePath, encryptionKey) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(encryptionKey, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  const input = require('fs').createReadStream(filePath);
  const encryptedPath = filePath + '.enc';
  const output = require('fs').createWriteStream(encryptedPath);
  
  return new Promise((resolve, reject) => {
    output.write(iv);
    input.pipe(cipher).pipe(output);
    
    output.on('close', () => {
      // Delete original file
      fs.unlink(filePath).catch(console.error);
      resolve(encryptedPath);
    });
    
    output.on('error', reject);
  });
}

async function decryptFile(encryptedPath, encryptionKey) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(encryptionKey, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  const input = require('fs').createReadStream(encryptedPath);
  const decryptedPath = encryptedPath.replace('.enc', '.tmp');
  const output = require('fs').createWriteStream(decryptedPath);
  
  return new Promise((resolve, reject) => {
    input.pipe(decipher).pipe(output);
    
    output.on('close', () => resolve(decryptedPath));
    output.on('error', reject);
  });
}

async function generateThumbnail(imagePath) {
  const thumbnailPath = imagePath.replace(path.extname(imagePath), '_thumb.jpg');
  
  try {
    await sharp(imagePath)
      .resize(200, 200, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return null;
  }
}

module.exports = router;