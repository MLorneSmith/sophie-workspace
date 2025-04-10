import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running relationship columns fix migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // 1. Add missing columns to all *_rels tables
    console.log('Adding missing columns to relationship tables...')

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
    ]

    // List of critical columns needed for Payload's relationship handling
    const criticalColumns = [
      { name: 'parent_id', type: 'UUID' },
      { name: 'downloads_id', type: 'UUID' },
      { name: 'posts_id', type: 'UUID' },
      { name: 'documentation_id', type: 'UUID' },
      { name: 'surveys_id', type: 'UUID' },
      { name: 'survey_questions_id', type: 'UUID' },
      { name: 'courses_id', type: 'UUID' },
      { name: 'course_lessons_id', type: 'UUID' },
      { name: 'course_quizzes_id', type: 'UUID' },
      { name: 'quiz_questions_id', type: 'UUID' },
      { name: 'quiz_id_id', type: 'UUID' }, // Add quiz_id_id column to ensure relationships work
      { name: 'path', type: 'TEXT' }, // Add path column which is causing issues
    ]

    // Add all critical columns to all relationship tables
    for (const table of relationshipTables) {
      for (const column of criticalColumns) {
        // Use raw SQL for dynamic table and column names
        // Avoid using parameterized queries for identifiers
        const sqlStatement = `
          DO $$
          BEGIN
            -- First check if the table exists
            IF EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'payload'
              AND table_name = '${table}'
            ) THEN
              -- Then check if the column doesn't exist
              IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'payload'
                AND table_name = '${table}'
                AND column_name = '${column.name}'
              ) THEN
                -- Add the column if the table exists but column doesn't
                ALTER TABLE payload.${table}
                ADD COLUMN ${column.name} ${column.type};
                
                RAISE NOTICE 'Added column ${column.name} to table ${table}';
              END IF;
            ELSE
              RAISE NOTICE 'Table payload.${table} does not exist, skipping column add';
            END IF;
          END
          $$;
        `

        // Execute the raw SQL statement
        await db.execute(sql.raw(sqlStatement))
      }

      console.log(`Added missing columns to ${table}`)
    }

    // 2. Create Downloads Relationships View
    console.log('Creating improved downloads_relationships view...')
    await db.execute(sql`
      CREATE OR REPLACE VIEW payload.downloads_relationships AS
      -- Documentation downloads
      SELECT 
        doc.id::text as collection_id, 
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
        cl.id::text as collection_id, 
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
        c.id::text as collection_id, 
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
        cq.id::text as collection_id, 
        dl.id::text as download_id,
        'course_quizzes' as collection_type
      FROM payload.course_quizzes cq
      LEFT JOIN payload.course_quizzes_rels cqr 
        ON (cq.id = cqr._parent_id OR cq.id = cqr.parent_id)
      LEFT JOIN payload.downloads dl 
        ON (dl.id = cqr.value OR dl.id = cqr.downloads_id)
      WHERE dl.id IS NOT NULL
    `)

    // 3. Create helper functions for working with dynamic UUID tables
    console.log('Creating helper functions for dynamic tables...')
    await db.execute(sql`
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
        EXECUTE 'ALTER TABLE ' || table_name || 
                ' ADD COLUMN IF NOT EXISTS quiz_id_id UUID';
        
        -- Add path column (missing column causing dynamic UUID table errors)
        EXECUTE 'ALTER TABLE ' || table_name || 
                ' ADD COLUMN IF NOT EXISTS path TEXT';
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Relationship columns fix completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in relationship columns fix migration:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // No destructive changes to revert
  console.log('Down migration for relationship columns fix - no changes to revert')

  // Clean up helper functions if desired
  await db.execute(sql`
    DROP FUNCTION IF EXISTS payload.ensure_relationship_columns(text);
    DROP VIEW IF EXISTS payload.downloads_relationships;
  `)
}
