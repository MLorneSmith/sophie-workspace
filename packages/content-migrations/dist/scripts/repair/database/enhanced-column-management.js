/**
 * Enhanced column management for UUID tables
 * Adds missing columns to UUID tables and ensures proper structure
 */
import { executeSQL } from '../../../utils/db/execute-sql.js';
import { findAllUuidTables, verifyTableColumns, } from './enhanced-uuid-detection.js';
/**
 * Add missing columns to a UUID table
 * @param tableName The name of the table to add columns to
 * @param missingColumns Array of column names to add
 * @returns Success flag
 */
export async function addMissingColumnsToTable(tableName, missingColumns) {
    // Start a transaction to ensure atomicity
    await executeSQL('BEGIN');
    try {
        for (const column of missingColumns) {
            try {
                // Add column based on its name with appropriate type
                let query = '';
                if (column === 'id') {
                    query = `
            ALTER TABLE payload.${tableName}
            ADD COLUMN IF NOT EXISTS id TEXT PRIMARY KEY
          `;
                }
                else if (column === 'order') {
                    query = `
            ALTER TABLE payload.${tableName}
            ADD COLUMN IF NOT EXISTS "order" INTEGER
          `;
                }
                else if (column === 'parent_id') {
                    query = `
            ALTER TABLE payload.${tableName}
            ADD COLUMN IF NOT EXISTS parent_id TEXT
          `;
                }
                else if (column === 'path') {
                    query = `
            ALTER TABLE payload.${tableName}
            ADD COLUMN IF NOT EXISTS path TEXT
          `;
                }
                else if (column === 'private_id') {
                    query = `
            ALTER TABLE payload.${tableName}
            ADD COLUMN IF NOT EXISTS private_id TEXT
          `;
                }
                if (query) {
                    await executeSQL(query);
                    console.log(`Added column ${column} to table ${tableName}`);
                }
            }
            catch (error) {
                console.error(`Error adding column ${column} to table ${tableName}:`, error);
                // Continue with other columns even if one fails
            }
        }
        // Commit the transaction
        await executeSQL('COMMIT');
        return true;
    }
    catch (error) {
        // Rollback the transaction on error
        try {
            await executeSQL('ROLLBACK');
        }
        catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        console.error(`Error adding columns to table ${tableName}:`, error);
        return false;
    }
}
/**
 * Fix all UUID tables by adding missing columns
 * @returns Success flag
 */
export async function fixAllUuidTables() {
    try {
        // Find all UUID tables
        const uuidTables = await findAllUuidTables();
        console.log(`Found ${uuidTables.length} UUID tables`);
        // Process each table
        for (const tableName of uuidTables) {
            // Verify columns
            const { hasAllColumns, missingColumns } = await verifyTableColumns(tableName);
            if (!hasAllColumns) {
                console.log(`Fixing table ${tableName}, missing columns: ${missingColumns.join(', ')}`);
                await addMissingColumnsToTable(tableName, missingColumns);
            }
            else {
                console.log(`Table ${tableName} has all required columns`);
            }
        }
        return true;
    }
    catch (error) {
        console.error('Error fixing UUID tables:', error);
        return false;
    }
}
