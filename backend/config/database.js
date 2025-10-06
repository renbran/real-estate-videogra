// Auto-detect database type and use appropriate adapter
const usePostgres = process.env.DATABASE_URL || process.env.DB_HOST;

if (usePostgres) {
  // PostgreSQL setup
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'videography_booking',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('connect', () => {
    console.log('✅ PostgreSQL connected successfully');
  });

  pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
  });

  // PostgreSQL query helper
  const query = async (text, params) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('🔍 Executed query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  };

  // PostgreSQL transaction helper
  const withTransaction = async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  module.exports = { pool, query, withTransaction };

} else {
  // SQLite setup for development
  const sqliteDB = require('./database-sqlite');
  
  module.exports = {
    query: sqliteDB.query,
    withTransaction: sqliteDB.withTransaction,
    pool: null // Not needed for SQLite
  };
}