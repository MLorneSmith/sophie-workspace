import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to add the todo column to course_lessons table
 *
 * This migration addresses the following:
 * 1. Adding the new general todo field to course_lessons
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to add todo column to course_lessons table')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Add todo column to course_lessons table
    await db.execute(sql`
      ALTER TABLE payload.course_lessons ADD COLUMN IF NOT EXISTS todo TEXT;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully added todo column to course_lessons table')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error adding todo column to course_lessons table:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back todo column addition')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Remove todo column from course_lessons table
    await db.execute(sql`
      ALTER TABLE payload.course_lessons DROP COLUMN IF EXISTS todo;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully removed todo column from course_lessons table')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error removing todo column from course_lessons table:', error)
    throw error
  }
}
