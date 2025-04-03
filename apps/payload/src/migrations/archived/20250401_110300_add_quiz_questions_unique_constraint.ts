import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add unique constraint to quiz_questions table for quiz_id and question
    ALTER TABLE payload.quiz_questions 
    ADD CONSTRAINT quiz_questions_quiz_id_question_unique 
    UNIQUE (quiz_id, question);
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove unique constraint from quiz_questions table
    ALTER TABLE payload.quiz_questions 
    DROP CONSTRAINT IF EXISTS quiz_questions_quiz_id_question_unique;
  `)
}
