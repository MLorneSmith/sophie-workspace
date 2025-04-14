/**
 * Verify Database Schema
 *
 * This script verifies that the database schema and tables exist.
 * It's designed to be called from the command line or from the reset-and-migrate.ps1 script.
 */
import dotenv from 'dotenv';
// Import fs to check if file exists
import fs from 'fs';
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
// Try to load environment variables from different paths
const paths = [
    path.resolve(__dirname, '../../../../', envFile),
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
    console.warn(`Could not load environment variables from any of the paths: ${paths.join(', ')}`);
}
// Hardcode the DATABASE_URI if it's not set
if (!process.env.DATABASE_URI) {
    process.env.DATABASE_URI =
        'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';
    console.log('Using hardcoded DATABASE_URI:', process.env.DATABASE_URI);
}
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
            // Check for required tables
            const requiredTables = [
                'courses',
                'course_lessons',
                'course_quizzes',
                'quiz_questions',
                'surveys',
                'survey_questions',
            ];
            for (const table of requiredTables) {
                const tableResult = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = $1`, [table]);
                if (tableResult.rows.length === 0) {
                    console.error(`❌ Required table '${table}' does not exist`);
                    process.exit(1);
                }
                console.log(`✅ Required table '${table}' exists`);
            }
            // Check for relationship tables
            const relationshipTables = [
                'course_lessons_rels',
                'course_quizzes_rels',
                'quiz_questions_rels',
                'survey_questions_rels',
                'surveys_rels',
            ];
            for (const table of relationshipTables) {
                const tableResult = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = $1`, [table]);
                if (tableResult.rows.length === 0) {
                    console.error(`❌ Relationship table '${table}' does not exist`);
                    process.exit(1);
                }
                console.log(`✅ Relationship table '${table}' exists`);
            }
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
