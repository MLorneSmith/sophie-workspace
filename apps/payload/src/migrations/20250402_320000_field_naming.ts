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
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Ensure quiz_id_id column exists and matches quiz_id
    await db.execute(sql`
      DO $$
      BEGIN
        -- Ensure quiz_id_id column exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions' 
          AND column_name = 'quiz_id_id'
        ) THEN
          ALTER TABLE "payload"."quiz_questions"
          ADD COLUMN "quiz_id_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `)

    // Update quiz_id_id to match quiz_id
    const updateQuizIdResult = await db.execute(sql`
      UPDATE payload.quiz_questions
      SET quiz_id_id = quiz_id
      WHERE quiz_id IS NOT NULL AND (quiz_id_id IS NULL OR quiz_id_id != quiz_id);
    `)

    console.log(`Updated ${updateQuizIdResult.rowCount} quiz_id_id values`)

    // Update field name in quiz_questions_rels table
    const updateQuizFieldResult = await db.execute(sql`
      UPDATE "payload"."quiz_questions_rels"
      SET "field" = 'quiz_id'
      WHERE "field" = 'quiz_id_id';
    `)

    console.log(`Updated ${updateQuizFieldResult.rowCount} field names in quiz_questions_rels`)

    // Update field name in survey_questions_rels table
    const updateSurveyFieldResult = await db.execute(sql`
      UPDATE "payload"."survey_questions_rels"
      SET "field" = 'surveys'
      WHERE "field" = 'surveys_id';
    `)

    console.log(`Updated ${updateSurveyFieldResult.rowCount} field names in survey_questions_rels`)

    // Verify field names are correct
    const verifyQuizFieldResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM "payload"."quiz_questions_rels" WHERE "field" = 'quiz_id_id';
    `)

    const verifySurveyFieldResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM "payload"."survey_questions_rels" WHERE "field" = 'surveys_id';
    `)

    const quizIdIdCount = verifyQuizFieldResult.rows[0]?.count
      ? Number(verifyQuizFieldResult.rows[0].count)
      : 0
    if (quizIdIdCount > 0) {
      console.warn(`Warning: ${quizIdIdCount} records still have field='quiz_id_id'`)
    } else {
      console.log('✅ All quiz_questions_rels field names are correct')
    }

    const surveysIdCount = verifySurveyFieldResult.rows[0]?.count
      ? Number(verifySurveyFieldResult.rows[0].count)
      : 0
    if (surveysIdCount > 0) {
      console.warn(`Warning: ${surveysIdCount} records still have field='surveys_id'`)
    } else {
      console.log('✅ All survey_questions_rels field names are correct')
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Field naming migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
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
