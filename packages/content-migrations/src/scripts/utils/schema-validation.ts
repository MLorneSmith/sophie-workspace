/**
 * Utility function to validate the database schema for migration scripts
 */
import { Pool, PoolClient } from 'pg';

/**
 * Validates the dynamic_uuid_tables schema and reports on available columns
 * @param client PostgreSQL client connection
 * @returns Object with validation results and column information
 */
export async function validateDynamicUuidTablesSchema(
  client: Pool | PoolClient,
) {
  try {
    // Check if dynamic_uuid_tables exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'dynamic_uuid_tables'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.error('ERROR: dynamic_uuid_tables table does not exist!');
      return {
        isValid: false,
        message: 'dynamic_uuid_tables table does not exist',
        columns: [],
      };
    }

    // Get columns and their data types
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'dynamic_uuid_tables';
    `);

    const columnNames = columnsResult.rows.map((row) => row.column_name);
    console.log(
      'Available columns in dynamic_uuid_tables:',
      columnNames.join(', '),
    );

    // Check for required columns
    const requiredColumns = ['table_name', 'created_at'];
    const missingColumns = requiredColumns.filter(
      (col) => !columnNames.includes(col),
    );

    if (missingColumns.length > 0) {
      console.error(
        `ERROR: Missing required columns: ${missingColumns.join(', ')}`,
      );
      return {
        isValid: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`,
        columns: columnNames,
      };
    }

    // Check if schema includes deprecated columns
    const hasDeprecatedLastChecked = columnNames.includes('last_checked');
    const hasDeprecatedHasParentId = columnNames.includes('has_parent_id');
    const hasDeprecatedHasDownloadsId =
      columnNames.includes('has_downloads_id');

    if (
      hasDeprecatedLastChecked ||
      hasDeprecatedHasParentId ||
      hasDeprecatedHasDownloadsId
    ) {
      console.log(
        'WARNING: Schema contains deprecated columns that might be removed in future versions.',
      );
    }

    return {
      isValid: true,
      message: 'Schema validation successful',
      columns: columnNames,
      hasDeprecatedColumns:
        hasDeprecatedLastChecked ||
        hasDeprecatedHasParentId ||
        hasDeprecatedHasDownloadsId,
    };
  } catch (error) {
    console.error('Error validating schema:', error);
    return {
      isValid: false,
      message: `Schema validation error: ${error instanceof Error ? error.message : String(error)}`,
      columns: [],
    };
  }
}

/**
 * Creates a compatible insert statement for the dynamic_uuid_tables table
 * that works with both old and new schema
 * @param client PostgreSQL client connection
 * @param tableName Name of the table to insert
 * @returns Promise<boolean> indicating success
 */
export async function safeInsertIntoUuidTablesTracking(
  client: Pool | PoolClient,
  tableName: string,
): Promise<boolean> {
  try {
    // First validate the schema
    const schemaInfo = await validateDynamicUuidTablesSchema(client);

    if (!schemaInfo.isValid) {
      console.error(
        `Cannot insert into dynamic_uuid_tables: ${schemaInfo.message}`,
      );
      return false;
    }

    // Create an appropriate SQL statement based on available columns
    const columns: string[] = ['table_name'];
    const values: any[] = [tableName];
    let paramCount = 1;

    // Add created_at or last_checked depending on what's available
    if (schemaInfo.columns.includes('created_at')) {
      columns.push('created_at');
      values.push(new Date());
      paramCount++;
    } else if (schemaInfo.columns.includes('last_checked')) {
      columns.push('last_checked');
      values.push(new Date());
      paramCount++;
    }

    // Add primary_key if available
    if (schemaInfo.columns.includes('primary_key')) {
      columns.push('primary_key');
      values.push('parent_id'); // Default to parent_id as the primary key
      paramCount++;
    }

    // Add needs_path_column if available
    if (schemaInfo.columns.includes('needs_path_column')) {
      columns.push('needs_path_column');
      values.push(true);
      paramCount++;
    }

    // Add has_downloads_id if available (deprecated but might exist)
    if (schemaInfo.columns.includes('has_downloads_id')) {
      columns.push('has_downloads_id');
      values.push(true);
      paramCount++;
    }

    // Add has_parent_id if available (deprecated but might exist)
    if (schemaInfo.columns.includes('has_parent_id')) {
      columns.push('has_parent_id');
      values.push(true);
      paramCount++;
    }

    // Construct the SQL with appropriate placeholders
    const placeholders = Array.from(
      { length: paramCount },
      (_, i) => `$${i + 1}`,
    ).join(', ');
    const updateParts = columns
      .slice(1) // Skip table_name which is the primary key
      .map((col, idx) => `${col} = $${idx + 2}`)
      .join(', ');

    const sql = `
      INSERT INTO payload.dynamic_uuid_tables (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (table_name) 
      DO UPDATE SET ${updateParts}
    `;

    await client.query(sql, values);
    console.log(`Successfully tracked UUID table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Error tracking UUID table ${tableName}:`, error);
    return false;
  }
}
