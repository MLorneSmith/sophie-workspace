import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "payload"."course_quizzes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"quiz_questions_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_course_quizzes_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"quiz_questions_id" uuid
  );
  
  ALTER TABLE "payload"."course_lessons" ADD COLUMN "quiz_id_id" uuid;
  ALTER TABLE "payload"."course_lessons" ADD COLUMN "survey_id_id" uuid;
  ALTER TABLE "payload"."_course_lessons_v" ADD COLUMN "version_quiz_id_id" uuid;
  ALTER TABLE "payload"."_course_lessons_v" ADD COLUMN "version_survey_id_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "payload"."course_quizzes_rels" ADD CONSTRAINT "course_quizzes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_quizzes_rels" ADD CONSTRAINT "course_quizzes_rels_quiz_questions_fk" FOREIGN KEY ("quiz_questions_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_quizzes_v_rels" ADD CONSTRAINT "_course_quizzes_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_course_quizzes_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_quizzes_v_rels" ADD CONSTRAINT "_course_quizzes_v_rels_quiz_questions_fk" FOREIGN KEY ("quiz_questions_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "course_quizzes_rels_order_idx" ON "payload"."course_quizzes_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "course_quizzes_rels_parent_idx" ON "payload"."course_quizzes_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "course_quizzes_rels_path_idx" ON "payload"."course_quizzes_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "course_quizzes_rels_quiz_questions_id_idx" ON "payload"."course_quizzes_rels" USING btree ("quiz_questions_id");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_rels_order_idx" ON "payload"."_course_quizzes_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_rels_parent_idx" ON "payload"."_course_quizzes_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_rels_path_idx" ON "payload"."_course_quizzes_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_rels_quiz_questions_id_idx" ON "payload"."_course_quizzes_v_rels" USING btree ("quiz_questions_id");
  DO $$ BEGIN
   ALTER TABLE "payload"."course_lessons" ADD CONSTRAINT "course_lessons_quiz_id_id_course_quizzes_id_fk" FOREIGN KEY ("quiz_id_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_lessons" ADD CONSTRAINT "course_lessons_survey_id_id_surveys_id_fk" FOREIGN KEY ("survey_id_id") REFERENCES "payload"."surveys"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v" ADD CONSTRAINT "_course_lessons_v_version_quiz_id_id_course_quizzes_id_fk" FOREIGN KEY ("version_quiz_id_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v" ADD CONSTRAINT "_course_lessons_v_version_survey_id_id_surveys_id_fk" FOREIGN KEY ("version_survey_id_id") REFERENCES "payload"."surveys"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "course_lessons_quiz_id_idx" ON "payload"."course_lessons" USING btree ("quiz_id_id");
  CREATE INDEX IF NOT EXISTS "course_lessons_survey_id_idx" ON "payload"."course_lessons" USING btree ("survey_id_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_quiz_id_idx" ON "payload"."_course_lessons_v" USING btree ("version_quiz_id_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_survey_id_idx" ON "payload"."_course_lessons_v" USING btree ("version_survey_id_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."course_quizzes_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_course_quizzes_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."course_quizzes_rels" CASCADE;
  DROP TABLE "payload"."_course_quizzes_v_rels" CASCADE;
  ALTER TABLE "payload"."course_lessons" DROP CONSTRAINT "course_lessons_quiz_id_id_course_quizzes_id_fk";
  
  ALTER TABLE "payload"."course_lessons" DROP CONSTRAINT "course_lessons_survey_id_id_surveys_id_fk";
  
  ALTER TABLE "payload"."_course_lessons_v" DROP CONSTRAINT "_course_lessons_v_version_quiz_id_id_course_quizzes_id_fk";
  
  ALTER TABLE "payload"."_course_lessons_v" DROP CONSTRAINT "_course_lessons_v_version_survey_id_id_surveys_id_fk";
  
  DROP INDEX IF EXISTS "course_lessons_quiz_id_idx";
  DROP INDEX IF EXISTS "course_lessons_survey_id_idx";
  DROP INDEX IF EXISTS "_course_lessons_v_version_version_quiz_id_idx";
  DROP INDEX IF EXISTS "_course_lessons_v_version_version_survey_id_idx";
  ALTER TABLE "payload"."course_lessons" DROP COLUMN IF EXISTS "quiz_id_id";
  ALTER TABLE "payload"."course_lessons" DROP COLUMN IF EXISTS "survey_id_id";
  ALTER TABLE "payload"."_course_lessons_v" DROP COLUMN IF EXISTS "version_quiz_id_id";
  ALTER TABLE "payload"."_course_lessons_v" DROP COLUMN IF EXISTS "version_survey_id_id";`)
}
