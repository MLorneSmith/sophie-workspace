"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Count Table Records
 *
 * This script counts the number of records in a specified table.
 * It's designed to be called from the command line or from the reset-and-migrate.ps1 script.
 *
 * Usage: tsx count-table-records.ts <schema> <table>
 * Example: tsx count-table-records.ts payload course_lessons
 */
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = __importDefault(require("pg"));
const url_1 = require("url");
// Get the current file's directory
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
// Try to load environment variables from different paths
const paths = [
    path_1.default.resolve(__dirname, '../../../../', envFile),
    path_1.default.resolve(__dirname, '../../../', envFile),
    path_1.default.resolve(__dirname, '../../', envFile),
    path_1.default.resolve(__dirname, '../', envFile),
    path_1.default.resolve(__dirname, './', envFile),
];
// Try each path until we find one that works
let loaded = false;
let envPath = '';
for (const p of paths) {
    if (fs_1.default.existsSync(p)) {
        envPath = p;
        dotenv_1.default.config({ path: p });
        console.log(`Loaded environment variables from ${p}`);
        loaded = true;
        break;
    }
}
if (!loaded) {
    console.warn(`Could not load environment variables from any of the paths: ${paths.join(', ')}`);
}
async function countTableRecords() {
    // Get the schema and table from command line arguments
    const schema = process.argv[2];
    const table = process.argv[3];
    if (!schema || !table) {
        console.error('Usage: tsx count-table-records.ts <schema> <table>');
        process.exit(1);
    }
    // Check if environment variables are loaded
    if (!process.env.DATABASE_URI) {
        console.error('DATABASE_URI environment variable is not set. Loading from:', envPath);
        // Try to load environment variables again
        dotenv_1.default.config({ path: envPath });
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
    // Connect to database
    const pool = new pg_1.default.Pool({
        connectionString: databaseUri,
    });
    try {
        console.log(`Counting records in ${schema}.${table}...`);
        // Get a client from the pool
        const client = await pool.connect();
        try {
            // Count the records
            const result = await client.query(`
        SELECT COUNT(*) as count FROM ${schema}.${table}
      `);
            // Get the count
            const count = result.rows[0].count;
            // Log the count
            console.log(`Count: ${count}`);
            // Return success
            process.exit(0);
        }
        catch (error) {
            console.error('Error counting records:', error);
            process.exit(1);
        }
        finally {
            client.release();
        }
    }
    finally {
        await pool.end();
    }
}
// Run the function if this script is executed directly
countTableRecords();
