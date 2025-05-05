/**
 * Critical Columns Fixer for UUID Tables
 *
 * This script adds missing critical columns to UUID tables. It focuses only on
 * the most important columns needed for proper functionality, making the repair
 * process more targeted and efficient.
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
// Import environment setup utility
import { ensureEnvFile } from '../../../utils/ensure-env-file.js';
// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
const projectRoot = path.resolve(__dirname, '../../../../../../');
dotenv.config({ path: path.resolve(projectRoot, '.env') });
// Get environment variables from .env.development file
try {
    const envFilePath = path.resolve(__dirname, '../../../../../.env.development');
    console.log(`Loading environment variables from: ${envFilePath}`);
    dotenv.config({ path: envFilePath });
}
catch (error) {
    console.warn('Could not load .env.development file:', error);
    // Try alternate path in case we're running from different location
    const alternatePath = path.resolve(__dirname, '../../../../../../.env.development');
    console.log(`Trying alternate path: ${alternatePath}`);
    dotenv.config({ path: alternatePath });
}
// Database connection settings
const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL;
if (!DATABASE_URI) {
    throw new Error('DATABASE_URI environment variable not set');
}
// Critical columns that must exist in all UUID tables
const CRITICAL_COLUMNS = [
    { name: 'id', dataType: 'text', isNullable: false },
    { name: 'parent_id', dataType: 'text', isNullable: true },
    { name: 'path', dataType: 'text', isNullable: true },
];
// Additional helpful columns
const OPTIONAL_COLUMNS = [
    { name: 'private_id', dataType: 'text', isNullable: true },
    { name: 'order', dataType: 'integer', isNullable: true },
    { name: 'course_id', dataType: 'text', isNullable: true },
    { name: 'course_lessons_id', dataType: 'text', isNullable: true },
    { name: 'course_quizzes_id', dataType: 'text', isNullable: true },
];
/**
 * Main function to fix critical columns
 */
async function fixCriticalColumns() {
    console.log(chalk.blue('=== FIXING CRITICAL UUID TABLE COLUMNS ==='));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    const client = new pg.Client({ connectionString: DATABASE_URI });
    try {
        await client.connect();
        console.log('Connected to database');
        // Begin transaction
        await client.query('BEGIN');
        try {
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
            console.log(chalk.blue(`Found ${uuidTables.length} UUID tables to check`));
            // Statistics tracking
            let tablesWithMissingCriticalColumns = 0;
            let columnsAdded = 0;
            let tablesFixed = 0;
            const fixedDetails = {};
            // Process each UUID table
            for (const tableName of uuidTables) {
                console.log(chalk.cyan(`Checking table: ${tableName}`));
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
                const missingCriticalColumns = CRITICAL_COLUMNS.filter((col) => !existingColumns.includes(col.name));
                if (missingCriticalColumns.length > 0) {
                    console.log(chalk.yellow(`Table ${tableName} is missing critical columns: ${missingCriticalColumns.map((c) => c.name).join(', ')}`));
                    tablesWithMissingCriticalColumns++;
                    fixedDetails[tableName] = [];
                    // Add each missing critical column
                    for (const column of missingCriticalColumns) {
                        try {
                            const nullableText = column.isNullable ? 'NULL' : 'NOT NULL';
                            const query = `
                ALTER TABLE payload.${tableName} 
                ADD COLUMN IF NOT EXISTS ${column.name} ${column.dataType} ${nullableText}
              `;
                            await client.query(query);
                            console.log(chalk.green(`Added ${column.name} to ${tableName}`));
                            columnsAdded++;
                            fixedDetails[tableName].push(column.name);
                        }
                        catch (error) {
                            console.error(chalk.red(`Error adding ${column.name} to ${tableName}:`), error);
                        }
                    }
                    tablesFixed++;
                }
                else {
                    console.log(chalk.green(`Table ${tableName} has all required critical columns`));
                }
                // Optionally add helpful columns
                for (const column of OPTIONAL_COLUMNS) {
                    if (!existingColumns.includes(column.name)) {
                        try {
                            const nullableText = column.isNullable ? 'NULL' : 'NOT NULL';
                            const query = `
                ALTER TABLE payload.${tableName} 
                ADD COLUMN IF NOT EXISTS ${column.name} ${column.dataType} ${nullableText}
              `;
                            await client.query(query);
                            console.log(chalk.gray(`Added optional column ${column.name} to ${tableName}`));
                            if (!fixedDetails[tableName]) {
                                fixedDetails[tableName] = [];
                            }
                            fixedDetails[tableName].push(column.name);
                            columnsAdded++;
                        }
                        catch (error) {
                            // Just log optional column errors, don't stop the process
                            console.warn(chalk.yellow(`Could not add optional column ${column.name} to ${tableName}:`, error.message));
                        }
                    }
                }
            }
            // Create a view that provides an overview of all UUID tables
            try {
                const createViewQuery = `
          CREATE OR REPLACE VIEW payload.uuid_tables_overview AS
          SELECT 
            t.table_name,
            ${CRITICAL_COLUMNS.map((col) => `
              EXISTS (
                SELECT 1 FROM information_schema.columns c 
                WHERE c.table_schema = 'payload' 
                AND c.table_name = t.table_name 
                AND c.column_name = '${col.name}'
              ) as has_${col.name}`).join(',')}
          FROM (
            SELECT tablename as table_name
            FROM pg_tables
            WHERE schemaname = 'payload' AND (
              tablename ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
              OR tablename ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
            )
          ) t;
        `;
                await client.query(createViewQuery);
                console.log(chalk.green('Created uuid_tables_overview view for monitoring'));
            }
            catch (error) {
                console.warn(chalk.yellow('Could not create overview view:', error.message));
            }
            // Commit transaction
            await client.query('COMMIT');
            // Print statistics
            console.log(chalk.blue('\n=== UUID TABLES FIX SUMMARY ==='));
            console.log(`Total UUID tables found: ${uuidTables.length}`);
            console.log(`Tables with missing critical columns: ${tablesWithMissingCriticalColumns}`);
            console.log(`Tables fixed: ${tablesFixed}`);
            console.log(`Total columns added: ${columnsAdded}`);
            if (tablesFixed > 0) {
                console.log(chalk.green('\nUUID tables have been successfully fixed!'));
            }
            else {
                console.log(chalk.green('\nAll UUID tables already have the required columns.'));
            }
            return {
                success: true,
                tablesChecked: uuidTables.length,
                tablesFixed,
                columnsAdded,
                fixedDetails,
            };
        }
        catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            console.error(chalk.red('Error fixing UUID tables:'), error);
            return { success: false, error: error.message };
        }
    }
    catch (error) {
        console.error(chalk.red('Database connection error:'), error);
        return { success: false, error: error.message };
    }
    finally {
        await client.end();
        console.log('Database connection closed');
    }
}
// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // First ensure environment is set up
    ensureEnvFile()
        .then(() => {
        return fixCriticalColumns();
    })
        .then((result) => {
        if (result.success) {
            console.log(chalk.green('Critical columns fix completed successfully'));
            process.exit(0);
        }
        else {
            console.error(chalk.red('Critical columns fix failed:'), result.error);
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error(chalk.red('Unhandled error:'), error);
        process.exit(1);
    });
}
export { fixCriticalColumns };
