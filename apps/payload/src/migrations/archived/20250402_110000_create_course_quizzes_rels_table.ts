import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to create and populate the course_quizzes_rels table
 *
 * This migration addresses the missing relationship table between course_quizzes and quiz_questions.
 * It creates the table if it doesn't exist, ensures it has the necessary columns,
 * and populates the relationships between quizzes and questions.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running consolidated fix for course_quizzes_rels table')

  try {
    // Step 1: Check if the course_quizzes_rels table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes_rels'
      ) as exists;
    `)

    // Step 2: Create the table if it doesn't exist
    if (!tableExists.rows[0]?.exists) {
      console.log('Creating course_quizzes_rels table...')
      await db.execute(sql`
        CREATE TABLE "payload"."course_quizzes_rels" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "_parent_id" uuid NOT NULL REFERENCES "payload"."course_quizzes"("id") ON DELETE CASCADE,
          "field" VARCHAR(255),
          "value" uuid,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
    } else {
      console.log('course_quizzes_rels table already exists')

      // Step 3: Add field column if it doesn't exist
      const fieldColumnExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes_rels'
          AND column_name = 'field'
        ) as exists;
      `)

      if (!fieldColumnExists.rows[0]?.exists) {
        console.log('Adding field column to course_quizzes_rels table...')
        await db.execute(sql`
          ALTER TABLE "payload"."course_quizzes_rels"
          ADD COLUMN "field" VARCHAR(255);
        `)
      }

      // Step 4: Add value column if it doesn't exist
      const valueColumnExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes_rels'
          AND column_name = 'value'
        ) as exists;
      `)

      if (!valueColumnExists.rows[0]?.exists) {
        console.log('Adding value column to course_quizzes_rels table...')
        await db.execute(sql`
          ALTER TABLE "payload"."course_quizzes_rels"
          ADD COLUMN "value" uuid;
        `)
      }
    }

    // Step 5: Populate relationships between quizzes and questions
    console.log('Populating quiz-question relationships...')
    await db.execute(sql`
      INSERT INTO "payload"."course_quizzes_rels" ("_parent_id", "field", "value")
      SELECT 
        qq.quiz_id, 
        'questions', 
        qq.id
      FROM "payload"."quiz_questions" qq
      WHERE qq.quiz_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "payload"."course_quizzes_rels"
        WHERE "_parent_id" = qq.quiz_id
        AND "field" = 'questions'
        AND "value" = qq.id
      );
    `)

    // Step 6: Verify the relationships
    const relationshipCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "payload"."course_quizzes_rels"
      WHERE "field" = 'questions';
    `)

    console.log(`Created ${relationshipCount.rows[0]?.count || 0} quiz-question relationships`)
    console.log('Successfully completed consolidated fix for course_quizzes_rels table')
  } catch (error) {
    console.error('Error fixing course_quizzes_rels table:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert course_quizzes_rels table fix')

  try {
    // Remove relationships
    await db.execute(sql`
      DELETE FROM "payload"."course_quizzes_rels"
      WHERE "field" = 'questions';
    `)

    console.log('Successfully reverted course_quizzes_rels table fix')
  } catch (error) {
    console.error('Error reverting course_quizzes_rels table fix:', error)
    throw error
  }
}
