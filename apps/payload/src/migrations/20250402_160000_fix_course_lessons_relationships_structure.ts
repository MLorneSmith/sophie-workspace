import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running comprehensive fix for course_lessons relationships structure')

  try {
    // Step 1: Check if the course_lessons_rels table exists and get its structure
    const tableExistsResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons_rels'
      ) as exists;
    `)

    const tableExists = tableExistsResult.rows[0]?.exists || false

    if (tableExists) {
      // Get the column structure of the existing table
      const columnsResult = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons_rels';
      `)

      const columns = columnsResult.rows.map((row) => row.column_name)
      console.log('Existing course_lessons_rels table columns:', columns)

      // Check if we need to add the field column
      if (!columns.includes('field')) {
        console.log('Adding missing field column to course_lessons_rels table')
        await db.execute(sql`
          ALTER TABLE "payload"."course_lessons_rels"
          ADD COLUMN "field" VARCHAR(255);
        `)
      }
    } else {
      // Create the relationship table with the correct structure
      console.log('Creating course_lessons_rels table with correct structure')
      await db.execute(sql`
        CREATE TABLE "payload"."course_lessons_rels" (
          "id" SERIAL PRIMARY KEY,
          "parent_id" uuid NOT NULL,
          "path" VARCHAR(255),
          "field" VARCHAR(255),
          "order_field" INT,
          "value" uuid,
          CONSTRAINT "course_lessons_rels_parent_id_fkey"
          FOREIGN KEY ("parent_id")
          REFERENCES "payload"."course_lessons"("id")
          ON DELETE CASCADE
        );
      `)
    }

    // Step 2: Ensure the quiz_id_id column exists in course_lessons
    await db.execute(sql`
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

    // Step 3: Populate the quiz_id_id column with values from quiz_id
    await db.execute(sql`
      UPDATE "payload"."course_lessons"
      SET "quiz_id_id" = "quiz_id"
      WHERE "quiz_id" IS NOT NULL AND ("quiz_id_id" IS NULL OR "quiz_id_id" != "quiz_id");
    `)

    // Step 4: Check if parent_id is a generated column
    const generatedColumnsResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = 'course_lessons_rels'
      AND is_generated = 'ALWAYS';
    `)

    const generatedColumns = generatedColumnsResult.rows.map((row) => row.column_name)
    console.log('Generated columns in course_lessons_rels:', generatedColumns)

    // Step 5: Insert relationships for quiz_id_id
    // Use a different approach that doesn't directly insert into parent_id if it's generated
    if (generatedColumns.includes('parent_id')) {
      console.log('parent_id is a generated column, using alternative approach')

      // First, get all lessons with quizzes
      const lessonsWithQuizzes = await db.execute(sql`
        SELECT id, quiz_id
        FROM "payload"."course_lessons"
        WHERE quiz_id IS NOT NULL;
      `)

      // For each lesson, create a relationship entry
      for (const lesson of lessonsWithQuizzes.rows) {
        // Check if relationship already exists
        const existingRel = await db.execute(sql`
          SELECT id FROM "payload"."course_lessons_rels"
          WHERE "_parent_id" = ${lesson.id}
          AND "field" = 'quiz_id_id';
        `)

        if (existingRel.rows.length === 0) {
          // Create relationship using _parent_id instead of parent_id
          await db.execute(sql`
            INSERT INTO "payload"."course_lessons_rels" 
            ("id", "_parent_id", "field", "course_quizzes_id")
            VALUES (
              gen_random_uuid(),
              ${lesson.id},
              'quiz_id_id',
              ${lesson.quiz_id}
            );
          `)
        }
      }
    } else {
      // Use the original approach if parent_id is not generated
      await db.execute(sql`
        INSERT INTO "payload"."course_lessons_rels" ("parent_id", "path", "field", "course_quizzes_id")
        SELECT "id", 'quiz_id_id', 'quiz_id_id', "quiz_id"
        FROM "payload"."course_lessons"
        WHERE "quiz_id" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "payload"."course_lessons_rels"
          WHERE "parent_id" = "course_lessons"."id"
          AND "field" = 'quiz_id_id'
        );
      `)
    }

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

    console.log(
      'Successfully completed comprehensive fix for course_lessons relationships structure',
    )
  } catch (error) {
    console.error('Error fixing course_lessons relationships structure:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert course_lessons relationships structure fix')

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

    console.log('Successfully reverted course_lessons relationships structure fix')
  } catch (error) {
    console.error('Error reverting course_lessons relationships structure fix:', error)
    throw error
  }
}
