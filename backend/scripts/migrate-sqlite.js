const { query, close } = require('../config/database-sqlite');

const createTables = async () => {
  try {
    console.log('🏗️  Creating SQLite database tables...');
    
    // Users table
    await query(`
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
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Bookings table (simplified for core functionality)
    await query(`
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
        backup_dates TEXT, -- JSON array
        scheduled_date DATE,
        scheduled_time TIME,
        estimated_duration INTEGER DEFAULT 90,
        actual_duration INTEGER,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed', 'cancelled')),
        priority_score INTEGER DEFAULT 0,
        is_flexible BOOLEAN DEFAULT 0,
        
        -- Property shoot fields
        property_value TEXT,
        property_type TEXT,
        bedrooms INTEGER,
        shoot_complexity TEXT,
        property_status TEXT,
        
        -- System fields
        special_requirements TEXT,
        manager_notes TEXT,
        approved_by TEXT,
        approved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (agent_id) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);
    
    // Notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        user_id TEXT NOT NULL,
        booking_id TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )
    `);
    
    console.log('✅ Database tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

const seedData = async () => {
  try {
    console.log('🌱 Seeding database with demo data...');
    
    // Check if users already exist
    const existingUsers = await query('SELECT COUNT(*) as count FROM users');
    if (existingUsers.rows[0].count > 0) {
      console.log('📊 Database already has data, skipping seed...');
      return;
    }
    
    // Insert demo users
    const users = [
      {
        id: 'user-1',
        email: 'sarah.j@realty.com',
        password_hash: '$2a$10$rUKhhqvOlXGWVJCDlI5iXuUGkbqS4RyWXtNSXGKRlY8JtPBQ2LK/e', // demo123
        name: 'Sarah Johnson',
        role: 'agent',
        tier: 'elite',
        monthly_quota: 8,
        monthly_used: 2,
        performance_score: 85
      },
      {
        id: 'user-2',
        email: 'manager@realty.com',
        password_hash: '$2a$10$rUKhhqvOlXGWVJCDlI5iXuUGkbqS4RyWXtNSXGKRlY8JtPBQ2LK/e', // demo123
        name: 'Alex Manager',
        role: 'manager',
        tier: 'premium',
        monthly_quota: 20,
        monthly_used: 5,
        performance_score: 92
      },
      {
        id: 'user-3',
        email: 'video@realty.com',
        password_hash: '$2a$10$rUKhhqvOlXGWVJCDlI5iXuUGkbqS4RyWXtNSXGKRlY8JtPBQ2LK/e', // demo123
        name: 'Chris Videographer',
        role: 'videographer',
        tier: 'standard',
        monthly_quota: 0,
        monthly_used: 0,
        performance_score: 88
      }
    ];
    
    for (const user of users) {
      await query(`
        INSERT INTO users (id, email, password_hash, name, role, tier, monthly_quota, monthly_used, performance_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [user.id, user.email, user.password_hash, user.name, user.role, user.tier, user.monthly_quota, user.monthly_used, user.performance_score]);
    }
    
    // Insert demo bookings
    const bookings = [
      {
        id: 'booking-1',
        booking_number: 'VB-20251006-ABC123',
        agent_id: 'user-1',
        shoot_category: 'property',
        location: '123 Main Street, Downtown, CA 90210',
        preferred_date: '2025-10-08',
        backup_dates: JSON.stringify(['2025-10-09', '2025-10-10']),
        status: 'pending',
        priority_score: 85,
        property_value: '1m_2m',
        property_type: 'single_family',
        bedrooms: 3,
        shoot_complexity: 'standard',
        property_status: 'vacant',
        special_requirements: 'Drone shots required for large backyard'
      },
      {
        id: 'booking-2',
        booking_number: 'VB-20251006-DEF456',
        agent_id: 'user-1',
        shoot_category: 'property',
        location: '456 Oak Avenue, Westside, CA 90211',
        preferred_date: '2025-10-07',
        backup_dates: JSON.stringify(['2025-10-08']),
        status: 'approved',
        priority_score: 95,
        property_value: 'over_2m',
        property_type: 'condo',
        bedrooms: 4,
        shoot_complexity: 'complex',
        property_status: 'occupied',
        approved_by: 'user-2',
        approved_at: new Date().toISOString(),
        scheduled_date: '2025-10-07',
        scheduled_time: '10:00'
      }
    ];
    
    for (const booking of bookings) {
      await query(`
        INSERT INTO bookings (
          id, booking_number, agent_id, shoot_category, location, preferred_date, 
          backup_dates, status, priority_score, property_value, property_type, 
          bedrooms, shoot_complexity, property_status, special_requirements, 
          approved_by, approved_at, scheduled_date, scheduled_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        booking.id, booking.booking_number, booking.agent_id, booking.shoot_category,
        booking.location, booking.preferred_date, booking.backup_dates, booking.status,
        booking.priority_score, booking.property_value, booking.property_type,
        booking.bedrooms, booking.shoot_complexity, booking.property_status,
        booking.special_requirements, booking.approved_by, booking.approved_at,
        booking.scheduled_date, booking.scheduled_time
      ]);
    }
    
    console.log('✅ Demo data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

const runMigration = async () => {
  try {
    await createTables();
    await seedData();
    console.log('🎉 Database setup complete!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    close();
  }
};

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { createTables, seedData };