import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_course_lessons_video_source_type" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "payload"."enum_course_lessons_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__course_lessons_v_version_video_source_type" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "payload"."enum__course_lessons_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE IF NOT EXISTS "payload"."course_lessons" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"bunny_video_id" varchar,
  	"bunny_library_id" varchar DEFAULT '264486',
  	"video_source_type" "payload"."enum_course_lessons_video_source_type" DEFAULT 'youtube',
  	"youtube_video_id" varchar,
  	"todo_complete_quiz" boolean DEFAULT false,
  	"slug" varchar,
  	"description" varchar,
  	"content" jsonb,
  	"lesson_number" numeric,
  	"estimated_duration" numeric,
  	"course_id_id" uuid,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_course_lessons_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."course_lessons_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_course_lessons_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_bunny_video_id" varchar,
  	"version_bunny_library_id" varchar DEFAULT '264486',
  	"version_video_source_type" "payload"."enum__course_lessons_v_version_video_source_type" DEFAULT 'youtube',
  	"version_youtube_video_id" varchar,
  	"version_todo_complete_quiz" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" jsonb,
  	"version_lesson_number" numeric,
  	"version_estimated_duration" numeric,
  	"version_course_id_id" uuid,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__course_lessons_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_course_lessons_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "course_lessons_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "payload"."course_lessons" ADD CONSTRAINT "course_lessons_course_id_id_courses_id_fk" FOREIGN KEY ("course_id_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_lessons_rels" ADD CONSTRAINT "course_lessons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_lessons_rels" ADD CONSTRAINT "course_lessons_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v" ADD CONSTRAINT "_course_lessons_v_parent_id_course_lessons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."course_lessons"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v" ADD CONSTRAINT "_course_lessons_v_version_course_id_id_courses_id_fk" FOREIGN KEY ("version_course_id_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v_rels" ADD CONSTRAINT "_course_lessons_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_course_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v_rels" ADD CONSTRAINT "_course_lessons_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE UNIQUE INDEX IF NOT EXISTS "course_lessons_slug_idx" ON "payload"."course_lessons" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "course_lessons_course_id_idx" ON "payload"."course_lessons" USING btree ("course_id_id");
  CREATE INDEX IF NOT EXISTS "course_lessons_updated_at_idx" ON "payload"."course_lessons" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "course_lessons_created_at_idx" ON "payload"."course_lessons" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "course_lessons__status_idx" ON "payload"."course_lessons" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "course_lessons_rels_order_idx" ON "payload"."course_lessons_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "course_lessons_rels_parent_idx" ON "payload"."course_lessons_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "course_lessons_rels_path_idx" ON "payload"."course_lessons_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "course_lessons_rels_downloads_id_idx" ON "payload"."course_lessons_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_parent_idx" ON "payload"."_course_lessons_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_slug_idx" ON "payload"."_course_lessons_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_course_id_idx" ON "payload"."_course_lessons_v" USING btree ("version_course_id_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_updated_at_idx" ON "payload"."_course_lessons_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_created_at_idx" ON "payload"."_course_lessons_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version__status_idx" ON "payload"."_course_lessons_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_created_at_idx" ON "payload"."_course_lessons_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_updated_at_idx" ON "payload"."_course_lessons_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_latest_idx" ON "payload"."_course_lessons_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_rels_order_idx" ON "payload"."_course_lessons_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_rels_parent_idx" ON "payload"."_course_lessons_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_rels_path_idx" ON "payload"."_course_lessons_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_rels_downloads_id_idx" ON "payload"."_course_lessons_v_rels" USING btree ("downloads_id");
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_lessons_fk" FOREIGN KEY ("course_lessons_id") REFERENCES "payload"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_course_lessons_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("course_lessons_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."course_lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."course_lessons_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_course_lessons_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_course_lessons_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."course_lessons" CASCADE;
  DROP TABLE "payload"."course_lessons_rels" CASCADE;
  DROP TABLE "payload"."_course_lessons_v" CASCADE;
  DROP TABLE "payload"."_course_lessons_v_rels" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_course_lessons_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_course_lessons_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "course_lessons_id";
  DROP TYPE "payload"."enum_course_lessons_video_source_type";
  DROP TYPE "payload"."enum_course_lessons_status";
  DROP TYPE "payload"."enum__course_lessons_v_version_video_source_type";
  DROP TYPE "payload"."enum__course_lessons_v_version_status";`)
}
