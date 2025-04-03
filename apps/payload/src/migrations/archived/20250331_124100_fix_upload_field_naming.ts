import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Fix image_id in posts table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'posts' 
        AND column_name = 'image_id_id'
      ) THEN
        ALTER TABLE "payload"."posts"
        ADD COLUMN "image_id_id" uuid;
        
        -- Copy data from image_id to image_id_id
        UPDATE "payload"."posts"
        SET "image_id_id" = "image_id"
        WHERE "image_id" IS NOT NULL;
      END IF;
    END $$;

    -- Fix featured_image_id in courses table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'featured_image_id_id'
      ) THEN
        ALTER TABLE "payload"."courses"
        ADD COLUMN "featured_image_id_id" uuid;
        
        -- Copy data from featured_image_id to featured_image_id_id
        UPDATE "payload"."courses"
        SET "featured_image_id_id" = "featured_image_id"
        WHERE "featured_image_id" IS NOT NULL;
      END IF;
    END $$;

    -- Fix featured_image_id in course_lessons table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'featured_image_id_id'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        ADD COLUMN "featured_image_id_id" uuid;
        
        -- Copy data from featured_image_id to featured_image_id_id
        UPDATE "payload"."course_lessons"
        SET "featured_image_id_id" = "featured_image_id"
        WHERE "featured_image_id" IS NOT NULL;
      END IF;
    END $$;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Remove image_id_id from posts table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'posts' 
        AND column_name = 'image_id_id'
      ) THEN
        ALTER TABLE "payload"."posts"
        DROP COLUMN "image_id_id";
      END IF;
    END $$;

    -- Remove featured_image_id_id from courses table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'featured_image_id_id'
      ) THEN
        ALTER TABLE "payload"."courses"
        DROP COLUMN "featured_image_id_id";
      END IF;
    END $$;

    -- Remove featured_image_id_id from course_lessons table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'featured_image_id_id'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        DROP COLUMN "featured_image_id_id";
      END IF;
    END $$;
  `)
}
