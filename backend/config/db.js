const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_event_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // return DATE/DATETIME/TIME columns as strings, not JS Date objects
});

// Quick sanity check on startup
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully.');
    conn.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
  }
}

module.exports = { pool, testConnection };
