/**
 * UUID Table Monitoring CLI
 *
 * This script sets up the monitoring system for UUID tables
 * without modifying any existing tables.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { createMonitoringSystem } from '../monitoring.js';
// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../../../../../../../.env.development');
dotenv.config({ path: envPath });
async function main() {
    console.log('Setting up UUID table monitoring system...');
    // Get database connection string from environment variables
    const databaseUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URI or DATABASE_URL environment variable is required');
        process.exit(1);
    }
    // Create database client
    const client = new pg.Client({
        connectionString: databaseUrl,
    });
    try {
        // Connect to database
        await client.connect();
        console.log('Connected to database');
        // Begin transaction
        await client.query('BEGIN');
        try {
            // Set up monitoring system
            const success = await createMonitoringSystem(client);
            if (success) {
                // Commit transaction
                await client.query('COMMIT');
                console.log('✅ UUID table monitoring system set up successfully');
                process.exit(0);
            }
            else {
                // Rollback transaction
                await client.query('ROLLBACK');
                console.error('❌ Failed to set up UUID table monitoring system');
                process.exit(1);
            }
        }
        catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Error setting up UUID table monitoring system:', error);
        process.exit(1);
    }
    finally {
        // Close database connection
        await client.end();
        console.log('Database connection closed');
    }
}
// Run the main function if this script is executed directly
main();
