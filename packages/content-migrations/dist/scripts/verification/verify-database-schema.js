/**
 * Verify Database Schema
 *
 * This script verifies that the database schema and tables exist.
 * It's designed to be called from the command line.
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
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });
/**
 * Verifies the database schema and tables
 */
async function verifyDatabaseSchema() {
    // Get database connection string
    const databaseUri = process.env.DATABASE_URI;
    if (!databaseUri) {
        throw new Error('DATABASE_URI environment variable is not set');
    }
    console.log(`Connecting to database: ${databaseUri}`);
    // Connect to database
    const pool = new pg.Pool({
        connectionString: databaseUri,
    });
    try {
        // Get a client from the pool
        const client = await pool.connect();
        try {
            console.log('Connected to database');
            // Check if payload schema exists
            const schemaResult = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'payload'");
            if (schemaResult.rows.length === 0) {
                console.error('❌ Payload schema does not exist');
                process.exit(1);
            }
            console.log('✅ Payload schema exists');
            // Check if tables exist
            const tablesResult = await client.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'payload'");
            const tableCount = parseInt(tablesResult.rows[0].count);
            if (tableCount === 0) {
                console.error('❌ No tables found in payload schema');
                process.exit(1);
            }
            console.log(`✅ Found ${tableCount} tables in payload schema`);
            // List all tables
            const listTablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' ORDER BY table_name");
            console.log('Tables in payload schema:');
            listTablesResult.rows.forEach((row) => {
                console.log(`  - ${row.table_name}`);
            });
            // Check relationship tables specifically
            const relsTablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' AND table_name LIKE '%_rels' ORDER BY table_name");
            console.log('\nRelationship tables:');
            relsTablesResult.rows.forEach((row) => {
                console.log(`  - ${row.table_name}`);
            });
            console.log('\nDatabase verification completed successfully');
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error verifying database schema:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
// Run the verification if this script is executed directly
if (import.meta.url === import.meta.resolve('./verify-database-schema.ts')) {
    verifyDatabaseSchema()
        .then(() => {
        console.log('Database verification completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Database verification failed:', error);
        process.exit(1);
    });
}
export { verifyDatabaseSchema };
