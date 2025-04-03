import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Comprehensive Migration for Quiz Questions Relationships
 *
 * This migration addresses all issues with quiz questions relationships:
 * 1. Adds quiz_id_id column to quiz_questions table if it doesn't exist
 * 2. Updates quiz_id_id column to match quiz_id column
 * 3. Adds value column to quiz_questions_rels table
 * 4. Creates entries in quiz_questions_rels table for each quiz question
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running comprehensive fix for quiz questions relationships')

  try {
    // Step 1: Ensure quiz_id_id column exists in quiz_questions table
    console.log('Ensuring quiz_id_id column exists in quiz_questions table...')
    await db.execute(sql`
      DO $$
      BEGIN
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

    // Step 2: Update quiz_id_id column to match quiz_id column
    console.log('Updating quiz_id_id column to match quiz_id column...')
    await db.execute(sql`
      UPDATE "payload"."quiz_questions"
      SET "quiz_id_id" = "quiz_id"
      WHERE "quiz_id" IS NOT NULL AND ("quiz_id_id" IS NULL OR "quiz_id_id" != "quiz_id");
    `)

    // Step 3: Ensure value column exists in quiz_questions_rels table
    console.log('Ensuring value column exists in quiz_questions_rels table...')
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
          AND column_name = 'value'
        ) THEN
          ALTER TABLE "payload"."quiz_questions_rels"
          ADD COLUMN "value" uuid;
        END IF;
      END $$;
    `)

    // Step 4: Ensure field column exists in quiz_questions_rels table
    console.log('Ensuring field column exists in quiz_questions_rels table...')
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

    // Step 5: Create entries in quiz_questions_rels table
    console.log('Creating entries in quiz_questions_rels table...')
    await db.execute(sql`
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
        SELECT 1 FROM "payload"."quiz_questions_rels"
        WHERE "_parent_id" = qq.id
        AND "field" = 'quiz_id_id'
      );
    `)

    // Step 6: Verify the updates
    const updatedQuestionsCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "payload"."quiz_questions"
      WHERE "quiz_id_id" IS NOT NULL;
    `)

    const relationshipCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "payload"."quiz_questions_rels"
      WHERE "field" = 'quiz_id_id';
    `)

    console.log(`Updated ${updatedQuestionsCount.rows[0]?.count || 0} quiz questions`)
    console.log(
      `Created ${relationshipCount.rows[0]?.count || 0} relationships in quiz_questions_rels table`,
    )
    console.log('Successfully completed comprehensive fix for quiz questions relationships')
  } catch (error) {
    console.error('Error fixing quiz questions relationships:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert quiz questions relationships fix')

  try {
    // Step 1: Remove entries from quiz_questions_rels table
    await db.execute(sql`
      DELETE FROM "payload"."quiz_questions_rels"
      WHERE "field" = 'quiz_id_id';
    `)

    // Step 2: Set quiz_id_id to NULL in quiz_questions table
    await db.execute(sql`
      UPDATE "payload"."quiz_questions"
      SET "quiz_id_id" = NULL
      WHERE "quiz_id_id" IS NOT NULL;
    `)

    console.log('Successfully reverted quiz questions relationships fix')
  } catch (error) {
    console.error('Error reverting quiz questions relationships fix:', error)
    throw error
  }
}
