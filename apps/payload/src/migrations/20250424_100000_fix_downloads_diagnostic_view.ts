import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to fix downloads_diagnostic view')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Check if path column exists in downloads table
    const columnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'downloads'
        AND column_name = 'path'
      ) as exists;
    `)

    // First drop the view if it exists
    await db.execute(sql`
      DROP VIEW IF EXISTS payload.downloads_diagnostic;
    `)

    // Then create the view with or without path column based on its existence
    if (!columnExists.rows[0].exists) {
      console.log('Path column does not exist in downloads table, creating without it')

      await db.execute(sql`
      CREATE VIEW payload.downloads_diagnostic AS
      SELECT 
        d.id,
        d.title,
        d.filename,
        d.url,
        d.mimetype,
        d.filesize,
        d.width,
        d.height,
        d.sizes_thumbnail_url,
        (SELECT count(*) AS count
          FROM payload.course_lessons_downloads
          WHERE (course_lessons_downloads.download_id = d.id)) AS lesson_count,
        (SELECT array_agg(cl.title) AS array_agg
          FROM (payload.course_lessons_downloads cld
            JOIN payload.course_lessons cl ON ((cld.lesson_id = cl.id)))
          WHERE (cld.download_id = d.id)) AS related_lessons
      FROM payload.downloads d;
      `)
    } else {
      console.log('Path column exists in downloads table, including it in the view')

      await db.execute(sql`
      CREATE VIEW payload.downloads_diagnostic AS
      SELECT 
        d.id,
        d.title,
        d.filename,
        d.url,
        d.mimetype,
        d.filesize,
        d.width,
        d.height,
        d.sizes_thumbnail_url,
        d.path,
        (SELECT count(*) AS count
          FROM payload.course_lessons_downloads
          WHERE (course_lessons_downloads.download_id = d.id)) AS lesson_count,
        (SELECT array_agg(cl.title) AS array_agg
          FROM (payload.course_lessons_downloads cld
            JOIN payload.course_lessons cl ON ((cld.lesson_id = cl.id)))
          WHERE (cld.download_id = d.id)) AS related_lessons
      FROM payload.downloads d;
      `)
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Fixed downloads_diagnostic view with path column')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error fixing downloads_diagnostic view:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back downloads_diagnostic view changes')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    await db.execute(sql`
    -- Restore original view
    DROP VIEW IF EXISTS payload.downloads_diagnostic;
    
    CREATE VIEW payload.downloads_diagnostic AS
    SELECT 
      d.id,
      d.title,
      d.filename,
      d.url,
      d.mimetype,
      d.filesize,
      d.width,
      d.height,
      d.sizes_thumbnail_url,
      (SELECT count(*) AS count
        FROM payload.course_lessons_downloads
        WHERE (course_lessons_downloads.download_id = d.id)) AS lesson_count,
      (SELECT array_agg(cl.title) AS array_agg
        FROM (payload.course_lessons_downloads cld
          JOIN payload.course_lessons cl ON ((cld.lesson_id = cl.id)))
        WHERE (cld.download_id = d.id)) AS related_lessons
    FROM payload.downloads d;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Restored original downloads_diagnostic view')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error restoring original downloads_diagnostic view:', error)
    throw error
  }
}
