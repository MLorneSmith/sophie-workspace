import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix for all relationship columns')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // 1. Add missing columns to all *__rels tables
    await db.execute(sql`
      DO $$
      DECLARE
        rel_table RECORD;
      BEGIN
        -- Loop through all tables ending with _rels in the payload schema
        FOR rel_table IN 
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND table_name LIKE '%\_\_rels'
        LOOP
          -- Add parent_id column if it doesn't exist
          EXECUTE format('
            ALTER TABLE payload.%I 
            ADD COLUMN IF NOT EXISTS parent_id TEXT
          ', rel_table.table_name);
          
          -- Add _parent_id column if it doesn't exist
          EXECUTE format('
            ALTER TABLE payload.%I 
            ADD COLUMN IF NOT EXISTS _parent_id TEXT
          ', rel_table.table_name);
          
          -- Add downloads_id column if it doesn't exist
          EXECUTE format('
            ALTER TABLE payload.%I 
            ADD COLUMN IF NOT EXISTS downloads_id TEXT
          ', rel_table.table_name);
          
          -- Add value column if it doesn't exist
          EXECUTE format('
            ALTER TABLE payload.%I 
            ADD COLUMN IF NOT EXISTS value TEXT
          ', rel_table.table_name);
        END LOOP;
      END $$;
    `)

    // 2. Create relationship tables if they don't exist
    await db.execute(sql`
      -- Create relationship tables if they don't exist for each collection
      DO $$
      BEGIN
        -- documentation__rels
        IF NOT EXISTS (SELECT FROM information_schema.tables 
                      WHERE table_schema = 'payload' 
                      AND table_name = 'documentation__rels') THEN
          CREATE TABLE payload.documentation__rels (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            _parent_id TEXT,
            parent_id TEXT,
            field TEXT,
            value TEXT,
            downloads_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END IF;

        -- course_lessons__rels
        IF NOT EXISTS (SELECT FROM information_schema.tables 
                      WHERE table_schema = 'payload' 
                      AND table_name = 'course_lessons__rels') THEN
          CREATE TABLE payload.course_lessons__rels (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            _parent_id TEXT,
            parent_id TEXT,
            field TEXT,
            value TEXT, 
            downloads_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END IF;

        -- courses__rels
        IF NOT EXISTS (SELECT FROM information_schema.tables 
                      WHERE table_schema = 'payload' 
                      AND table_name = 'courses__rels') THEN
          CREATE TABLE payload.courses__rels (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            _parent_id TEXT,
            parent_id TEXT,
            field TEXT,
            value TEXT,
            downloads_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END IF;

        -- course_quizzes__rels
        IF NOT EXISTS (SELECT FROM information_schema.tables 
                      WHERE table_schema = 'payload' 
                      AND table_name = 'course_quizzes__rels') THEN
          CREATE TABLE payload.course_quizzes__rels (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            _parent_id TEXT,
            parent_id TEXT,
            field TEXT,
            value TEXT,
            downloads_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END IF;

        -- posts__rels
        IF NOT EXISTS (SELECT FROM information_schema.tables 
                      WHERE table_schema = 'payload' 
                      AND table_name = 'posts__rels') THEN
          CREATE TABLE payload.posts__rels (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            _parent_id TEXT,
            parent_id TEXT,
            field TEXT,
            value TEXT,
            downloads_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END IF;

        -- surveys__rels
        IF NOT EXISTS (SELECT FROM information_schema.tables 
                      WHERE table_schema = 'payload' 
                      AND table_name = 'surveys__rels') THEN
          CREATE TABLE payload.surveys__rels (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            _parent_id TEXT,
            parent_id TEXT,
            field TEXT,
            value TEXT,
            downloads_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END IF;
      END $$;
    `)

    // 3. Enhance the view-based solution to handle more relationships
    await db.execute(sql`
      -- Recreate improved downloads_relationships view
      CREATE OR REPLACE VIEW payload.downloads_relationships AS
      -- Documentation downloads
      SELECT 
        d.id::text as collection_id, 
        dl.id::text as download_id,
        'documentation' as collection_type
      FROM payload.documentation d
      LEFT JOIN payload.documentation__rels dr ON d.id::text = dr._parent_id OR d.id::text = dr.parent_id
      LEFT JOIN payload.downloads dl ON dl.id::text = dr.value OR dl.id::text = dr.downloads_id
      WHERE dl.id IS NOT NULL
      
      UNION ALL
      
      -- Course lessons downloads
      SELECT 
        cl.id::text as collection_id, 
        dl.id::text as download_id,
        'course_lessons' as collection_type
      FROM payload.course_lessons cl
      LEFT JOIN payload.course_lessons__rels clr ON cl.id::text = clr._parent_id OR cl.id::text = clr.parent_id
      LEFT JOIN payload.downloads dl ON dl.id::text = clr.value OR dl.id::text = clr.downloads_id
      WHERE dl.id IS NOT NULL
      
      UNION ALL
      
      -- Courses downloads
      SELECT 
        c.id::text as collection_id, 
        dl.id::text as download_id,
        'courses' as collection_type
      FROM payload.courses c
      LEFT JOIN payload.courses__rels cr ON c.id::text = cr._parent_id OR c.id::text = cr.parent_id
      LEFT JOIN payload.downloads dl ON dl.id::text = cr.value OR dl.id::text = cr.downloads_id
      WHERE dl.id IS NOT NULL
      
      UNION ALL
      
      -- Course quizzes downloads
      SELECT 
        cq.id::text as collection_id, 
        dl.id::text as download_id,
        'course_quizzes' as collection_type
      FROM payload.course_quizzes cq
      LEFT JOIN payload.course_quizzes__rels cqr ON cq.id::text = cqr._parent_id OR cq.id::text = cqr.parent_id
      LEFT JOIN payload.downloads dl ON dl.id::text = cqr.value OR dl.id::text = cqr.downloads_id
      WHERE dl.id IS NOT NULL
      
      UNION ALL
      
      -- Posts downloads
      SELECT 
        p.id::text as collection_id, 
        dl.id::text as download_id,
        'posts' as collection_type
      FROM payload.posts p
      LEFT JOIN payload.posts__rels pr ON p.id::text = pr._parent_id OR p.id::text = pr.parent_id
      LEFT JOIN payload.downloads dl ON dl.id::text = pr.value OR dl.id::text = pr.downloads_id
      WHERE dl.id IS NOT NULL
      
      UNION ALL
      
      -- Surveys downloads
      SELECT 
        s.id::text as collection_id, 
        dl.id::text as download_id,
        'surveys' as collection_type
      FROM payload.surveys s
      LEFT JOIN payload.surveys__rels sr ON s.id::text = sr._parent_id OR s.id::text = sr.parent_id
      LEFT JOIN payload.downloads dl ON dl.id::text = sr.value OR dl.id::text = sr.downloads_id
      WHERE dl.id IS NOT NULL
    `)

    // 4. Create a query logging mechanism for future diagnostics
    await db.execute(sql`
      -- Create query log table if it doesn't exist
      CREATE TABLE IF NOT EXISTS payload.query_log (
        id SERIAL PRIMARY KEY,
        query_text TEXT,
        created_at TIMESTAMP WITH TIME ZONE
      );
      
      -- Create a function to log problematic queries (for diagnostic purposes)
      CREATE OR REPLACE FUNCTION payload.log_query_error()
      RETURNS trigger AS $$
      BEGIN
        -- Log failed queries to help diagnose issues
        INSERT INTO payload.query_log (query_text, created_at)
        VALUES (current_query(), NOW());
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Fixed relationship columns successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error fixing relationship columns:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // This migration adds columns non-destructively, so no need for complex down logic
  console.log('Relationship column fix - no destructive changes to revert')
  // If needed in the future, we can add code to remove added columns
}
