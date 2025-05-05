/**
 * Critical Columns Verification
 *
 * This script verifies that all UUID tables have the required critical columns.
 * It scans the database for UUID tables and checks each one for the presence
 * of id, parent_id, and path columns.
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
const projectRoot = path.resolve(__dirname, '../../../../../');
dotenv.config({ path: path.resolve(projectRoot, '.env') });
// Get environment variables from .env.development file
try {
    const envFilePath = path.resolve(__dirname, '../../.env.development');
    console.log(`Loading environment variables from: ${envFilePath}`);
    dotenv.config({ path: envFilePath });
}
catch (error) {
    console.warn('Could not load .env.development file:', error);
    // Try alternate path in case we're running from different location
    const alternatePath = path.resolve(__dirname, '../../../.env.development');
    console.log(`Trying alternate path: ${alternatePath}`);
    dotenv.config({ path: alternatePath });
}
// Database connection settings
const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL;
if (!DATABASE_URI) {
    throw new Error('DATABASE_URI environment variable not set');
}
// Required critical columns that all UUID tables must have
const CRITICAL_COLUMNS = [
    { name: 'id', dataType: 'text' },
    { name: 'parent_id', dataType: 'text' },
    { name: 'path', dataType: 'text' },
];
/**
 * Main verification function
 */
async function verifyCriticalColumns(verbose = false) {
    console.log(chalk.blue('=== VERIFYING CRITICAL UUID TABLE COLUMNS ==='));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    const client = new pg.Client({ connectionString: DATABASE_URI });
    try {
        await client.connect();
        console.log('Connected to database');
        // Find all UUID tables
        const uuidTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'payload'
      AND (
        table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
        OR table_name ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
      )
      ORDER BY table_name;
    `;
        const tablesResult = await client.query(uuidTablesQuery);
        const uuidTables = tablesResult.rows.map((row) => row.table_name);
        if (uuidTables.length === 0) {
            console.log(chalk.yellow('No UUID tables found in the payload schema.'));
            return { success: true, message: 'No UUID tables found' };
        }
        console.log(chalk.blue(`Found ${uuidTables.length} UUID tables to verify`));
        // Statistics tracking
        let tablesWithMissingColumns = 0;
        let totalMissingColumns = 0;
        const tablesWithIssues = [];
        // Process each UUID table
        for (const tableName of uuidTables) {
            if (verbose) {
                console.log(chalk.cyan(`Checking table: ${tableName}`));
            }
            // Get existing columns
            const columnsQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = $1;
      `;
            const columnsResult = await client.query(columnsQuery, [tableName]);
            const existingColumns = columnsResult.rows.map((row) => row.column_name);
            // Check for missing critical columns
            const missingColumns = CRITICAL_COLUMNS.filter((col) => !existingColumns.includes(col.name)).map((col) => col.name);
            if (missingColumns.length > 0) {
                tablesWithMissingColumns++;
                totalMissingColumns += missingColumns.length;
                tablesWithIssues.push({
                    tableName,
                    missingColumns,
                });
                console.log(chalk.red(`Table ${tableName} is missing critical columns: ${missingColumns.join(', ')}`));
            }
            else if (verbose) {
                console.log(chalk.green(`Table ${tableName} has all required critical columns`));
            }
        }
        // Print statistics
        console.log(chalk.blue('\n=== VERIFICATION SUMMARY ==='));
        console.log(`Total UUID tables found: ${uuidTables.length}`);
        console.log(`Tables with missing critical columns: ${tablesWithMissingColumns}`);
        console.log(`Total missing columns: ${totalMissingColumns}`);
        if (tablesWithIssues.length > 0) {
            console.log(chalk.red('\nTables with issues:'));
            for (const table of tablesWithIssues) {
                console.log(`  ${table.tableName}: missing ${table.missingColumns.join(', ')}`);
            }
            return {
                success: false,
                tablesChecked: uuidTables.length,
                tablesWithIssues: tablesWithMissingColumns,
                totalMissingColumns,
                details: tablesWithIssues,
            };
        }
        else {
            console.log(chalk.green('\nAll UUID tables have the required critical columns!'));
            return {
                success: true,
                tablesChecked: uuidTables.length,
            };
        }
    }
    catch (error) {
        console.error(chalk.red('Error verifying critical columns:'), error);
        return { success: false, error: error.message };
    }
    finally {
        await client.end();
        console.log('Database connection closed');
    }
}
// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
    verifyCriticalColumns(verbose)
        .then((result) => {
        if (result.success) {
            console.log(chalk.green('Verification completed successfully'));
            process.exit(0);
        }
        else if (result.tablesWithIssues) {
            console.error(chalk.red('Verification failed: Some tables are missing critical columns'));
            process.exit(1);
        }
        else {
            console.error(chalk.red('Verification failed:'), result.error);
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error(chalk.red('Unhandled error:'), error);
        process.exit(1);
    });
}
export { verifyCriticalColumns };
