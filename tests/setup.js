// tests/setup.js
const mysql = require('mysql2/promise');

// Increase Jest timeout for database operations
jest.setTimeout(30000);

// Global test database connection
let globalConnection;

beforeAll(async () => {
  // Only try to connect to database in CI or when explicitly requested
  const shouldConnectToDb = process.env.CI || process.env.TEST_WITH_DB === 'true';
  
  if (!shouldConnectToDb) {
    console.log('Skipping database connection (not in CI environment)');
    return;
  }

  // Wait for database to be ready (important in CI)
  const maxRetries = 10;
  const delay = 2000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      globalConnection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'testuser',
        password: process.env.DB_PASSWORD || 'testpass',
        database: process.env.DB_NAME || 'testdb'
      });
      
      // Test connection
      await globalConnection.execute('SELECT 1');
      console.log('Database connected for tests');
      break;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${error.message}`);
      }
      console.log(`Waiting for database... attempt ${i + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
});

afterAll(async () => {
  if (globalConnection) {
    await globalConnection.end();
  }
});

// Make connection available globally for tests
global.testDb = () => globalConnection;