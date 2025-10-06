const { query, close } = require('./config/database-sqlite');

async function testDatabase() {
  console.log('🔧 Testing Database Connection & Data');
  console.log('=====================================\n');
  
  try {
    // Test basic connection
    console.log('1. Testing database connection...');
    const result = await query("SELECT 1 as test");
    console.log('   ✅ Database connection working');
    
    // Check tables
    console.log('\n2. Checking tables...');
    const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('   Tables found:', tables.rows.map(t => t.name).join(', '));
    
    // Check users
    console.log('\n3. Checking users...');
    const users = await query('SELECT id, email, name, role, tier FROM users');
    console.log(`   Found ${users.rows.length} users:`);
    users.rows.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}/${user.tier}`);
    });
    
    // Check bookings
    console.log('\n4. Checking bookings...');
    const bookings = await query('SELECT id, booking_number, agent_id, status, location FROM bookings LIMIT 3');
    console.log(`   Found ${bookings.rows.length} bookings:`);
    bookings.rows.forEach(booking => {
      console.log(`   - ${booking.booking_number}: ${booking.status} (${booking.location})`);
    });
    
    console.log('\n✅ Database test complete!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await close();
  }
}

testDatabase();