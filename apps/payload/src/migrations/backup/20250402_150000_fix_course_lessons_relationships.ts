import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running comprehensive fix for course_lessons relationships')

  try {
    // Step 1: Ensure the quiz_id_id column exists
    await db.execute(sql`
      -- Ensure the column exists
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons' 
          AND column_name = 'quiz_id_id'
        ) THEN
          ALTER TABLE "payload"."course_lessons"
          ADD COLUMN "quiz_id_id" uuid;
        END IF;
      END $$;
    `)

    // Step 2: Populate the quiz_id_id column with values from quiz_id
    await db.execute(sql`
      -- Populate the column
      UPDATE "payload"."course_lessons"
      SET "quiz_id_id" = "quiz_id"
      WHERE "quiz_id" IS NOT NULL AND ("quiz_id_id" IS NULL OR "quiz_id_id" != "quiz_id");
    `)

    // Step 3: Ensure the course_lessons_rels table exists
    await db.execute(sql`
      -- Create the relationship table if it doesn't exist
      CREATE TABLE IF NOT EXISTS "payload"."course_lessons_rels" (
        "id" SERIAL PRIMARY KEY,
        "parent_id" uuid NOT NULL,
        "path" VARCHAR(255) NOT NULL,
        "field" VARCHAR(255) NOT NULL,
        "order_field" INT,
        "value" uuid,
        CONSTRAINT "course_lessons_rels_parent_id_fkey"
        FOREIGN KEY ("parent_id")
        REFERENCES "payload"."course_lessons"("id")
        ON DELETE CASCADE
      );
    `)

    // Step 4: Insert relationships for quiz_id_id
    await db.execute(sql`
      -- Insert relationships for quiz_id_id
      INSERT INTO "payload"."course_lessons_rels" ("parent_id", "path", "field", "value")
      SELECT "id", 'quiz_id_id', 'quiz_id_id', "quiz_id"
      FROM "payload"."course_lessons"
      WHERE "quiz_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "payload"."course_lessons_rels"
        WHERE "parent_id" = "course_lessons"."id"
        AND "field" = 'quiz_id_id'
      );
    `)

    // Step 5: Verify the updates
    const columnResult = await db.execute(sql`
      SELECT COUNT(*) as updated_count
      FROM "payload"."course_lessons" 
      WHERE "quiz_id" IS NOT NULL AND "quiz_id" = "quiz_id_id";
    `)

    const relsResult = await db.execute(sql`
      SELECT COUNT(*) as rels_count
      FROM "payload"."course_lessons_rels"
      WHERE "field" = 'quiz_id_id';
    `)

    const updatedCount = columnResult.rows[0]?.updated_count || 0
    const relsCount = relsResult.rows[0]?.rels_count || 0

    console.log(`Successfully updated quiz_id_id column for ${updatedCount} lessons`)
    console.log(
      `Successfully created ${relsCount} relationship entries in course_lessons_rels table`,
    )

    // Step 6: Log sample data for verification
    const sampleData = await db.execute(sql`
      SELECT cl.id, cl.title, cl.quiz_id, cl.quiz_id_id, 
             (SELECT COUNT(*) FROM "payload"."course_lessons_rels" 
              WHERE "parent_id" = cl.id AND "field" = 'quiz_id_id') as rel_count
      FROM "payload"."course_lessons" cl
      WHERE cl.quiz_id IS NOT NULL
      LIMIT 5;
    `)

    console.log('Sample of updated lessons:')
    for (const row of sampleData.rows) {
      console.log(
        `- ${row.title}: quiz_id=${row.quiz_id}, quiz_id_id=${row.quiz_id_id}, rel_count=${row.rel_count}`,
      )
    }

    console.log('Successfully completed comprehensive fix for course_lessons relationships')
  } catch (error) {
    console.error('Error fixing course_lessons relationships:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert course_lessons relationships fix')

  try {
    // Step 1: Remove relationship entries
    await db.execute(sql`
      DELETE FROM "payload"."course_lessons_rels"
      WHERE "field" = 'quiz_id_id';
    `)

    // Step 2: Set quiz_id_id to null
    await db.execute(sql`
      UPDATE "payload"."course_lessons" 
      SET "quiz_id_id" = NULL 
      WHERE "quiz_id_id" IS NOT NULL;
    `)

    console.log('Successfully reverted course_lessons relationships fix')
  } catch (error) {
    console.error('Error reverting course_lessons relationships fix:', error)
    throw error
  }
}
