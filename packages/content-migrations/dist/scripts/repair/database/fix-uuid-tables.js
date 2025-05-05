/**
 * Fix UUID Tables Script for Migrations
 *
 * This script is designed to be a compatibility layer for the reset-and-migrate.ps1 script.
 * It forwards to the new enhanced implementation in the uuid-management directory.
 *
 * Usage:
 *   pnpm --filter @kit/content-migrations run fix:uuid-tables
 */
import { repairUuidTables } from './uuid-management/index.js';
/**
 * Execute the UUID tables fix
 */
export async function fixUuidTables() {
    console.log('Using updated UUID table management - forwarding to new implementation');
    try {
        const result = await repairUuidTables({
            addMissingColumns: true,
            createMonitoring: true,
            verifyAfterRepair: true,
        });
        return result.tablesFixed > 0 || result.monitoringEnabled;
    }
    catch (error) {
        console.error('Error in UUID table management:', error);
        return false;
    }
}
// In ESM, we immediately invoke the main function when this file is run directly
// This is the ESM equivalent of the CommonJS `if (require.main === module)` check
if (import.meta.url.endsWith('fix-uuid-tables.js') ||
    import.meta.url.endsWith('fix-uuid-tables.ts')) {
    fixUuidTables()
        .then((success) => {
        if (success) {
            console.log('UUID tables management completed successfully');
            process.exit(0);
        }
        else {
            console.log('UUID tables management completed without changes');
            // Exit with success code since no changes needed is not an error
            process.exit(0);
        }
    })
        .catch((error) => {
        console.error('Error running UUID tables management:', error);
        process.exit(1);
    });
}
