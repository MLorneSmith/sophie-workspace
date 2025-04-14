/**
 * Fix UUID Tables Script for Migrations
 *
 * This script is designed to be a compatibility layer for the reset-and-migrate.ps1 script.
 * It simply forwards to the new implementation in run-uuid-tables-fix.ts which uses
 * direct SQL execution for better compatibility.
 *
 * Usage:
 *   pnpm --filter @kit/content-migrations run fix:uuid-tables
 */
import { runUuidTablesFix } from './run-uuid-tables-fix';
/**
 * Execute the UUID tables fix
 */
async function fixUuidTables() {
    console.log('Forwarding to new UUID tables fix implementation...');
    return await runUuidTablesFix();
}
// Simple immediate invocation of the main function
// Since this is intended to be run as a script, we can just run it directly
if (require.main === module) {
    fixUuidTables()
        .then((success) => {
        if (success) {
            console.log('UUID tables scan completed successfully');
            process.exit(0);
        }
        else {
            console.log('UUID tables scan completed with issues');
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error('Error running UUID tables scan:', error);
        process.exit(1);
    });
}
export { fixUuidTables };
