import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_course_quizzes_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__course_quizzes_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE IF NOT EXISTS "payload"."course_quizzes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"course_id_id" uuid,
  	"pass_threshold" numeric DEFAULT 70,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_course_quizzes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_course_quizzes_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_course_id_id" uuid,
  	"version_pass_threshold" numeric DEFAULT 70,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__course_quizzes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "course_quizzes_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "payload"."course_quizzes" ADD CONSTRAINT "course_quizzes_course_id_id_courses_id_fk" FOREIGN KEY ("course_id_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_quizzes_v" ADD CONSTRAINT "_course_quizzes_v_parent_id_course_quizzes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_quizzes_v" ADD CONSTRAINT "_course_quizzes_v_version_course_id_id_courses_id_fk" FOREIGN KEY ("version_course_id_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE UNIQUE INDEX IF NOT EXISTS "course_quizzes_slug_idx" ON "payload"."course_quizzes" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "course_quizzes_course_id_idx" ON "payload"."course_quizzes" USING btree ("course_id_id");
  CREATE INDEX IF NOT EXISTS "course_quizzes_updated_at_idx" ON "payload"."course_quizzes" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "course_quizzes_created_at_idx" ON "payload"."course_quizzes" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "course_quizzes__status_idx" ON "payload"."course_quizzes" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_parent_idx" ON "payload"."_course_quizzes_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_version_version_slug_idx" ON "payload"."_course_quizzes_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_version_version_course_id_idx" ON "payload"."_course_quizzes_v" USING btree ("version_course_id_id");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_version_version_updated_at_idx" ON "payload"."_course_quizzes_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_version_version_created_at_idx" ON "payload"."_course_quizzes_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_version_version__status_idx" ON "payload"."_course_quizzes_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_created_at_idx" ON "payload"."_course_quizzes_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_updated_at_idx" ON "payload"."_course_quizzes_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_latest_idx" ON "payload"."_course_quizzes_v" USING btree ("latest");
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_quizzes_fk" FOREIGN KEY ("course_quizzes_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_course_quizzes_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("course_quizzes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."course_quizzes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_course_quizzes_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."course_quizzes" CASCADE;
  DROP TABLE "payload"."_course_quizzes_v" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_course_quizzes_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_course_quizzes_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "course_quizzes_id";
  DROP TYPE "payload"."enum_course_quizzes_status";
  DROP TYPE "payload"."enum__course_quizzes_v_version_status";`)
}
