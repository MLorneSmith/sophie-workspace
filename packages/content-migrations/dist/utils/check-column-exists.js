/**
 * Checks if a column exists in a table
 * @param client The database client
 * @param schema The schema name
 * @param table The table name
 * @param columnNames Array of possible column names to check
 * @returns The actual column name if found, null otherwise
 */
export async function checkColumnExists(client, schema, table, columnNames) {
    for (const columnName of columnNames) {
        const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = $2 
        AND column_name = $3
      );
    `, [schema, table, columnName]);
        if (result.rows[0].exists) {
            return columnName;
        }
    }
    return null;
}
