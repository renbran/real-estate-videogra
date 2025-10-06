const { query, close } = require('./config/database-sqlite');

async function inspectDatabase() {
  console.log('📊 DATABASE INSPECTION REPORT');
  console.log('==============================\n');
  
  try {
    // Check Users
    console.log('👥 USERS TABLE:');
    const users = await query('SELECT id, email, name, role, tier, monthly_quota, monthly_used FROM users');
    console.table(users);
    
    console.log('\n📋 BOOKINGS TABLE:');
    const bookings = await query('SELECT id, booking_number, agent_id, shoot_category, location, status, priority_score, scheduled_date FROM bookings LIMIT 5');
    console.table(bookings);
    
    console.log('\n📈 DATABASE STATISTICS:');
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const bookingCount = await query('SELECT COUNT(*) as count FROM bookings');
    const pendingBookings = await query('SELECT COUNT(*) as count FROM bookings WHERE status = "pending"');
    const approvedBookings = await query('SELECT COUNT(*) as count FROM bookings WHERE status = "approved"');
    
    console.log(`Total Users: ${userCount.length > 0 ? userCount[0].count : 0}`);
    console.log(`Total Bookings: ${bookingCount.length > 0 ? bookingCount[0].count : 0}`);
    console.log(`Pending Bookings: ${pendingBookings.length > 0 ? pendingBookings[0].count : 0}`);
    console.log(`Approved Bookings: ${approvedBookings.length > 0 ? approvedBookings[0].count : 0}`);
    
    console.log('\n🏗️  TABLE STRUCTURE:');
    const userSchema = await query("PRAGMA table_info(users)");
    console.log('\nUsers table columns:');
    userSchema.forEach(col => {
        console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? '(PRIMARY KEY)' : ''}`);
    });
    
    const bookingSchema = await query("PRAGMA table_info(bookings)");
    console.log('\nBookings table columns:');
    bookingSchema.forEach(col => {
        console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? '(PRIMARY KEY)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error);
  } finally {
    await close();
  }
}

inspectDatabase();