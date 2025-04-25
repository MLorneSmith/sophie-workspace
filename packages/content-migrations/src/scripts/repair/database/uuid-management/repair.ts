/**
 * UUID Table Repair
 * Main implementation for repairing UUID tables
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

import { ensureRequiredColumns } from './columns.js';
import { detectUuidTables } from './detection.js';
import { createMonitoringSystem } from './monitoring.js';
import { RepairOptions, RepairResult } from './types.js';
import { verifyUuidTables } from './verification.js';

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../../../../../../.env.development');
dotenv.config({ path: envPath });

/**
 * Main function to repair all UUID tables
 *
 * @param options Configuration options for the repair process
 * @returns Results of the repair process
 */
export async function repairUuidTables(
  options: Partial<RepairOptions> = {},
): Promise<RepairResult> {
  // Default options
  const defaultOptions: RepairOptions = {
    addMissingColumns: true,
    createMonitoring: true,
    verifyAfterRepair: true,
    logLevel: 'info',
  };

  const config = { ...defaultOptions, ...options };
  const result: RepairResult = {
    tablesScanned: 0,
    tablesFixed: 0,
    columnsAdded: {},
    errors: {},
    monitoringEnabled: false,
  };

  // Get database connection string from environment variables
  const databaseUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
  if (!databaseUrl) {
    const error =
      'DATABASE_URI or DATABASE_URL environment variable is required';
    console.error(error);
    result.errors['connection'] = error;
    return result;
  }

  // Create database client
  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Begin transaction
    await client.query('BEGIN');

    try {
      // Step 1: Detect UUID tables
      const tables = await detectUuidTables(client);
      result.tablesScanned = tables.length;
      console.log(`Detected ${tables.length} UUID tables`);

      // Step 2: Add missing columns if configured
      if (config.addMissingColumns) {
        const columnResults = await ensureRequiredColumns(client, tables);
        result.tablesFixed = Object.keys(columnResults).length;
        result.columnsAdded = columnResults;
        console.log(`Added missing columns to ${result.tablesFixed} tables`);
      }

      // Step 3: Create monitoring system if configured
      if (config.createMonitoring) {
        result.monitoringEnabled = await createMonitoringSystem(client);
        console.log(
          `Monitoring system ${result.monitoringEnabled ? 'enabled' : 'failed to enable'}`,
        );
      }

      // Step 4: Verify tables if configured
      if (config.verifyAfterRepair) {
        // Re-detect tables to get updated column information
        const updatedTables = await detectUuidTables(client);
        await verifyUuidTables(updatedTables);
      }

      // Commit transaction
      await client.query('COMMIT');
      console.log('Transaction committed successfully');
    } catch (error) {
      // Rollback transaction if any error occurs
      await client.query('ROLLBACK');
      console.error('Error during repair, transaction rolled back:', error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error repairing UUID tables:', error);
    if (error instanceof Error) {
      result.errors['general'] = error.message;
    } else {
      result.errors['general'] = 'Unknown error';
    }
    return result;
  } finally {
    // Close database connection
    try {
      await client.end();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}
