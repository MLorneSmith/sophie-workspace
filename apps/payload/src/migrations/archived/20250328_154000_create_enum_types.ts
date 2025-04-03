import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create enum types if they don't exist
    DO $$ 
    BEGIN
      -- Set the search path to include the payload schema
      SET search_path TO payload, public;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_documentation_status') THEN
        CREATE TYPE payload.enum_documentation_status AS ENUM('draft', 'published');
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_posts_status') THEN
        CREATE TYPE payload.enum_posts_status AS ENUM('draft', 'published');
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_surveys_status') THEN
        CREATE TYPE payload.enum_surveys_status AS ENUM('draft', 'published');
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_survey_questions_type') THEN
        CREATE TYPE payload.enum_survey_questions_type AS ENUM('multiple_choice');
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_survey_questions_questionspin') THEN
        CREATE TYPE payload.enum_survey_questions_questionspin AS ENUM('Positive', 'Negative');
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_courses_status') THEN
        CREATE TYPE payload.enum_courses_status AS ENUM('draft', 'published');
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_quiz_questions_type') THEN
        CREATE TYPE payload.enum_quiz_questions_type AS ENUM('multiple_choice');
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop enum types if they exist
    DROP TYPE IF EXISTS payload.enum_documentation_status;
    DROP TYPE IF EXISTS payload.enum_posts_status;
    DROP TYPE IF EXISTS payload.enum_surveys_status;
    DROP TYPE IF EXISTS payload.enum_survey_questions_type;
    DROP TYPE IF EXISTS payload.enum_survey_questions_questionspin;
    DROP TYPE IF EXISTS payload.enum_courses_status;
    DROP TYPE IF EXISTS payload.enum_quiz_questions_type;
  `)
}
