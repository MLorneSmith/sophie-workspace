/**
 * Database connection pool utility for content migrations
 * Provides a centralized pool configuration for all database operations
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
const { Pool } = pg;
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
// Load from root of the content-migrations package
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });
// Get the database connection string from the environment variables
const databaseUri = process.env.DATABASE_URI;
if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
}
// Create and export a single pool instance for reuse
export const pool = new Pool({
    connectionString: databaseUri,
});
// Log database connection issues
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
// Connection test function
export async function testConnection() {
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()');
        return true;
    }
    catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
    finally {
        client.release();
    }
}
