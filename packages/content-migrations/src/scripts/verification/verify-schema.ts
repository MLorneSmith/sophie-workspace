/**
 * Schema Verification Utility
 *
 * This utility verifies that a database schema exists.
 * It's designed to be called from the command line or from the reset-and-migrate.ps1 script.
 */
import dotenv from 'dotenv';
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

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });

/**
 * Verifies that a database schema exists
 * @param schemaName - The name of the schema to verify
 */
async function verifySchema(schemaName: string): Promise<void> {
  // Get database connection string
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    console.error('DATABASE_URI environment variable is not set');
    process.exit(1);
  }

  console.log(`Connecting to database: ${databaseUri}`);

  // Connect to database
  const pool = new pg.Pool({
    connectionString: databaseUri,
  });

  try {
    const client = await pool.connect();
    try {
      console.log(`Checking if schema '${schemaName}' exists...`);

      // Check if schema exists
      const result = await client.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        [schemaName],
      );

      if (result.rows.length > 0) {
        console.log(`Schema '${schemaName}' exists`);
        process.exit(0);
      } else {
        console.error(`Schema '${schemaName}' does not exist`);
        process.exit(1);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get schema name from command line argument
const schemaName = process.argv[2];
if (!schemaName) {
  console.error('Schema name is required');
  process.exit(1);
}

verifySchema(schemaName);
