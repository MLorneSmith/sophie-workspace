import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix for type mismatches and missing columns')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // We don't need a conversion function - we'll use explicit casting instead

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

    // 3. Add the missing course_id_id column to course_quizzes
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns
                      WHERE table_schema = 'payload'
                      AND table_name = 'course_quizzes'
                      AND column_name = 'course_id_id') THEN
          ALTER TABLE payload.course_quizzes ADD COLUMN course_id_id TEXT;
          
          -- Populate the course_id_id from existing relationships
          UPDATE payload.course_quizzes cq
          SET course_id_id = cr.value
          FROM payload.course_quizzes__rels cr
          WHERE cq.id::TEXT = cr._parent_id
          AND cr.field = 'course_id';
        END IF;
      END $$;
    `)

    // 4. Update the downloads_relationships view with explicit type casting
    await db.execute(sql`
      -- Create a simplified downloads_relationships view with explicit casting
      CREATE OR REPLACE VIEW payload.downloads_relationships AS
      -- Documentation downloads
      SELECT 
        d.id::text as collection_id, 
        dl.id::text as download_id,
        'documentation' as collection_type
      FROM payload.documentation d
      LEFT JOIN payload.documentation__rels dr ON d.id::text = dr._parent_id 
      LEFT JOIN payload.downloads dl ON dr.value::text = dl.id::text
      WHERE dl.id IS NOT NULL
      
      UNION ALL
      
      -- Course lessons downloads
      SELECT 
        cl.id::text as collection_id, 
        dl.id::text as download_id,
        'course_lessons' as collection_type
      FROM payload.course_lessons cl
      LEFT JOIN payload.course_lessons__rels clr ON cl.id::text = clr._parent_id
      LEFT JOIN payload.downloads dl ON clr.value::text = dl.id::text
      WHERE dl.id IS NOT NULL
      
      UNION ALL
      
      -- Courses downloads
      SELECT 
        c.id::text as collection_id, 
        dl.id::text as download_id,
        'courses' as collection_type
      FROM payload.courses c
      LEFT JOIN payload.courses__rels cr ON c.id::text = cr._parent_id
      LEFT JOIN payload.downloads dl ON cr.value::text = dl.id::text
      WHERE dl.id IS NOT NULL
      
      UNION ALL
      
      -- Course quizzes downloads
      SELECT 
        cq.id::text as collection_id, 
        dl.id::text as download_id,
        'course_quizzes' as collection_type
      FROM payload.course_quizzes cq
      LEFT JOIN payload.course_quizzes__rels cqr ON cq.id::text = cqr._parent_id
      LEFT JOIN payload.downloads dl ON cqr.value::text = dl.id::text
      WHERE dl.id IS NOT NULL
      
      UNION ALL
      
      -- Posts downloads
      SELECT 
        p.id::text as collection_id, 
        dl.id::text as download_id,
        'posts' as collection_type
      FROM payload.posts p
      LEFT JOIN payload.posts__rels pr ON p.id::text = pr._parent_id
      LEFT JOIN payload.downloads dl ON pr.value::text = dl.id::text
      WHERE dl.id IS NOT NULL
      
      UNION ALL
      
      -- Surveys downloads
      SELECT 
        s.id::text as collection_id, 
        dl.id::text as download_id,
        'surveys' as collection_type
      FROM payload.surveys s
      LEFT JOIN payload.surveys__rels sr ON s.id::text = sr._parent_id
      LEFT JOIN payload.downloads dl ON sr.value::text = dl.id::text
      WHERE dl.id IS NOT NULL
    `)

    // 5. Create a simpler helper function
    await db.execute(sql`
      -- Create a database function to get downloads for a collection
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
    console.log('Fixed type mismatches and missing columns successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error fixing type mismatches and columns:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // This migration adds columns and functions non-destructively, so no complex down logic
  console.log('Type mismatches and columns fix - no destructive changes to revert')
}
