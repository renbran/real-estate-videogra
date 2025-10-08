const { query, pool } = require('../config/database');

const createTables = async () => {
  // Handle both SQLite and PostgreSQL
  const client = pool ? await pool.connect() : { query };
  
  try {
    console.log('🏗️  Creating database tables...');
    
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Users table - handles all user types with role-based access
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('agent', 'manager', 'videographer', 'admin', 'executive')),
        tier VARCHAR(50) CHECK (tier IN ('standard', 'premium', 'elite')) DEFAULT 'standard',
        monthly_quota INTEGER DEFAULT 2,
        monthly_used INTEGER DEFAULT 0,
        performance_score INTEGER DEFAULT 0,
        phone VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Resource types table - extensible for different resources
    await client.query(`
      CREATE TABLE IF NOT EXISTS resource_types (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Resources table - individual resources (videographers, equipment, etc.)
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        resource_type_id UUID REFERENCES resource_types(id),
        name VARCHAR(255) NOT NULL,
        user_id UUID REFERENCES users(id), -- Links to user if resource is a person
        capacity_per_day INTEGER DEFAULT 1,
        working_hours_start TIME DEFAULT '08:00',
        working_hours_end TIME DEFAULT '17:00',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Bookings table - main booking entity
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_number VARCHAR(50) UNIQUE NOT NULL,
        agent_id UUID REFERENCES users(id) NOT NULL,
        resource_id UUID REFERENCES resources(id),
        
        -- Booking Category and Type
        shoot_category VARCHAR(50) NOT NULL CHECK (shoot_category IN ('property', 'personal', 'company_event', 'marketing_content', 'special_project')),
        
        -- Location and Scheduling
        location TEXT NOT NULL,
        formatted_address TEXT,
        place_id VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        geographic_zone VARCHAR(50),
        
        preferred_date DATE NOT NULL,
        backup_dates DATE[],
        scheduled_date DATE,
        scheduled_time TIME,
        estimated_duration INTEGER, -- in minutes
        
        -- Booking Status and Priority
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed', 'cancelled')),
        priority_score INTEGER DEFAULT 0,
        is_flexible BOOLEAN DEFAULT false,
        urgency_level VARCHAR(20) DEFAULT 'standard' CHECK (urgency_level IN ('standard', 'priority', 'rush')),
        
        -- Property Shoot Specific Fields
        property_value VARCHAR(50),
        property_type VARCHAR(50),
        bedrooms INTEGER,
        shoot_complexity VARCHAR(50),
        property_status VARCHAR(20),
        access_method VARCHAR(100),
        square_footage INTEGER,
        special_features TEXT[],
        services_needed TEXT[],
        
        -- Personal Shoot Specific Fields
        personal_shoot_type VARCHAR(50),
        personal_shoot_size VARCHAR(50),
        personal_shoot_location VARCHAR(50),
        personal_shoot_duration VARCHAR(50),
        outfit_changes BOOLEAN DEFAULT false,
        makeup_styling_needed BOOLEAN DEFAULT false,
        usage_type VARCHAR(100),
        
        -- Company Event Specific Fields
        event_name VARCHAR(255),
        company_event_type VARCHAR(100),
        event_start_time TIMESTAMP,
        event_end_time TIMESTAMP,
        expected_attendees INTEGER,
        coverage_type VARCHAR(50),
        deliverables_needed TEXT[],
        event_organizer VARCHAR(255),
        budget_code VARCHAR(100),
        
        -- Marketing Content Specific Fields
        project_title VARCHAR(255),
        marketing_content_type VARCHAR(100),
        script_status VARCHAR(50),
        talent_participants TEXT,
        marketing_location VARCHAR(100),
        production_time VARCHAR(50),
        post_production_complexity VARCHAR(50),
        strategic_importance VARCHAR(50),
        
        -- Special Project Specific Fields
        project_description TEXT,
        project_complexity VARCHAR(50),
        deadline_criticality VARCHAR(50),
        executive_sponsor_id UUID REFERENCES users(id),
        budget_available VARCHAR(50),
        
        -- Additional Information
        special_requirements TEXT,
        delivery_timeline VARCHAR(50) DEFAULT 'standard',
        file_delivery_method VARCHAR(50) DEFAULT 'email',
        additional_emails TEXT[],
        internal_notes TEXT,
        
        -- Management Fields
        manager_notes TEXT,
        videographer_notes TEXT,
        actual_duration INTEGER,
        completion_notes TEXT,
        
        -- Audit Trail
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        approved_by UUID REFERENCES users(id),
        completed_at TIMESTAMP
      )
    `);
    
    // Booking history/audit table
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking_audit (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id) NOT NULL,
        action VARCHAR(50) NOT NULL,
        old_values JSONB,
        new_values JSONB,
        changed_by UUID REFERENCES users(id) NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `);
    
    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id),
        user_id UUID REFERENCES users(id) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        email_sent BOOLEAN DEFAULT false,
        email_sent_at TIMESTAMP,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // System settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_by UUID REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Company branding and customization
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_branding (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_name VARCHAR(255) NOT NULL,
        logo_url TEXT,
        primary_color VARCHAR(7) DEFAULT '#1e40af',
        secondary_color VARCHAR(7) DEFAULT '#f97316',
        accent_color VARCHAR(7) DEFAULT '#10b981',
        custom_css TEXT,
        email_template TEXT,
        login_page_background TEXT,
        favicon_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // File storage and document management
    await client.query(`
      CREATE TABLE IF NOT EXISTS file_storage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id),
        user_id UUID REFERENCES users(id) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_path TEXT NOT NULL,
        file_url TEXT,
        download_count INTEGER DEFAULT 0,
        is_encrypted BOOLEAN DEFAULT true,
        encryption_key TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP
      )
    `);
    
    // Performance analytics and metrics
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) NOT NULL,
        booking_id UUID REFERENCES bookings(id),
        metric_type VARCHAR(50) NOT NULL,
        metric_value DECIMAL(10,2) NOT NULL,
        metric_date DATE NOT NULL,
        additional_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Route optimization and geographic clustering
    await client.query(`
      CREATE TABLE IF NOT EXISTS route_optimizations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        videographer_id UUID REFERENCES users(id) NOT NULL,
        optimization_date DATE NOT NULL,
        booking_ids UUID[] NOT NULL,
        original_route JSONB,
        optimized_route JSONB,
        time_saved INTEGER, -- in minutes
        distance_saved DECIMAL(10,2), -- in miles/km
        fuel_savings DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP
      )
    `);
    
    // Calendar integrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS calendar_integrations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) NOT NULL,
        provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'outlook', 'apple', 'ical')),
        access_token TEXT,
        refresh_token TEXT,
        calendar_id VARCHAR(255),
        sync_enabled BOOLEAN DEFAULT true,
        last_sync TIMESTAMP,
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Advanced reporting and custom reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) NOT NULL,
        report_name VARCHAR(255) NOT NULL,
        report_config JSONB NOT NULL,
        schedule_config JSONB,
        last_generated TIMESTAMP,
        is_scheduled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Geographic zones for resource management
    await client.query(`
      CREATE TABLE IF NOT EXISTS geographic_zones (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        zone_name VARCHAR(100) NOT NULL,
        zone_code VARCHAR(10) NOT NULL UNIQUE,
        boundary_coordinates JSONB NOT NULL,
        default_videographer_id UUID REFERENCES users(id),
        travel_time_matrix JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Emergency contacts and support escalation
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_contacts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        contact_type VARCHAR(50) NOT NULL CHECK (contact_type IN ('emergency', 'support', 'escalation')),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        availability_hours VARCHAR(100),
        priority_level INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Automated backup tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS backup_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        backup_type VARCHAR(50) NOT NULL,
        backup_size BIGINT,
        backup_location TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('started', 'completed', 'failed')),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT
      )
    `);
    
    // Create indexes for performance
    console.log('📊 Creating database indexes...');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON bookings(agent_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_resource_id ON bookings(resource_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_category ON bookings(shoot_category)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_geographic_zone ON bookings(geographic_zone)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_booking_audit_booking_id ON booking_audit(booking_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_file_storage_booking_id ON file_storage(booking_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_file_storage_user_id ON file_storage(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(metric_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_route_optimizations_videographer_id ON route_optimizations(videographer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_route_optimizations_date ON route_optimizations(optimization_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id ON calendar_integrations(user_id)');
    
    // Create trigger for updated_at timestamps
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
      CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_company_branding_updated_at ON company_branding;
      CREATE TRIGGER update_company_branding_updated_at BEFORE UPDATE ON company_branding
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_calendar_integrations_updated_at ON calendar_integrations;
      CREATE TRIGGER update_calendar_integrations_updated_at BEFORE UPDATE ON calendar_integrations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_custom_reports_updated_at ON custom_reports;
      CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('✅ Database tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    // Only release if using PostgreSQL pool
    if (pool && client.release) {
      client.release();
    }
  }
};

// Run migration if called directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Database migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };