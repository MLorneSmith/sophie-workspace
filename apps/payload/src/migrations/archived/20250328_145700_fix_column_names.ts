import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Rename columns to match Payload's expectations, but only if the tables exist
    DO $$ 
    BEGIN
      -- Check if posts table exists and has image column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'posts' AND column_name = 'image'
      ) THEN
        ALTER TABLE payload.posts RENAME COLUMN image TO image_id;
      END IF;
      
      -- Check if courses table exists and has featured_image column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'courses' AND column_name = 'featured_image'
      ) THEN
        ALTER TABLE payload.courses RENAME COLUMN featured_image TO featured_image_id;
      END IF;
      
      -- Check if quiz_questions table exists and has quiz column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'quiz_questions' AND column_name = 'quiz'
      ) THEN
        ALTER TABLE payload.quiz_questions RENAME COLUMN quiz TO quiz_id;
      END IF;
      
      -- Check if course_lessons table exists and has featured_image column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'course_lessons' AND column_name = 'featured_image'
      ) THEN
        ALTER TABLE payload.course_lessons RENAME COLUMN featured_image TO featured_image_id;
      END IF;
      
      -- Check if course_lessons table exists and has course column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'course_lessons' AND column_name = 'course'
      ) THEN
        ALTER TABLE payload.course_lessons RENAME COLUMN course TO course_id;
      END IF;
      
      -- Check if course_lessons table exists and has quiz column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'course_lessons' AND column_name = 'quiz'
      ) THEN
        ALTER TABLE payload.course_lessons RENAME COLUMN quiz TO quiz_id;
      END IF;
    END $$;
    
    -- Fix relationship tables structure
    -- For courses_rels, we need to handle the generic related_id/related_collection approach
    -- First, add the course_lessons_id column if it doesn't exist
    DO $$ 
    BEGIN
      -- Check if courses_rels table exists
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' AND table_name = 'courses_rels'
      ) THEN
        -- Check if course_lessons_id column doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' AND table_name = 'courses_rels' AND column_name = 'course_lessons_id'
        ) THEN
          ALTER TABLE payload.courses_rels ADD COLUMN course_lessons_id INTEGER;
          
          -- Check if related_id and related_collection columns exist
          IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' AND table_name = 'courses_rels' AND column_name = 'related_id'
          ) AND EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' AND table_name = 'courses_rels' AND column_name = 'related_collection'
          ) THEN
            -- Update the course_lessons_id column with values from related_id where related_collection is 'course_lessons'
            UPDATE payload.courses_rels 
            SET course_lessons_id = related_id 
            WHERE related_collection = 'course_lessons';
          END IF;
        END IF;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Revert column renames, but only if the tables exist
    DO $$ 
    BEGIN
      -- Check if posts table exists and has image_id column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'posts' AND column_name = 'image_id'
      ) THEN
        ALTER TABLE payload.posts RENAME COLUMN image_id TO image;
      END IF;
      
      -- Check if courses table exists and has featured_image_id column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'courses' AND column_name = 'featured_image_id'
      ) THEN
        ALTER TABLE payload.courses RENAME COLUMN featured_image_id TO featured_image;
      END IF;
      
      -- Check if quiz_questions table exists and has quiz_id column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'quiz_questions' AND column_name = 'quiz_id'
      ) THEN
        ALTER TABLE payload.quiz_questions RENAME COLUMN quiz_id TO quiz;
      END IF;
      
      -- Check if course_lessons table exists and has featured_image_id column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'course_lessons' AND column_name = 'featured_image_id'
      ) THEN
        ALTER TABLE payload.course_lessons RENAME COLUMN featured_image_id TO featured_image;
      END IF;
      
      -- Check if course_lessons table exists and has course_id column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'course_lessons' AND column_name = 'course_id'
      ) THEN
        ALTER TABLE payload.course_lessons RENAME COLUMN course_id TO course;
      END IF;
      
      -- Check if course_lessons table exists and has quiz_id column
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'course_lessons' AND column_name = 'quiz_id'
      ) THEN
        ALTER TABLE payload.course_lessons RENAME COLUMN quiz_id TO quiz;
      END IF;
    END $$;
    
    -- Revert relationship table changes
    -- For courses_rels, we would need to ensure related_id/related_collection are properly set
    -- This is a simplified version; in a real scenario, you might want to preserve the data
    DO $$ 
    BEGIN
      -- Check if courses_rels table exists
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' AND table_name = 'courses_rels'
      ) THEN
        -- Check if course_lessons_id column exists
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' AND table_name = 'courses_rels' AND column_name = 'course_lessons_id'
        ) THEN
          -- Check if related_id and related_collection columns exist
          IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' AND table_name = 'courses_rels' AND column_name = 'related_id'
          ) AND EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' AND table_name = 'courses_rels' AND column_name = 'related_collection'
          ) THEN
            -- Update related_id and related_collection based on course_lessons_id
            UPDATE payload.courses_rels 
            SET related_id = course_lessons_id, related_collection = 'course_lessons' 
            WHERE course_lessons_id IS NOT NULL;
          END IF;
          
          -- Drop the course_lessons_id column
          ALTER TABLE payload.courses_rels DROP COLUMN course_lessons_id;
        END IF;
      END IF;
    END $$;
  `)
}
