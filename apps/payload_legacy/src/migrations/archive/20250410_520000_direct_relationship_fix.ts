import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running direct relationship fix')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // 1. Add the missing course_id_id column to course_quizzes
    await db.execute(sql`
      -- Add course_id_id column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns
                      WHERE table_schema = 'payload'
                      AND table_name = 'course_quizzes'
                      AND column_name = 'course_id_id') THEN
          ALTER TABLE payload.course_quizzes ADD COLUMN course_id_id TEXT;
        END IF;
      END $$;
    `)

    // 2. Create downloads__rels table if it doesn't exist
    await db.execute(sql`
      -- Create downloads__rels if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.tables 
                      WHERE table_schema = 'payload' 
                      AND table_name = 'downloads__rels') THEN
          CREATE TABLE payload.downloads__rels (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            _parent_id TEXT,
            parent_id TEXT,
            field TEXT,
            value TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END IF;
      END $$;
    `)

    // 3. Create a simpler view that doesn't try to do complex type conversions
    await db.execute(sql`
      -- Create a simplified downloads_relationships view
      CREATE OR REPLACE VIEW payload.downloads_relationships AS
      -- Course lessons downloads - direct approach
      SELECT 
        course_lessons.id::text as collection_id,
        downloads.id::text as download_id,
        'course_lessons' as collection_type
      FROM payload.course_lessons
      JOIN payload.course_lessons__downloads ON course_lessons.id::text = course_lessons__downloads.parent_id
      JOIN payload.downloads ON downloads.id::text = course_lessons__downloads.downloads_id
      
      UNION ALL
      
      -- Courses downloads - direct approach
      SELECT 
        courses.id::text as collection_id,
        downloads.id::text as download_id,
        'courses' as collection_type
      FROM payload.courses
      JOIN payload.courses__downloads ON courses.id::text = courses__downloads.parent_id
      JOIN payload.downloads ON downloads.id::text = courses__downloads.downloads_id
      
      UNION ALL
      
      -- Course quizzes downloads - direct approach
      SELECT 
        course_quizzes.id::text as collection_id,
        downloads.id::text as download_id,
        'course_quizzes' as collection_type
      FROM payload.course_quizzes
      JOIN payload.course_quizzes__downloads ON course_quizzes.id::text = course_quizzes__downloads.parent_id
      JOIN payload.downloads ON downloads.id::text = course_quizzes__downloads.downloads_id
      
      UNION ALL
      
      -- Documentation downloads - direct approach
      SELECT 
        documentation.id::text as collection_id,
        downloads.id::text as download_id,
        'documentation' as collection_type
      FROM payload.documentation
      JOIN payload.documentation__downloads ON documentation.id::text = documentation__downloads.parent_id
      JOIN payload.downloads ON downloads.id::text = documentation__downloads.downloads_id
      
      UNION ALL
      
      -- Posts downloads - direct approach
      SELECT 
        posts.id::text as collection_id,
        downloads.id::text as download_id,
        'posts' as collection_type
      FROM payload.posts
      JOIN payload.posts__downloads ON posts.id::text = posts__downloads.parent_id
      JOIN payload.downloads ON downloads.id::text = posts__downloads.downloads_id
      
      UNION ALL
      
      -- Surveys downloads - direct approach
      SELECT 
        surveys.id::text as collection_id,
        downloads.id::text as download_id,
        'surveys' as collection_type
      FROM payload.surveys
      JOIN payload.surveys__downloads ON surveys.id::text = surveys__downloads.parent_id
      JOIN payload.downloads ON downloads.id::text = surveys__downloads.downloads_id
    `)

    // 4. Create standard downloads relationship tables for each collection
    const collections = [
      'documentation',
      'course_lessons',
      'courses',
      'course_quizzes',
      'posts',
      'surveys',
    ]

    for (const collection of collections) {
      await db.execute(sql`
        -- Create relationship table for ${sql.raw(collection)}
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM information_schema.tables 
                        WHERE table_schema = 'payload' 
                        AND table_name = ${sql.raw(`'${collection}__downloads'`)}) THEN
            CREATE TABLE payload.${sql.raw(`${collection}__downloads`)} (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              parent_id TEXT REFERENCES payload.${sql.raw(collection)}(id),
              downloads_id TEXT REFERENCES payload.downloads(id),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Add indexes for better performance
            CREATE INDEX ${sql.raw(`idx_${collection}__downloads_parent`)} ON payload.${sql.raw(`${collection}__downloads`)}(parent_id);
            CREATE INDEX ${sql.raw(`idx_${collection}__downloads_dload`)} ON payload.${sql.raw(`${collection}__downloads`)}(downloads_id);
          END IF;
        END $$;
      `)
    }

    // 5. Create a simple function to get downloads for a collection
    await db.execute(sql`
      -- Create a simpler database function to get downloads for a collection
      CREATE OR REPLACE FUNCTION payload.get_downloads_for_collection(
        collection_id TEXT,
        collection_type TEXT
      ) RETURNS TABLE (download_id TEXT) AS $$
      BEGIN
        RETURN QUERY 
        SELECT dr.download_id 
        FROM payload.downloads_relationships dr
        WHERE dr.collection_id = collection_id
        AND dr.collection_type = collection_type;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Direct relationship fix completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in direct relationship fix:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Non-destructive migration, no need for complex down logic
  console.log('Direct relationship fix - no destructive changes to revert')
}
