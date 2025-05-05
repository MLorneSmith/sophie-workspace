/**
 * UUID Table Verification
 * Verifies that UUID tables have all required columns
 */
import { REQUIRED_COLUMNS } from './columns.js';
/**
 * Verify that UUID tables have all required columns
 *
 * @param tables Array of UUID tables to verify
 * @returns True if all tables have all required columns
 */
export async function verifyUuidTables(tables) {
    let allValid = true;
    let tablesChecked = 0;
    let tablesWithMissingColumns = 0;
    console.log(`Verifying ${tables.length} UUID tables...`);
    for (const table of tables) {
        tablesChecked++;
        const existingColumnNames = table.columns.map((col) => col.name);
        const missingColumns = REQUIRED_COLUMNS.filter((col) => !existingColumnNames.includes(col.name)).map((col) => col.name);
        if (missingColumns.length > 0) {
            console.error(`Table ${table.name} is missing columns: ${missingColumns.join(', ')}`);
            tablesWithMissingColumns++;
            allValid = false;
        }
    }
    if (allValid) {
        console.log(`✅ All ${tablesChecked} UUID tables have the required columns`);
    }
    else {
        console.error(`❌ ${tablesWithMissingColumns} out of ${tablesChecked} UUID tables are missing required columns`);
    }
    return allValid;
}
/**
 * Get detailed verification report for all tables
 *
 * @param tables Array of UUID tables to verify
 * @returns Detailed report of tables and their missing columns
 */
export function getVerificationReport(tables) {
    let valid = true;
    const tableDetails = [];
    let missingColumnsTables = 0;
    for (const table of tables) {
        const existingColumnNames = table.columns.map((col) => col.name);
        const missingColumns = REQUIRED_COLUMNS.filter((col) => !existingColumnNames.includes(col.name)).map((col) => col.name);
        const tableValid = missingColumns.length === 0;
        if (!tableValid) {
            missingColumnsTables++;
            valid = false;
        }
        tableDetails.push({
            tableName: table.name,
            valid: tableValid,
            missingColumns,
        });
    }
    return {
        valid,
        totalTables: tables.length,
        missingColumnsTables,
        tableDetails,
    };
}
