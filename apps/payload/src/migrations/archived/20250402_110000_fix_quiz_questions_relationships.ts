import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Enhanced Migration for Quiz Questions Relationships
 *
 * This migration addresses issues with the previous migration that failed to:
 * 1. Update quiz_id_id column to match quiz_id column
 * 2. Create entries in quiz_questions_rels table for each quiz question
 *
 * This migration adds more detailed logging and uses a different approach
 * to ensure the relationships are properly established.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running enhanced fix for quiz questions relationships')

  try {
    // Step 1: Check if quiz_id column contains valid UUIDs
    console.log('Checking if quiz_id column contains valid UUIDs...')
    const validQuizIds = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "payload"."quiz_questions" qq
      JOIN "payload"."course_quizzes" cq ON qq.quiz_id = cq.id
      WHERE qq.quiz_id IS NOT NULL;
    `)
    console.log(
      `Found ${validQuizIds.rows[0]?.count || 0} quiz questions with valid quiz_id values`,
    )

    // Step 2: Check current state of quiz_id_id column
    console.log('Checking current state of quiz_id_id column...')
    const nullQuizIdId = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "payload"."quiz_questions"
      WHERE "quiz_id" IS NOT NULL AND "quiz_id_id" IS NULL;
    `)
    console.log(
      `Found ${nullQuizIdId.rows[0]?.count || 0} quiz questions with NULL quiz_id_id values`,
    )

    // Step 3: Update quiz_id_id column using a different approach
    console.log('Updating quiz_id_id column using a different approach...')
    const updateResult = await db.execute(sql`
      WITH updated_rows AS (
        UPDATE "payload"."quiz_questions"
        SET "quiz_id_id" = "quiz_id"
        WHERE "quiz_id" IS NOT NULL AND "quiz_id_id" IS NULL
        RETURNING id
      )
      SELECT COUNT(*) as count FROM updated_rows;
    `)
    console.log(`Updated ${updateResult.rows[0]?.count || 0} quiz questions with quiz_id_id values`)

    // Step 4: Check current state of quiz_questions_rels table
    console.log('Checking current state of quiz_questions_rels table...')
    const existingRels = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "payload"."quiz_questions_rels"
      WHERE "field" = 'quiz_id_id';
    `)
    console.log(
      `Found ${existingRels.rows[0]?.count || 0} existing relationships in quiz_questions_rels table`,
    )

    // Step 5: Create entries in quiz_questions_rels table using a different approach
    console.log('Creating entries in quiz_questions_rels table using a different approach...')

    // First, ensure all required columns exist
    await db.execute(sql`
      DO $$
      BEGIN
        -- Ensure _parent_id column exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions_rels' 
          AND column_name = '_parent_id'
        ) THEN
          ALTER TABLE "payload"."quiz_questions_rels"
          ADD COLUMN "_parent_id" uuid REFERENCES "payload"."quiz_questions"("id") ON DELETE CASCADE;
        END IF;

        -- Ensure field column exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions_rels' 
          AND column_name = 'field'
        ) THEN
          ALTER TABLE "payload"."quiz_questions_rels"
          ADD COLUMN "field" VARCHAR(255);
        END IF;

        -- Ensure value column exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions_rels' 
          AND column_name = 'value'
        ) THEN
          ALTER TABLE "payload"."quiz_questions_rels"
          ADD COLUMN "value" uuid;
        END IF;

        -- Ensure created_at column exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions_rels' 
          AND column_name = 'created_at'
        ) THEN
          ALTER TABLE "payload"."quiz_questions_rels"
          ADD COLUMN "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;

        -- Ensure updated_at column exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions_rels' 
          AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE "payload"."quiz_questions_rels"
          ADD COLUMN "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
      END $$;
    `)

    // Then insert the relationships
    const insertResult = await db.execute(sql`
      WITH inserted_rows AS (
        INSERT INTO "payload"."quiz_questions_rels" ("id", "_parent_id", "field", "value", "updated_at", "created_at")
        SELECT 
          gen_random_uuid(), 
          qq.id, 
          'quiz_id_id', 
          qq.quiz_id,
          NOW(),
          NOW()
        FROM "payload"."quiz_questions" qq
        WHERE qq.quiz_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "payload"."quiz_questions_rels" qr
          WHERE qr."_parent_id" = qq.id
          AND qr."field" = 'quiz_id_id'
        )
        RETURNING id
      )
      SELECT COUNT(*) as count FROM inserted_rows;
    `)
    console.log(
      `Created ${insertResult.rows[0]?.count || 0} new relationships in quiz_questions_rels table`,
    )

    // Step 6: Create bidirectional relationships in course_quizzes_rels table
    console.log('Creating bidirectional relationships in course_quizzes_rels table...')

    // First, check if course_quizzes_rels table exists
    const courseQuizzesRelsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes_rels'
      ) as exists;
    `)

    if (courseQuizzesRelsExists.rows[0]?.exists) {
      // Create bidirectional relationships
      const bidirectionalResult = await db.execute(sql`
        WITH inserted_rows AS (
          INSERT INTO "payload"."course_quizzes_rels" ("id", "_parent_id", "field", "value", "updated_at", "created_at")
          SELECT 
            gen_random_uuid(), 
            qq.quiz_id, 
            'questions', 
            qq.id,
            NOW(),
            NOW()
          FROM "payload"."quiz_questions" qq
          WHERE qq.quiz_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "payload"."course_quizzes_rels" cqr
            WHERE cqr."_parent_id" = qq.quiz_id
            AND cqr."field" = 'questions'
            AND cqr."value" = qq.id
          )
          RETURNING id
        )
        SELECT COUNT(*) as count FROM inserted_rows;
      `)
      console.log(
        `Created ${bidirectionalResult.rows[0]?.count || 0} bidirectional relationships in course_quizzes_rels table`,
      )
    } else {
      console.log(
        'course_quizzes_rels table does not exist, skipping bidirectional relationship creation',
      )
    }

    // Step 7: Verify the updates
    const finalQuizIdIdCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "payload"."quiz_questions"
      WHERE "quiz_id_id" IS NOT NULL;
    `)

    const finalRelationshipCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "payload"."quiz_questions_rels"
      WHERE "field" = 'quiz_id_id';
    `)

    console.log(
      `Final count: ${finalQuizIdIdCount.rows[0]?.count || 0} quiz questions with quiz_id_id values`,
    )
    console.log(
      `Final count: ${finalRelationshipCount.rows[0]?.count || 0} relationships in quiz_questions_rels table`,
    )

    if (courseQuizzesRelsExists.rows[0]?.exists) {
      const finalBidirectionalCount = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM "payload"."course_quizzes_rels"
        WHERE "field" = 'questions';
      `)
      console.log(
        `Final count: ${finalBidirectionalCount.rows[0]?.count || 0} bidirectional relationships in course_quizzes_rels table`,
      )
    }

    console.log('Successfully completed enhanced fix for quiz questions relationships')
  } catch (error) {
    console.error('Error fixing quiz questions relationships:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert enhanced quiz questions relationships fix')

  try {
    // Step 1: Remove bidirectional entries from course_quizzes_rels table
    const courseQuizzesRelsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes_rels'
      ) as exists;
    `)

    if (courseQuizzesRelsExists.rows[0]?.exists) {
      await db.execute(sql`
        DELETE FROM "payload"."course_quizzes_rels"
        WHERE "field" = 'questions';
      `)
    }

    // Step 2: Remove entries from quiz_questions_rels table
    await db.execute(sql`
      DELETE FROM "payload"."quiz_questions_rels"
      WHERE "field" = 'quiz_id_id';
    `)

    // Step 3: Set quiz_id_id to NULL in quiz_questions table
    await db.execute(sql`
      UPDATE "payload"."quiz_questions"
      SET "quiz_id_id" = NULL
      WHERE "quiz_id_id" IS NOT NULL;
    `)

    console.log('Successfully reverted enhanced quiz questions relationships fix')
  } catch (error) {
    console.error('Error reverting enhanced quiz questions relationships fix:', error)
    throw error
  }
}
