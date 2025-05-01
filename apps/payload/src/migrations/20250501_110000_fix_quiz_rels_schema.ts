import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Fix the schema of the course_quizzes_rels table
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Step 1: Ensure quiz_questions_id column exists and is UUID
  await db.execute(sql`
    ALTER TABLE "payload"."course_quizzes_rels"
     ADD COLUMN IF NOT EXISTS "quiz_questions_id" uuid;
   `)

  // Step 2: Drop the 'value' column if it exists.
  // We remove the data copy attempt as it caused foreign key errors and the
  // fix:quiz-jsonb-sync script handles definitive population later.
  await db.execute(sql`
     ALTER TABLE "payload"."course_quizzes_rels"
     DROP COLUMN IF EXISTS "value";
   `)

  /* --- Removed Data Copy Attempt ---
   try {
     const checkValueColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'course_quizzes_rels' 
      AND column_name = 'value';
    `)

    // Only attempt update if 'value' column exists
    if (checkValueColumn.rowCount > 0) {
      await db.execute(sql`
        UPDATE "payload"."course_quizzes_rels"
        SET "quiz_questions_id" = "value"::uuid
        WHERE "quiz_questions_id" IS NULL 
        AND "value" IS NOT NULL 
        AND "value"::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; -- Cast value to text for regex
      `)
    } else {
      console.warn(
        "Column 'value' does not exist in course_quizzes_rels, skipping data copy attempt.",
      )
    }
  } catch (error) {
    console.warn(
      'Warning: Could not copy data from value to quiz_questions_id. This might be expected if the value column does not exist or contains non-UUID data. The main fix script will handle population.',
    )
    // Type check for error message
    if (error instanceof Error) {
      console.warn('Original error:', error.message)
    } else {
       console.warn('Original error:', error)
     }
   }
   --- End Removed Data Copy Attempt --- */
}

// Revert the schema changes
export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Add the 'value' column back (as text, assuming original type was text)
  await db.execute(sql`
     ALTER TABLE "payload"."course_quizzes_rels"
     ADD COLUMN IF NOT EXISTS "value" text;
   `)

  // NOTE: We don't attempt to copy data back during rollback,
  // as the original 'value' data was likely incorrect or null.
  /* --- Removed Rollback Data Copy ---
   try {
     await db.execute(sql`
      UPDATE "payload"."course_quizzes_rels"
      SET "value" = "quiz_questions_id"::text
      WHERE "value" IS NULL AND "quiz_questions_id" IS NOT NULL;
    `)
  } catch (error) {
    console.warn(
      'Warning: Could not copy data back from quiz_questions_id to value during rollback.',
    )
    // Type check for error message
    if (error instanceof Error) {
      console.warn('Original error:', error.message)
    } else {
       console.warn('Original error:', error)
     }
   }
   --- End Removed Rollback Data Copy --- */

  // Drop the 'quiz_questions_id' column during rollback
  await db.execute(sql`
     ALTER TABLE "payload"."course_quizzes_rels"
     DROP COLUMN IF EXISTS "quiz_questions_id";
   `)
}
