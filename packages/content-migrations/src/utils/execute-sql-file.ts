/**
 * SQL File Execution Utility
 *
 * This utility executes SQL files directly against the database.
 * It's used for seeding data and other SQL-based operations.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

// Try to load environment variables from different paths
const paths = [
  path.resolve(__dirname, '../../../', envFile),
  path.resolve(__dirname, '../../', envFile),
  path.resolve(__dirname, '../', envFile),
  path.resolve(__dirname, './', envFile),
];

// Try each path until we find one that works
let loaded = false;
let envPath = '';
for (const p of paths) {
  if (fs.existsSync(p)) {
    envPath = p;
    dotenv.config({ path: p });
    console.log(`Loaded environment variables from ${p}`);
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.warn(
    `Could not load environment variables from any of the paths: ${paths.join(', ')}`,
  );
}

// Load environment variables immediately when the module is imported
dotenv.config({ path: envPath });
console.log('Loading environment variables from:', envPath);

/**
 * Executes a SQL file against the database
 * @param filePath - Path to the SQL file
 * @returns Promise that resolves when the SQL file has been executed
 */
export async function executeSqlFile(filePath: string): Promise<void> {
  // Check if environment variables are loaded
  if (!process.env.DATABASE_URI) {
    console.error(
      'DATABASE_URI environment variable is not set. Loading from:',
      envPath,
    );
    // Try to load environment variables again
    dotenv.config({ path: envPath });

    // If still not set, throw an error
    if (!process.env.DATABASE_URI) {
      throw new Error('DATABASE_URI environment variable is not set');
    }
  }

  // Get database connection string
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Executing SQL file: ${filePath}`);

  // Read SQL file
  if (!fs.existsSync(filePath)) {
    throw new Error(`SQL file not found: ${filePath}`);
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  // Connect to database
  const pool = new pg.Pool({
    connectionString: databaseUri,
  });

  try {
    // Get a client from the pool
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // Start a transaction
      await client.query('BEGIN');

      try {
        // Execute SQL
        await client.query(sql);

        // Commit the transaction
        await client.query('COMMIT');
        console.log(`Successfully executed SQL file: ${filePath}`);
      } catch (error) {
        // Rollback the transaction if an error occurs
        await client.query('ROLLBACK');
        console.error('Transaction rolled back due to error:', error);
        throw error;
      }
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}
