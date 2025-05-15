import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_documentation_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__documentation_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE IF NOT EXISTS "payload"."users" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."media" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."downloads" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."posts_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."posts_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."posts" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"content" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"image_id_id" varchar,
  	"status" "payload"."enum_posts_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_posts_v_version_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"category" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_posts_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_posts_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_image_id_id" varchar,
  	"version_status" "payload"."enum__posts_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."documentation_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."documentation_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."documentation" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"content" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"status" "payload"."enum_documentation_status" DEFAULT 'draft',
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_documentation_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."documentation_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_documentation_v_version_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"category" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_documentation_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_documentation_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_status" "payload"."enum__documentation_v_version_status" DEFAULT 'draft',
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__documentation_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_documentation_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" varchar,
  	"media_id" varchar,
  	"downloads_id" uuid,
  	"posts_id" uuid,
  	"documentation_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DO $$ BEGIN
   ALTER TABLE "payload"."posts_categories" ADD CONSTRAINT "posts_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."posts_tags" ADD CONSTRAINT "posts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."posts" ADD CONSTRAINT "posts_image_id_id_media_id_fk" FOREIGN KEY ("image_id_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."posts_rels" ADD CONSTRAINT "posts_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v_version_categories" ADD CONSTRAINT "_posts_v_version_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v_version_tags" ADD CONSTRAINT "_posts_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."posts"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v" ADD CONSTRAINT "_posts_v_version_image_id_id_media_id_fk" FOREIGN KEY ("version_image_id_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_categories" ADD CONSTRAINT "documentation_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_tags" ADD CONSTRAINT "documentation_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_rels" ADD CONSTRAINT "documentation_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."documentation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_rels" ADD CONSTRAINT "documentation_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_version_categories" ADD CONSTRAINT "_documentation_v_version_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_documentation_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_version_tags" ADD CONSTRAINT "_documentation_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_documentation_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v" ADD CONSTRAINT "_documentation_v_parent_id_documentation_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."documentation"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_rels" ADD CONSTRAINT "_documentation_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_documentation_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_rels" ADD CONSTRAINT "_documentation_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documentation_fk" FOREIGN KEY ("documentation_id") REFERENCES "payload"."documentation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "downloads_updated_at_idx" ON "payload"."downloads" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "downloads_created_at_idx" ON "payload"."downloads" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "downloads_filename_idx" ON "payload"."downloads" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "posts_categories_order_idx" ON "payload"."posts_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "posts_categories_parent_id_idx" ON "payload"."posts_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "posts_tags_order_idx" ON "payload"."posts_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "posts_tags_parent_id_idx" ON "payload"."posts_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "posts_image_id_idx" ON "payload"."posts" USING btree ("image_id_id");
  CREATE INDEX IF NOT EXISTS "posts_updated_at_idx" ON "payload"."posts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "payload"."posts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "posts__status_idx" ON "payload"."posts" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "posts_rels_order_idx" ON "payload"."posts_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "posts_rels_parent_idx" ON "payload"."posts_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_path_idx" ON "payload"."posts_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "posts_rels_downloads_id_idx" ON "payload"."posts_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_categories_order_idx" ON "payload"."_posts_v_version_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_categories_parent_id_idx" ON "payload"."_posts_v_version_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_tags_order_idx" ON "payload"."_posts_v_version_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_tags_parent_id_idx" ON "payload"."_posts_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_parent_idx" ON "payload"."_posts_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_image_id_idx" ON "payload"."_posts_v" USING btree ("version_image_id_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_updated_at_idx" ON "payload"."_posts_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_created_at_idx" ON "payload"."_posts_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version__status_idx" ON "payload"."_posts_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_posts_v_created_at_idx" ON "payload"."_posts_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_updated_at_idx" ON "payload"."_posts_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_latest_idx" ON "payload"."_posts_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_order_idx" ON "payload"."_posts_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_parent_idx" ON "payload"."_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_path_idx" ON "payload"."_posts_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_downloads_id_idx" ON "payload"."_posts_v_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "documentation_categories_order_idx" ON "payload"."documentation_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "documentation_categories_parent_id_idx" ON "payload"."documentation_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "documentation_tags_order_idx" ON "payload"."documentation_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "documentation_tags_parent_id_idx" ON "payload"."documentation_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "documentation_updated_at_idx" ON "payload"."documentation" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "documentation_created_at_idx" ON "payload"."documentation" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "documentation__status_idx" ON "payload"."documentation" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "documentation_rels_order_idx" ON "payload"."documentation_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "documentation_rels_parent_idx" ON "payload"."documentation_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "documentation_rels_path_idx" ON "payload"."documentation_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "documentation_rels_downloads_id_idx" ON "payload"."documentation_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_categories_order_idx" ON "payload"."_documentation_v_version_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_categories_parent_id_idx" ON "payload"."_documentation_v_version_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_tags_order_idx" ON "payload"."_documentation_v_version_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_tags_parent_id_idx" ON "payload"."_documentation_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_parent_idx" ON "payload"."_documentation_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_version_updated_at_idx" ON "payload"."_documentation_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_version_created_at_idx" ON "payload"."_documentation_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_version__status_idx" ON "payload"."_documentation_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_documentation_v_created_at_idx" ON "payload"."_documentation_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_documentation_v_updated_at_idx" ON "payload"."_documentation_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_documentation_v_latest_idx" ON "payload"."_documentation_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_documentation_v_rels_order_idx" ON "payload"."_documentation_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_documentation_v_rels_parent_idx" ON "payload"."_documentation_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_rels_path_idx" ON "payload"."_documentation_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_documentation_v_rels_downloads_id_idx" ON "payload"."_documentation_v_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_downloads_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_posts_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_documentation_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("documentation_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."downloads" CASCADE;
  DROP TABLE "payload"."posts_categories" CASCADE;
  DROP TABLE "payload"."posts_tags" CASCADE;
  DROP TABLE "payload"."posts" CASCADE;
  DROP TABLE "payload"."posts_rels" CASCADE;
  DROP TABLE "payload"."_posts_v_version_categories" CASCADE;
  DROP TABLE "payload"."_posts_v_version_tags" CASCADE;
  DROP TABLE "payload"."_posts_v" CASCADE;
  DROP TABLE "payload"."_posts_v_rels" CASCADE;
  DROP TABLE "payload"."documentation_categories" CASCADE;
  DROP TABLE "payload"."documentation_tags" CASCADE;
  DROP TABLE "payload"."documentation" CASCADE;
  DROP TABLE "payload"."documentation_rels" CASCADE;
  DROP TABLE "payload"."_documentation_v_version_categories" CASCADE;
  DROP TABLE "payload"."_documentation_v_version_tags" CASCADE;
  DROP TABLE "payload"."_documentation_v" CASCADE;
  DROP TABLE "payload"."_documentation_v_rels" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TYPE "payload"."enum_posts_status";
  DROP TYPE "payload"."enum__posts_v_version_status";
  DROP TYPE "payload"."enum_documentation_status";
  DROP TYPE "payload"."enum__documentation_v_version_status";`)
}
