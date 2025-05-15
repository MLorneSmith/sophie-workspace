import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_private_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__private_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE IF NOT EXISTS "payload"."private_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."private_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."private" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"content" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"image_id_id" uuid,
  	"featured_image_id_id" uuid,
  	"status" "payload"."enum_private_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_private_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."private_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_private_v_version_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"category" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_private_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_private_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_image_id_id" uuid,
  	"version_featured_image_id_id" uuid,
  	"version_status" "payload"."enum__private_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__private_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_private_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "private_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "payload"."private_categories" ADD CONSTRAINT "private_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."private"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private_tags" ADD CONSTRAINT "private_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."private"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private" ADD CONSTRAINT "private_image_id_id_downloads_id_fk" FOREIGN KEY ("image_id_id") REFERENCES "payload"."downloads"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private" ADD CONSTRAINT "private_featured_image_id_id_downloads_id_fk" FOREIGN KEY ("featured_image_id_id") REFERENCES "payload"."downloads"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private_rels" ADD CONSTRAINT "private_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."private"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private_rels" ADD CONSTRAINT "private_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v_version_categories" ADD CONSTRAINT "_private_v_version_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_private_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v_version_tags" ADD CONSTRAINT "_private_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_private_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v" ADD CONSTRAINT "_private_v_parent_id_private_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."private"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v" ADD CONSTRAINT "_private_v_version_image_id_id_downloads_id_fk" FOREIGN KEY ("version_image_id_id") REFERENCES "payload"."downloads"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v" ADD CONSTRAINT "_private_v_version_featured_image_id_id_downloads_id_fk" FOREIGN KEY ("version_featured_image_id_id") REFERENCES "payload"."downloads"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v_rels" ADD CONSTRAINT "_private_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_private_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v_rels" ADD CONSTRAINT "_private_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "private_categories_order_idx" ON "payload"."private_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "private_categories_parent_id_idx" ON "payload"."private_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "private_tags_order_idx" ON "payload"."private_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "private_tags_parent_id_idx" ON "payload"."private_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "private_image_id_idx" ON "payload"."private" USING btree ("image_id_id");
  CREATE INDEX IF NOT EXISTS "private_featured_image_id_idx" ON "payload"."private" USING btree ("featured_image_id_id");
  CREATE INDEX IF NOT EXISTS "private_updated_at_idx" ON "payload"."private" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "private_created_at_idx" ON "payload"."private" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "private__status_idx" ON "payload"."private" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "private_rels_order_idx" ON "payload"."private_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "private_rels_parent_idx" ON "payload"."private_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "private_rels_path_idx" ON "payload"."private_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "private_rels_downloads_id_idx" ON "payload"."private_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_private_v_version_categories_order_idx" ON "payload"."_private_v_version_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_private_v_version_categories_parent_id_idx" ON "payload"."_private_v_version_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_private_v_version_tags_order_idx" ON "payload"."_private_v_version_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_private_v_version_tags_parent_id_idx" ON "payload"."_private_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_private_v_parent_idx" ON "payload"."_private_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_private_v_version_version_image_id_idx" ON "payload"."_private_v" USING btree ("version_image_id_id");
  CREATE INDEX IF NOT EXISTS "_private_v_version_version_featured_image_id_idx" ON "payload"."_private_v" USING btree ("version_featured_image_id_id");
  CREATE INDEX IF NOT EXISTS "_private_v_version_version_updated_at_idx" ON "payload"."_private_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_private_v_version_version_created_at_idx" ON "payload"."_private_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_private_v_version_version__status_idx" ON "payload"."_private_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_private_v_created_at_idx" ON "payload"."_private_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_private_v_updated_at_idx" ON "payload"."_private_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_private_v_latest_idx" ON "payload"."_private_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_private_v_rels_order_idx" ON "payload"."_private_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_private_v_rels_parent_idx" ON "payload"."_private_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_private_v_rels_path_idx" ON "payload"."_private_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_private_v_rels_downloads_id_idx" ON "payload"."_private_v_rels" USING btree ("downloads_id");
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_private_fk" FOREIGN KEY ("private_id") REFERENCES "payload"."private"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_private_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("private_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."private_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."private_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."private" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."private_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_private_v_version_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_private_v_version_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_private_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_private_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."private_categories" CASCADE;
  DROP TABLE "payload"."private_tags" CASCADE;
  DROP TABLE "payload"."private" CASCADE;
  DROP TABLE "payload"."private_rels" CASCADE;
  DROP TABLE "payload"."_private_v_version_categories" CASCADE;
  DROP TABLE "payload"."_private_v_version_tags" CASCADE;
  DROP TABLE "payload"."_private_v" CASCADE;
  DROP TABLE "payload"."_private_v_rels" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_private_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_private_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "private_id";
  DROP TYPE "payload"."enum_private_status";
  DROP TYPE "payload"."enum__private_v_version_status";`)
}
