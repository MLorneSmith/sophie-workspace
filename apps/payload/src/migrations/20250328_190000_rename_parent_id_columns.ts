import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Rename parent_id to _parent_id in all relationship tables
    
    -- posts_categories
    ALTER TABLE "payload"."posts_categories" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- posts_tags
    ALTER TABLE "payload"."posts_tags" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- documentation_categories
    ALTER TABLE "payload"."documentation_categories" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- documentation_tags
    ALTER TABLE "payload"."documentation_tags" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- survey_questions_options
    ALTER TABLE "payload"."survey_questions_options" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- documentation_rels
    ALTER TABLE "payload"."documentation_rels" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- posts_rels
    ALTER TABLE "payload"."posts_rels" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- surveys_rels
    ALTER TABLE "payload"."surveys_rels" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- survey_questions_rels
    ALTER TABLE "payload"."survey_questions_rels" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- courses_rels
    ALTER TABLE "payload"."courses_rels" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- course_lessons_rels
    ALTER TABLE "payload"."course_lessons_rels" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- course_quizzes_rels
    ALTER TABLE "payload"."course_quizzes_rels" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- quiz_questions_rels
    ALTER TABLE "payload"."quiz_questions_rels" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- payload_preferences_rels
    ALTER TABLE "payload"."payload_preferences_rels" 
    RENAME COLUMN "parent_id" TO "_parent_id";
    
    -- payload_locked_documents_rels
    ALTER TABLE "payload"."payload_locked_documents_rels" 
    RENAME COLUMN "parent_id" TO "_parent_id";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Rename _parent_id back to parent_id in all relationship tables
    
    -- posts_categories
    ALTER TABLE "payload"."posts_categories" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- posts_tags
    ALTER TABLE "payload"."posts_tags" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- documentation_categories
    ALTER TABLE "payload"."documentation_categories" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- documentation_tags
    ALTER TABLE "payload"."documentation_tags" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- survey_questions_options
    ALTER TABLE "payload"."survey_questions_options" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- documentation_rels
    ALTER TABLE "payload"."documentation_rels" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- posts_rels
    ALTER TABLE "payload"."posts_rels" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- surveys_rels
    ALTER TABLE "payload"."surveys_rels" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- survey_questions_rels
    ALTER TABLE "payload"."survey_questions_rels" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- courses_rels
    ALTER TABLE "payload"."courses_rels" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- course_lessons_rels
    ALTER TABLE "payload"."course_lessons_rels" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- course_quizzes_rels
    ALTER TABLE "payload"."course_quizzes_rels" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- quiz_questions_rels
    ALTER TABLE "payload"."quiz_questions_rels" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- payload_preferences_rels
    ALTER TABLE "payload"."payload_preferences_rels" 
    RENAME COLUMN "_parent_id" TO "parent_id";
    
    -- payload_locked_documents_rels
    ALTER TABLE "payload"."payload_locked_documents_rels" 
    RENAME COLUMN "_parent_id" TO "parent_id";
  `)
}
