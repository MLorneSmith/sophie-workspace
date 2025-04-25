/**
 * Enhanced UUID Table Detection
 * Uses PostgreSQL metadata tables to find UUID pattern tables
 */
import pg from 'pg';

import { ColumnInfo, UuidTable } from './types.js';

/**
 * Detect all UUID tables in the Payload schema
 * Uses PostgreSQL metadata queries to identify tables with UUID naming patterns
 */
export async function detectUuidTables(
  client: pg.Client,
): Promise<UuidTable[]> {
  try {
    // Query to find tables with UUID pattern names in the payload schema
    const query = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'payload' 
      AND (
        -- Match standard UUID pattern tables
        tablename ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$'
        OR
        -- Match relationship tables
        tablename LIKE '%\_rels'
        OR
        -- Match other known relationship tables
        tablename IN ('downloads_rels', 'course_quizzes_rels', 'quiz_questions_rels')
      )
    `;

    const tablesResult = await client.query(query);

    // Process each table to get detailed information
    const uuidTables: UuidTable[] = [];
    for (const row of tablesResult.rows) {
      const tableName = row.tablename;
      const columns = await getTableColumns(client, tableName);

      uuidTables.push({
        name: tableName,
        schema: 'payload',
        existsInDatabase: true,
        columns,
      });
    }

    return uuidTables;
  } catch (error) {
    console.error('Error detecting UUID tables:', error);
    return [];
  }
}

/**
 * Get detailed column information for a table
 * @param client PostgreSQL client
 * @param tableName The name of the table to check
 * @returns Array of column information
 */
async function getTableColumns(
  client: pg.Client,
  tableName: string,
): Promise<ColumnInfo[]> {
  try {
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'payload' 
      AND table_name = $1
    `;

    const columnsResult = await client.query(query, [tableName]);

    return columnsResult.rows.map((row) => ({
      name: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable === 'YES',
      exists: true,
    }));
  } catch (error) {
    console.error(`Error getting columns for table ${tableName}:`, error);
    return [];
  }
}
