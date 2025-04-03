import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('Updating field name in quiz_questions_rels table...')

  // Get the current count of entries with field = 'quiz_id_id'
  const beforeResult = await payload.db.drizzle.execute(sql`
    SELECT COUNT(*) as count FROM payload.quiz_questions_rels WHERE field = 'quiz_id_id';
  `)
  // @ts-ignore - Accessing result by index
  const beforeCount = parseInt(beforeResult[0]?.count || '0')

  // Update the field name
  await payload.db.drizzle.execute(sql`
    UPDATE payload.quiz_questions_rels
    SET field = 'quiz_id'
    WHERE field = 'quiz_id_id';
  `)

  // Get the count of entries with field = 'quiz_id' after the update
  const afterResult = await payload.db.drizzle.execute(sql`
    SELECT COUNT(*) as count FROM payload.quiz_questions_rels WHERE field = 'quiz_id';
  `)
  // @ts-ignore - Accessing result by index
  const afterCount = parseInt(afterResult[0]?.count || '0')

  console.log(
    `Updated ${afterCount} entries in quiz_questions_rels table from 'quiz_id_id' to 'quiz_id'`,
  )

  // Verify that all entries were updated
  if (beforeCount !== afterCount) {
    console.warn(
      `Warning: Before count (${beforeCount}) does not match after count (${afterCount})`,
    )
  } else {
    console.log('✅ All entries were updated successfully')
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Revert the changes
  await payload.db.drizzle.execute(sql`
    UPDATE payload.quiz_questions_rels
    SET field = 'quiz_id_id'
    WHERE field = 'quiz_id';
  `)
}
