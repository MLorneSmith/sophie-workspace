import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create documentation_breadcrumbs table for the nestedDocsPlugin
    CREATE TABLE IF NOT EXISTS "payload"."documentation_breadcrumbs" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "doc" uuid NOT NULL,
      "parent" uuid,
      "order" integer,
      "_order" integer GENERATED ALWAYS AS ("order") STORED,
      "depth" integer,
      "label" varchar,
      "url" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for documentation_breadcrumbs
    CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_updated_at_idx" ON "payload"."documentation_breadcrumbs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_created_at_idx" ON "payload"."documentation_breadcrumbs" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_doc_idx" ON "payload"."documentation_breadcrumbs" USING btree ("doc");
    CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_parent_idx" ON "payload"."documentation_breadcrumbs" USING btree ("parent");
    
    -- Add foreign key constraints
    ALTER TABLE "payload"."documentation_breadcrumbs" 
    ADD CONSTRAINT "documentation_breadcrumbs_doc_fkey" 
    FOREIGN KEY ("doc") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."documentation_breadcrumbs" 
    ADD CONSTRAINT "documentation_breadcrumbs_parent_fkey" 
    FOREIGN KEY ("parent") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop foreign key constraints
    ALTER TABLE IF EXISTS "payload"."documentation_breadcrumbs" DROP CONSTRAINT IF EXISTS "documentation_breadcrumbs_doc_fkey";
    ALTER TABLE IF EXISTS "payload"."documentation_breadcrumbs" DROP CONSTRAINT IF EXISTS "documentation_breadcrumbs_parent_fkey";
    
    -- Drop table
    DROP TABLE IF EXISTS "payload"."documentation_breadcrumbs";
  `)
}
