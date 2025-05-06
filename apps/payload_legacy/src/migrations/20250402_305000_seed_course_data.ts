import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Seed Course Data Migration
 *
 * This migration executes the seed-course-data.sql file to ensure the course
 * is created before any lessons or quizzes try to reference it.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running course data seeding migration')

  try {
    // Get the current file's directory (ES modules compatible)
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    // Get the path to the seed-course-data.sql file
    const seedFilePath = path.resolve(__dirname, 'seed-course-data.sql')

    // Read the SQL file
    const seedSql = fs.readFileSync(seedFilePath, 'utf8')

    // Execute the SQL
    await db.execute(sql.raw(seedSql))

    // Verify the course was created
    const courseResult = await db.execute(sql`
      SELECT id, title FROM payload.courses 
      WHERE id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8';
    `)

    if (courseResult.rows.length === 0) {
      console.warn('Course was not created, this may cause issues with lessons and quizzes')
    } else {
      console.log(`Course "${courseResult.rows[0].title}" seeded successfully`)
    }

    console.log('Course data seeding migration completed successfully')
  } catch (error) {
    console.error('Error in course data seeding migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for course data seeding')

  try {
    // Delete the course
    await db.execute(sql`
      DELETE FROM payload.courses 
      WHERE id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8';
    `)

    console.log('Course data seeding down migration completed successfully')
  } catch (error) {
    console.error('Error in course data seeding down migration:', error)
    throw error
  }
}
