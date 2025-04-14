/**
 * Verify All Script
 *
 * This script runs a comprehensive verification of all aspects of the database.
 * It checks tables, relationships, and schema structure to ensure everything is correct.
 */
import { executeSQL } from '../../utils/db/execute-sql.js';
import verifyTodoFields from './verify-todo-fields.js';
async function verifyAll() {
    console.log('=== DATABASE VERIFICATION ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log();
    let success = true;
    try {
        // Verify schema exists
        const schemaResult = await executeSQL(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata
        WHERE schema_name = 'payload'
      ) as schema_exists;
    `);
        const schemaExists = schemaResult.rows?.[0]?.schema_exists === true;
        if (schemaExists) {
            console.log('✅ Payload schema exists');
        }
        else {
            console.log('❌ Payload schema does not exist');
            success = false;
        }
        // Verify core tables exist
        const coreTables = [
            'courses',
            'course_lessons',
            'course_quizzes',
            'quiz_questions',
            'surveys',
            'survey_questions',
        ];
        for (const table of coreTables) {
            const tableResult = await executeSQL(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND table_name = '${table}'
        ) as table_exists;
      `);
            const tableExists = tableResult.rows?.[0]?.table_exists === true;
            if (tableExists) {
                console.log(`✅ Table 'payload.${table}' exists`);
            }
            else {
                console.log(`❌ Table 'payload.${table}' does not exist`);
                success = false;
            }
        }
        // Verify relationship tables
        const relationshipTables = [
            'course_lessons_rels',
            'course_quizzes_rels',
            'quiz_questions_rels',
            'surveys_rels',
            'survey_questions_rels',
        ];
        for (const table of relationshipTables) {
            const tableResult = await executeSQL(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND table_name = '${table}'
        ) as table_exists;
      `);
            const tableExists = tableResult.rows?.[0]?.table_exists === true;
            if (tableExists) {
                console.log(`✅ Relationship table 'payload.${table}' exists`);
            }
            else {
                console.log(`❌ Relationship table 'payload.${table}' does not exist`);
                success = false;
            }
        }
        // Verify UUID table tracking system exists
        const trackingTableResult = await executeSQL(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'payload'
        AND table_name = 'dynamic_uuid_tables'
      ) as table_exists;
    `);
        const trackingTableExists = trackingTableResult.rows?.[0]?.table_exists === true;
        if (trackingTableExists) {
            console.log('✅ dynamic_uuid_tables tracking table exists');
        }
        else {
            console.log('❌ dynamic_uuid_tables tracking table does not exist');
            success = false;
        }
        // Verify scan_and_fix_uuid_tables function exists
        const scannerFunctionResult = await executeSQL(`
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE pronamespace = 'payload'::regnamespace 
        AND proname = 'scan_and_fix_uuid_tables'
      ) as function_exists;
    `);
        const scannerFunctionExists = scannerFunctionResult.rows?.[0]?.function_exists === true;
        if (scannerFunctionExists) {
            console.log('✅ scan_and_fix_uuid_tables function exists');
        }
        else {
            console.log('❌ scan_and_fix_uuid_tables function does not exist');
            success = false;
        }
        // Verify downloads_relationships view exists
        const viewResult = await executeSQL(`
      SELECT EXISTS (
        SELECT FROM information_schema.views
        WHERE table_schema = 'payload'
        AND table_name = 'downloads_relationships'
      ) as view_exists;
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
        ORDER BY ordinal_position;
      `);
            const viewColumns = viewColumnsResult.rows.map((row) => row.column_name);
            console.log(`View columns: ${viewColumns.join(', ')}`);
            if (!viewColumns.includes('table_name')) {
                console.log('❌ downloads_relationships view is missing table_name column');
                success = false;
            }
        }
        else {
            console.log('❌ downloads_relationships view does not exist');
            success = false;
        }
        // Verify todo fields in course_lessons table
        console.log('\n=== VERIFYING TODO FIELDS ===');
        try {
            const todoFieldsSuccess = await verifyTodoFields();
            if (todoFieldsSuccess) {
                console.log('✅ Todo fields verification passed');
            }
            else {
                console.log('❌ Todo fields verification failed');
                success = false;
            }
        }
        catch (error) {
            console.error('Error during todo fields verification:', error);
            console.log('❌ Todo fields verification failed due to error');
            success = false;
        }
        console.log('\n=== VERIFICATION SUMMARY ===');
        if (success) {
            console.log('✅ All database verifications passed successfully');
        }
        else {
            console.log('❌ Some verifications failed, see details above');
        }
        return success;
    }
    catch (error) {
        console.error('Error during verification:', error);
        return false;
    }
}
// Run the verification and exit with appropriate code
verifyAll()
    .then((success) => {
    if (success) {
        console.log('Database verification completed successfully');
        process.exit(0);
    }
    else {
        console.log('Database verification failed, see errors above');
        process.exit(1);
    }
})
    .catch((error) => {
    console.error('Fatal error during verification:', error);
    process.exit(1);
});
