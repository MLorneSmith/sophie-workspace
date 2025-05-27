import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "payload"."documentation_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"doc_id" uuid,
  	"url" varchar,
  	"label" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_documentation_v_version_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"doc_id" uuid,
  	"url" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "payload"."documentation" ADD COLUMN "parent_id" uuid;
  ALTER TABLE "payload"."_documentation_v" ADD COLUMN "version_parent_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_breadcrumbs" ADD CONSTRAINT "documentation_breadcrumbs_doc_id_documentation_id_fk" FOREIGN KEY ("doc_id") REFERENCES "payload"."documentation"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_breadcrumbs" ADD CONSTRAINT "documentation_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_version_breadcrumbs" ADD CONSTRAINT "_documentation_v_version_breadcrumbs_doc_id_documentation_id_fk" FOREIGN KEY ("doc_id") REFERENCES "payload"."documentation"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_version_breadcrumbs" ADD CONSTRAINT "_documentation_v_version_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_documentation_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_order_idx" ON "payload"."documentation_breadcrumbs" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_parent_id_idx" ON "payload"."documentation_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_doc_idx" ON "payload"."documentation_breadcrumbs" USING btree ("doc_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_breadcrumbs_order_idx" ON "payload"."_documentation_v_version_breadcrumbs" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_breadcrumbs_parent_id_idx" ON "payload"."_documentation_v_version_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_breadcrumbs_doc_idx" ON "payload"."_documentation_v_version_breadcrumbs" USING btree ("doc_id");
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation" ADD CONSTRAINT "documentation_parent_id_documentation_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."documentation"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v" ADD CONSTRAINT "_documentation_v_version_parent_id_documentation_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "documentation_parent_idx" ON "payload"."documentation" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_version_parent_idx" ON "payload"."_documentation_v" USING btree ("version_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."documentation_breadcrumbs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_documentation_v_version_breadcrumbs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."documentation_breadcrumbs" CASCADE;
  DROP TABLE "payload"."_documentation_v_version_breadcrumbs" CASCADE;
  ALTER TABLE "payload"."documentation" DROP CONSTRAINT "documentation_parent_id_documentation_id_fk";
  
  ALTER TABLE "payload"."_documentation_v" DROP CONSTRAINT "_documentation_v_version_parent_id_documentation_id_fk";
  
  DROP INDEX IF EXISTS "documentation_parent_idx";
  DROP INDEX IF EXISTS "_documentation_v_version_version_parent_idx";
  ALTER TABLE "payload"."documentation" DROP COLUMN IF EXISTS "parent_id";
  ALTER TABLE "payload"."_documentation_v" DROP COLUMN IF EXISTS "version_parent_id";`)
}
