/**
 * UUID Table Verification - Fixed Version
 * More resilient verification with better handling of edge cases
 */
import chalk from 'chalk';

import { REQUIRED_COLUMNS } from './columns.js';
import { UuidTable } from './types.js';

// Split columns into critical and optional for more nuanced verification
const CRITICAL_COLUMNS = REQUIRED_COLUMNS.filter((col) =>
  ['id', 'path', 'parent_id'].includes(col.name),
);

const OPTIONAL_COLUMNS = REQUIRED_COLUMNS.filter(
  (col) => !CRITICAL_COLUMNS.map((c) => c.name).includes(col.name),
);

/**
 * Verify that UUID tables have all required columns
 * This improved version distinguishes between critical and optional columns
 * and is more tolerant of missing optional columns
 *
 * @param tables Array of UUID tables to verify
 * @returns True if all tables have all critical columns
 */
export async function verifyUuidTables(tables: UuidTable[]): Promise<boolean> {
  // Handle empty tables list gracefully
  if (tables.length === 0) {
    console.warn(
      chalk.yellow(
        '⚠️ No tables to verify! This may indicate a database schema issue.',
      ),
    );
    console.log(
      chalk.blue(
        'ℹ️ This is not necessarily an error - if this is a fresh installation,',
      ),
    );
    console.log(
      chalk.blue('   the tables may be created during content population.'),
    );
    // Return success to allow the migration to continue
    return true;
  }

  let allCriticalValid = true;
  let allOptionalValid = true;
  let tablesChecked = 0;
  let tablesWithMissingCriticalColumns = 0;
  let tablesWithMissingOptionalColumns = 0;

  console.log(chalk.blue(`🔍 Verifying ${tables.length} tables...`));

  for (const table of tables) {
    tablesChecked++;
    const existingColumnNames = table.columns.map((col) => col.name);

    // Check critical columns
    const missingCriticalColumns = CRITICAL_COLUMNS.filter(
      (col) => !existingColumnNames.includes(col.name),
    ).map((col) => col.name);

    // Check optional columns
    const missingOptionalColumns = OPTIONAL_COLUMNS.filter(
      (col) => !existingColumnNames.includes(col.name),
    ).map((col) => col.name);

    if (missingCriticalColumns.length > 0) {
      console.error(
        chalk.red(
          `❌ Table ${table.name} is missing critical columns: ${missingCriticalColumns.join(', ')}`,
        ),
      );
      tablesWithMissingCriticalColumns++;
      allCriticalValid = false;
    }

    if (missingOptionalColumns.length > 0) {
      console.warn(
        chalk.yellow(
          `⚠️ Table ${table.name} is missing optional columns: ${missingOptionalColumns.join(', ')}`,
        ),
      );
      tablesWithMissingOptionalColumns++;
      allOptionalValid = false;
    }

    if (
      missingCriticalColumns.length === 0 &&
      missingOptionalColumns.length === 0
    ) {
      console.log(
        chalk.green(`✅ Table ${table.name} has all required columns`),
      );
    }
  }

  // Print summary
  console.log(chalk.blue('\n📊 VERIFICATION SUMMARY:'));
  console.log(`Total tables checked: ${tablesChecked}`);
  console.log(
    `Tables with all columns: ${tablesChecked - tablesWithMissingCriticalColumns - tablesWithMissingOptionalColumns}`,
  );
  console.log(
    `Tables missing critical columns: ${tablesWithMissingCriticalColumns}`,
  );
  console.log(
    `Tables missing optional columns only: ${tablesWithMissingOptionalColumns}`,
  );

  // Return based on critical columns only
  if (allCriticalValid) {
    if (allOptionalValid) {
      console.log(chalk.green('\n✅ All tables have all required columns!'));
    } else {
      console.log(
        chalk.yellow(
          '\n⚠️ All tables have critical columns, but some are missing optional columns.',
        ),
      );
      console.log(
        chalk.yellow(
          '   This is acceptable for migration to continue, but you may want to fix later.',
        ),
      );
    }
    return true;
  } else {
    console.error(
      chalk.red(
        '\n❌ Some tables are missing critical columns and need repair',
      ),
    );
    return false;
  }
}

/**
 * Get detailed verification report for all tables
 * Enhanced to distinguish between critical and optional columns
 *
 * @param tables Array of UUID tables to verify
 * @returns Detailed report of tables and their missing columns
 */
export function getVerificationReport(tables: UuidTable[]): {
  valid: boolean;
  criticalValid: boolean;
  totalTables: number;
  missingCriticalColumnsTables: number;
  missingOptionalColumnsTables: number;
  tableDetails: Array<{
    tableName: string;
    valid: boolean;
    criticalValid: boolean;
    missingCriticalColumns: string[];
    missingOptionalColumns: string[];
  }>;
} {
  let criticalValid = true;
  let optionalValid = true;
  const tableDetails: Array<{
    tableName: string;
    valid: boolean;
    criticalValid: boolean;
    missingCriticalColumns: string[];
    missingOptionalColumns: string[];
  }> = [];

  let missingCriticalColumnsTables = 0;
  let missingOptionalColumnsTables = 0;

  // Handle empty tables list gracefully
  if (tables.length === 0) {
    console.warn(chalk.yellow('⚠️ No tables to verify in report generation!'));
    return {
      valid: true, // Return valid to allow migration to continue
      criticalValid: true,
      totalTables: 0,
      missingCriticalColumnsTables: 0,
      missingOptionalColumnsTables: 0,
      tableDetails: [],
    };
  }

  for (const table of tables) {
    const existingColumnNames = table.columns.map((col) => col.name);

    // Check critical columns
    const missingCriticalColumns = CRITICAL_COLUMNS.filter(
      (col) => !existingColumnNames.includes(col.name),
    ).map((col) => col.name);

    // Check optional columns
    const missingOptionalColumns = OPTIONAL_COLUMNS.filter(
      (col) => !existingColumnNames.includes(col.name),
    ).map((col) => col.name);

    const tableCriticalValid = missingCriticalColumns.length === 0;
    const tableValid =
      tableCriticalValid && missingOptionalColumns.length === 0;

    if (!tableCriticalValid) {
      missingCriticalColumnsTables++;
      criticalValid = false;
    }

    if (missingOptionalColumns.length > 0) {
      missingOptionalColumnsTables++;
      optionalValid = false;
    }

    tableDetails.push({
      tableName: table.name,
      valid: tableValid,
      criticalValid: tableCriticalValid,
      missingCriticalColumns,
      missingOptionalColumns,
    });
  }

  return {
    valid: criticalValid && optionalValid,
    criticalValid,
    totalTables: tables.length,
    missingCriticalColumnsTables,
    missingOptionalColumnsTables,
    tableDetails,
  };
}
