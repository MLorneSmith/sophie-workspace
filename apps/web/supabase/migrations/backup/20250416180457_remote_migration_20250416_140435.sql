drop view if exists "payload"."downloads_relationships";

drop function if exists "payload"."scan_and_fix_uuid_tables"();

alter table "payload"."course_lessons" add column "parent_id" text;

alter table "payload"."course_lessons" add column "path" text;

alter table "payload"."course_lessons" add column "private_id" uuid;

alter table "payload"."course_lessons__downloads" add column "media_id" uuid;

alter table "payload"."course_lessons__downloads" add column "private_id" uuid;

alter table "payload"."course_lessons_downloads" add column "downloads_id" uuid;

alter table "payload"."course_lessons_downloads" add column "media_id" uuid;

alter table "payload"."course_lessons_downloads" add column "parent_id" text;

alter table "payload"."course_lessons_downloads" add column "path" text;

alter table "payload"."course_lessons_downloads" add column "private_id" uuid;

alter table "payload"."course_lessons_rels" add column "media_id" uuid;

alter table "payload"."course_quizzes" add column "parent_id" text;

alter table "payload"."course_quizzes" add column "path" text;

alter table "payload"."course_quizzes" add column "private_id" uuid;

alter table "payload"."course_quizzes__downloads" add column "media_id" uuid;

alter table "payload"."course_quizzes__downloads" add column "private_id" uuid;

alter table "payload"."course_quizzes_rels" add column "media_id" uuid;

alter table "payload"."courses" add column "media_id" uuid;

alter table "payload"."courses" add column "parent_id" text;

alter table "payload"."courses" add column "path" text;

alter table "payload"."courses" add column "private_id" uuid;

alter table "payload"."courses__downloads" add column "media_id" uuid;

alter table "payload"."courses__downloads" add column "private_id" uuid;

alter table "payload"."courses_rels" add column "media_id" uuid;

alter table "payload"."documentation" add column "media_id" uuid;

alter table "payload"."documentation" add column "path" text;

alter table "payload"."documentation" add column "private_id" uuid;

alter table "payload"."documentation__downloads" add column "media_id" uuid;

alter table "payload"."documentation__downloads" add column "private_id" uuid;

alter table "payload"."documentation_breadcrumbs" add column "downloads_id" uuid;

alter table "payload"."documentation_breadcrumbs" add column "media_id" uuid;

alter table "payload"."documentation_breadcrumbs" add column "parent_id" text;

alter table "payload"."documentation_breadcrumbs" add column "path" text;

alter table "payload"."documentation_breadcrumbs" add column "private_id" uuid;

alter table "payload"."documentation_categories" add column "downloads_id" uuid;

alter table "payload"."documentation_categories" add column "media_id" uuid;

alter table "payload"."documentation_categories" add column "path" text;

alter table "payload"."documentation_categories" add column "private_id" uuid;

alter table "payload"."documentation_rels" add column "media_id" uuid;

alter table "payload"."documentation_tags" add column "downloads_id" uuid;

alter table "payload"."documentation_tags" add column "media_id" uuid;

alter table "payload"."documentation_tags" add column "path" text;

alter table "payload"."documentation_tags" add column "private_id" uuid;

alter table "payload"."downloads" add column "downloads_id" uuid;

alter table "payload"."downloads" add column "media_id" uuid;

alter table "payload"."downloads" add column "parent_id" text;

alter table "payload"."downloads" add column "private_id" uuid;

alter table "payload"."downloads_rels" add column "media_id" uuid;

alter table "payload"."downloads_rels" alter column "parent_id" set data type text using "parent_id"::text;

alter table "payload"."media" add column "downloads_id" uuid;

alter table "payload"."media" add column "media_id" uuid;

alter table "payload"."media" add column "parent_id" text;

alter table "payload"."media" add column "path" text;

alter table "payload"."media" add column "private_id" uuid;

alter table "payload"."payload_locked_documents" add column "downloads_id" uuid;

alter table "payload"."payload_locked_documents" add column "parent_id" text;

alter table "payload"."payload_locked_documents" add column "path" text;

alter table "payload"."payload_locked_documents" add column "private_id" uuid;

alter table "payload"."payload_preferences" add column "downloads_id" uuid;

alter table "payload"."payload_preferences" add column "media_id" uuid;

alter table "payload"."payload_preferences" add column "parent_id" text;

alter table "payload"."payload_preferences" add column "path" text;

alter table "payload"."payload_preferences" add column "private_id" uuid;

alter table "payload"."payload_preferences_rels" add column "media_id" uuid;

alter table "payload"."posts" add column "media_id" uuid;

alter table "payload"."posts" add column "parent_id" text;

alter table "payload"."posts" add column "path" text;

alter table "payload"."posts" add column "private_id" uuid;

alter table "payload"."posts__downloads" add column "media_id" uuid;

alter table "payload"."posts__downloads" add column "private_id" uuid;

alter table "payload"."posts_categories" add column "downloads_id" uuid;

alter table "payload"."posts_categories" add column "media_id" uuid;

alter table "payload"."posts_categories" add column "parent_id" text;

alter table "payload"."posts_categories" add column "path" text;

alter table "payload"."posts_categories" add column "private_id" uuid;

alter table "payload"."posts_tags" add column "downloads_id" uuid;

alter table "payload"."posts_tags" add column "media_id" uuid;

alter table "payload"."posts_tags" add column "parent_id" text;

alter table "payload"."posts_tags" add column "path" text;

alter table "payload"."posts_tags" add column "private_id" uuid;

alter table "payload"."private" add column "media_id" uuid;

alter table "payload"."private" add column "parent_id" text;

alter table "payload"."private" add column "private_id" uuid;

alter table "payload"."private__downloads" add column "media_id" uuid;

alter table "payload"."private__downloads" add column "private_id" uuid;

alter table "payload"."private_categories" add column "downloads_id" uuid;

alter table "payload"."private_categories" add column "media_id" uuid;

alter table "payload"."private_categories" add column "private_id" uuid;

alter table "payload"."private_tags" add column "downloads_id" uuid;

alter table "payload"."private_tags" add column "media_id" uuid;

alter table "payload"."private_tags" add column "private_id" uuid;

alter table "payload"."quiz_questions" add column "downloads_id" uuid;

alter table "payload"."quiz_questions" add column "parent_id" text;

alter table "payload"."quiz_questions" add column "path" text;

alter table "payload"."quiz_questions" add column "private_id" uuid;

alter table "payload"."quiz_questions_options" add column "downloads_id" uuid;

alter table "payload"."quiz_questions_options" add column "media_id" uuid;

alter table "payload"."quiz_questions_options" add column "parent_id" text;

alter table "payload"."quiz_questions_options" add column "path" text;

alter table "payload"."quiz_questions_options" add column "private_id" uuid;

alter table "payload"."quiz_questions_rels" add column "media_id" uuid;

alter table "payload"."survey_questions" add column "downloads_id" uuid;

alter table "payload"."survey_questions" add column "media_id" uuid;

alter table "payload"."survey_questions" add column "parent_id" text;

alter table "payload"."survey_questions" add column "path" text;

alter table "payload"."survey_questions" add column "private_id" uuid;

alter table "payload"."survey_questions_options" add column "downloads_id" uuid;

alter table "payload"."survey_questions_options" add column "media_id" uuid;

alter table "payload"."survey_questions_options" add column "parent_id" text;

alter table "payload"."survey_questions_options" add column "path" text;

alter table "payload"."survey_questions_options" add column "private_id" uuid;

alter table "payload"."survey_questions_rels" add column "media_id" uuid;

alter table "payload"."surveys" add column "media_id" uuid;

alter table "payload"."surveys" add column "parent_id" text;

alter table "payload"."surveys" add column "path" text;

alter table "payload"."surveys" add column "private_id" uuid;

alter table "payload"."surveys__downloads" add column "media_id" uuid;

alter table "payload"."surveys__downloads" add column "private_id" uuid;

alter table "payload"."surveys_rels" add column "media_id" uuid;

alter table "payload"."users" add column "downloads_id" uuid;

alter table "payload"."users" add column "media_id" uuid;

alter table "payload"."users" add column "parent_id" text;

alter table "payload"."users" add column "path" text;

alter table "payload"."users" add column "private_id" uuid;

set check_function_bodies = off;

create or replace view "payload"."downloads_relationships" as  SELECT (doc.id)::text AS table_name,
    (dl.id)::text AS download_id,
    'documentation'::text AS collection_type
   FROM ((payload.documentation doc
     LEFT JOIN payload.documentation_rels dr ON (((doc.id = dr._parent_id) OR (doc.id = dr.parent_id))))
     LEFT JOIN payload.downloads dl ON (((dl.id = dr.value) OR (dl.id = dr.downloads_id))))
  WHERE (dl.id IS NOT NULL)
UNION ALL
 SELECT (cl.id)::text AS table_name,
    (dl.id)::text AS download_id,
    'course_lessons'::text AS collection_type
   FROM ((payload.course_lessons cl
     LEFT JOIN payload.course_lessons_rels clr ON (((cl.id = clr._parent_id) OR (cl.id = clr.parent_id))))
     LEFT JOIN payload.downloads dl ON (((dl.id = clr.value) OR (dl.id = clr.downloads_id))))
  WHERE (dl.id IS NOT NULL)
UNION ALL
 SELECT (c.id)::text AS table_name,
    (dl.id)::text AS download_id,
    'courses'::text AS collection_type
   FROM ((payload.courses c
     LEFT JOIN payload.courses_rels cr ON (((c.id = cr._parent_id) OR (c.id = cr.parent_id))))
     LEFT JOIN payload.downloads dl ON (((dl.id = cr.value) OR (dl.id = cr.downloads_id))))
  WHERE (dl.id IS NOT NULL)
UNION ALL
 SELECT (cq.id)::text AS table_name,
    (dl.id)::text AS download_id,
    'course_quizzes'::text AS collection_type
   FROM ((payload.course_quizzes cq
     LEFT JOIN payload.course_quizzes_rels cqr ON (((cq.id = cqr._parent_id) OR (cq.id = cqr.parent_id))))
     LEFT JOIN payload.downloads dl ON (((dl.id = cqr.value) OR (dl.id = cqr.downloads_id))))
  WHERE (dl.id IS NOT NULL);


CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
        DECLARE
          table_record RECORD;
          has_path BOOLEAN;
          has_parent_id BOOLEAN;
          has_downloads_id BOOLEAN;
          has_media_id BOOLEAN;
          has_private_id BOOLEAN;
        BEGIN
          FOR table_record IN 
            SELECT table_name 
            FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
          LOOP
            -- Add required columns
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS parent_id TEXT', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS downloads_id UUID', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS media_id UUID', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS private_id UUID', table_record.table_name);
            
            -- Check if columns exist
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = table_record.table_name
              AND column_name = 'path'
            ) INTO has_path;
            
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = table_record.table_name
              AND column_name = 'parent_id'
            ) INTO has_parent_id;
            
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = table_record.table_name
              AND column_name = 'downloads_id'
            ) INTO has_downloads_id;
            
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = table_record.table_name
              AND column_name = 'media_id'
            ) INTO has_media_id;
            
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = table_record.table_name
              AND column_name = 'private_id'
            ) INTO has_private_id;
            
            -- Update tracking table
            INSERT INTO payload.dynamic_uuid_tables (
              table_name, last_checked, has_path, has_parent_id, 
              has_downloads_id, has_media_id, has_private_id
            )
            VALUES (
              table_record.table_name, NOW(), has_path, has_parent_id,
              has_downloads_id, has_media_id, has_private_id
            )
            ON CONFLICT (table_name) 
            DO UPDATE SET
              last_checked = NOW(),
              has_path = EXCLUDED.has_path,
              has_parent_id = EXCLUDED.has_parent_id,
              has_downloads_id = EXCLUDED.has_downloads_id,
              has_media_id = EXCLUDED.has_media_id,
              has_private_id = EXCLUDED.has_private_id;
          END LOOP;
        END;
        $function$
;


