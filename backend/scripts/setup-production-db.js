const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Create production SQLite setup
const setupProductionDatabase = async () => {
  console.log('🚀 Setting up production database (removing demo accounts)...');
  
  const dbPath = path.join(__dirname, '../data/videography_booking.db');
  
  // Remove existing database to start fresh
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  Removed existing demo database');
  }
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new sqlite3.Database(dbPath);
  
  try {
    console.log('🏗️  Creating production database tables...');
    
    // Create users table (production-ready)
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('agent', 'manager', 'videographer', 'admin', 'executive')),
          tier TEXT CHECK (tier IN ('standard', 'premium', 'elite')) DEFAULT 'standard',
          monthly_quota INTEGER DEFAULT 2,
          monthly_used INTEGER DEFAULT 0,
          performance_score INTEGER DEFAULT 0,
          phone TEXT,
          company TEXT,
          is_active BOOLEAN DEFAULT 1,
          email_verified BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Create bookings table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
          booking_number TEXT UNIQUE NOT NULL,
          agent_id TEXT NOT NULL,
          shoot_category TEXT NOT NULL,
          location TEXT NOT NULL,
          formatted_address TEXT,
          place_id TEXT,
          latitude REAL,
          longitude REAL,
          preferred_date DATE NOT NULL,
          backup_dates TEXT,
          scheduled_date DATE,
          scheduled_time TIME,
          estimated_duration INTEGER DEFAULT 90,
          actual_duration INTEGER,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed', 'cancelled')),
          priority_score INTEGER DEFAULT 0,
          is_flexible BOOLEAN DEFAULT 0,
          property_value TEXT,
          shoot_complexity TEXT DEFAULT 'standard',
          property_status TEXT DEFAULT 'active',
          special_requirements TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (agent_id) REFERENCES users (id)
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Create system_settings table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
          setting_key TEXT UNIQUE NOT NULL,
          setting_value TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Create password_resets table for secure password recovery
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
          email TEXT NOT NULL,
          token TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Insert only essential system settings (no demo data)
    const settings = [
      ['company_name', 'VideoPro', 'Company name'],
      ['max_bookings_per_day', '5', 'Maximum bookings per day'],
      ['session_timeout_minutes', '30', 'Session timeout in minutes'],
      ['registration_enabled', 'true', 'Allow new user registration'],
      ['email_verification_required', 'false', 'Require email verification for new accounts'],
      ['default_agent_tier', 'standard', 'Default tier for new agents'],
      ['default_agent_quota', '2', 'Default monthly quota for new agents']
    ];

    for (const setting of settings) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO system_settings (setting_key, setting_value, description)
          VALUES (?, ?, ?)
        `, setting, (err) => err ? reject(err) : resolve());
      });
    }

    console.log('✅ Production database setup completed!');
    console.log('🔒 No demo accounts created - ready for real user registration');
    console.log('📝 Registration is enabled for new users');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    db.close();
  }
};

// Run setup if called directly
if (require.main === module) {
  setupProductionDatabase()
    .then(() => {
      console.log('🎉 Production database ready!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupProductionDatabase };