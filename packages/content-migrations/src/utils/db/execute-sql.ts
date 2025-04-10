/**
 * Utility function to execute SQL statements against the database
 */
import dotenv from 'dotenv';
import path from 'path';
import pkg from 'pg';

const { Pool } = pkg;

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : process.env.NODE_ENV === 'test'
      ? '.env.test'
      : '.env.development';

// Load from root directory - use path relative to project root
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Database connection string from environment variables - check both possible names
const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URI;

if (!connectionString) {
  throw new Error(
    'Neither DATABASE_URL nor DATABASE_URI environment variables are set',
  );
}

// Configure the connection pool
const pool = new Pool({
  connectionString,
});

/**
 * Execute a SQL statement with optional parameters
 *
 * @param sql The SQL statement to execute
 * @param params Optional parameters for the SQL statement
 * @returns The result of the SQL statement
 */
export async function executeSQL(
  sql: string,
  params: any[] = [],
): Promise<any> {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(sql, params);
    return result;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Close the database connection pool
 * Should be called when the application is shutting down
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
