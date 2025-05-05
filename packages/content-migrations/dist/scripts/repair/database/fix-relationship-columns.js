/**
 * Fix Relationship Columns
 *
 * This script adds missing relationship columns to all relationship tables
 * It's designed to be run as part of the migration process
 */
import { generateAddRelationshipColumnsSql } from '../../sql/utils/relationship-columns.js';
import { executeSQL } from '../../utils/db/execute-sql.js';
// Corrected path
async function fixRelationshipColumns() {
    console.log('\nFixing relationship columns in all relationship tables...');
    // List of known relationship tables to fix
    const relationshipTables = [
        'documentation_rels',
        'posts_rels',
        'surveys_rels',
        'survey_questions_rels',
        'courses_rels',
        'course_lessons_rels',
        'course_quizzes_rels',
        'quiz_questions_rels',
        'downloads_rels',
        'payload_locked_documents_rels',
        'payload_preferences_rels',
    ];
    try {
        // Start transaction
        await executeSQL('BEGIN;');
        // First check which tables exist and create missing ones
        for (const table of relationshipTables) {
            // Check if table exists
            const tableExistsResult = await executeSQL(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND table_name = '${table}'
        ) as table_exists;
      `);
            const tableExists = tableExistsResult.rows?.[0]?.table_exists === true;
            if (!tableExists) {
                console.log(`\nTable payload.${table} does not exist, creating it...`);
                // Create table with all required columns
                await executeSQL(`
          CREATE TABLE payload.${table} (
            id UUID PRIMARY KEY,
            _parent_id UUID NOT NULL,
            field TEXT,
            value UUID,
            parent_id UUID,
            downloads_id UUID,
            posts_id UUID,
            documentation_id UUID,
            surveys_id UUID,
            survey_questions_id UUID,
            courses_id UUID,
            course_lessons_id UUID,
            course_quizzes_id UUID,
            quiz_questions_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
                console.log(`Table payload.${table} created successfully.`);
            }
            else {
                // Table exists, add any missing columns
                console.log(`\nAdding missing columns to ${table}...`);
                const sql = generateAddRelationshipColumnsSql(table);
                await executeSQL(sql);
            }
        }
        // First check if the view exists
        const viewExistsResult = await executeSQL(`
      SELECT EXISTS (
        SELECT FROM information_schema.views
        WHERE table_schema = 'payload'
        AND table_name = 'downloads_relationships'
      ) as view_exists;
    `);
        const viewExists = viewExistsResult.rows?.[0]?.view_exists === true;
        // If the view exists, drop it first
        if (viewExists) {
            console.log('\nDropping existing downloads_relationships view...');
            await executeSQL(`DROP VIEW IF EXISTS payload.downloads_relationships;`);
        }
        // Create the Downloads Relationships View
        console.log('\nCreating/updating downloads_relationships view...');
        const viewSql = `
      CREATE VIEW payload.downloads_relationships AS
      -- Documentation downloads
      SELECT
        doc.id::text as table_name,
        dl.id::text as download_id,
        'documentation' as collection_type
      FROM payload.documentation doc
      LEFT JOIN payload.documentation_rels dr
        ON (doc.id = dr._parent_id OR doc.id = dr.parent_id)
      LEFT JOIN payload.downloads dl
        ON (dl.id = dr.value OR dl.id = dr.downloads_id)
      WHERE dl.id IS NOT NULL

      UNION ALL

      -- Course lessons downloads
      SELECT
        cl.id::text as table_name,
        dl.id::text as download_id,
        'course_lessons' as collection_type
      FROM payload.course_lessons cl
      LEFT JOIN payload.course_lessons_rels clr
        ON (cl.id = clr._parent_id OR cl.id = clr.parent_id)
      LEFT JOIN payload.downloads dl
        ON (dl.id = clr.value OR dl.id = clr.downloads_id)
      WHERE dl.id IS NOT NULL

      UNION ALL

      -- Courses downloads
      SELECT
        c.id::text as table_name,
        dl.id::text as download_id,
        'courses' as collection_type
      FROM payload.courses c
      LEFT JOIN payload.courses_rels cr
        ON (c.id = cr._parent_id OR c.id = cr.parent_id)
      LEFT JOIN payload.downloads dl
        ON (dl.id = cr.value OR dl.id = cr.downloads_id)
      WHERE dl.id IS NOT NULL

      UNION ALL

      -- Course quizzes downloads
      SELECT
        cq.id::text as table_name,
        dl.id::text as download_id,
        'course_quizzes' as collection_type
      FROM payload.course_quizzes cq
      LEFT JOIN payload.course_quizzes_rels cqr
        ON (cq.id = cqr._parent_id OR cq.id = cqr.parent_id)
      LEFT JOIN payload.downloads dl
        ON (dl.id = cqr.value OR dl.id = cqr.downloads_id)
      WHERE dl.id IS NOT NULL
    `;
        await executeSQL(viewSql);
        // Create helper function to add columns to dynamic tables
        console.log('\nCreating ensure_relationship_columns function...');
        const functionSql = `
      -- Helper function to add required columns to any table (including dynamic ones)
      CREATE OR REPLACE FUNCTION payload.ensure_relationship_columns(table_name text)
      RETURNS void AS $$
      BEGIN
        -- Add parent_id if it doesn't exist
        EXECUTE 'ALTER TABLE ' || table_name ||
                ' ADD COLUMN IF NOT EXISTS parent_id UUID';

        -- Add downloads_id if it doesn't exist
        EXECUTE 'ALTER TABLE ' || table_name ||
                ' ADD COLUMN IF NOT EXISTS downloads_id UUID';

        -- Add private_id if it doesn't exist
        EXECUTE 'ALTER TABLE ' || table_name ||
                ' ADD COLUMN IF NOT EXISTS private_id UUID';

        -- Add other important relationship columns
        EXECUTE 'ALTER TABLE ' || table_name ||
                ' ADD COLUMN IF NOT EXISTS documentation_id UUID';
        EXECUTE 'ALTER TABLE ' || table_name ||
                ' ADD COLUMN IF NOT EXISTS courses_id UUID';
        EXECUTE 'ALTER TABLE ' || table_name ||
                ' ADD COLUMN IF NOT EXISTS course_lessons_id UUID';
        EXECUTE 'ALTER TABLE ' || table_name ||
                ' ADD COLUMN IF NOT EXISTS course_quizzes_id UUID';
        EXECUTE 'ALTER TABLE ' || table_name ||
                ' ADD COLUMN IF NOT EXISTS quiz_questions_id UUID';
      END;
      $$ LANGUAGE plpgsql;
    `;
        await executeSQL(functionSql);
        // Commit transaction
        await executeSQL('COMMIT;');
        console.log('\n✅ Successfully added missing relationship columns to all tables');
        console.log('✅ Created downloads_relationships view');
        console.log('✅ Created ensure_relationship_columns function');
        return true;
    }
    catch (error) {
        // Rollback on error
        await executeSQL('ROLLBACK;');
        console.error('\n❌ Error fixing relationship columns:', error);
        return false;
    }
}
// In ESM, we can use fileURLToPath to check if we're the main module
// But for simplicity, we'll just always run the function when this file is imported
// This is safe since this is a CLI tool
// Run the fix directly
fixRelationshipColumns()
    .then((success) => {
    if (process.argv[1]?.includes('fix-relationship-columns.ts')) {
        process.exit(success ? 0 : 1);
    }
})
    .catch((error) => {
    console.error('\nUnhandled error:', error);
    if (process.argv[1]?.includes('fix-relationship-columns.ts')) {
        process.exit(1);
    }
});
/* This code is unreachable but keeping for reference
if (false) {
  fixRelationshipColumns()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\nUnhandled error:', error);
      process.exit(1);
    });
}
*/
// Export for use in other scripts
export { fixRelationshipColumns };
