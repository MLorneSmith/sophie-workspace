import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running private collection migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Create private table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."private" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "title" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "description" text,
        "content" jsonb,
        "status" varchar DEFAULT 'draft',
        "published_at" timestamp(3) with time zone,
        "image_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "image_id_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "featured_image_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "featured_image_id_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "downloads_id" uuid[],
        "path" text,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for private
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "private_updated_at_idx" ON "payload"."private" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "private_created_at_idx" ON "payload"."private" USING btree ("created_at");
      CREATE UNIQUE INDEX IF NOT EXISTS "private_slug_idx" ON "payload"."private" USING btree ("slug");
    `)

    // Create private_categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."private_categories" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer GENERATED ALWAYS AS ("order") STORED,
        "_parent_id" uuid REFERENCES "payload"."private"("id") ON DELETE CASCADE,
        "parent_id" uuid REFERENCES "payload"."private"("id") ON DELETE CASCADE,
        "category" varchar,
        "path" text,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for private_categories
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "private_categories_updated_at_idx" ON "payload"."private_categories" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "private_categories_created_at_idx" ON "payload"."private_categories" USING btree ("created_at");
    `)

    // Create private_tags table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."private_tags" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer GENERATED ALWAYS AS ("order") STORED,
        "_parent_id" uuid REFERENCES "payload"."private"("id") ON DELETE CASCADE,
        "parent_id" uuid REFERENCES "payload"."private"("id") ON DELETE CASCADE,
        "tag" varchar,
        "path" text,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for private_tags
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "private_tags_updated_at_idx" ON "payload"."private_tags" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "private_tags_created_at_idx" ON "payload"."private_tags" USING btree ("created_at");
    `)

    // Create private_rels table with ALL necessary relationship columns
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."private_rels" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "_parent_id" uuid REFERENCES "payload"."private"("id") ON DELETE CASCADE,
        "parent_id" uuid REFERENCES "payload"."private"("id") ON DELETE CASCADE,
        "field" text,
        "value" uuid,
        "order" integer,
        "_order" integer GENERATED ALWAYS AS ("order") STORED,
        "media_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "documentation_id" uuid REFERENCES "payload"."documentation"("id") ON DELETE SET NULL,
        "posts_id" uuid REFERENCES "payload"."posts"("id") ON DELETE SET NULL,
        "surveys_id" uuid REFERENCES "payload"."surveys"("id") ON DELETE SET NULL,
        "survey_questions_id" uuid REFERENCES "payload"."survey_questions"("id") ON DELETE SET NULL,
        "courses_id" uuid REFERENCES "payload"."courses"("id") ON DELETE SET NULL,
        "course_lessons_id" uuid REFERENCES "payload"."course_lessons"("id") ON DELETE SET NULL,
        "course_quizzes_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL,
        "quiz_questions_id" uuid REFERENCES "payload"."quiz_questions"("id") ON DELETE SET NULL,
        "quiz_id_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL,
        "downloads_id" uuid REFERENCES "payload"."downloads"("id") ON DELETE SET NULL,
        "private_id" uuid REFERENCES "payload"."private"("id") ON DELETE SET NULL,
        "path" text,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for private_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "private_rels_updated_at_idx" ON "payload"."private_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "private_rels_created_at_idx" ON "payload"."private_rels" USING btree ("created_at");
    `)

    // Create private__downloads junction table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."private__downloads" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer GENERATED ALWAYS AS ("order") STORED,
        "_parent_id" uuid REFERENCES "payload"."private"("id") ON DELETE CASCADE,
        "parent_id" uuid REFERENCES "payload"."private"("id") ON DELETE CASCADE,
        "downloads_id" uuid REFERENCES "payload"."downloads"("id") ON DELETE CASCADE,
        "path" text,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for private__downloads
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "private__downloads_updated_at_idx" ON "payload"."private__downloads" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "private__downloads_created_at_idx" ON "payload"."private__downloads" USING btree ("created_at");
    `)

    // Update downloads_relationships view to include private collection
    await db.execute(
      sql.raw(`
      DO $BLOCK$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.views 
                  WHERE table_schema = 'payload' 
                  AND table_name = 'downloads_relationships') THEN
          DROP VIEW IF EXISTS payload.downloads_relationships;
          
          CREATE VIEW payload.downloads_relationships AS
          -- Documentation downloads
          SELECT 
            doc.id::text as collection_id, 
            dl.id::text as download_id,
            'documentation' as collection_type,
            'documentation_rels' as table_name
          FROM payload.documentation doc
          LEFT JOIN payload.documentation_rels dr 
            ON (doc.id = dr._parent_id OR doc.id = dr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = dr.value OR dl.id = dr.downloads_id)
          WHERE dl.id IS NOT NULL
          
          UNION ALL
          
          -- Course lessons downloads
          SELECT 
            cl.id::text as collection_id, 
            dl.id::text as download_id,
            'course_lessons' as collection_type,
            'course_lessons_rels' as table_name
          FROM payload.course_lessons cl
          LEFT JOIN payload.course_lessons_rels clr 
            ON (cl.id = clr._parent_id OR cl.id = clr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = clr.value OR dl.id = clr.downloads_id)
          WHERE dl.id IS NOT NULL
          
          UNION ALL
          
          -- Courses downloads
          SELECT 
            c.id::text as collection_id, 
            dl.id::text as download_id,
            'courses' as collection_type,
            'courses_rels' as table_name
          FROM payload.courses c
          LEFT JOIN payload.courses_rels cr 
            ON (c.id = cr._parent_id OR c.id = cr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = cr.value OR dl.id = cr.downloads_id)
          WHERE dl.id IS NOT NULL
          
          UNION ALL
          
          -- Course quizzes downloads
          SELECT 
            cq.id::text as collection_id, 
            dl.id::text as download_id,
            'course_quizzes' as collection_type,
            'course_quizzes_rels' as table_name
          FROM payload.course_quizzes cq
          LEFT JOIN payload.course_quizzes_rels cqr 
            ON (cq.id = cqr._parent_id OR cq.id = cqr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = cqr.value OR dl.id = cqr.downloads_id)
          WHERE dl.id IS NOT NULL
          
          UNION ALL
          
          -- Private posts downloads
          SELECT 
            p.id::text as collection_id, 
            dl.id::text as download_id,
            'private' as collection_type,
            'private_rels' as table_name
          FROM payload.private p
          LEFT JOIN payload.private_rels pr 
            ON (p.id = pr._parent_id OR p.id = pr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = pr.downloads_id)
          WHERE dl.id IS NOT NULL;
        END IF;
      END $BLOCK$;
    `),
    )

    // Check if dynamic_uuid_tables exists before trying to insert
    await db.execute(
      sql.raw(`
      DO $BLOCK$
      BEGIN
        -- Create the tracking table if it doesn't exist yet
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'dynamic_uuid_tables'
        ) THEN
          CREATE TABLE "payload"."dynamic_uuid_tables" (
            "table_name" text PRIMARY KEY,
            "primary_key" text,
            "created_at" timestamp(3) with time zone DEFAULT now(),
            "needs_path_column" boolean DEFAULT false
          );
        END IF;

        -- Register the private collection
        INSERT INTO "payload"."dynamic_uuid_tables" (
          "table_name", 
          "primary_key", 
          "created_at", 
          "needs_path_column"
        ) 
        VALUES (
          'private', 
          'id', 
          NOW(), 
          TRUE
        )
        ON CONFLICT (table_name) DO NOTHING;

        -- Register the related tables
        INSERT INTO "payload"."dynamic_uuid_tables" (
          "table_name", "primary_key", "created_at", "needs_path_column"
        ) VALUES 
          ('private_rels', 'id', NOW(), TRUE),
          ('private_categories', 'id', NOW(), TRUE),
          ('private_tags', 'id', NOW(), TRUE),
          ('private__downloads', 'id', NOW(), TRUE)
        ON CONFLICT (table_name) DO NOTHING;
      END $BLOCK$;
    `),
    )

    // Add private collection to ensure_relationship_columns function
    await db.execute(
      sql.raw(`
      DO $BLOCK$
      BEGIN
        -- Check if function exists and update it
        IF EXISTS (
          SELECT FROM pg_proc
          WHERE proname = 'ensure_relationship_columns'
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'payload')
        ) THEN
          -- Drop and recreate with private support
          DROP FUNCTION IF EXISTS payload.ensure_relationship_columns(text);
          
          CREATE OR REPLACE FUNCTION payload.ensure_relationship_columns(table_name text)
          RETURNS void AS $$
          BEGIN
            -- Add parent_id if it doesn't exist
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS parent_id UUID';
                    
            -- Add _parent_id if it doesn't exist
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS _parent_id UUID';
                    
            -- Add downloads_id if it doesn't exist
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS downloads_id UUID';
                    
            -- Add other important relationship columns
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS documentation_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS posts_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS private_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS surveys_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS survey_questions_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS courses_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS course_lessons_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS course_quizzes_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS quiz_questions_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS quiz_id_id UUID';
            
            -- Add path column (missing column causing dynamic UUID table errors)
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS path TEXT';
          END;
          $$ LANGUAGE plpgsql;
        END IF;
      END $BLOCK$;
    `),
    )

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Private collection migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in private collection migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back private collection migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Update downloads_relationships view to remove private collection
    await db.execute(
      sql.raw(`
      DO $BLOCK$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.views 
                  WHERE table_schema = 'payload' 
                  AND table_name = 'downloads_relationships') THEN
          DROP VIEW IF EXISTS payload.downloads_relationships;
          
          CREATE VIEW payload.downloads_relationships AS
          -- Documentation downloads
          SELECT 
            doc.id::text as collection_id, 
            dl.id::text as download_id,
            'documentation' as collection_type,
            'documentation_rels' as table_name
          FROM payload.documentation doc
          LEFT JOIN payload.documentation_rels dr 
            ON (doc.id = dr._parent_id OR doc.id = dr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = dr.value OR dl.id = dr.downloads_id)
          WHERE dl.id IS NOT NULL
          
          UNION ALL
          
          -- Course lessons downloads
          SELECT 
            cl.id::text as collection_id, 
            dl.id::text as download_id,
            'course_lessons' as collection_type,
            'course_lessons_rels' as table_name
          FROM payload.course_lessons cl
          LEFT JOIN payload.course_lessons_rels clr 
            ON (cl.id = clr._parent_id OR cl.id = clr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = clr.value OR dl.id = clr.downloads_id)
          WHERE dl.id IS NOT NULL
          
          UNION ALL
          
          -- Courses downloads
          SELECT 
            c.id::text as collection_id, 
            dl.id::text as download_id,
            'courses' as collection_type,
            'courses_rels' as table_name
          FROM payload.courses c
          LEFT JOIN payload.courses_rels cr 
            ON (c.id = cr._parent_id OR c.id = cr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = cr.value OR dl.id = cr.downloads_id)
          WHERE dl.id IS NOT NULL
          
          UNION ALL
          
          -- Course quizzes downloads
          SELECT 
            cq.id::text as collection_id, 
            dl.id::text as download_id,
            'course_quizzes' as collection_type,
            'course_quizzes_rels' as table_name
          FROM payload.course_quizzes cq
          LEFT JOIN payload.course_quizzes_rels cqr 
            ON (cq.id = cqr._parent_id OR cq.id = cqr.parent_id)
          LEFT JOIN payload.downloads dl 
            ON (dl.id = cqr.value OR dl.id = cqr.downloads_id)
          WHERE dl.id IS NOT NULL;
        END IF;
      END $BLOCK$;
    `),
    )

    // Drop tables in reverse order to avoid foreign key constraints
    await db.execute(sql`
      DROP TABLE IF EXISTS "payload"."private__downloads";
      DROP TABLE IF EXISTS "payload"."private_rels";
      DROP TABLE IF EXISTS "payload"."private_tags";
      DROP TABLE IF EXISTS "payload"."private_categories";
      DROP TABLE IF EXISTS "payload"."private";
    `)

    // Remove from UUID tables tracking if the table exists
    await db.execute(sql`
      DO $BLOCK$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'dynamic_uuid_tables'
        ) THEN
          DELETE FROM "payload"."dynamic_uuid_tables" WHERE "table_name" IN ('private', 'private_rels', 'private_categories', 'private_tags', 'private__downloads');
        END IF;
      END $BLOCK$;
    `)

    // Update ensure_relationship_columns function to remove private support
    await db.execute(sql`
      DO $BLOCK$
      BEGIN
        -- Check if function exists and update it
        IF EXISTS (
          SELECT FROM pg_proc
          WHERE proname = 'ensure_relationship_columns'
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'payload')
        ) THEN
          -- Drop and recreate without private support
          DROP FUNCTION IF EXISTS payload.ensure_relationship_columns(text);
          
          CREATE OR REPLACE FUNCTION payload.ensure_relationship_columns(table_name text)
          RETURNS void AS $$
          BEGIN
            -- Add parent_id if it doesn't exist
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS parent_id UUID';
                    
            -- Add _parent_id if it doesn't exist
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS _parent_id UUID';
                    
            -- Add downloads_id if it doesn't exist
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS downloads_id UUID';
                    
            -- Add other important relationship columns
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS documentation_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS posts_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS surveys_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS survey_questions_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS courses_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS course_lessons_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS course_quizzes_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS quiz_questions_id UUID';
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS quiz_id_id UUID';
            
            -- Add path column (missing column causing dynamic UUID table errors)
            EXECUTE 'ALTER TABLE ' || table_name || 
                    ' ADD COLUMN IF NOT EXISTS path TEXT';
          END;
          $$ LANGUAGE plpgsql;
        END IF;
      END $BLOCK$;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Private collection rollback completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in private collection rollback:', error)
    throw error
  }
}
