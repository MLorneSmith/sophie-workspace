"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSqlFile = executeSqlFile;
/**
 * SQL File Execution Utility
 *
 * This utility executes SQL files directly against the database.
 * It's used for seeding data and other SQL-based operations.
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
// Load environment variables immediately when the module is imported
dotenv_1.default.config({ path: envPath });
console.log('Loading environment variables from:', envPath);
/**
 * Executes a SQL file against the database
 * @param filePath - Path to the SQL file
 * @returns Promise that resolves when the SQL file has been executed
 */
async function executeSqlFile(filePath) {
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
    console.log(`Executing SQL file: ${filePath}`);
    // Read SQL file
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error(`SQL file not found: ${filePath}`);
    }
    const sql = fs_1.default.readFileSync(filePath, 'utf8');
    // Connect to database
    const pool = new pg_1.default.Pool({
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
            }
            catch (error) {
                // Rollback the transaction if an error occurs
                await client.query('ROLLBACK');
                console.error('Transaction rolled back due to error:', error);
                throw error;
            }
        }
        finally {
            client.release();
        }
    }
    finally {
        await pool.end();
    }
}
