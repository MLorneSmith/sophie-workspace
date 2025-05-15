import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_quiz_questions_type" AS ENUM('multiple_choice');
  CREATE TABLE IF NOT EXISTS "payload"."quiz_questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"is_correct" boolean DEFAULT false
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."quiz_questions" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"question" varchar NOT NULL,
  	"type" "payload"."enum_quiz_questions_type" DEFAULT 'multiple_choice' NOT NULL,
  	"question_slug" varchar NOT NULL,
  	"explanation" jsonb,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "quiz_questions_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "payload"."quiz_questions_options" ADD CONSTRAINT "quiz_questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "quiz_questions_options_order_idx" ON "payload"."quiz_questions_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "quiz_questions_options_parent_id_idx" ON "payload"."quiz_questions_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "quiz_questions_question_slug_idx" ON "payload"."quiz_questions" USING btree ("question_slug");
  CREATE INDEX IF NOT EXISTS "quiz_questions_updated_at_idx" ON "payload"."quiz_questions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "quiz_questions_created_at_idx" ON "payload"."quiz_questions" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quiz_questions_fk" FOREIGN KEY ("quiz_questions_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_quiz_questions_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("quiz_questions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."quiz_questions_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."quiz_questions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."quiz_questions_options" CASCADE;
  DROP TABLE "payload"."quiz_questions" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_quiz_questions_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_quiz_questions_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "quiz_questions_id";
  DROP TYPE "payload"."enum_quiz_questions_type";`)
}
