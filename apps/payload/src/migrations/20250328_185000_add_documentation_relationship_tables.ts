import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create documentation_categories table for the categories array field in Documentation collection
    CREATE TABLE IF NOT EXISTS "payload"."documentation_categories" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "parent_id" uuid,
      "category" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for documentation_categories
    CREATE INDEX IF NOT EXISTS "documentation_categories_updated_at_idx" ON "payload"."documentation_categories" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "documentation_categories_created_at_idx" ON "payload"."documentation_categories" USING btree ("created_at");
    
    -- Add foreign key constraint
    ALTER TABLE "payload"."documentation_categories" 
    ADD CONSTRAINT "documentation_categories_parent_id_fkey" 
    FOREIGN KEY ("parent_id") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;
    
    -- Create documentation_tags table for the tags array field in Documentation collection
    CREATE TABLE IF NOT EXISTS "payload"."documentation_tags" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "parent_id" uuid,
      "tag" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for documentation_tags
    CREATE INDEX IF NOT EXISTS "documentation_tags_updated_at_idx" ON "payload"."documentation_tags" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "documentation_tags_created_at_idx" ON "payload"."documentation_tags" USING btree ("created_at");
    
    -- Add foreign key constraint
    ALTER TABLE "payload"."documentation_tags" 
    ADD CONSTRAINT "documentation_tags_parent_id_fkey" 
    FOREIGN KEY ("parent_id") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;
    
    -- Add missing fields to documentation table
    ALTER TABLE "payload"."documentation"
    ADD COLUMN IF NOT EXISTS "description" text,
    ADD COLUMN IF NOT EXISTS "order" numeric DEFAULT 0;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop foreign key constraints
    ALTER TABLE IF EXISTS "payload"."documentation_categories" DROP CONSTRAINT IF EXISTS "documentation_categories_parent_id_fkey";
    ALTER TABLE IF EXISTS "payload"."documentation_tags" DROP CONSTRAINT IF EXISTS "documentation_tags_parent_id_fkey";
    
    -- Drop tables
    DROP TABLE IF EXISTS "payload"."documentation_categories";
    DROP TABLE IF EXISTS "payload"."documentation_tags";
    
    -- Remove added columns from documentation
    ALTER TABLE "payload"."documentation"
    DROP COLUMN IF EXISTS "description",
    DROP COLUMN IF EXISTS "order";
  `)
}
