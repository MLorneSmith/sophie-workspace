/**
 * Utility script to run a SQL query directly
 * Used by the hook integration script to verify bunny_video_id values
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../../.env.development');
console.log(`Loading environment variables from: ${envPath}`);
dotenv.config({ path: envPath });

/**
 * Run a SQL query directly
 * @param query The SQL query to run
 */
async function runSql(query: string): Promise<void> {
  console.log(`Executing SQL query: ${query}`);

  // Get database connection string from environment variables
  const databaseUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URI or DATABASE_URL environment variable is required',
    );
  }

  console.log('Connecting to database');

  // Create database client
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Execute query
    const result = await client.query(query);

    // Log result (for verification purposes)
    if (result.rows && result.rows.length > 0) {
      console.log('Query result:');
      console.table(result.rows);
    } else {
      console.log('Query executed successfully (no rows returned)');
    }

    // Close connection
    await client.end();
    console.log('Successfully executed SQL query');
  } catch (error) {
    console.error('Error executing SQL query:', error);
    // Close connection even if error occurred
    await client.end();
    throw error;
  }
}

// Execute the function if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  // Get query from command line arguments
  const query = process.argv[2];
  if (!query) {
    console.error('SQL query is required');
    process.exit(1);
  }

  runSql(query)
    .then(() => {
      console.log('SQL query completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error during SQL query execution:', error);
      process.exit(1);
    });
}

export default runSql;
