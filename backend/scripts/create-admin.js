const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../data/videography_booking.db');

async function createAdminAccount() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('📄 Connected to production database');
    });

    // Admin credentials
    const adminEmail = 'admin@videopro.com';
    const adminPassword = 'AdminPass123!';
    const adminName = 'System Administrator';

    bcrypt.hash(adminPassword, 12, (err, passwordHash) => {
      if (err) {
        reject(err);
        return;
      }

      const insertAdmin = `
        INSERT OR REPLACE INTO users (
          email, password_hash, name, role, tier, monthly_quota, 
          monthly_used, is_active, email_verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(insertAdmin, [
        adminEmail,
        passwordHash,
        adminName,
        'admin',
        'elite',
        999,
        0,
        1,
        1,
        new Date().toISOString()
      ], function(err) {
        if (err) {
          reject(err);
          return;
        }

        console.log('✅ Admin account created/updated successfully!');
        console.log('');
        console.log('🔐 ADMIN CREDENTIALS:');
        console.log('📧 Email: admin@videopro.com');
        console.log('🔑 Password: AdminPass123!');
        console.log('👤 Role: admin');
        console.log('🎯 Tier: elite');
        console.log('📊 Monthly Quota: 999');
        console.log('');
        console.log('🌐 Login at: http://localhost:5000');
        console.log('');

        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          resolve();
        });
      });
    });
  });
}

// Run the script
createAdminAccount()
  .then(() => {
    console.log('🎉 Admin setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  });