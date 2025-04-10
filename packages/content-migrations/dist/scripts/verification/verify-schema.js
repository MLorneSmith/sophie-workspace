"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Schema Verification Utility
 *
 * This utility verifies that a database schema exists.
 * It's designed to be called from the command line or from the reset-and-migrate.ps1 script.
 */
const dotenv_1 = __importDefault(require("dotenv"));
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
console.log(`Loading environment variables from ${envFile}`);
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, `../../../${envFile}`) });
/**
 * Verifies that a database schema exists
 * @param schemaName - The name of the schema to verify
 */
async function verifySchema(schemaName) {
    // Get database connection string
    const databaseUri = process.env.DATABASE_URI;
    if (!databaseUri) {
        console.error('DATABASE_URI environment variable is not set');
        process.exit(1);
    }
    console.log(`Connecting to database: ${databaseUri}`);
    // Connect to database
    const pool = new pg_1.default.Pool({
        connectionString: databaseUri,
    });
    try {
        const client = await pool.connect();
        try {
            console.log(`Checking if schema '${schemaName}' exists...`);
            // Check if schema exists
            const result = await client.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [schemaName]);
            if (result.rows.length > 0) {
                console.log(`Schema '${schemaName}' exists`);
                process.exit(0);
            }
            else {
                console.error(`Schema '${schemaName}' does not exist`);
                process.exit(1);
            }
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error verifying schema:', error);
        process.exit(1);
    }
    finally {
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
