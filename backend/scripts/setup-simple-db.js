const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Create simplified SQLite setup for testing
const setupSimpleDatabase = async () => {
  console.log('🚀 Setting up simple SQLite database for testing...');
  
  const dbPath = path.join(__dirname, '../data/videography_booking.db');
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new sqlite3.Database(dbPath);
  
  try {
    // Hash password for admin
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create users table (minimal)
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          tier TEXT DEFAULT 'standard',
          monthly_quota INTEGER DEFAULT 2,
          monthly_used INTEGER DEFAULT 0,
          performance_score INTEGER DEFAULT 0,
          phone TEXT,
          is_active BOOLEAN DEFAULT 1,
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // Insert admin user
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO users (
          email, password_hash, name, role, tier, phone
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'admin@videopro.com',
        hashedPassword,
        'System Administrator', 
        'admin',
        null,
        '+1-555-0001'
      ], (err) => err ? reject(err) : resolve());
    });

    // Insert some demo users
    const demoUsers = [
      ['manager@videopro.com', hashedPassword, 'Alex Manager', 'manager', null, '+1-555-0002'],
      ['sarah.johnson@realty.com', hashedPassword, 'Sarah Johnson', 'agent', 'elite', '+1-555-1001'],
      ['mike.chen@realty.com', hashedPassword, 'Mike Chen', 'agent', 'premium', '+1-555-1002']
    ];

    for (const user of demoUsers) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO users (
            email, password_hash, name, role, tier, phone
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, user, (err) => err ? reject(err) : resolve());
      });
    }

    // Insert basic system settings
    const settings = [
      ['company_name', 'VideoPro', 'Company name'],
      ['max_bookings_per_day', '5', 'Maximum bookings per day'],
      ['session_timeout_minutes', '30', 'Session timeout in minutes']
    ];

    for (const setting of settings) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO system_settings (setting_key, setting_value, description)
          VALUES (?, ?, ?)
        `, setting, (err) => err ? reject(err) : resolve());
      });
    }

    console.log('✅ Simple database setup completed!');
    console.log('👤 Admin credentials: admin@videopro.com / password123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    db.close();
  }
};

// Run setup if called directly
if (require.main === module) {
  setupSimpleDatabase()
    .then(() => {
      console.log('🎉 Database ready for testing!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupSimpleDatabase };