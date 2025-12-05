import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "payload"."enum_quiz_questions_questiontype" AS ENUM('single-answer', 'multi-answer');
    ALTER TABLE "payload"."quiz_questions" ADD COLUMN "questiontype" "payload"."enum_quiz_questions_questiontype" DEFAULT 'single-answer';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."quiz_questions" DROP COLUMN "questiontype";
    DROP TYPE "payload"."enum_quiz_questions_questiontype";
  `)
}
