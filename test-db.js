 const pool = require('./db');

(async () => {
  try {
    const res = await pool.query('SELECT 1 AS ok');
    console.log('✅ Database connected!', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
})();
