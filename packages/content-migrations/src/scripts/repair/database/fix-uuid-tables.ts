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
// Import from same directory since we moved the file
// Using .js extension as required by NodeNext module resolution
import { runUuidTablesFix } from './run-uuid-tables-fix.js';

/**
 * Execute the UUID tables fix
 */
async function fixUuidTables(): Promise<boolean> {
  console.log('Forwarding to new UUID tables fix implementation...');
  return await runUuidTablesFix();
}

// In ESM, we immediately invoke the main function when this file is run directly
// This is the ESM equivalent of the CommonJS `if (require.main === module)` check
// The import.meta.url check ensures this only runs when the script is called directly
if (
  import.meta.url.endsWith('fix-uuid-tables.js') ||
  import.meta.url.endsWith('fix-uuid-tables.ts')
) {
  fixUuidTables()
    .then((success) => {
      if (success) {
        console.log('UUID tables scan completed successfully');
        process.exit(0);
      } else {
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
