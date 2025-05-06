import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to fix remaining missing columns
 *
 * This migration addresses the following issues:
 * 1. Missing path column in downloads_rels table
 * 2. Missing pass_threshold column in course_quizzes table
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix for remaining column issues')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // 1. Fix downloads_rels.path column
    await db.execute(sql`
      ALTER TABLE payload.downloads_rels ADD COLUMN IF NOT EXISTS path TEXT;
    `)

    // 2. Fix course_quizzes.pass_threshold column
    await db.execute(sql`
      ALTER TABLE payload.course_quizzes ADD COLUMN IF NOT EXISTS pass_threshold INTEGER;
    `)

    // 3. Run a comprehensive check to ensure all download relation tables have the path column
    await db.execute(
      sql.raw(`
      DO $$
      BEGIN
        -- Ensure downloads__rels has path column
        ALTER TABLE IF EXISTS payload.downloads_rels ADD COLUMN IF NOT EXISTS path TEXT;
        
        -- Add path column to all download relation tables
        ALTER TABLE IF EXISTS payload.documentation__downloads ADD COLUMN IF NOT EXISTS path TEXT;
        ALTER TABLE IF EXISTS payload.posts__downloads ADD COLUMN IF NOT EXISTS path TEXT;
        ALTER TABLE IF EXISTS payload.surveys__downloads ADD COLUMN IF NOT EXISTS path TEXT;
        ALTER TABLE IF EXISTS payload.courses__downloads ADD COLUMN IF NOT EXISTS path TEXT;
        ALTER TABLE IF EXISTS payload.course_lessons__downloads ADD COLUMN IF NOT EXISTS path TEXT;
        ALTER TABLE IF EXISTS payload.course_quizzes__downloads ADD COLUMN IF NOT EXISTS path TEXT;
      END
      $$;
      `),
    )

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully fixed remaining column issues')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error fixing remaining column issues:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back column fixes (not actually removing columns)')
  // We don't want to actually remove these columns as they might be required
}
