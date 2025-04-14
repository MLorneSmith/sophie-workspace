/**
 * Verify Relationship Columns
 *
 * This script verifies that the necessary relationship columns exist in the database tables
 * and that the helper functions and views have been created by the fix migration.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
const { Pool } = pg;
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : process.env.NODE_ENV === 'test'
        ? '.env.test'
        : '.env.development';
// Load from root directory - use path relative to project root
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
// Database connection string from environment variables - check both possible variable names
const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URI;
if (!connectionString) {
    console.error('Neither DATABASE_URL nor DATABASE_URI environment variables are set');
    console.error('Please make sure one of these variables is defined in your .env file');
    console.error('Expected format: postgresql://username:password@host:port/database?schema=payload');
    process.exit(1);
}
// Configure the pool
const pool = new Pool({
    connectionString,
});
/**
 * Main verification function
 */
async function verifyRelationshipColumns() {
    console.log('\nVerifying relationship columns...');
    try {
        // 1. Verify critical relationship tables have the required columns
        console.log('\n1. Checking relationship tables for required columns...');
        const requiredRelTables = [
            'documentation_rels',
            'courses_rels',
            'course_lessons_rels',
            'course_quizzes_rels',
            'downloads_rels',
        ];
        const criticalColumns = [
            'parent_id',
            'downloads_id',
            'documentation_id',
            'courses_id',
            'course_lessons_id',
            'course_quizzes_id',
        ];
        let missingColumns = false;
        for (const table of requiredRelTables) {
            const tableColumns = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = $1
      `, [table]);
            const existingColumns = tableColumns.rows.map((row) => row.column_name);
            console.log(`\nChecking table: payload.${table}`);
            for (const column of criticalColumns) {
                if (!existingColumns.includes(column)) {
                    console.error(`❌ Missing column ${column} in table payload.${table}`);
                    missingColumns = true;
                }
                else {
                    console.log(`✅ Column ${column} exists in table payload.${table}`);
                }
            }
        }
        if (missingColumns) {
            console.error('\n❌ Some required columns are missing in relationship tables!');
        }
        else {
            console.log('\n✅ All relationship tables have required columns.');
        }
        // 2. Verify the downloads_relationships view exists
        console.log('\n2. Verifying downloads_relationships view exists...');
        const viewCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'payload' 
        AND table_name = 'downloads_relationships'
      ) as view_exists
    `);
        if (viewCheck.rows[0].view_exists) {
            console.log('✅ downloads_relationships view exists.');
        }
        else {
            console.error('❌ downloads_relationships view does not exist!');
            missingColumns = true;
        }
        // 3. Check for the ensure_relationship_columns function
        console.log('\n3. Verifying ensure_relationship_columns function exists...');
        const functionCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'payload' 
        AND p.proname = 'ensure_relationship_columns'
      ) as function_exists
    `);
        if (functionCheck.rows[0].function_exists) {
            console.log('✅ ensure_relationship_columns function exists.');
        }
        else {
            console.error('❌ ensure_relationship_columns function does not exist!');
            missingColumns = true;
        }
        // Final status report
        if (missingColumns) {
            console.error('\n❌ VERIFICATION FAILED: Some relationship columns, views or functions are missing!');
            return false;
        }
        else {
            console.log('\n✅ VERIFICATION PASSED: All relationship columns, views and functions exist.');
            return true;
        }
    }
    catch (error) {
        console.error('\n❌ Error verifying relationship columns:', error);
        return false;
    }
    finally {
        await pool.end();
    }
}
// Run the verification
verifyRelationshipColumns()
    .then((success) => {
    process.exit(success ? 0 : 1);
})
    .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
