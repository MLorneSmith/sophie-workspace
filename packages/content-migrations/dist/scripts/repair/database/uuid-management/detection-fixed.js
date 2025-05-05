/**
 * Detect all relationship tables in the Payload schema
 * This enhanced version prioritizes relationship tables with _rels suffix
 * since those are what actually exist in our database
 */
export async function detectUuidTables(client) {
    try {
        // Query to find relationship tables and UUID pattern tables
        // Prioritizing relationship tables which we know exist
        const query = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'payload' 
      AND (
        -- Match relationship tables (primary focus)
        tablename LIKE '%\_rels'
        OR
        -- Match other known relationship tables
        tablename IN ('downloads_rels', 'course_quizzes_rels', 'quiz_questions_rels')
        OR
        -- Match standard UUID pattern tables (secondary focus)
        tablename ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$'
      )
      ORDER BY 
        -- Order relationship tables first
        CASE WHEN tablename LIKE '%\_rels' THEN 0 ELSE 1 END,
        tablename
    `;
        const tablesResult = await client.query(query);
        // Early warning if no tables found at all
        if (tablesResult.rows.length === 0) {
            console.warn('⚠️ No relationship or UUID tables found in payload schema! This is unusual.');
            // Don't return early - instead continue with empty array
        }
        else {
            console.log(`📊 Found ${tablesResult.rows.length} tables to verify`);
        }
        // Process each table to get detailed information
        const uuidTables = [];
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
    }
    catch (error) {
        console.error('❌ Error detecting tables:', error);
        return [];
    }
}
/**
 * Get detailed column information for a table
 * @param client PostgreSQL client
 * @param tableName The name of the table to check
 * @returns Array of column information
 */
async function getTableColumns(client, tableName) {
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
    }
    catch (error) {
        console.error(`❌ Error getting columns for table ${tableName}:`, error);
        return [];
    }
}
