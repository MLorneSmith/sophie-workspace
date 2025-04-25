/**
 * UUID Table Repair CLI
 *
 * This script focuses only on adding required columns to UUID tables,
 * without setting up monitoring or performing verification.
 */
import { repairUuidTables } from '../repair.js';

async function main() {
  console.log('Starting UUID table repair...');

  try {
    const result = await repairUuidTables({
      addMissingColumns: true,
      createMonitoring: false,
      verifyAfterRepair: false,
    });

    console.log('UUID table repair completed');
    console.log(`Tables scanned: ${result.tablesScanned}`);
    console.log(`Tables fixed: ${result.tablesFixed}`);

    if (Object.keys(result.columnsAdded).length > 0) {
      console.log('Columns added:');
      for (const [table, columns] of Object.entries(result.columnsAdded)) {
        console.log(`- ${table}: ${columns.join(', ')}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error repairing UUID tables:', error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
main();
