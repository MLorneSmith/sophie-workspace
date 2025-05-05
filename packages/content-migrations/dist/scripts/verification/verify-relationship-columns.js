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
            // Check if the table is actually a view
            const isView = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'payload' 
          AND table_name = $1
        ) as is_view
      `, [table]);
            if (isView.rows[0].is_view) {
                console.log(`⚠️ ${table} is a VIEW, not a table. Skipping column verification.`);
                continue; // Skip this table/view
            }
            // Get columns and their data types
            const tableColumns = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = $1
      `, [table]);
            const existingColumns = {};
            tableColumns.rows.forEach((row) => {
                existingColumns[row.column_name] = row.data_type;
            });
            console.log(`\nChecking table: payload.${table}`);
            for (const column of criticalColumns) {
                if (!existingColumns[column]) {
                    console.error(`❌ Missing column ${column} in table payload.${table}`);
                    missingColumns = true;
                }
                else {
                    const dataType = existingColumns[column];
                    const expectedType = column.endsWith('_id') ? 'uuid' : 'text';
                    if (dataType.toLowerCase() !== expectedType) {
                        console.error(`❌ Column ${column} in table payload.${table} has wrong type: ${dataType} (expected ${expectedType})`);
                        missingColumns = true;
                    }
                    else {
                        console.log(`✅ Column ${column} exists in table payload.${table} with correct type (${dataType})`);
                    }
                }
            }
        }
        if (missingColumns) {
            console.error('\n❌ Some required columns are missing in relationship tables!');
            // Add auto-repair functionality
            console.log('\nAttempting to repair missing columns...');
            try {
                // Add missing columns direct repair logic
                for (const table of requiredRelTables) {
                    // Check if the table is a view before attempting repair
                    const isView = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.views 
              WHERE table_schema = 'payload' 
              AND table_name = $1
            ) as is_view
          `, [table]);
                    if (isView.rows[0].is_view) {
                        console.log(`⚠️ ${table} is a VIEW, not a table. Skipping repair.`);
                        continue; // Skip this table/view
                    }
                    // Get both column names and data types
                    const tableColumns = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'payload'
              AND table_name = $1
          `, [table]);
                    const existingColumns = {};
                    tableColumns.rows.forEach((row) => {
                        existingColumns[row.column_name] = row.data_type;
                    });
                    console.log(`\nAttempting repair for table: payload.${table}`);
                    for (const column of criticalColumns) {
                        const expectedType = column.endsWith('_id') ? 'UUID' : 'TEXT';
                        if (!existingColumns[column]) {
                            // Column is missing completely
                            try {
                                await pool.query(`
                  ALTER TABLE payload.${table} 
                  ADD COLUMN IF NOT EXISTS ${column} ${expectedType}
                `);
                                console.log(`✅ Added missing column ${column} to table payload.${table}`);
                            }
                            catch (colError) {
                                console.error(`❌ Failed to add column ${column} to table payload.${table}:`, colError.message, {
                                    code: colError.code,
                                    detail: colError.detail,
                                    hint: colError.hint,
                                });
                            }
                        }
                        else if (existingColumns[column].toLowerCase() !==
                            expectedType.toLowerCase()) {
                            // Column exists but has wrong type
                            try {
                                await pool.query(`
                  ALTER TABLE payload.${table} 
                  ALTER COLUMN ${column} TYPE ${expectedType} 
                  USING ${column}::${expectedType}
                `);
                                console.log(`✅ Fixed column type for ${column} in table payload.${table} to ${expectedType}`);
                            }
                            catch (typeError) {
                                console.error(`❌ Failed to fix column type for ${column} in table payload.${table}:`, typeError.message, {
                                    code: typeError.code,
                                    detail: typeError.detail,
                                    hint: typeError.hint,
                                });
                            }
                        }
                    }
                }
                // Re-verify after repairs
                console.log('\nRe-verifying after repairs...');
                missingColumns = false;
                for (const table of requiredRelTables) {
                    // Skip views
                    const isView = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.views 
              WHERE table_schema = 'payload' 
              AND table_name = $1
            ) as is_view
          `, [table]);
                    if (isView.rows[0].is_view) {
                        continue;
                    }
                    const tableColumns = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'payload'
              AND table_name = $1
          `, [table]);
                    const existingColumns = {};
                    tableColumns.rows.forEach((row) => {
                        existingColumns[row.column_name] = row.data_type;
                    });
                    for (const column of criticalColumns) {
                        if (!existingColumns[column]) {
                            console.error(`❌ Column ${column} still missing in table payload.${table} after repair attempt`);
                            missingColumns = true;
                        }
                        else {
                            const dataType = existingColumns[column];
                            const expectedType = column.endsWith('_id') ? 'uuid' : 'text';
                            if (dataType.toLowerCase() !== expectedType) {
                                console.error(`❌ Column ${column} in table payload.${table} still has wrong type: ${dataType} (expected ${expectedType})`);
                                missingColumns = true;
                            }
                        }
                    }
                }
                if (!missingColumns) {
                    console.log('\n✅ All relationship columns have been repaired successfully!');
                }
                else {
                    console.error('\n❌ Some columns could not be repaired. Manual intervention required.');
                }
            }
            catch (repairError) {
                console.error('❌ Error during repair attempt:', repairError.message, {
                    code: repairError.code,
                    detail: repairError.detail,
                    hint: repairError.hint,
                });
            }
        }
        else {
            console.log('\n✅ All relationship tables have required columns.');
        }
        // 2. Verify the downloads_relationships view exists and create if missing
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
            // Attempt to create the view
            try {
                console.log('Attempting to create downloads_relationships view...');
                await pool.query(`
          CREATE VIEW payload.downloads_relationships AS
          SELECT 
            doc.id::text as collection_id, 
            dl.id::text as download_id,
            'documentation' as collection_type,
            'documentation_rels' as table_name
          FROM payload.documentation doc
          LEFT JOIN payload.documentation_rels dr 
            ON (doc.id = dr._parent_id OR doc.id = dr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = dr.value OR dl.id = dr.downloads_id)
          WHERE dl.id IS NOT NULL

          UNION ALL

          -- Course lessons downloads
          SELECT 
            cl.id::text as collection_id, 
            dl.id::text as download_id,
            'course_lessons' as collection_type,
            'course_lessons_rels' as table_name
          FROM payload.course_lessons cl
          LEFT JOIN payload.course_lessons_rels clr 
            ON (cl.id = clr._parent_id OR cl.id = clr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = clr.value OR dl.id = clr.downloads_id)
          WHERE dl.id IS NOT NULL

          UNION ALL

          -- Courses downloads
          SELECT 
            c.id::text as collection_id, 
            dl.id::text as download_id,
            'courses' as collection_type,
            'courses_rels' as table_name
          FROM payload.courses c
          LEFT JOIN payload.courses_rels cr 
            ON (c.id = cr._parent_id OR c.id = cr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = cr.value OR dl.id = cr.downloads_id)
          WHERE dl.id IS NOT NULL

          UNION ALL

          -- Course quizzes downloads
          SELECT 
            cq.id::text as collection_id, 
            dl.id::text as download_id,
            'course_quizzes' as collection_type,
            'course_quizzes_rels' as table_name
          FROM payload.course_quizzes cq
          LEFT JOIN payload.course_quizzes_rels cqr 
            ON (cq.id = cqr._parent_id OR cq.id = cqr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = cqr.value OR dl.id = cqr.downloads_id)
          WHERE dl.id IS NOT NULL;
        `);
                console.log('✅ Successfully created downloads_relationships view.');
                // Re-check the view
                const viewRecheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.views 
            WHERE table_schema = 'payload' 
            AND table_name = 'downloads_relationships'
          ) as view_exists
        `);
                if (viewRecheck.rows[0].view_exists) {
                    missingColumns = false;
                    console.log('✅ View creation confirmed.');
                }
            }
            catch (viewError) {
                console.error('❌ Failed to create view:', viewError.message, {
                    code: viewError.code,
                    detail: viewError.detail,
                    hint: viewError.hint,
                });
            }
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
