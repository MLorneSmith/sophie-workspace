/**
 * Enhanced UUID table detection - finds all UUID-pattern tables at runtime
 * Uses regex pattern matching on table names to find all potential UUID tables
 */
import { executeSQL } from '../../../utils/db/execute-sql.js';

/**
 * Find all UUID-pattern tables in the Payload schema
 * Uses PostgreSQL regex pattern matching to identify tables with UUID naming pattern
 */
export async function findAllUuidTables() {
  try {
    // Query to find all tables with UUID pattern names in the payload schema
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'payload'
      AND table_name ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$'
    `;

    const result = await executeSQL(query);
    return result.rows.map((row) => row.table_name);
  } catch (error) {
    console.error('Error detecting UUID tables:', error);
    return [];
  }
}

/**
 * Verify if a table has all required columns
 * @param tableName The name of the table to check
 * @returns Object with information about existing and missing columns
 */
export async function verifyTableColumns(tableName: string) {
  try {
    const requiredColumns = ['id', 'order', 'parent_id', 'path', 'private_id'];

    const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = $1
    `;

    const columnsResult = await executeSQL(query, [tableName]);

    const existingColumns = columnsResult.rows.map((row) => row.column_name);
    const missingColumns = requiredColumns.filter(
      (column) => !existingColumns.includes(column),
    );

    return {
      tableName,
      hasAllColumns: missingColumns.length === 0,
      missingColumns,
      existingColumns,
    };
  } catch (error) {
    console.error(`Error verifying columns for table ${tableName}:`, error);
    return {
      tableName,
      hasAllColumns: false,
      missingColumns: ['Error verifying'],
      existingColumns: [],
    };
  }
}
