import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to add video support with source type selection
 *
 * This migration addresses the following:
 * 1. Adding the external video ID field (for YouTube and Vimeo)
 * 2. Adding video source type selection field
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to add video support to course_lessons table')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Add youtube_video_id column to course_lessons table if it doesn't exist
    await db.execute(sql`
      ALTER TABLE payload.course_lessons ADD COLUMN IF NOT EXISTS youtube_video_id TEXT DEFAULT NULL;
    `)

    // Add video_source_type column to course_lessons table with default 'youtube'
    await db.execute(sql`
      ALTER TABLE payload.course_lessons ADD COLUMN IF NOT EXISTS video_source_type TEXT DEFAULT 'youtube';
    `)

    // Populate external video data for specific lessons
    console.log('Populating external video data for specific lessons')

    // Update Storyboards in Film to use YouTube video
    await db.execute(sql`
      UPDATE payload.course_lessons 
      SET 
        video_source_type = 'youtube',
        youtube_video_id = 'BSOJiSUI0z8'
      WHERE 
        slug = 'storyboards-film';
    `)

    // Update Overview of the Fundamental Elements of Design to use Vimeo video
    await db.execute(sql`
      UPDATE payload.course_lessons 
      SET 
        video_source_type = 'vimeo',
        youtube_video_id = '32944253' 
      WHERE 
        slug = 'fundamental-design-overview';
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log(
      'Successfully added video support columns to course_lessons table and populated external video data',
    )
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error adding video support columns to course_lessons table:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back video support columns addition')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Remove video_source_type column from course_lessons table
    await db.execute(sql`
      ALTER TABLE payload.course_lessons DROP COLUMN IF EXISTS video_source_type;
    `)

    // Remove youtube_video_id column from course_lessons table
    await db.execute(sql`
      ALTER TABLE payload.course_lessons DROP COLUMN IF EXISTS youtube_video_id;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully removed video support columns from course_lessons table')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error removing video support columns from course_lessons table:', error)
    throw error
  }
}
