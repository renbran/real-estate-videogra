const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { createTables } = require('./migrate');

const seedData = async () => {
  console.log('🌱 Seeding database with initial data...');
  
  const client = await pool.connect();
  
  try {
    // First run migrations
    await createTables();
    
    // Hash password for demo users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Insert resource types
    await client.query(`
      INSERT INTO resource_types (name, description) VALUES
      ('Videographer', 'Professional videographer for real estate shoots'),
      ('Photography Equipment', 'Camera equipment and accessories'),
      ('Drone Equipment', 'Aerial photography and videography equipment')
      ON CONFLICT DO NOTHING
    `);
    
    // Get videographer resource type ID
    const resourceTypeResult = await client.query(
      "SELECT id FROM resource_types WHERE name = 'Videographer'"
    );
    const videographerResourceTypeId = resourceTypeResult.rows[0].id;
    
    // Insert demo users
    const usersResult = await client.query(`
      INSERT INTO users (email, password_hash, name, role, tier, monthly_quota, monthly_used, performance_score, phone) VALUES
      ('admin@videopro.com', $1, 'System Administrator', 'admin', NULL, NULL, NULL, NULL, '+1-555-0001'),
      ('manager@videopro.com', $1, 'Alex Manager', 'manager', NULL, NULL, NULL, NULL, '+1-555-0002'),
      ('videographer@videopro.com', $1, 'Chris Videographer', 'videographer', NULL, NULL, NULL, NULL, '+1-555-0003'),
      ('sarah.johnson@realty.com', $1, 'Sarah Johnson', 'agent', 'elite', 8, 2, 95, '+1-555-1001'),
      ('mike.chen@realty.com', $1, 'Mike Chen', 'agent', 'premium', 4, 1, 88, '+1-555-1002'),
      ('lisa.rodriguez@realty.com', $1, 'Lisa Rodriguez', 'agent', 'standard', 2, 0, 82, '+1-555-1003'),
      ('david.thompson@realty.com', $1, 'David Thompson', 'agent', 'premium', 4, 3, 91, '+1-555-1004'),
      ('emily.wilson@realty.com', $1, 'Emily Wilson', 'agent', 'standard', 2, 1, 79, '+1-555-1005'),
      ('marketing@realty.com', $1, 'Marketing Director', 'executive', NULL, NULL, NULL, NULL, '+1-555-2001')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, role
    `, [hashedPassword]);
    
    console.log('👥 Created users:', usersResult.rows);
    
    // Get videographer user ID
    const videographerResult = await client.query(
      "SELECT id FROM users WHERE email = 'videographer@videopro.com'"
    );
    const videographerUserId = videographerResult.rows[0]?.id;
    
    // Insert resources (videographer)
    if (videographerUserId) {
      await client.query(`
        INSERT INTO resources (resource_type_id, name, user_id, capacity_per_day, working_hours_start, working_hours_end) VALUES
        ($1, 'Chris Videographer', $2, 3, '08:00', '18:00')
        ON CONFLICT DO NOTHING
      `, [videographerResourceTypeId, videographerUserId]);
    }
    
    // Insert system settings
    await client.query(`
      INSERT INTO system_settings (setting_key, setting_value, description) VALUES
      ('company_name', 'VideoPro', 'Company name displayed in the application'),
      ('max_bookings_per_day', '5', 'Maximum number of bookings per day per resource'),
      ('advance_booking_days', '90', 'Maximum days in advance for booking'),
      ('auto_approval_threshold', '75', 'Priority score threshold for auto-approval'),
      ('session_timeout_minutes', '30', 'Session timeout in minutes'),
      ('email_notifications_enabled', 'true', 'Enable/disable email notifications'),
      ('sms_notifications_enabled', 'false', 'Enable/disable SMS notifications'),
      ('working_hours_start', '08:00', 'Default working hours start time'),
      ('working_hours_end', '18:00', 'Default working hours end time'),
      ('booking_confirmation_required', 'true', 'Require confirmation before booking')
      ON CONFLICT (setting_key) DO NOTHING
    `);
    
    // Create some sample bookings for testing
    const agentResult = await client.query(
      "SELECT id FROM users WHERE email = 'sarah.johnson@realty.com'"
    );
    const resourceResult = await client.query(
      "SELECT id FROM resources WHERE name = 'Chris Videographer'"
    );
    
    if (agentResult.rows[0] && resourceResult.rows[0]) {
      const agentId = agentResult.rows[0].id;
      const resourceId = resourceResult.rows[0].id;
      
      await client.query(`
        INSERT INTO bookings (
          booking_number, agent_id, resource_id, shoot_category, location,
          preferred_date, scheduled_date, scheduled_time, status, priority_score,
          property_value, shoot_complexity, property_status, estimated_duration,
          special_requirements
        ) VALUES (
          'VB-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-001',
          $1, $2, 'property', '123 Main St, Anytown, ST 12345',
          CURRENT_DATE + INTERVAL '3 days',
          CURRENT_DATE + INTERVAL '3 days',
          '10:00',
          'approved',
          85,
          '500k_1m',
          'standard',
          'vacant',
          90,
          'Please bring drone for aerial shots'
        )
        ON CONFLICT (booking_number) DO NOTHING
      `, [agentId, resourceId]);
    }
    
    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🎉 Database seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };