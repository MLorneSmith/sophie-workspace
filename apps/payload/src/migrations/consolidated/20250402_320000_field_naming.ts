import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Field Naming Migration
 *
 * This migration fixes field naming issues (quiz_id_id -> quiz_id)
 * and updates field values in relationship tables.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running field naming migration')

  try {
    // Update field name in quiz_questions_rels table
    await db.execute(sql`
      UPDATE "payload"."quiz_questions_rels"
      SET "field" = 'quiz_id'
      WHERE "field" = 'quiz_id_id';
    `)

    // Update field name in survey_questions_rels table
    await db.execute(sql`
      UPDATE "payload"."survey_questions_rels"
      SET "field" = 'surveys'
      WHERE "field" = 'surveys_id';
    `)

    // Get the count of updated records for verification
    const quizQuestionsCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM "payload"."quiz_questions_rels" WHERE "field" = 'quiz_id';
    `)

    const surveyQuestionsCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM "payload"."survey_questions_rels" WHERE "field" = 'surveys';
    `)

    console.log(
      `Updated ${quizQuestionsCount.rows[0]?.count || 0} records in quiz_questions_rels table`,
    )
    console.log(
      `Updated ${surveyQuestionsCount.rows[0]?.count || 0} records in survey_questions_rels table`,
    )

    console.log('Field naming migration completed successfully')
  } catch (error) {
    console.error('Error in field naming migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for field naming')

  try {
    // Revert field name in quiz_questions_rels table
    await db.execute(sql`
      UPDATE "payload"."quiz_questions_rels"
      SET "field" = 'quiz_id_id'
      WHERE "field" = 'quiz_id';
    `)

    // Revert field name in survey_questions_rels table
    await db.execute(sql`
      UPDATE "payload"."survey_questions_rels"
      SET "field" = 'surveys_id'
      WHERE "field" = 'surveys';
    `)

    console.log('Field naming down migration completed successfully')
  } catch (error) {
    console.error('Error in field naming down migration:', error)
    throw error
  }
}
