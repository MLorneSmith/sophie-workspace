/**
 * UUID Table Verification CLI
 *
 * This script checks if all UUID tables have the required columns
 * without making any changes to the database.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { detectUuidTables } from '../detection.js';
import { getVerificationReport } from '../verification.js';
// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../../../../../../../.env.development');
dotenv.config({ path: envPath });
async function main() {
    console.log('Starting UUID table verification...');
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
        // Detect UUID tables
        const tables = await detectUuidTables(client);
        console.log(`Found ${tables.length} UUID tables to verify`);
        // Get detailed verification report
        const report = getVerificationReport(tables);
        // Display report in a readable format
        console.log('\nUUID Table Verification Report:');
        console.log(`Total tables: ${report.totalTables}`);
        console.log(`Tables with missing columns: ${report.missingColumnsTables} (${Math.round((report.missingColumnsTables / report.totalTables) * 100)}%)`);
        // Show tables with missing columns
        if (report.missingColumnsTables > 0) {
            console.log('\nTables with missing columns:');
            report.tableDetails
                .filter((detail) => !detail.valid)
                .forEach((detail) => {
                console.log(`- ${detail.tableName}: missing ${detail.missingColumns.join(', ')}`);
            });
        }
        // Exit with appropriate code
        if (report.valid) {
            console.log('\n✅ All UUID tables have the required columns');
            process.exit(0);
        }
        else {
            console.error('\n❌ Some UUID tables are missing required columns. Run the repair script to fix them.');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Error verifying UUID tables:', error);
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
