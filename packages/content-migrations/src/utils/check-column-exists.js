/**
 * Utility function to check if a column exists in a table and return the actual column name
 * This handles the case where tables might use either parent_id or _parent_id
 */
import pg from 'pg';

/**
 * Checks if a column exists in a table
 * @param {pg.PoolClient} client The database client
 * @param {string} schema The schema name
 * @param {string} table The table name
 * @param {string[]} columnNames Array of possible column names to check
 * @returns {Promise<string|null>} The actual column name if found, null otherwise
 */
export async function checkColumnExists(client, schema, table, columnNames) {
  for (const columnName of columnNames) {
    const result = await client.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = $2 
        AND column_name = $3
      );
    `,
      [schema, table, columnName],
    );

    if (result.rows[0].exists) {
      return columnName;
    }
  }

  return null;
}
