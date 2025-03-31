import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create posts_categories table for the categories array field in Posts collection
    CREATE TABLE IF NOT EXISTS "payload"."posts_categories" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "parent_id" uuid,
      "category" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for posts_categories
    CREATE INDEX IF NOT EXISTS "posts_categories_updated_at_idx" ON "payload"."posts_categories" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "posts_categories_created_at_idx" ON "payload"."posts_categories" USING btree ("created_at");
    
    -- Add foreign key constraint
    ALTER TABLE "payload"."posts_categories" 
    ADD CONSTRAINT "posts_categories_parent_id_fkey" 
    FOREIGN KEY ("parent_id") REFERENCES "payload"."posts"("id") ON DELETE CASCADE;
    
    -- Create posts_tags table for the tags array field in Posts collection
    CREATE TABLE IF NOT EXISTS "payload"."posts_tags" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "parent_id" uuid,
      "tag" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for posts_tags
    CREATE INDEX IF NOT EXISTS "posts_tags_updated_at_idx" ON "payload"."posts_tags" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "posts_tags_created_at_idx" ON "payload"."posts_tags" USING btree ("created_at");
    
    -- Add foreign key constraint
    ALTER TABLE "payload"."posts_tags" 
    ADD CONSTRAINT "posts_tags_parent_id_fkey" 
    FOREIGN KEY ("parent_id") REFERENCES "payload"."posts"("id") ON DELETE CASCADE;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop foreign key constraints
    ALTER TABLE IF EXISTS "payload"."posts_categories" DROP CONSTRAINT IF EXISTS "posts_categories_parent_id_fkey";
    ALTER TABLE IF EXISTS "payload"."posts_tags" DROP CONSTRAINT IF EXISTS "posts_tags_parent_id_fkey";
    
    -- Drop tables
    DROP TABLE IF EXISTS "payload"."posts_categories";
    DROP TABLE IF EXISTS "payload"."posts_tags";
  `)
}
