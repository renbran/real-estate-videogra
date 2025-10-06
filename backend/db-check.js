const { query, close } = require('./config/database-sqlite');

async function inspectDatabase() {
  console.log('📊 VideoPro Database Analysis');
  console.log('============================\n');
  
  try {
    // Check if tables exist and get their data
    console.log('🔍 Checking database contents...\n');
    
    // Users
    try {
      const users = await query('SELECT * FROM users');
      console.log('👥 USERS:');
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.email})`);
          console.log(`     Role: ${user.role} | Tier: ${user.tier} | Quota: ${user.monthly_used}/${user.monthly_quota}`);
        });
      } else {
        console.log('  No users found');
      }
      console.log(`  Total: ${users ? users.length : 0} users\n`);
    } catch (err) {
      console.log('  Users table: Not found or empty\n');
    }
    
    // Bookings
    try {
      const bookings = await query('SELECT * FROM bookings');
      console.log('📋 BOOKINGS:');
      if (bookings && bookings.length > 0) {
        bookings.forEach((booking, index) => {
          console.log(`  ${index + 1}. ${booking.booking_number}`);
          console.log(`     Location: ${booking.location}`);
          console.log(`     Status: ${booking.status} | Priority: ${booking.priority_score}`);
          console.log(`     Date: ${booking.preferred_date || 'Not set'}`);
        });
      } else {
        console.log('  No bookings found');
      }
      console.log(`  Total: ${bookings ? bookings.length : 0} bookings\n`);
    } catch (err) {
      console.log('  Bookings table: Not found or empty\n');
    }
    
    // Check table structures
    console.log('🏗️  TABLE STRUCTURES:');
    try {
      const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('Available tables:', tables.map(t => t.name).join(', '));
    } catch (err) {
      console.log('Could not retrieve table list');
    }
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  } finally {
    console.log('\n✅ Database inspection complete');
    await close();
  }
}

inspectDatabase();