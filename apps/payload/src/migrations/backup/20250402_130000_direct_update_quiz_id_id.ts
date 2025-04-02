import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to directly update quiz_id_id column in course_lessons table')

  try {
    // Execute a raw SQL query to update the quiz_id_id column
    await db.execute(sql`
      -- Direct update of quiz_id_id column with values from quiz_id
      UPDATE payload.course_lessons 
      SET quiz_id_id = quiz_id 
      WHERE quiz_id IS NOT NULL;
    `)

    // Verify the update
    const result = await db.execute(sql`
      SELECT COUNT(*) as updated_count
      FROM payload.course_lessons 
      WHERE quiz_id IS NOT NULL AND quiz_id = quiz_id_id;
    `)

    const updatedCount = result.rows[0]?.updated_count || 0
    console.log(`Successfully updated quiz_id_id column for ${updatedCount} lessons`)

    // Log the updated rows for verification
    const updatedRows = await db.execute(sql`
      SELECT id, title, quiz_id, quiz_id_id 
      FROM payload.course_lessons 
      WHERE quiz_id IS NOT NULL
      LIMIT 5;
    `)

    console.log('Sample of updated lessons:')
    for (const row of updatedRows.rows.slice(0, 5)) {
      console.log(`- ${row.title}: quiz_id=${row.quiz_id}, quiz_id_id=${row.quiz_id_id}`)
    }

    console.log('Successfully updated quiz_id_id column in course_lessons table')
  } catch (error) {
    console.error('Error updating quiz_id_id column:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert quiz_id_id column in course_lessons table')

  try {
    // Execute a raw SQL query to set the quiz_id_id column to null
    await db.execute(sql`
      UPDATE payload.course_lessons 
      SET quiz_id_id = NULL 
      WHERE quiz_id_id IS NOT NULL;
    `)

    console.log('Successfully reverted quiz_id_id column in course_lessons table')
  } catch (error) {
    console.error('Error reverting quiz_id_id column:', error)
    throw error
  }
}
