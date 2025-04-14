#!/usr/bin/env tsx
/**
 * Verify UUID Tables Script
 *
 * This script checks if UUID tables have the required columns.
 */
import dotenv from 'dotenv';
import { executeSQL } from '../utils/db/execute-sql.js';
// Setup environment
dotenv.config();
async function verifyUuidTables() {
    console.log(`=== UUID TABLES VERIFICATION ===`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log();
    try {
        // Test database connection
        console.log('Testing database connection...');
        const connectionTest = await executeSQL(`SELECT NOW() as time`);
        console.log(`Database connection successful, server time: ${connectionTest.rows?.[0]?.time || 'unknown'}`);
        // List all tables in the schema first
        console.log('\nListing all tables in payload schema...');
        const allTablesResult = await executeSQL(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'payload'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
        console.log(`Found ${allTablesResult.rows.length} total tables in payload schema`);
        console.log('First 10 tables:');
        for (let i = 0; i < Math.min(10, allTablesResult.rows.length); i++) {
            console.log(` - ${allTablesResult.rows[i].table_name}`);
        }
        // Look for tables that might be relationship tables
        console.log('\nChecking for relationship tables...');
        const relsTables = await executeSQL(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name LIKE '%_rels' 
      ORDER BY table_name
    `);
        console.log(`Found ${relsTables.rows.length} relationship tables (_rels suffix):`);
        for (const row of relsTables.rows) {
            console.log(` - ${row.table_name}`);
        }
        // Look for tables that have uuid columns
        console.log('\nChecking for UUID columns in tables...');
        const tablesWithUuidColumns = await executeSQL(`
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND data_type = 'uuid'
      ORDER BY table_name
    `);
        console.log(`Found ${tablesWithUuidColumns.rows.length} tables with UUID columns:`);
        for (let i = 0; i < Math.min(10, tablesWithUuidColumns.rows.length); i++) {
            console.log(` - ${tablesWithUuidColumns.rows[i].table_name}`);
        }
        if (tablesWithUuidColumns.rows.length > 10) {
            console.log(`   ... and ${tablesWithUuidColumns.rows.length - 10} more`);
        }
        // Check for tracking table
        console.log('\nChecking if dynamic_uuid_tables tracking table exists...');
        const trackingTableResult = await executeSQL(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'payload'
        AND table_name = 'dynamic_uuid_tables'
      ) as table_exists
    `);
        const trackingTableExists = trackingTableResult.rows?.[0]?.table_exists === true;
        if (trackingTableExists) {
            console.log('✅ dynamic_uuid_tables tracking table exists');
            // Check tracking table columns
            const columnsResult = await executeSQL(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = 'dynamic_uuid_tables'
      `);
            const columns = columnsResult.rows.map((row) => row.column_name);
            console.log(`Tracking table has columns: ${columns.join(', ')}`);
            // Build a safe query based on existing columns
            let query = 'SELECT table_name';
            if (columns.includes('has_downloads_id')) {
                query += ', has_downloads_id';
            }
            if (columns.includes('last_checked')) {
                query += ', last_checked';
            }
            query += ' FROM payload.dynamic_uuid_tables';
            if (columns.includes('last_checked')) {
                query += ' ORDER BY last_checked DESC';
            }
            // Execute the dynamic query
            const trackingEntries = await executeSQL(query);
            console.log(`Found ${trackingEntries.rows.length} entries in tracking table`);
            // Display entries based on available columns
            for (const entry of trackingEntries.rows) {
                let entryText = ` - ${entry.table_name}`;
                if (entry.has_downloads_id !== undefined) {
                    entryText += `: ${entry.has_downloads_id ? '✅' : '❌'} downloads_id column`;
                }
                if (entry.last_checked !== undefined) {
                    entryText += `, last checked at ${entry.last_checked}`;
                }
                console.log(entryText);
            }
        }
        else {
            console.log('❌ dynamic_uuid_tables tracking table does not exist');
        }
        // Check for missing path columns in UUID tables
        console.log('\nChecking for UUID tables missing the path column...');
        const missingPathResult = await executeSQL(`
      SELECT t.table_name
      FROM information_schema.tables t
      WHERE t.table_schema = 'payload'
      AND t.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
      AND NOT EXISTS (
        SELECT FROM information_schema.columns c
        WHERE c.table_schema = 'payload'
        AND c.table_name = t.table_name
        AND c.column_name = 'path'
      )
    `);
        const tablesWithoutPath = missingPathResult.rows.map((row) => row.table_name);
        if (tablesWithoutPath.length === 0) {
            console.log('✅ All UUID tables have the path column');
        }
        else {
            console.log(`❌ Found ${tablesWithoutPath.length} UUID tables missing the path column:`);
            for (const table of tablesWithoutPath) {
                console.log(` - ${table}`);
            }
        }
        // Check for the scanner function
        console.log('\nVerifying scan_and_fix_uuid_tables function exists...');
        const scannerFunctionResult = await executeSQL(`
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE pronamespace = 'payload'::regnamespace
        AND proname = 'scan_and_fix_uuid_tables'
      ) as function_exists
    `);
        const scannerFunctionExists = scannerFunctionResult.rows?.[0]?.function_exists === true;
        if (scannerFunctionExists) {
            console.log('✅ scan_and_fix_uuid_tables function exists');
        }
        else {
            console.log('❌ scan_and_fix_uuid_tables function does not exist');
        }
        // Check for the helper view
        console.log('\nVerifying downloads_relationships view exists...');
        const viewResult = await executeSQL(`
      SELECT EXISTS (
        SELECT FROM information_schema.views
        WHERE table_schema = 'payload'
        AND table_name = 'downloads_relationships'
      ) as view_exists
    `);
        const viewExists = viewResult.rows?.[0]?.view_exists === true;
        if (viewExists) {
            console.log('✅ downloads_relationships view exists');
            // Check the view's columns
            const viewColumnsResult = await executeSQL(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = 'downloads_relationships'
        ORDER BY ordinal_position
      `);
            const viewColumns = viewColumnsResult.rows.map((row) => row.column_name);
            console.log(`View has columns: ${viewColumns.join(', ')}`);
        }
        else {
            console.log('❌ downloads_relationships view does not exist');
        }
        console.log('\n=== SUMMARY ===');
        if (tablesWithoutPath.length === 0 && viewExists && scannerFunctionExists) {
            console.log('✅ All UUID tables have the required columns and support structures are in place');
            console.log('The "column X.path does not exist" errors should be resolved');
        }
        else {
            console.log('❌ Some UUID tables are missing the required columns or support structures');
            console.log('The "column X.path does not exist" errors may still occur');
        }
    }
    catch (error) {
        console.error('Error verifying UUID tables:', error);
    }
}
// Run the verification
verifyUuidTables().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
