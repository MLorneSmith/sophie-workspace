import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  payload.logger.info('Running lesson enhancements migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Add structured fields to course_lessons table
    await db.execute(sql`
      ALTER TABLE payload.course_lessons 
      ADD COLUMN IF NOT EXISTS bunny_video_id TEXT,
      ADD COLUMN IF NOT EXISTS bunny_library_id TEXT DEFAULT '264486',
      ADD COLUMN IF NOT EXISTS todo_complete_quiz BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS todo_watch_content TEXT,
      ADD COLUMN IF NOT EXISTS todo_read_content TEXT,
      ADD COLUMN IF NOT EXISTS todo_course_project TEXT;
    `)

    // Create downloads table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.downloads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        lesson_id UUID REFERENCES payload.course_lessons(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create relationship table for lessons and downloads
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.course_lessons_downloads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID REFERENCES payload.course_lessons(id) NOT NULL,
        download_id UUID REFERENCES payload.downloads(id) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(lesson_id, download_id)
      );
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)

    payload.logger.info('Added lesson enhancement fields')
  } catch (error) {
    await db.execute(sql`ROLLBACK;`)
    payload.logger.error('Migration failed:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Reverting lesson enhancements migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Revert the changes
    await db.execute(sql`
      ALTER TABLE payload.course_lessons 
      DROP COLUMN IF EXISTS bunny_video_id,
      DROP COLUMN IF EXISTS bunny_library_id,
      DROP COLUMN IF EXISTS todo_complete_quiz,
      DROP COLUMN IF EXISTS todo_watch_content,
      DROP COLUMN IF EXISTS todo_read_content,
      DROP COLUMN IF EXISTS todo_course_project;
    `)

    await db.execute(sql`DROP TABLE IF EXISTS payload.course_lessons_downloads;`)
    await db.execute(sql`DROP TABLE IF EXISTS payload.downloads;`)

    // Commit transaction
    await db.execute(sql`COMMIT;`)

    payload.logger.info('Removed lesson enhancement fields')
  } catch (error) {
    await db.execute(sql`ROLLBACK;`)
    payload.logger.error('Migration reversion failed:', error)
    throw error
  }
}
