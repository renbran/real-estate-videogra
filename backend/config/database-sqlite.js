const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create SQLite database for development
const dbPath = path.join(__dirname, '../data/videography_booking.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Simple query function to match the PostgreSQL interface
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ 
          rows: [{ id: this.lastID }],
          rowCount: this.changes 
        });
      });
    }
  });
};

// Transaction wrapper
const withTransaction = async (callback) => {
  return new Promise(async (resolve, reject) => {
    db.serialize(async () => {
      try {
        await query('BEGIN TRANSACTION');
        const result = await callback({ query });
        await query('COMMIT');
        resolve(result);
      } catch (error) {
        await query('ROLLBACK');
        reject(error);
      }
    });
  });
};

// Close database connection
const close = () => {
  db.close();
};

module.exports = {
  query,
  withTransaction,
  close,
  db
};

console.log('📁 SQLite database initialized at:', dbPath);