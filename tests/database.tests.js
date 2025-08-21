// tests/database.test.js
describe('Database Tests', () => {
  let connection;

  beforeAll(async () => {
    connection = global.testDb();
    
    // Skip database tests if no connection is available
    if (!connection) {
      console.log('Skipping database tests - no database connection available');
      return;
    }
  });

  beforeEach(async () => {
    if (!connection) return;
    
    // Clean up tables before each test
    try {
      await connection.execute('DELETE FROM posts');
      await connection.execute('DELETE FROM users');
    } catch (error) {
      // Tables might not exist yet, ignore error
      console.log('Tables not found, skipping cleanup');
    }
  });

  test('should connect to database', async () => {
    if (!connection) {
      console.log('Skipping test - no database connection');
      return;
    }
    
    const [rows] = await connection.execute('SELECT 1 as test');
    expect(rows[0].test).toBe(1);
  });

  test('should create and retrieve a user', async () => {
    if (!connection) {
      console.log('Skipping test - no database connection');
      return;
    }
    
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
    if (!connection) {
      console.log('Skipping test - no database connection');
      return;
    }
    
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