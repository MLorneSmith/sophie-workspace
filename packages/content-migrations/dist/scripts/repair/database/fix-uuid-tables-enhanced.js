/**
 * Enhanced UUID table fix script
 * Detects and fixes UUID tables with missing columns
 *
 * Run with: pnpm tsx src/scripts/repair/database/fix-uuid-tables-enhanced.ts
 *
 * This script:
 * 1. Finds all UUID-pattern tables in the database
 * 2. Checks each table for required columns
 * 3. Adds missing columns to tables that need them
 * 4. Implements monitoring for future tables
 * 5. Provides detailed logging of changes made
 */
import { repairUuidTables } from './uuid-management/index.js';
/**
 * Main entry point
 */
async function main() {
    console.log('Starting enhanced UUID table fix with monitoring...');
    try {
        // Run comprehensive UUID table management with enhanced features
        const result = await repairUuidTables({
            addMissingColumns: true,
            createMonitoring: true,
            verifyAfterRepair: true,
            logLevel: 'info',
        });
        console.log(`Tables scanned: ${result.tablesScanned}`);
        console.log(`Tables fixed: ${result.tablesFixed}`);
        if (Object.keys(result.columnsAdded).length > 0) {
            console.log('Columns added:');
            for (const [table, columns] of Object.entries(result.columnsAdded)) {
                console.log(`- ${table}: ${columns.join(', ')}`);
            }
        }
        if (result.monitoringEnabled) {
            console.log('✅ Monitoring system enabled successfully');
        }
        if (Object.keys(result.errors).length > 0) {
            console.warn('⚠️ Errors occurred during the process:');
            for (const [key, error] of Object.entries(result.errors)) {
                console.warn(`- ${key}: ${error}`);
            }
            process.exit(1);
        }
        console.log('✅ Enhanced UUID table fix completed successfully');
    }
    catch (error) {
        console.error('❌ Error during enhanced UUID table fix:', error);
        process.exit(1);
    }
}
// Execute the main function
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
