/**
 * Database utility functions for executing SQL queries
 * Designed for ES Module compatibility
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Calculate the project root for environment variable loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

// Load environment variables with better error handling
try {
  dotenv.config({ path: path.join(projectRoot, '.env.development') });
  console.log('Loaded environment variables from .env.development');
} catch (error) {
  console.log('Could not load dotenv, using default connection string');
}

// Use named import to make it clear we're using the PostgreSQL client
const { Pool } = pg;

// Connection pool for reuse
let pool: pg.Pool | null = null;

/**
 * Get database connection pool (singleton pattern)
 * @returns PostgreSQL connection pool
 */
export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';

    console.log(`Attempting to connect to database: ${connectionString}`); // More specific log

    try {
      pool = new Pool({ connectionString });
      console.log('Database pool created successfully.'); // Success log
    } catch (poolError) {
      console.error('!!! FAILED TO CREATE DATABASE POOL !!!', poolError); // Explicit error log
      throw poolError; // Re-throw to ensure script fails if pool creation fails
    }

    // Add error handler to prevent silent failures
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  return pool;
}

/**
 * Execute SQL query with proper error handling
 * @param query SQL query string
 * @param params Optional query parameters
 * @returns Query result
 */
export async function executeSQL(
  query: string,
  params: any[] = [],
): Promise<pg.QueryResult> {
  const client = await getPool().connect();
  try {
    return await client.query(query, params);
  } catch (error) {
    console.error(`SQL Error executing query: ${query.substring(0, 100)}...`);
    console.error(`Error details: ${error}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close all database connections (for cleanup)
 */
export async function closeConnections(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connections closed');
  }
}

// Export the pg types for convenience
export { pg };
