/**
 * Enhanced database connection utility for Quiz System Repair
 * Uses the same successful approach as older scripts
 */
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import path from 'path';
import postgres from 'postgres';
import { fileURLToPath } from 'url';
import { getLogger } from '../../../../utils/logging.js';
const logger = getLogger('QuizSystemDB');
// Calculate the project root for environment variable loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../../');
// Initialize connection
let db = null;
/**
 * Load environment variables from project root
 */
export function loadEnvironmentVariables() {
    try {
        const envPath = path.join(projectRoot, '.env.development');
        dotenv.config({ path: envPath });
        logger.info(`Loaded environment variables from ${envPath}`);
    }
    catch (error) {
        logger.warning('Could not load dotenv, will use default connection string');
    }
}
/**
 * Get database connection with enhanced error handling
 * @returns Drizzle ORM database instance
 */
export async function getDbConnection(options = {}) {
    // If we already have a connection, return it
    if (db) {
        return db;
    }
    // Load environment variables first
    loadEnvironmentVariables();
    // Use DATABASE_URI (like older scripts) or DATABASE_URL, with fallback
    const schemaName = options.schema || 'payload';
    // PostgreSQL doesn't support schema in connection string as a query parameter
    // So we'll connect first, then set the schema using search_path
    // Make sure to parse any connection string to strip out schema=xyz parameters
    let connectionString = process.env.DATABASE_URI ||
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:54322/postgres';
    // Remove any ?schema= parameter if present
    if (connectionString.includes('?schema=')) {
        connectionString = connectionString.replace(/\?schema=[^&]+(&.*)?$/, '$1');
        // If we ended up with just a ? at the end, remove it
        if (connectionString.endsWith('?')) {
            connectionString = connectionString.slice(0, -1);
        }
    }
    logger.info(`Connecting to database: ${connectionString}`);
    logger.info(`Using database schema: ${schemaName}`);
    try {
        // Create client with proper configuration
        const client = postgres(connectionString, {
            max: 10,
            idle_timeout: 20,
            connect_timeout: 10,
        });
        // Create Drizzle instance
        db = drizzle(client);
        // Set schema via search_path after connection is established
        await db.execute(`SET search_path TO ${schemaName}, public;`);
        logger.info(`Set search path to schema: ${schemaName}`);
        // Test connection
        const testResult = await db.execute('SELECT 1 as test');
        // Drizzle ORM returns array directly, not { rows: [] }
        if (testResult && Array.isArray(testResult) && testResult.length > 0) {
            logger.info('Database connection established successfully');
        }
        else {
            throw new Error('Connection test failed - unexpected result format');
        }
        return db;
    }
    catch (error) {
        logger.error('Failed to establish database connection', error);
        throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Close database connection
 */
export async function closeDbConnection() {
    if (db) {
        // Note: postgres.js doesn't expose a direct way to close all connections
        // This is a limitation compared to pg's pool.end()
        logger.info('Database connections will be closed automatically');
        db = null;
    }
}
