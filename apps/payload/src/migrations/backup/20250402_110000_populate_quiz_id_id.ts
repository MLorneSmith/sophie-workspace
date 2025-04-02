import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to populate quiz_id_id column in course_lessons table')

  try {
    // Get the database connection from Payload
    const db = payload.db.drizzle

    // Execute a raw SQL query to update the quiz_id_id column
    await db.execute(
      `UPDATE payload.course_lessons 
       SET quiz_id_id = quiz_id 
       WHERE quiz_id IS NOT NULL AND quiz_id_id IS NULL`,
    )

    console.log('Successfully populated quiz_id_id column in course_lessons table')
  } catch (error) {
    console.error('Error populating quiz_id_id column:', error)
    throw error
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert quiz_id_id column in course_lessons table')

  try {
    // Get the database connection from Payload
    const db = payload.db.drizzle

    // Execute a raw SQL query to set the quiz_id_id column to null
    await db.execute(
      `UPDATE payload.course_lessons 
       SET quiz_id_id = NULL 
       WHERE quiz_id_id IS NOT NULL`,
    )

    console.log('Successfully reverted quiz_id_id column in course_lessons table')
  } catch (error) {
    console.error('Error reverting quiz_id_id column:', error)
    throw error
  }
}
