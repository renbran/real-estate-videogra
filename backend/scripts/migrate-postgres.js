/**
 * PostgreSQL Database Migration Script
 * Creates all necessary tables, indexes, and demo users for production
 */

const { pool, query } = require('../config/database');
const bcrypt = require('bcryptjs');

async function migrate() {
  console.log('🚀 Starting PostgreSQL database migration...\n');

  try {
    // Create Users Table
    console.log('📝 Creating users table...');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'agent',
        tier VARCHAR(50) DEFAULT 'standard',
        status VARCHAR(50) DEFAULT 'active',
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create Bookings Table
    console.log('📝 Creating bookings table...');
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        videographer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        property_address TEXT NOT NULL,
        property_type VARCHAR(100),
        scheduled_date TIMESTAMP,
        scheduled_time VARCHAR(50),
        duration INTEGER DEFAULT 60,
        service_type VARCHAR(100),
        price DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        special_requirements TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Bookings table created');

    // Create Notifications Table
    console.log('📝 Creating notifications table...');
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        link VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Notifications table created');

    // Create Files Table
    console.log('📝 Creating files table...');
    await query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        filename VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_type VARCHAR(100),
        file_size INTEGER,
        mime_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Files table created');

    // Create Audit Logs Table
    console.log('📝 Creating audit_logs table...');
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        details JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Audit logs table created');

    // Create Calendar Events Table
    console.log('📝 Creating calendar_events table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        location TEXT,
        event_type VARCHAR(50) DEFAULT 'booking',
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Calendar events table created');

    // Create Indexes
    console.log('\n📝 Creating indexes...');
    
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_bookings_videographer_id ON bookings(videographer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_files_booking_id ON files(booking_id)');
    
    console.log('✅ All indexes created');

    // Create Demo Users
    console.log('\n📝 Creating demo users...');
    
    const demoPassword = await bcrypt.hash('demo123', 10);
    
    const demoUsers = [
      {
        email: 'sarah.j@realty.com',
        password_hash: demoPassword,
        full_name: 'Sarah Johnson',
        phone: '+1-555-0101',
        role: 'agent',
        tier: 'elite',
        status: 'active',
        email_verified: true
      },
      {
        email: 'manager@realty.com',
        password_hash: demoPassword,
        full_name: 'Michael Chen',
        phone: '+1-555-0102',
        role: 'manager',
        tier: 'standard',
        status: 'active',
        email_verified: true
      },
      {
        email: 'video@realty.com',
        password_hash: demoPassword,
        full_name: 'Alex Rodriguez',
        phone: '+1-555-0103',
        role: 'videographer',
        tier: 'standard',
        status: 'active',
        email_verified: true
      },
      {
        email: 'admin@osusproperties.com',
        password_hash: demoPassword,
        full_name: 'OSUS Admin',
        phone: '+1-555-0100',
        role: 'admin',
        tier: 'premium',
        status: 'active',
        email_verified: true
      }
    ];

    for (const user of demoUsers) {
      // Check if user already exists
      const existing = await query('SELECT id FROM users WHERE email = $1', [user.email]);
      
      if (existing.rows.length === 0) {
        await query(`
          INSERT INTO users (email, password_hash, full_name, phone, role, tier, status, email_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          user.email,
          user.password_hash,
          user.full_name,
          user.phone,
          user.role,
          user.tier,
          user.status,
          user.email_verified
        ]);
        console.log(`✅ Created demo user: ${user.email}`);
      } else {
        console.log(`⏭️  User already exists: ${user.email}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Demo Users (password: demo123):');
    console.log('   - sarah.j@realty.com (Agent, Elite)');
    console.log('   - manager@realty.com (Manager)');
    console.log('   - video@realty.com (Videographer)');
    console.log('   - admin@osusproperties.com (Admin)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n🎉 Database ready for production!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });
