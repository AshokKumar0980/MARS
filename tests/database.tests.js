// tests/database.test.js
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'testuser',
  password: process.env.DB_PASSWORD || 'testpass',
  database: process.env.DB_NAME || 'testdb'
};

describe('Database Tests', () => {
  let connection;

  beforeAll(async () => {
    connection = await mysql.createConnection(config);
  });

  afterAll(async () => {
    if (connection) {
      await connection.end();
    }
  });

  beforeEach(async () => {
    // Clean up tables before each test
    await connection.execute('DELETE FROM posts');
    await connection.execute('DELETE FROM users');
  });

  test('should connect to database', async () => {
    const [rows] = await connection.execute('SELECT 1 as test');
    expect(rows[0].test).toBe(1);
  });

  test('should create and retrieve a user', async () => {
    // Insert user
    const [result] = await connection.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['John Doe', 'john@example.com']
    );

    expect(result.insertId).toBeDefined();

    // Retrieve user
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('John Doe');
    expect(rows[0].email).toBe('john@example.com');
  });

  test('should create user and post with foreign key relationship', async () => {
    // Create user
    const [userResult] = await connection.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['Jane Doe', 'jane@example.com']
    );

    // Create post for user
    const [postResult] = await connection.execute(
      'INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)',
      ['Test Post', 'This is a test post', userResult.insertId]
    );

    // Verify relationship
    const [rows] = await connection.execute(`
      SELECT u.name, p.title, p.content 
      FROM users u 
      JOIN posts p ON u.id = p.user_id 
      WHERE u.id = ?
    `, [userResult.insertId]);

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Jane Doe');
    expect(rows[0].title).toBe('Test Post');
  });
});