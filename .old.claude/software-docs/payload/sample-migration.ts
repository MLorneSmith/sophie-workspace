/**
 * DOCUMENTATION SAMPLE ONLY - NOT FOR EXECUTION
 *
 * This file is for documentation purposes only and is not meant to be executed.
 * It demonstrates the structure of a Payload CMS migration file.
 *
 * In a real migration file, you would import from '@payloadcms/db-postgres'.
 */

// Mock types for documentation purposes
type MigrateUpArgs = {
	db: { execute: (query: unknown) => Promise<unknown> };
	payload: unknown;
	req: unknown;
};

type MigrateDownArgs = {
	db: { execute: (query: unknown) => Promise<unknown> };
	payload: unknown;
	req: unknown;
};

const sql = (strings: TemplateStringsArray, ..._values: unknown[]) =>
	strings.join("");

/**
 * This is a sample migration file that demonstrates how to create a new collection.
 * To create a real migration file, run:
 * pnpm migrate:create --name your-migration-name
 */

export async function up({
	db,
	payload: _payload,
	req: _req,
}: MigrateUpArgs): Promise<void> {
	// Create a new enum type for the status field
	await db.execute(sql`
    CREATE TYPE "payload"."enum_blog_posts_status" AS ENUM('draft', 'published');
  `);

	// Create the blog_posts table
	await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload"."blog_posts" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "summary" varchar,
      "content" jsonb NOT NULL,
      "featured_image_id" integer,
      "published_at" timestamp(3) with time zone,
      "status" "payload"."enum_blog_posts_status" DEFAULT 'draft' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `);

	// Create the blog_posts_categories table for the categories array field
	await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload"."blog_posts_categories" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "category" varchar
    );
  `);

	// Create the blog_posts_tags table for the tags array field
	await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload"."blog_posts_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "tag" varchar
    );
  `);

	// Add foreign key constraints
	await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload"."blog_posts" ADD CONSTRAINT "blog_posts_featured_image_id_fk" 
        FOREIGN KEY ("featured_image_id") REFERENCES "payload"."media"("id") 
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."blog_posts_categories" ADD CONSTRAINT "blog_posts_categories_parent_id_fk" 
        FOREIGN KEY ("_parent_id") REFERENCES "payload"."blog_posts"("id") 
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."blog_posts_tags" ADD CONSTRAINT "blog_posts_tags_parent_id_fk" 
        FOREIGN KEY ("_parent_id") REFERENCES "payload"."blog_posts"("id") 
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

	// Create indexes
	await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "blog_posts_slug_idx" ON "payload"."blog_posts" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "blog_posts_status_idx" ON "payload"."blog_posts" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "blog_posts_updated_at_idx" ON "payload"."blog_posts" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "blog_posts_created_at_idx" ON "payload"."blog_posts" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "blog_posts_categories_order_idx" ON "payload"."blog_posts_categories" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "blog_posts_categories_parent_id_idx" ON "payload"."blog_posts_categories" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "blog_posts_tags_order_idx" ON "payload"."blog_posts_tags" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "blog_posts_tags_parent_id_idx" ON "payload"."blog_posts_tags" USING btree ("_parent_id");
  `);
}

export async function down({
	db,
	payload: _payload,
	req: _req,
}: MigrateDownArgs): Promise<void> {
	// Drop tables and constraints in reverse order
	await db.execute(sql`
    DROP TABLE IF EXISTS "payload"."blog_posts_tags" CASCADE;
    DROP TABLE IF EXISTS "payload"."blog_posts_categories" CASCADE;
    DROP TABLE IF EXISTS "payload"."blog_posts" CASCADE;
    DROP TYPE IF EXISTS "payload"."enum_blog_posts_status";
  `);
}
