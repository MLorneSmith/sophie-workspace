import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

import { getLogger } from '../../utils/logging.js';

// Create a logger instance for this module
const logger = getLogger('UuidTableManager');

const { Client } = pg;

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../../../.env.development');
dotenv.config({ path: envPath });

/**
 * Consolidated UUID Table Manager
 *
 * This module provides a centralized approach to managing UUID tables created by Payload CMS.
 * It handles all required operations in a single transaction to improve performance and reliability.
 *
 * Features:
 * - Scans for all UUID-patterned tables
 * - Adds required columns in a single transaction
 * - Updates tracking table with discovered tables
 * - Uses proper error handling and transaction management
 */

interface UuidTableInfo {
  table_name: string;
  has_path_column: boolean;
  has_id_column: boolean;
  has_private_id_column: boolean;
}

/**
 * Main function to manage all UUID tables in a single operation
 */
export async function manageUuidTables() {
  logger.info('Starting consolidated UUID table management');

  // Get database connection string from environment variables
  const databaseUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URI or DATABASE_URL environment variable is required',
    );
  }

  // Create database client
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    // Connect to database
    await client.connect();
    logger.info('Connected to database');

    // 1. Begin transaction
    await client.query('BEGIN');

    // 2. Get all UUID tables in one query
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
    `);

    const allTables = result.rows;

    logger.info(`Found ${allTables.length} UUID-patterned tables to process`);

    // 3. Check which columns each table has to avoid redundant operations
    const tablesWithInfo = [];

    for (const table of allTables) {
      const columnsResult = await client.query(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = $1;
      `,
        [table.table_name],
      );

      const columnNames = columnsResult.rows.map((col) => col.column_name);

      tablesWithInfo.push({
        table_name: table.table_name,
        has_path_column: columnNames.includes('path'),
        has_id_column: columnNames.includes('id'),
        has_private_id_column: columnNames.includes('private_id'),
      });
    }

    // 4. Process all tables with efficient operations
    for (const table of tablesWithInfo) {
      // Skip tables that already have all required columns
      if (
        table.has_path_column &&
        table.has_id_column &&
        table.has_private_id_column
      ) {
        logger.info(
          `Table ${table.table_name} already has all required columns, skipping`,
        );
        continue;
      }

      // Build dynamic SQL to add only the missing columns
      const alterStatements = [];

      if (!table.has_path_column) {
        alterStatements.push(`ADD COLUMN IF NOT EXISTS "path" TEXT`);
      }

      if (!table.has_id_column) {
        alterStatements.push(`ADD COLUMN IF NOT EXISTS "id" TEXT`);
      }

      if (!table.has_private_id_column) {
        alterStatements.push(`ADD COLUMN IF NOT EXISTS "private_id" TEXT`);
      }

      if (alterStatements.length > 0) {
        const alterSql = `
          DO $$
          BEGIN
            ALTER TABLE payload.${table.table_name}
            ${alterStatements.join(',\n')};
          EXCEPTION WHEN others THEN
            RAISE NOTICE 'Error adding columns to %: %', '${table.table_name}', SQLERRM;
          END $$;
        `;

        await client.query(alterSql);
        logger.info(`Added missing columns to ${table.table_name}`);
      }

      // Add to tracking table if not already present
      await client.query(
        `
          INSERT INTO payload.dynamic_uuid_tables (table_name, primary_key, created_at)
          VALUES ($1, 'id', NOW())
          ON CONFLICT (table_name) DO NOTHING;
        `,
        [table.table_name],
      );
    }

    // 5. Commit all changes in one transaction
    await client.query('COMMIT');
    logger.info(
      `Successfully processed ${tablesWithInfo.length} UUID tables in a single transaction`,
    );

    // Close connection
    await client.end();
    return true;
  } catch (error) {
    // 6. Rollback on any error
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      logger.error('Error during rollback:', rollbackError);
    }

    logger.error('Error in consolidated UUID table management:', error);

    // Close connection even on error
    try {
      await client.end();
    } catch (closeError) {
      logger.error('Error closing database connection:', closeError);
    }

    throw error;
  }
}

/**
 * Run the manager if called directly from command line
 * Using ES modules pattern instead of CommonJS require.main check
 */
const isMainModule = import.meta.url.endsWith(process.argv[1]);
// Alternative check for tsx and other runners where the above might not work
const isRunDirectly =
  process.argv[1] &&
  process.argv[1].includes('consolidated-uuid-table-manager');

if (isMainModule || isRunDirectly) {
  manageUuidTables()
    .then(() => {
      logger.info('UUID table management completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('UUID table management failed:', error);
      process.exit(1);
    });
}
