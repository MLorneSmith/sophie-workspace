import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Consolidated Migration for Quiz Relationships
 *
 * This migration consolidates and replaces the following migrations:
 * - 20250403_100000_fix_course_lessons_quiz_relationships.ts
 * - 20250404_100000_fix_quiz_id_relationships.ts
 *
 * It addresses issues with quiz relationships in both course_lessons and quiz_questions tables,
 * ensuring proper relationship structure and data consistency.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running consolidated fix for course-quiz relationships')

  try {
    // Step 1: Ensure all required columns exist
    console.log('Ensuring required columns exist...')

    // Add field column to course_lessons_rels if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons_rels' 
          AND column_name = 'field'
        ) THEN
          ALTER TABLE "payload"."course_lessons_rels"
          ADD COLUMN "field" VARCHAR(255);
        END IF;
      END $$;
    `)

    // Add field column to quiz_questions_rels if it exists and doesn't have field column
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions_rels'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions_rels' 
          AND column_name = 'field'
        ) THEN
          ALTER TABLE "payload"."quiz_questions_rels"
          ADD COLUMN "field" VARCHAR(255);
        END IF;
      END $$;
    `)

    // Step 2: Fix course_lessons_rels relationships
    console.log('Fixing course_lessons_rels relationships...')

    // Check if quiz_id column exists in course_lessons_rels
    const quizIdColumnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons_rels' 
        AND column_name = 'quiz_id'
      ) as exists;
    `)

    const hasQuizIdColumn = quizIdColumnExists.rows[0]?.exists || false
    console.log(`quiz_id column exists in course_lessons_rels: ${hasQuizIdColumn}`)

    // Only update if the column exists
    if (hasQuizIdColumn) {
      await db.execute(sql`
        UPDATE "payload"."course_lessons_rels"
        SET "field" = 'quiz_id'
        WHERE "quiz_id" IS NOT NULL AND "field" IS NULL;
      `)

      // Verify the updates
      const updatedRelsCount = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM "payload"."course_lessons_rels"
        WHERE "field" = 'quiz_id';
      `)

      console.log(
        `Updated ${updatedRelsCount.rows[0]?.count || 0} relationships in course_lessons_rels table`,
      )
    }

    // Step 3: Fix quiz_questions table
    console.log('Fixing quiz_questions table...')

    // Update quiz_id_id with values from quiz_id if both columns exist
    const quizIdIdColumnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions' 
        AND column_name = 'quiz_id_id'
      ) as exists;
    `)

    if (quizIdIdColumnExists.rows[0]?.exists) {
      await db.execute(sql`
        UPDATE "payload"."quiz_questions"
        SET "quiz_id_id" = "quiz_id"
        WHERE "quiz_id" IS NOT NULL AND ("quiz_id_id" IS NULL OR "quiz_id_id" != "quiz_id");
      `)

      // Verify the updates
      const updatedQuestionsCount = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM "payload"."quiz_questions"
        WHERE "quiz_id_id" IS NOT NULL;
      `)

      console.log(`Updated ${updatedQuestionsCount.rows[0]?.count || 0} quiz questions`)
    }

    // Step 4: Create entries in quiz_questions_rels table if it exists
    console.log('Creating entries in quiz_questions_rels table...')

    // First, check if the table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions_rels'
      ) as exists;
    `)

    if (tableExists.rows[0]?.exists) {
      // Check if course_quizzes_id column exists
      const courseQuizzesIdExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions_rels' 
          AND column_name = 'course_quizzes_id'
        ) as exists;
      `)

      if (courseQuizzesIdExists.rows[0]?.exists) {
        // Insert relationships for each quiz question
        await db.execute(sql`
          INSERT INTO "payload"."quiz_questions_rels" ("id", "_parent_id", "field", "course_quizzes_id")
          SELECT 
            gen_random_uuid(), 
            qq.id, 
            'quiz_id', 
            qq.quiz_id
          FROM "payload"."quiz_questions" qq
          WHERE qq.quiz_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "payload"."quiz_questions_rels"
            WHERE "_parent_id" = qq.id
            AND "field" = 'quiz_id'
          );
        `)

        // Verify the inserts
        const insertedRelsCount = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM "payload"."quiz_questions_rels"
          WHERE "field" = 'quiz_id';
        `)

        console.log(
          `Created ${insertedRelsCount.rows[0]?.count || 0} relationships in quiz_questions_rels table`,
        )
      } else {
        console.log(
          'course_quizzes_id column does not exist in quiz_questions_rels, skipping relationship creation',
        )
      }
    } else {
      console.log('quiz_questions_rels table does not exist, skipping')
    }

    console.log('Successfully completed consolidated fix for course-quiz relationships')
  } catch (error) {
    console.error('Error fixing course-quiz relationships:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert course-quiz relationships fix')

  try {
    // Step 1: Revert changes to course_lessons_rels table
    await db.execute(sql`
      UPDATE "payload"."course_lessons_rels"
      SET "field" = NULL
      WHERE "field" = 'quiz_id';
    `)

    // Step 2: Revert changes to quiz_questions table if quiz_id_id exists
    const quizIdIdColumnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions' 
        AND column_name = 'quiz_id_id'
      ) as exists;
    `)

    if (quizIdIdColumnExists.rows[0]?.exists) {
      await db.execute(sql`
        UPDATE "payload"."quiz_questions" 
        SET "quiz_id_id" = NULL 
        WHERE "quiz_id_id" IS NOT NULL;
      `)
    }

    // Step 3: Remove entries from quiz_questions_rels table if it exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions_rels'
      ) as exists;
    `)

    if (tableExists.rows[0]?.exists) {
      await db.execute(sql`
        DELETE FROM "payload"."quiz_questions_rels"
        WHERE "field" = 'quiz_id';
      `)
    }

    console.log('Successfully reverted course-quiz relationships fix')
  } catch (error) {
    console.error('Error reverting course-quiz relationships fix:', error)
    throw error
  }
}
