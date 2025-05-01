import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres' // Correct import

// Add _status column, default to 'published', and update existing rows
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Use db from args
  await db.execute(sql`
    ALTER TABLE "payload"."course_quizzes" ADD COLUMN "_status" varchar;
    UPDATE "payload"."course_quizzes" SET "_status" = 'published' WHERE "_status" IS NULL;
  `) // Use db.execute
}

// Remove _status column
export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Use db from args
  await db.execute(sql`
    ALTER TABLE "payload"."course_quizzes" DROP COLUMN IF EXISTS "_status";
  `) // Use db.execute
}
