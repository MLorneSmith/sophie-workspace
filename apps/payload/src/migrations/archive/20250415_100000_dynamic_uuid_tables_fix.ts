import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running dynamic UUID tables view-based fix...')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Create a view for all download relationships
    console.log('Creating downloads_relationships view...')
    await db.execute(sql`
      CREATE OR REPLACE VIEW payload.downloads_relationships AS
      -- Documentation downloads
      SELECT 
        d.id::text as collection_id, 
        dl.id::text as download_id,
        'documentation' as collection_type
      FROM payload.documentation d
      JOIN payload.documentation__downloads dld ON d.id::text = dld.parent_id
      JOIN payload.downloads dl ON dl.id::uuid = dld.downloads_id::uuid
      
      UNION ALL
      
      -- Course lessons downloads
      SELECT 
        cl.id::text as collection_id, 
        dl.id::text as download_id,
        'course_lessons' as collection_type
      FROM payload.course_lessons cl
      JOIN payload.course_lessons__downloads cld ON cl.id::text = cld.parent_id
      JOIN payload.downloads dl ON dl.id::uuid = cld.downloads_id::uuid
      
      UNION ALL
      
      -- Courses downloads
      SELECT 
        c.id::text as collection_id, 
        dl.id::text as download_id,
        'courses' as collection_type
      FROM payload.courses c
      JOIN payload.courses__downloads cd ON c.id::text = cd.parent_id
      JOIN payload.downloads dl ON dl.id::uuid = cd.downloads_id::uuid
      
      UNION ALL
      
      -- Course quizzes downloads
      SELECT 
        c.id::text as collection_id, 
        dl.id::text as download_id,
        'course_quizzes' as collection_type
      FROM payload.course_quizzes c
      JOIN payload.course_quizzes__downloads cd ON c.id::text = cd.parent_id
      JOIN payload.downloads dl ON dl.id::uuid = cd.downloads_id::uuid
    `)

    // Create function to get downloads for a collection
    console.log('Creating get_downloads_for_collection function...')
    await db.execute(sql`
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

    // Create function to check if a download belongs to a collection
    console.log('Creating collection_has_download function...')
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.collection_has_download(
        collection_id TEXT, 
        collection_type TEXT,
        download_id TEXT
      ) RETURNS BOOLEAN AS $$
      DECLARE
        found BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT 1 
          FROM payload.downloads_relationships dr
          WHERE dr.collection_id = collection_id
          AND dr.collection_type = collection_type
          AND dr.download_id = download_id
        ) INTO found;
        
        RETURN found;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create function to safely handle UUID conversions
    console.log('Creating safe_uuid_conversion function...')
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.safe_uuid_conversion(text_value TEXT)
      RETURNS UUID AS $$
      BEGIN
        RETURN text_value::uuid;
      EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Verify the view works by testing it
    console.log('Verifying downloads_relationships view...')
    const viewTest = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.views
        WHERE table_schema = 'payload'
        AND table_name = 'downloads_relationships'
      ) as view_exists;
    `)

    if (!viewTest.rows[0]?.view_exists) {
      throw new Error('Failed to create downloads_relationships view')
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully created views and functions for dynamic UUID tables fix')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in dynamic UUID tables fix migration:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Removing views and functions for dynamic UUID tables fix...')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Drop functions
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.get_downloads_for_collection(TEXT, TEXT);
      DROP FUNCTION IF EXISTS payload.collection_has_download(TEXT, TEXT, TEXT);
      DROP FUNCTION IF EXISTS payload.safe_uuid_conversion(TEXT);
    `)

    // Drop view
    await db.execute(sql`
      DROP VIEW IF EXISTS payload.downloads_relationships;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully removed views and functions for dynamic UUID tables fix')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in down migration for dynamic UUID tables fix:', error)
    throw error
  }
}
