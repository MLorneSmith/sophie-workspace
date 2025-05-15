import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_survey_questions_type" AS ENUM('multiple_choice', 'text_field', 'scale');
  CREATE TYPE "payload"."enum_survey_questions_questionspin" AS ENUM('Positive', 'Negative');
  CREATE TYPE "payload"."enum_survey_questions_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__survey_questions_v_version_type" AS ENUM('multiple_choice', 'text_field', 'scale');
  CREATE TYPE "payload"."enum__survey_questions_v_version_questionspin" AS ENUM('Positive', 'Negative');
  CREATE TYPE "payload"."enum__survey_questions_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE IF NOT EXISTS "payload"."survey_questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."survey_questions" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"question_slug" varchar,
  	"text" varchar,
  	"type" "payload"."enum_survey_questions_type" DEFAULT 'multiple_choice',
  	"description" varchar,
  	"required" boolean DEFAULT true,
  	"category" varchar,
  	"questionspin" "payload"."enum_survey_questions_questionspin" DEFAULT 'Positive',
  	"position" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_survey_questions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_survey_questions_v_version_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"option" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_survey_questions_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_question_slug" varchar,
  	"version_text" varchar,
  	"version_type" "payload"."enum__survey_questions_v_version_type" DEFAULT 'multiple_choice',
  	"version_description" varchar,
  	"version_required" boolean DEFAULT true,
  	"version_category" varchar,
  	"version_questionspin" "payload"."enum__survey_questions_v_version_questionspin" DEFAULT 'Positive',
  	"version_position" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__survey_questions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "survey_questions_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "payload"."survey_questions_options" ADD CONSTRAINT "survey_questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_survey_questions_v_version_options" ADD CONSTRAINT "_survey_questions_v_version_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_survey_questions_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_survey_questions_v" ADD CONSTRAINT "_survey_questions_v_parent_id_survey_questions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."survey_questions"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "survey_questions_options_order_idx" ON "payload"."survey_questions_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "survey_questions_options_parent_id_idx" ON "payload"."survey_questions_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "survey_questions_question_slug_idx" ON "payload"."survey_questions" USING btree ("question_slug");
  CREATE INDEX IF NOT EXISTS "survey_questions_updated_at_idx" ON "payload"."survey_questions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "survey_questions_created_at_idx" ON "payload"."survey_questions" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "survey_questions__status_idx" ON "payload"."survey_questions" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_options_order_idx" ON "payload"."_survey_questions_v_version_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_options_parent_id_idx" ON "payload"."_survey_questions_v_version_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_parent_idx" ON "payload"."_survey_questions_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_version_question_slug_idx" ON "payload"."_survey_questions_v" USING btree ("version_question_slug");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_version_updated_at_idx" ON "payload"."_survey_questions_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_version_created_at_idx" ON "payload"."_survey_questions_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_version__status_idx" ON "payload"."_survey_questions_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_created_at_idx" ON "payload"."_survey_questions_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_updated_at_idx" ON "payload"."_survey_questions_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_latest_idx" ON "payload"."_survey_questions_v" USING btree ("latest");
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_survey_questions_fk" FOREIGN KEY ("survey_questions_id") REFERENCES "payload"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_survey_questions_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("survey_questions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."survey_questions_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."survey_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_survey_questions_v_version_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_survey_questions_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."survey_questions_options" CASCADE;
  DROP TABLE "payload"."survey_questions" CASCADE;
  DROP TABLE "payload"."_survey_questions_v_version_options" CASCADE;
  DROP TABLE "payload"."_survey_questions_v" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_survey_questions_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_survey_questions_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "survey_questions_id";
  DROP TYPE "payload"."enum_survey_questions_type";
  DROP TYPE "payload"."enum_survey_questions_questionspin";
  DROP TYPE "payload"."enum_survey_questions_status";
  DROP TYPE "payload"."enum__survey_questions_v_version_type";
  DROP TYPE "payload"."enum__survey_questions_v_version_questionspin";
  DROP TYPE "payload"."enum__survey_questions_v_version_status";`)
}
