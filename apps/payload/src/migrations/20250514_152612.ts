import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_surveys_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__surveys_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE IF NOT EXISTS "payload"."surveys" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"status" "payload"."enum_surveys_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_surveys_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."surveys_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_surveys_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_status" "payload"."enum__surveys_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__surveys_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_surveys_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "surveys_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "payload"."surveys_rels" ADD CONSTRAINT "surveys_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."surveys"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."surveys_rels" ADD CONSTRAINT "surveys_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_surveys_v" ADD CONSTRAINT "_surveys_v_parent_id_surveys_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."surveys"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_surveys_v_rels" ADD CONSTRAINT "_surveys_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_surveys_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_surveys_v_rels" ADD CONSTRAINT "_surveys_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE UNIQUE INDEX IF NOT EXISTS "surveys_slug_idx" ON "payload"."surveys" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "surveys_updated_at_idx" ON "payload"."surveys" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "surveys_created_at_idx" ON "payload"."surveys" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "surveys__status_idx" ON "payload"."surveys" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "surveys_rels_order_idx" ON "payload"."surveys_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "surveys_rels_parent_idx" ON "payload"."surveys_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "surveys_rels_path_idx" ON "payload"."surveys_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "surveys_rels_downloads_id_idx" ON "payload"."surveys_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_surveys_v_parent_idx" ON "payload"."_surveys_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_surveys_v_version_version_slug_idx" ON "payload"."_surveys_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_surveys_v_version_version_updated_at_idx" ON "payload"."_surveys_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_surveys_v_version_version_created_at_idx" ON "payload"."_surveys_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_surveys_v_version_version__status_idx" ON "payload"."_surveys_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_surveys_v_created_at_idx" ON "payload"."_surveys_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_surveys_v_updated_at_idx" ON "payload"."_surveys_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_surveys_v_latest_idx" ON "payload"."_surveys_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_surveys_v_rels_order_idx" ON "payload"."_surveys_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_surveys_v_rels_parent_idx" ON "payload"."_surveys_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_surveys_v_rels_path_idx" ON "payload"."_surveys_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_surveys_v_rels_downloads_id_idx" ON "payload"."_surveys_v_rels" USING btree ("downloads_id");
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_surveys_fk" FOREIGN KEY ("surveys_id") REFERENCES "payload"."surveys"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_surveys_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("surveys_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."surveys" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."surveys_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_surveys_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_surveys_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."surveys" CASCADE;
  DROP TABLE "payload"."surveys_rels" CASCADE;
  DROP TABLE "payload"."_surveys_v" CASCADE;
  DROP TABLE "payload"."_surveys_v_rels" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_surveys_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_surveys_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "surveys_id";
  DROP TYPE "payload"."enum_surveys_status";
  DROP TYPE "payload"."enum__surveys_v_version_status";`)
}
