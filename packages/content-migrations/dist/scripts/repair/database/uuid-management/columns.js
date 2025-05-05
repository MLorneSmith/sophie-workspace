// Required columns that all UUID tables should have
export const REQUIRED_COLUMNS = [
    { name: 'id', dataType: 'text', isNullable: false },
    { name: 'parent_id', dataType: 'text', isNullable: true },
    { name: 'path', dataType: 'text', isNullable: true },
    { name: 'private_id', dataType: 'text', isNullable: true },
    { name: 'order', dataType: 'integer', isNullable: true },
    { name: 'course_id', dataType: 'text', isNullable: true },
    { name: 'course_lessons_id', dataType: 'text', isNullable: true },
    { name: 'course_quizzes_id', dataType: 'text', isNullable: true },
];
/**
 * Ensure UUID tables have all required columns
 * @param client PostgreSQL client (should be in an active transaction)
 * @param tables Array of UUID tables to process
 * @returns Object mapping table names to arrays of added column names
 */
export async function ensureRequiredColumns(client, tables) {
    const results = {};
    for (const table of tables) {
        try {
            const existingColumnNames = table.columns.map((col) => col.name);
            const addedColumns = [];
            // Add each required column if it doesn't exist
            for (const column of REQUIRED_COLUMNS) {
                if (!existingColumnNames.includes(column.name)) {
                    try {
                        const nullableText = column.isNullable ? 'NULL' : 'NOT NULL';
                        const query = `
              ALTER TABLE payload.${table.name} 
              ADD COLUMN IF NOT EXISTS ${column.name} ${column.dataType} ${nullableText}
            `;
                        await client.query(query);
                        addedColumns.push(column.name);
                    }
                    catch (error) {
                        console.error(`Error adding ${column.name} to ${table.name}:`, error);
                        // Continue with other columns even if one fails
                    }
                }
            }
            if (addedColumns.length > 0) {
                results[table.name] = addedColumns;
            }
        }
        catch (error) {
            console.error(`Error processing table ${table.name}:`, error);
        }
    }
    return results;
}
