const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

// SQLite database path
const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../data/videography_booking.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('❌ SQLite connection error:', err);
    process.exit(1);
  } else {
    logger.info(`✅ SQLite database connected: ${dbPath}`);
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    db.run('PRAGMA journal_mode = WAL');
    
    logger.info('✅ SQLite configured with foreign keys and WAL mode');
  }
});

// Helper function to promisify database operations
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        logger.error('Query error:', { error: err.message, sql, params });
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        logger.error('Run error:', { error: err.message, sql, params });
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        logger.error('Get error:', { error: err.message, sql, params });
        reject(err);
      } else {
        resolve({ rows: row ? [row] : [] });
      }
    });
  });
};

// Transaction helper
const transaction = async (callback) => {
  return new Promise(async (resolve, reject) => {
    db.serialize(async () => {
      try {
        await run('BEGIN TRANSACTION');
        const result = await callback({ query, run, get });
        await run('COMMIT');
        resolve(result);
      } catch (error) {
        await run('ROLLBACK');
        logger.error('Transaction rolled back:', error);
        reject(error);
      }
    });
  });
};

// Close database connection
const close = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        logger.error('Error closing database:', err);
        reject(err);
      } else {
        logger.info('Database closed gracefully');
        resolve();
      }
    });
  });
};

// Export both the raw db and helper functions
module.exports = {
  db,
  query,
  run,
  get,
  transaction,
  close
};
