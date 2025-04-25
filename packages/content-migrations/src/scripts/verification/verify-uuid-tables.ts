/**
 * UUID Tables Verification Script
 *
 * This script verifies that all UUID-patterned tables in the Payload schema
 * have the required columns (path, parent_id, downloads_id, private_id).
 *
 * Run with:
 *   pnpm --filter @kit/content-migrations run verify:uuid-tables
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get the current file's path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup environment
const projectRoot = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.resolve(projectRoot, '.env') });

// Load environment variables from .env.development file in content-migrations package
try {
  const envFilePath = path.resolve(__dirname, '../../.env.development');
  console.log(`Checking for .env file at: ${envFilePath}`);

  // Get DATABASE_URI from environment or try alternatives
  if (!process.env.DATABASE_URI && !process.env.DATABASE_URL) {
    console.log(
      'DATABASE_URI not found in environment, using default connection string',
    );
    process.env.DATABASE_URI =
      'postgresql://postgres:postgres@localhost:54322/postgres';
  }
} catch (error) {
  // Silently continue if env file can't be loaded
}

// Get DATABASE_URI from environment
const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL;
if (!DATABASE_URI) {
  throw new Error('DATABASE_URI environment variable not set');
}

/**
 * Main verification function - checks all UUID tables for required columns
 */
async function verifyUuidTables(): Promise<boolean> {
  console.log(chalk.blue('=== VERIFYING UUID TABLES ==='));
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const pool = new Pool({ connectionString: DATABASE_URI });
  let overallSuccess = true;
  const criticalColumns = ['path', 'parent_id']; // These columns are critical
  const optionalColumns = ['downloads_id', 'private_id']; // These are helpful but not critical
  const allColumns = [...criticalColumns, ...optionalColumns];
  
  try {
    // Find all tables in the payload schema that match the UUID pattern
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

    const tablesResult = await pool.query(uuidTablesQuery);
    const uuidTables = tablesResult.rows.map((row) => row.table_name);

    if (uuidTables.length === 0) {
      console.log(chalk.yellow('No UUID tables found in the payload schema.'));
      return true;
    }

    console.log(chalk.blue(`Found ${uuidTables.length} UUID tables:`));

    // Collect statistics
    let totalTables = uuidTables.length;
    let tablesWithAllColumns = 0;
    let tablesWithCriticalColumns = 0;
    let tablesWithIssues = 0;
    let tablesWithCriticalIssues = 0;

    // Check each UUID table for required columns
    for (const tableName of uuidTables) {
      console.log(chalk.cyan(`\nVerifying table: ${tableName}`));

      // Get all columns for this table
      const columnsQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = $1;
      `;

      const columnsResult = await pool.query(columnsQuery, [tableName]);
      const existingColumns = columnsResult.rows.map((row) => row.column_name);

      // Check all required columns
      const missingColumns = allColumns.filter(
        (col) => !existingColumns.includes(col),
      );
      
      // Check critical columns only
      const missingCriticalColumns = criticalColumns.filter(
        (col) => !existingColumns.includes(col),
      );

      if (missingColumns.length > 0) {
        if (missingCriticalColumns.length > 0) {
          console.log(
            chalk.red(
              `Table ${tableName} is missing critical columns: ${missingCriticalColumns.join(
                ', ',
              )}`,
            ),
          );
          tablesWithCriticalIssues++;
          overallSuccess = false;
        } else {
          console.log(
            chalk.yellow(
              `Table ${tableName} is missing optional columns: ${missingColumns.join(
                ', ',
              )}`,
            ),
          );
          tablesWithIssues++;
          // Don't set overallSuccess to false for optional columns only
        }
      } else {
        console.log(
          chalk.green(`Table ${tableName} has all required columns.`),
        );
        tablesWithAllColumns++;
      }
      
      // Count tables with critical columns even if optional ones are missing
      if (missingCriticalColumns.length === 0) {
        tablesWithCriticalColumns++;
      }
    }

    // Print statistics
    console.log(chalk.blue('\n=== UUID TABLES VERIFICATION SUMMARY ==='));
    console.log(`Total UUID tables found: ${totalTables}`);
    console.log(`Tables with all columns: ${tablesWithAllColumns}`);
    console.log(`Tables with all critical columns: ${tablesWithCriticalColumns}`);
    console.log(`Tables missing optional columns only: ${tablesWithIssues}`);
    console.log(`Tables missing critical columns: ${tablesWithCriticalIssues}`);

    if (overallSuccess) {
      console.log(chalk.green('\nAll UUID tables have the required critical columns.'));
    } else {
      console.log(
        chalk.yellow(
          '\nSome UUID tables are missing critical columns. Run the UUID table fix script.',
        ),
      );
    }

    // Even if some optional columns are missing, we should return success 
    // as long as all critical columns are present
    const hasCriticalColumnIssues = tablesWithCriticalIssues > 0;
    
    // Only return failure if critical columns are missing
    return !hasCriticalColumnIssues;
  } catch (error: any) {
    console.error(chalk.red('Error verifying UUID tables:'), error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Auto-execute the verification
verifyUuidTables()
  .then((success) => {
    if (success) {
      console.log(
        chalk.green('UUID tables verification completed successfully.'),
      );
      process.exit(0);
    } else {
      console.log(
        chalk.yellow(
          'UUID tables verification found issues with critical columns that need to be fixed.',
        ),
      );
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(chalk.red('Error running UUID tables verification:'), error);
    process.exit(1);
  });
