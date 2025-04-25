/**
 * Comprehensive UUID Table Management CLI
 *
 * This script runs the complete UUID table management process:
 * 1. Detects all UUID tables
 * 2. Adds missing columns to each table
 * 3. Sets up monitoring for future UUID tables
 * 4. Verifies all tables have the required columns
 */
import { repairUuidTables } from '../repair.js';

async function main() {
  console.log('Starting comprehensive UUID table management...');

  try {
    const result = await repairUuidTables({
      addMissingColumns: true,
      createMonitoring: true,
      verifyAfterRepair: true,
      logLevel: 'info',
    });

    console.log('UUID table management completed successfully');
    console.log(`Tables scanned: ${result.tablesScanned}`);
    console.log(`Tables fixed: ${result.tablesFixed}`);

    if (Object.keys(result.columnsAdded).length > 0) {
      console.log('Columns added:');
      for (const [table, columns] of Object.entries(result.columnsAdded)) {
        console.log(`- ${table}: ${columns.join(', ')}`);
      }
    }

    if (result.monitoringEnabled) {
      console.log('Monitoring system enabled successfully');
    }

    if (Object.keys(result.errors).length > 0) {
      console.warn('Errors occurred during the process:');
      for (const [key, error] of Object.entries(result.errors)) {
        console.warn(`- ${key}: ${error}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error running UUID table management:', error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
main();
