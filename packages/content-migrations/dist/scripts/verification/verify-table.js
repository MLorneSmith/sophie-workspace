/**
 * Table Verification Utility
 *
 * This utility verifies that a database table exists in a specific schema.
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
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });
/**
 * Verifies that a database table exists in a specific schema
 * @param schemaName - The name of the schema containing the table
 * @param tableName - The name of the table to verify
 */
async function verifyTable(schemaName, tableName) {
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
            console.log(`Checking if table '${schemaName}.${tableName}' exists...`);
            // Check if table exists
            const result = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`, [schemaName, tableName]);
            if (result.rows.length > 0) {
                console.log(`Table '${schemaName}.${tableName}' exists`);
                process.exit(0);
            }
            else {
                console.error(`Table '${schemaName}.${tableName}' does not exist`);
                process.exit(1);
            }
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error verifying table:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
// Get schema and table names from command line arguments
const schemaName = process.argv[2];
const tableName = process.argv[3];
if (!schemaName || !tableName) {
    console.error('Schema name and table name are required');
    process.exit(1);
}
verifyTable(schemaName, tableName);
