/**
 * Run UUID Tables Fix Script
 *
 * This script executes the SQL fix directly instead of using complex libraries.
 * It's a simpler approach that directly executes our SQL fix script.
 *
 * Usage:
 *   pnpm --filter @kit/content-migrations run fix:uuid-tables
 */
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup environment
const projectRoot = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.resolve(projectRoot, '.env') });

// Get DATABASE_URI from environment
const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL;
if (!DATABASE_URI) {
  throw new Error('DATABASE_URI environment variable not set');
}

async function runUuidTablesFix(): Promise<boolean> {
  console.log('=== RUNNING UUID TABLES FIX ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Locate the SQL fix script
    const sqlScriptPath = path.resolve(
      projectRoot,
      'apps/payload/src/scripts/uuid-tables-fix.sql',
    );

    if (!fs.existsSync(sqlScriptPath)) {
      console.error(`SQL script not found at: ${sqlScriptPath}`);
      return false;
    }

    console.log(`Executing SQL script: ${sqlScriptPath}`);

    // Execute the SQL script using psql
    const result = execSync(`psql "${DATABASE_URI}" -f "${sqlScriptPath}"`, {
      encoding: 'utf-8',
    });

    console.log('SQL script executed successfully');
    console.log(result);

    return true;
  } catch (error: any) {
    console.error('Error executing UUID tables fix:', error.message || error);
    return false;
  }
}

// Auto-execute the fix - in ES modules with type:module, the script is always
// executed even when imported, so we run the function directly
runUuidTablesFix()
  .then((success) => {
    if (success) {
      console.log('UUID tables scan completed successfully');
    } else {
      console.log('UUID tables scan completed with issues');
      // Only exit with error code if running directly from command line
      if (process.argv[1]?.includes('run-uuid-tables-fix.ts')) {
        process.exit(1);
      }
    }
  })
  .catch((error) => {
    console.error('Error running UUID tables fix:', error);
    // Only exit with error code if running directly from command line
    if (process.argv[1]?.includes('run-uuid-tables-fix.ts')) {
      process.exit(1);
    }
  });

export { runUuidTablesFix };
