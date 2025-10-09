const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../data/videography_booking.db');
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Created data directory: ${dataDir}`);
}

const db = new sqlite3.Database(dbPath);

async function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('🔨 Creating database tables...\n');

      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL CHECK(role IN ('agent', 'manager', 'videographer', 'admin')),
          tier TEXT CHECK(tier IN ('basic', 'standard', 'elite')),
          monthly_quota INTEGER DEFAULT 5,
          monthly_used INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_login TEXT
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating users table:', err);
          reject(err);
        } else {
          console.log('✅ Users table created');
        }
      });

      // Bookings table
      db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY,
          booking_number TEXT UNIQUE NOT NULL,
          agent_id TEXT NOT NULL,
          shoot_category TEXT NOT NULL CHECK(shoot_category IN ('property', 'personal', 'company_event', 'marketing', 'special_project')),
          property_address TEXT NOT NULL,
          property_type TEXT,
          property_value TEXT,
          bedrooms INTEGER,
          preferred_date TEXT NOT NULL,
          backup_dates TEXT,
          is_flexible INTEGER DEFAULT 0,
          special_requirements TEXT,
          complexity TEXT CHECK(complexity IN ('basic', 'standard', 'premium', 'luxury')),
          priority_score REAL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled', 'declined')),
          scheduled_date TEXT,
          scheduled_time TEXT,
          assigned_videographer_id TEXT,
          estimated_duration INTEGER,
          actual_duration INTEGER,
          notes TEXT,
          cancellation_reason TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_videographer_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating bookings table:', err);
          reject(err);
        } else {
          console.log('✅ Bookings table created');
        }
      });

      // Notifications table
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('email', 'sms', 'push', 'in_app')),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
          is_read INTEGER DEFAULT 0,
          related_booking_id TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL,
          read_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (related_booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating notifications table:', err);
          reject(err);
        } else {
          console.log('✅ Notifications table created');
        }
      });

      // Files table
      db.run(`
        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          booking_id TEXT NOT NULL,
          uploaded_by TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type TEXT,
          description TEXT,
          is_final INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
          FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating files table:', err);
          reject(err);
        } else {
          console.log('✅ Files table created');
        }
      });

      // Audit log table
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          action TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          resource_id TEXT,
          old_values TEXT,
          new_values TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating audit_logs table:', err);
          reject(err);
        } else {
          console.log('✅ Audit logs table created');
        }
      });

      // Calendar events table
      db.run(`
        CREATE TABLE IF NOT EXISTS calendar_events (
          id TEXT PRIMARY KEY,
          booking_id TEXT,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          location TEXT,
          event_type TEXT CHECK(event_type IN ('booking', 'meeting', 'reminder', 'personal')),
          google_calendar_event_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating calendar_events table:', err);
          reject(err);
        } else {
          console.log('✅ Calendar events table created');
        }
      });

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON bookings(agent_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
      db.run('CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date)');
      db.run('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_files_booking_id ON files(booking_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id)', (err) => {
        if (err) {
          console.error('❌ Error creating indexes:', err);
          reject(err);
        } else {
          console.log('✅ Indexes created\n');
          resolve();
        }
      });
    });
  });
}

async function seedData() {
  return new Promise(async (resolve, reject) => {
    console.log('🌱 Seeding initial data...\n');

    try {
      // Check if users already exist
      db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
        if (err) {
          console.error('❌ Error checking users:', err);
          reject(err);
          return;
        }

        if (row.count > 0) {
          console.log('ℹ️  Users already exist, skipping seed\n');
          resolve();
          return;
        }

        // Create demo users
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('demo123', salt);
        const now = new Date().toISOString();

        const users = [
          {
            id: uuidv4(),
            email: 'sarah.j@realty.com',
            password_hash: password,
            name: 'Sarah Johnson',
            phone: '+1 (555) 123-4567',
            role: 'agent',
            tier: 'elite',
            monthly_quota: 8,
            monthly_used: 2,
            created_at: now,
            updated_at: now
          },
          {
            id: uuidv4(),
            email: 'manager@realty.com',
            password_hash: password,
            name: 'Alex Manager',
            phone: '+1 (555) 234-5678',
            role: 'manager',
            tier: null,
            monthly_quota: null,
            monthly_used: null,
            created_at: now,
            updated_at: now
          },
          {
            id: uuidv4(),
            email: 'video@realty.com',
            password_hash: password,
            name: 'Chris Videographer',
            phone: '+1 (555) 345-6789',
            role: 'videographer',
            tier: null,
            monthly_quota: null,
            monthly_used: null,
            created_at: now,
            updated_at: now
          },
          {
            id: uuidv4(),
            email: 'admin@osusproperties.com',
            password_hash: password,
            name: 'Admin User',
            phone: '+1 (555) 999-0000',
            role: 'admin',
            tier: null,
            monthly_quota: null,
            monthly_used: null,
            created_at: now,
            updated_at: now
          }
        ];

        const stmt = db.prepare(`
          INSERT INTO users (id, email, password_hash, name, phone, role, tier, monthly_quota, monthly_used, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const user of users) {
          stmt.run(
            user.id,
            user.email,
            user.password_hash,
            user.name,
            user.phone,
            user.role,
            user.tier,
            user.monthly_quota,
            user.monthly_used,
            user.created_at,
            user.updated_at,
            (err) => {
              if (err) {
                console.error(`❌ Error creating user ${user.email}:`, err);
              } else {
                console.log(`✅ Created user: ${user.email} (${user.role})`);
              }
            }
          );
        }

        stmt.finalize((err) => {
          if (err) {
            console.error('❌ Error finalizing statement:', err);
            reject(err);
          } else {
            console.log('\n✅ Database seeded successfully!');
            console.log('\n📝 Demo Login Credentials:');
            console.log('   Email: sarah.j@realty.com | Password: demo123 (Agent - Elite)');
            console.log('   Email: manager@realty.com | Password: demo123 (Manager)');
            console.log('   Email: video@realty.com | Password: demo123 (Videographer)');
            console.log('   Email: admin@osusproperties.com | Password: demo123 (Admin)\n');
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('❌ Seed error:', error);
      reject(error);
    }
  });
}

async function migrate() {
  try {
    console.log('🚀 Starting SQLite database migration...\n');
    await createTables();
    await seedData();
    console.log('✅ Migration completed successfully!\n');
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    db.close();
    process.exit(1);
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrate();
}

module.exports = {
  createTables,
  seedData,
  migrate
};
