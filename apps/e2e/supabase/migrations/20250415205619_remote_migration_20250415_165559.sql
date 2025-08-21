create schema if not exists "payload";

create sequence "payload"."payload_migrations_id_seq";

create table "payload"."course_lessons" (
    "id" uuid not null default gen_random_uuid(),
    "title" text,
    "slug" text,
    "description" text,
    "content" text,
    "lesson_number" integer,
    "estimated_duration" integer,
    "published_at" timestamp with time zone,
    "quiz_id" uuid,
    "quiz_id_id" uuid,
    "course_id" uuid,
    "course_id_id" uuid,
    "featured_image_id" uuid,
    "featured_image_id_id" uuid,
    "media_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "bunny_video_id" text,
    "bunny_library_id" text default '264486'::text,
    "todo_complete_quiz" boolean default false,
    "todo_watch_content" text,
    "todo_read_content" text,
    "todo_course_project" text,
    "survey_id" uuid,
    "survey_id_id" uuid,
    "downloads_id" uuid[],
    "todo" text,
    "youtube_video_id" text,
    "video_source_type" text default 'youtube'::text
);


create table "payload"."course_lessons__downloads" (
    "id" uuid not null default gen_random_uuid(),
    "parent_id" text not null,
    "downloads_id" uuid,
    "order_column" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "order" integer,
    "path" text
);


create table "payload"."course_lessons_downloads" (
    "id" uuid not null default gen_random_uuid(),
    "lesson_id" uuid not null,
    "download_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "payload"."course_lessons_rels" (
    "id" uuid not null default gen_random_uuid(),
    "_parent_id" uuid not null,
    "field" character varying(255),
    "value" uuid,
    "order" integer,
    "_order" integer,
    "path" character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "parent_id" uuid,
    "downloads_id" uuid,
    "posts_id" uuid,
    "documentation_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "quiz_id_id" uuid,
    "private_id" uuid
);


create table "payload"."course_quizzes" (
    "id" uuid not null default gen_random_uuid(),
    "title" text,
    "slug" text,
    "description" text,
    "passing_score" integer,
    "media_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "downloads_id" uuid[],
    "course_id_id" text,
    "pass_threshold" integer
);


create table "payload"."course_quizzes__downloads" (
    "id" uuid not null default gen_random_uuid(),
    "parent_id" text not null,
    "downloads_id" uuid,
    "order_column" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "order" integer,
    "path" text
);


create table "payload"."course_quizzes_rels" (
    "id" uuid not null default gen_random_uuid(),
    "_parent_id" uuid not null,
    "field" character varying(255),
    "value" uuid,
    "parent_id" uuid,
    "order" integer,
    "_order" integer,
    "path" character varying,
    "quiz_questions_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "course_lessons_id" uuid,
    "downloads_id" uuid,
    "posts_id" uuid,
    "documentation_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_id_id" uuid,
    "private_id" uuid
);


create table "payload"."courses" (
    "id" uuid not null default gen_random_uuid(),
    "title" text,
    "slug" text,
    "description" text,
    "show_progress_bar" boolean default true,
    "estimated_duration" integer,
    "status" text,
    "published_at" timestamp with time zone,
    "intro_content" jsonb,
    "completion_content" jsonb,
    "featured_image_id" uuid,
    "featured_image_id_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "downloads_id" uuid[],
    "content" jsonb
);


create table "payload"."courses__downloads" (
    "id" uuid not null default gen_random_uuid(),
    "parent_id" text not null,
    "downloads_id" uuid,
    "order_column" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "order" integer,
    "path" text
);


create table "payload"."courses_rels" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer,
    "_parent_id" uuid,
    "field" character varying(255),
    "value" uuid,
    "parent_id" uuid,
    "path" character varying,
    "course_lessons_id" uuid,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now(),
    "downloads_id" uuid,
    "posts_id" uuid,
    "documentation_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "quiz_id_id" uuid,
    "private_id" uuid
);


create table "payload"."documentation" (
    "id" uuid not null default gen_random_uuid(),
    "title" character varying not null,
    "slug" character varying not null,
    "status" character varying default 'draft'::character varying,
    "content" jsonb,
    "parent" uuid,
    "parent_id" uuid,
    "description" text,
    "order" numeric default 0,
    "_order" numeric generated always as ("order") stored,
    "published_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now(),
    "downloads_id" uuid[]
);


create table "payload"."documentation__downloads" (
    "id" uuid not null default gen_random_uuid(),
    "parent_id" text not null,
    "downloads_id" uuid,
    "order_column" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "order" integer,
    "path" text
);


create table "payload"."documentation_breadcrumbs" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer,
    "_parent_id" uuid,
    "doc" uuid,
    "doc_id" uuid,
    "label" character varying,
    "url" character varying,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."documentation_categories" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer,
    "parent_id" uuid,
    "_parent_id" uuid,
    "category" character varying,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."documentation_rels" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer,
    "_parent_id" uuid,
    "field" character varying(255),
    "value" uuid,
    "path" character varying,
    "documentation_id" uuid,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now(),
    "parent_id" uuid,
    "downloads_id" uuid,
    "posts_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "quiz_id_id" uuid,
    "private_id" uuid
);


create table "payload"."documentation_tags" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer,
    "parent_id" uuid,
    "_parent_id" uuid,
    "tag" character varying,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."downloads" (
    "id" uuid not null default gen_random_uuid(),
    "filename" text not null,
    "url" text not null,
    "description" text,
    "lesson_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "title" text,
    "type" text,
    "key" text,
    "filesize" integer,
    "mimetype" text,
    "thumbnail_u_r_l" text,
    "mime_type" text,
    "mime" text,
    "alt_text" text,
    "filename_original" text,
    "width" integer,
    "height" integer,
    "focal_x" numeric,
    "focal_y" numeric,
    "sizes" jsonb,
    "sizes_srcsets" jsonb,
    "sizes_thumbnail_url" text,
    "sizes_thumbnail_width" integer,
    "sizes_thumbnail_height" integer,
    "sizes_thumbnail_mime_type" text,
    "sizes_thumbnail_filesize" integer,
    "sizes_thumbnail_filename" text,
    "sizes_card_url" text,
    "sizes_card_width" integer,
    "sizes_card_height" integer,
    "sizes_card_mime_type" text,
    "sizes_card_filesize" integer,
    "sizes_card_filename" text,
    "sizes_tablet_url" text,
    "sizes_tablet_width" integer,
    "sizes_tablet_height" integer,
    "sizes_tablet_mime_type" text,
    "sizes_tablet_filesize" integer,
    "sizes_tablet_filename" text,
    "caption" text,
    "created_by" text,
    "updated_by" text,
    "path" text
);


create table "payload"."downloads_rels" (
    "id" uuid not null default gen_random_uuid(),
    "_parent_id" uuid not null,
    "field" text,
    "value" text,
    "order_column" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "order" integer,
    "path" text,
    "parent_id" uuid,
    "downloads_id" uuid,
    "documentation_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "posts_id" uuid,
    "private_id" uuid
);


create table "payload"."dynamic_uuid_tables" (
    "table_name" text not null,
    "primary_key" text,
    "created_at" timestamp(3) with time zone default now(),
    "needs_path_column" boolean default false
);


create table "payload"."media" (
    "id" uuid not null default gen_random_uuid(),
    "alt" character varying not null,
    "filename" character varying,
    "mime_type" character varying,
    "filesize" numeric,
    "width" numeric,
    "height" numeric,
    "url" character varying,
    "thumbnail_u_r_l" character varying,
    "focal_x" numeric,
    "focal_y" numeric,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."payload_locked_documents" (
    "id" uuid not null default gen_random_uuid(),
    "collection" character varying,
    "document_id" character varying,
    "lock_expiration" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now(),
    "global_slug" character varying,
    "media_id" uuid,
    "documentation_id" uuid,
    "posts_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid
);


create table "payload"."payload_locked_documents_rels" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "parent_id" uuid,
    "path" character varying,
    "users_id" uuid,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now(),
    "downloads_id" uuid,
    "posts_id" uuid,
    "documentation_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "quiz_id_id" uuid,
    "media_id" uuid,
    "private_id" uuid
);


create table "payload"."payload_migrations" (
    "id" integer not null default nextval('payload.payload_migrations_id_seq'::regclass),
    "name" character varying,
    "batch" numeric,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."payload_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user" uuid,
    "key" character varying,
    "value" jsonb,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."payload_preferences_rels" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "parent_id" uuid,
    "path" character varying,
    "users_id" uuid,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now(),
    "downloads_id" uuid,
    "posts_id" uuid,
    "documentation_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "quiz_id_id" uuid,
    "private_id" uuid
);


create table "payload"."posts" (
    "id" uuid not null default gen_random_uuid(),
    "title" character varying not null,
    "slug" character varying not null,
    "status" character varying default 'draft'::character varying,
    "content" jsonb,
    "description" text,
    "image_id" uuid,
    "image_id_id" uuid,
    "featured_image_id" uuid,
    "featured_image_id_id" uuid,
    "published_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now(),
    "downloads_id" uuid[]
);


create table "payload"."posts__downloads" (
    "id" uuid not null default gen_random_uuid(),
    "parent_id" text not null,
    "downloads_id" uuid,
    "order_column" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "order" integer,
    "path" text
);


create table "payload"."posts_categories" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer,
    "_parent_id" uuid,
    "category" character varying,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."posts_rels" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer,
    "_parent_id" uuid,
    "field" character varying(255),
    "value" uuid,
    "path" character varying,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now(),
    "media_id" uuid,
    "parent_id" uuid,
    "downloads_id" uuid,
    "posts_id" uuid,
    "documentation_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "quiz_id_id" uuid,
    "private_id" uuid
);


create table "payload"."posts_tags" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer,
    "_parent_id" uuid,
    "tag" character varying,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."private" (
    "id" uuid not null default gen_random_uuid(),
    "title" character varying not null,
    "slug" character varying not null,
    "description" text,
    "content" jsonb,
    "status" character varying default 'draft'::character varying,
    "published_at" timestamp(3) with time zone,
    "image_id" uuid,
    "image_id_id" uuid,
    "featured_image_id" uuid,
    "featured_image_id_id" uuid,
    "downloads_id" uuid[],
    "path" text,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."private__downloads" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer generated always as ("order") stored,
    "_parent_id" uuid,
    "parent_id" uuid,
    "downloads_id" uuid,
    "path" text,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."private_categories" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer generated always as ("order") stored,
    "_parent_id" uuid,
    "parent_id" uuid,
    "category" character varying,
    "path" text,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."private_rels" (
    "id" uuid not null default gen_random_uuid(),
    "_parent_id" uuid,
    "parent_id" uuid,
    "field" text,
    "value" uuid,
    "order" integer,
    "_order" integer generated always as ("order") stored,
    "media_id" uuid,
    "documentation_id" uuid,
    "posts_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "quiz_id_id" uuid,
    "downloads_id" uuid,
    "private_id" uuid,
    "path" text,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."private_tags" (
    "id" uuid not null default gen_random_uuid(),
    "order" integer,
    "_order" integer generated always as ("order") stored,
    "_parent_id" uuid,
    "parent_id" uuid,
    "tag" character varying,
    "path" text,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."quiz_questions" (
    "id" uuid not null default gen_random_uuid(),
    "question" text,
    "options" jsonb,
    "correct_answer" text,
    "type" text,
    "explanation" text,
    "order" integer,
    "_order" integer generated always as ("order") stored,
    "quiz_id" uuid,
    "quiz_id_id" uuid,
    "media_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "payload"."quiz_questions_options" (
    "id" uuid not null default gen_random_uuid(),
    "_order" integer,
    "order" integer,
    "_parent_id" uuid,
    "text" character varying,
    "is_correct" boolean default false,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."quiz_questions_rels" (
    "id" uuid not null default gen_random_uuid(),
    "_parent_id" uuid not null,
    "field" character varying(255),
    "value" uuid,
    "order" integer,
    "_order" integer,
    "path" character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "parent_id" uuid,
    "downloads_id" uuid,
    "posts_id" uuid,
    "documentation_id" uuid,
    "surveys_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "quiz_id_id" uuid,
    "private_id" uuid
);


create table "payload"."survey_questions" (
    "id" uuid not null default gen_random_uuid(),
    "question" text,
    "options" jsonb,
    "text" character varying generated always as (question) stored,
    "type" character varying default 'text'::character varying,
    "description" text,
    "required" boolean default false,
    "category" character varying,
    "questionspin" integer,
    "position" integer,
    "order" integer,
    "_order" integer generated always as ("order") stored,
    "surveys_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "payload"."survey_questions_options" (
    "id" uuid not null default gen_random_uuid(),
    "_order" integer,
    "order" integer,
    "_parent_id" uuid,
    "option" character varying,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


create table "payload"."survey_questions_rels" (
    "id" uuid not null default gen_random_uuid(),
    "_parent_id" uuid not null,
    "field" character varying(255),
    "value" uuid,
    "surveys_id" uuid,
    "order" integer,
    "_order" integer,
    "path" character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "parent_id" uuid,
    "downloads_id" uuid,
    "posts_id" uuid,
    "documentation_id" uuid,
    "survey_questions_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "quiz_id_id" uuid,
    "private_id" uuid
);


create table "payload"."surveys" (
    "id" uuid not null default gen_random_uuid(),
    "title" text,
    "slug" text,
    "description" text,
    "start_message" text,
    "end_message" text,
    "show_progress_bar" boolean default true,
    "summary_content" jsonb,
    "status" character varying default 'draft'::character varying,
    "published_at" timestamp(3) with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "downloads_id" uuid[]
);


create table "payload"."surveys__downloads" (
    "id" uuid not null default gen_random_uuid(),
    "parent_id" text not null,
    "downloads_id" uuid,
    "order_column" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "order" integer,
    "path" text
);


create table "payload"."surveys_rels" (
    "id" uuid not null default gen_random_uuid(),
    "_parent_id" uuid not null,
    "field" character varying(255),
    "value" uuid,
    "parent_id" uuid,
    "order" integer,
    "_order" integer,
    "path" character varying,
    "survey_questions_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "downloads_id" uuid,
    "posts_id" uuid,
    "documentation_id" uuid,
    "surveys_id" uuid,
    "courses_id" uuid,
    "course_lessons_id" uuid,
    "course_quizzes_id" uuid,
    "quiz_questions_id" uuid,
    "quiz_id_id" uuid,
    "private_id" uuid
);


create table "payload"."users" (
    "id" uuid not null default gen_random_uuid(),
    "email" character varying not null,
    "reset_password_token" character varying,
    "reset_password_expiration" timestamp(3) with time zone,
    "salt" character varying,
    "hash" character varying,
    "login_attempts" numeric default 0,
    "lock_until" timestamp(3) with time zone,
    "first_name" character varying,
    "last_name" character varying,
    "updated_at" timestamp(3) with time zone not null default now(),
    "created_at" timestamp(3) with time zone not null default now()
);


alter sequence "payload"."payload_migrations_id_seq" owned by "payload"."payload_migrations"."id";

CREATE UNIQUE INDEX course_lessons__downloads_pkey ON payload.course_lessons__downloads USING btree (id);

CREATE UNIQUE INDEX course_lessons_downloads_lesson_id_download_id_key ON payload.course_lessons_downloads USING btree (lesson_id, download_id);

CREATE UNIQUE INDEX course_lessons_downloads_pkey ON payload.course_lessons_downloads USING btree (id);

CREATE UNIQUE INDEX course_lessons_pkey ON payload.course_lessons USING btree (id);

CREATE INDEX course_lessons_rels_created_at_idx ON payload.course_lessons_rels USING btree (created_at);

CREATE UNIQUE INDEX course_lessons_rels_pkey ON payload.course_lessons_rels USING btree (id);

CREATE INDEX course_lessons_rels_updated_at_idx ON payload.course_lessons_rels USING btree (updated_at);

CREATE UNIQUE INDEX course_lessons_slug_key ON payload.course_lessons USING btree (slug);

CREATE UNIQUE INDEX course_quizzes__downloads_pkey ON payload.course_quizzes__downloads USING btree (id);

CREATE UNIQUE INDEX course_quizzes_pkey ON payload.course_quizzes USING btree (id);

CREATE INDEX course_quizzes_rels_created_at_idx ON payload.course_quizzes_rels USING btree (created_at);

CREATE UNIQUE INDEX course_quizzes_rels_pkey ON payload.course_quizzes_rels USING btree (id);

CREATE INDEX course_quizzes_rels_updated_at_idx ON payload.course_quizzes_rels USING btree (updated_at);

CREATE UNIQUE INDEX course_quizzes_slug_key ON payload.course_quizzes USING btree (slug);

CREATE UNIQUE INDEX courses__downloads_pkey ON payload.courses__downloads USING btree (id);

CREATE UNIQUE INDEX courses_pkey ON payload.courses USING btree (id);

CREATE INDEX courses_rels_created_at_idx ON payload.courses_rels USING btree (created_at);

CREATE UNIQUE INDEX courses_rels_pkey ON payload.courses_rels USING btree (id);

CREATE INDEX courses_rels_updated_at_idx ON payload.courses_rels USING btree (updated_at);

CREATE UNIQUE INDEX courses_slug_key ON payload.courses USING btree (slug);

CREATE UNIQUE INDEX documentation__downloads_pkey ON payload.documentation__downloads USING btree (id);

CREATE INDEX documentation_breadcrumbs_created_at_idx ON payload.documentation_breadcrumbs USING btree (created_at);

CREATE UNIQUE INDEX documentation_breadcrumbs_pkey ON payload.documentation_breadcrumbs USING btree (id);

CREATE INDEX documentation_breadcrumbs_updated_at_idx ON payload.documentation_breadcrumbs USING btree (updated_at);

CREATE INDEX documentation_categories_created_at_idx ON payload.documentation_categories USING btree (created_at);

CREATE UNIQUE INDEX documentation_categories_pkey ON payload.documentation_categories USING btree (id);

CREATE INDEX documentation_categories_updated_at_idx ON payload.documentation_categories USING btree (updated_at);

CREATE INDEX documentation_created_at_idx ON payload.documentation USING btree (created_at);

CREATE UNIQUE INDEX documentation_pkey ON payload.documentation USING btree (id);

CREATE INDEX documentation_rels_created_at_idx ON payload.documentation_rels USING btree (created_at);

CREATE UNIQUE INDEX documentation_rels_pkey ON payload.documentation_rels USING btree (id);

CREATE INDEX documentation_rels_updated_at_idx ON payload.documentation_rels USING btree (updated_at);

CREATE UNIQUE INDEX documentation_slug_idx ON payload.documentation USING btree (slug);

CREATE INDEX documentation_tags_created_at_idx ON payload.documentation_tags USING btree (created_at);

CREATE UNIQUE INDEX documentation_tags_pkey ON payload.documentation_tags USING btree (id);

CREATE INDEX documentation_tags_updated_at_idx ON payload.documentation_tags USING btree (updated_at);

CREATE INDEX documentation_updated_at_idx ON payload.documentation USING btree (updated_at);

CREATE UNIQUE INDEX downloads_pkey ON payload.downloads USING btree (id);

CREATE INDEX downloads_rels_field_idx ON payload.downloads_rels USING btree (field);

CREATE INDEX downloads_rels_parent_idx ON payload.downloads_rels USING btree (_parent_id);

CREATE UNIQUE INDEX downloads_rels_pkey ON payload.downloads_rels USING btree (id);

CREATE INDEX downloads_rels_value_idx ON payload.downloads_rels USING btree (value);

CREATE UNIQUE INDEX dynamic_uuid_tables_pkey ON payload.dynamic_uuid_tables USING btree (table_name);

CREATE INDEX idx_course_lessons__downloads_downloads ON payload.course_lessons__downloads USING btree (downloads_id);

CREATE INDEX idx_course_lessons__downloads_parent ON payload.course_lessons__downloads USING btree (parent_id);

CREATE INDEX idx_course_quizzes__downloads_downloads ON payload.course_quizzes__downloads USING btree (downloads_id);

CREATE INDEX idx_course_quizzes__downloads_parent ON payload.course_quizzes__downloads USING btree (parent_id);

CREATE INDEX idx_courses__downloads_downloads ON payload.courses__downloads USING btree (downloads_id);

CREATE INDEX idx_courses__downloads_parent ON payload.courses__downloads USING btree (parent_id);

CREATE INDEX idx_documentation__downloads_downloads ON payload.documentation__downloads USING btree (downloads_id);

CREATE INDEX idx_documentation__downloads_parent ON payload.documentation__downloads USING btree (parent_id);

CREATE INDEX idx_posts__downloads_downloads ON payload.posts__downloads USING btree (downloads_id);

CREATE INDEX idx_posts__downloads_parent ON payload.posts__downloads USING btree (parent_id);

CREATE INDEX idx_private__downloads_downloads ON payload.private__downloads USING btree (downloads_id);

CREATE INDEX idx_private__downloads_parent ON payload.private__downloads USING btree (parent_id);

CREATE INDEX idx_surveys__downloads_downloads ON payload.surveys__downloads USING btree (downloads_id);

CREATE INDEX idx_surveys__downloads_parent ON payload.surveys__downloads USING btree (parent_id);

CREATE INDEX media_created_at_idx ON payload.media USING btree (created_at);

CREATE UNIQUE INDEX media_filename_idx ON payload.media USING btree (filename);

CREATE UNIQUE INDEX media_pkey ON payload.media USING btree (id);

CREATE INDEX media_updated_at_idx ON payload.media USING btree (updated_at);

CREATE INDEX payload_locked_documents_created_at_idx ON payload.payload_locked_documents USING btree (created_at);

CREATE UNIQUE INDEX payload_locked_documents_pkey ON payload.payload_locked_documents USING btree (id);

CREATE INDEX payload_locked_documents_rels_created_at_idx ON payload.payload_locked_documents_rels USING btree (created_at);

CREATE UNIQUE INDEX payload_locked_documents_rels_pkey ON payload.payload_locked_documents_rels USING btree (id);

CREATE INDEX payload_locked_documents_rels_updated_at_idx ON payload.payload_locked_documents_rels USING btree (updated_at);

CREATE INDEX payload_locked_documents_updated_at_idx ON payload.payload_locked_documents USING btree (updated_at);

CREATE INDEX payload_migrations_created_at_idx ON payload.payload_migrations USING btree (created_at);

CREATE UNIQUE INDEX payload_migrations_pkey ON payload.payload_migrations USING btree (id);

CREATE INDEX payload_migrations_updated_at_idx ON payload.payload_migrations USING btree (updated_at);

CREATE INDEX payload_preferences_created_at_idx ON payload.payload_preferences USING btree (created_at);

CREATE UNIQUE INDEX payload_preferences_pkey ON payload.payload_preferences USING btree (id);

CREATE INDEX payload_preferences_rels_created_at_idx ON payload.payload_preferences_rels USING btree (created_at);

CREATE UNIQUE INDEX payload_preferences_rels_pkey ON payload.payload_preferences_rels USING btree (id);

CREATE INDEX payload_preferences_rels_updated_at_idx ON payload.payload_preferences_rels USING btree (updated_at);

CREATE INDEX payload_preferences_updated_at_idx ON payload.payload_preferences USING btree (updated_at);

CREATE UNIQUE INDEX posts__downloads_pkey ON payload.posts__downloads USING btree (id);

CREATE INDEX posts_categories_created_at_idx ON payload.posts_categories USING btree (created_at);

CREATE UNIQUE INDEX posts_categories_pkey ON payload.posts_categories USING btree (id);

CREATE INDEX posts_categories_updated_at_idx ON payload.posts_categories USING btree (updated_at);

CREATE INDEX posts_created_at_idx ON payload.posts USING btree (created_at);

CREATE UNIQUE INDEX posts_pkey ON payload.posts USING btree (id);

CREATE INDEX posts_rels_created_at_idx ON payload.posts_rels USING btree (created_at);

CREATE UNIQUE INDEX posts_rels_pkey ON payload.posts_rels USING btree (id);

CREATE INDEX posts_rels_updated_at_idx ON payload.posts_rels USING btree (updated_at);

CREATE UNIQUE INDEX posts_slug_idx ON payload.posts USING btree (slug);

CREATE INDEX posts_tags_created_at_idx ON payload.posts_tags USING btree (created_at);

CREATE UNIQUE INDEX posts_tags_pkey ON payload.posts_tags USING btree (id);

CREATE INDEX posts_tags_updated_at_idx ON payload.posts_tags USING btree (updated_at);

CREATE INDEX posts_updated_at_idx ON payload.posts USING btree (updated_at);

CREATE INDEX private__downloads_created_at_idx ON payload.private__downloads USING btree (created_at);

CREATE UNIQUE INDEX private__downloads_pkey ON payload.private__downloads USING btree (id);

CREATE INDEX private__downloads_updated_at_idx ON payload.private__downloads USING btree (updated_at);

CREATE INDEX private_categories_created_at_idx ON payload.private_categories USING btree (created_at);

CREATE UNIQUE INDEX private_categories_pkey ON payload.private_categories USING btree (id);

CREATE INDEX private_categories_updated_at_idx ON payload.private_categories USING btree (updated_at);

CREATE INDEX private_created_at_idx ON payload.private USING btree (created_at);

CREATE UNIQUE INDEX private_pkey ON payload.private USING btree (id);

CREATE INDEX private_rels_created_at_idx ON payload.private_rels USING btree (created_at);

CREATE UNIQUE INDEX private_rels_pkey ON payload.private_rels USING btree (id);

CREATE INDEX private_rels_updated_at_idx ON payload.private_rels USING btree (updated_at);

CREATE UNIQUE INDEX private_slug_idx ON payload.private USING btree (slug);

CREATE INDEX private_tags_created_at_idx ON payload.private_tags USING btree (created_at);

CREATE UNIQUE INDEX private_tags_pkey ON payload.private_tags USING btree (id);

CREATE INDEX private_tags_updated_at_idx ON payload.private_tags USING btree (updated_at);

CREATE INDEX private_updated_at_idx ON payload.private USING btree (updated_at);

CREATE INDEX quiz_questions_options_created_at_idx ON payload.quiz_questions_options USING btree (created_at);

CREATE UNIQUE INDEX quiz_questions_options_pkey ON payload.quiz_questions_options USING btree (id);

CREATE INDEX quiz_questions_options_updated_at_idx ON payload.quiz_questions_options USING btree (updated_at);

CREATE UNIQUE INDEX quiz_questions_pkey ON payload.quiz_questions USING btree (id);

CREATE INDEX quiz_questions_rels_created_at_idx ON payload.quiz_questions_rels USING btree (created_at);

CREATE UNIQUE INDEX quiz_questions_rels_pkey ON payload.quiz_questions_rels USING btree (id);

CREATE INDEX quiz_questions_rels_updated_at_idx ON payload.quiz_questions_rels USING btree (updated_at);

CREATE INDEX survey_questions_options_created_at_idx ON payload.survey_questions_options USING btree (created_at);

CREATE UNIQUE INDEX survey_questions_options_pkey ON payload.survey_questions_options USING btree (id);

CREATE INDEX survey_questions_options_updated_at_idx ON payload.survey_questions_options USING btree (updated_at);

CREATE UNIQUE INDEX survey_questions_pkey ON payload.survey_questions USING btree (id);

CREATE INDEX survey_questions_rels_created_at_idx ON payload.survey_questions_rels USING btree (created_at);

CREATE UNIQUE INDEX survey_questions_rels_pkey ON payload.survey_questions_rels USING btree (id);

CREATE INDEX survey_questions_rels_updated_at_idx ON payload.survey_questions_rels USING btree (updated_at);

CREATE UNIQUE INDEX surveys__downloads_pkey ON payload.surveys__downloads USING btree (id);

CREATE UNIQUE INDEX surveys_pkey ON payload.surveys USING btree (id);

CREATE INDEX surveys_rels_created_at_idx ON payload.surveys_rels USING btree (created_at);

CREATE UNIQUE INDEX surveys_rels_pkey ON payload.surveys_rels USING btree (id);

CREATE INDEX surveys_rels_updated_at_idx ON payload.surveys_rels USING btree (updated_at);

CREATE UNIQUE INDEX surveys_slug_key ON payload.surveys USING btree (slug);

CREATE INDEX users_created_at_idx ON payload.users USING btree (created_at);

CREATE UNIQUE INDEX users_email_idx ON payload.users USING btree (email);

CREATE UNIQUE INDEX users_email_key ON payload.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON payload.users USING btree (id);

CREATE INDEX users_updated_at_idx ON payload.users USING btree (updated_at);

alter table "payload"."course_lessons" add constraint "course_lessons_pkey" PRIMARY KEY using index "course_lessons_pkey";

alter table "payload"."course_lessons__downloads" add constraint "course_lessons__downloads_pkey" PRIMARY KEY using index "course_lessons__downloads_pkey";

alter table "payload"."course_lessons_downloads" add constraint "course_lessons_downloads_pkey" PRIMARY KEY using index "course_lessons_downloads_pkey";

alter table "payload"."course_lessons_rels" add constraint "course_lessons_rels_pkey" PRIMARY KEY using index "course_lessons_rels_pkey";

alter table "payload"."course_quizzes" add constraint "course_quizzes_pkey" PRIMARY KEY using index "course_quizzes_pkey";

alter table "payload"."course_quizzes__downloads" add constraint "course_quizzes__downloads_pkey" PRIMARY KEY using index "course_quizzes__downloads_pkey";

alter table "payload"."course_quizzes_rels" add constraint "course_quizzes_rels_pkey" PRIMARY KEY using index "course_quizzes_rels_pkey";

alter table "payload"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

alter table "payload"."courses__downloads" add constraint "courses__downloads_pkey" PRIMARY KEY using index "courses__downloads_pkey";

alter table "payload"."courses_rels" add constraint "courses_rels_pkey" PRIMARY KEY using index "courses_rels_pkey";

alter table "payload"."documentation" add constraint "documentation_pkey" PRIMARY KEY using index "documentation_pkey";

alter table "payload"."documentation__downloads" add constraint "documentation__downloads_pkey" PRIMARY KEY using index "documentation__downloads_pkey";

alter table "payload"."documentation_breadcrumbs" add constraint "documentation_breadcrumbs_pkey" PRIMARY KEY using index "documentation_breadcrumbs_pkey";

alter table "payload"."documentation_categories" add constraint "documentation_categories_pkey" PRIMARY KEY using index "documentation_categories_pkey";

alter table "payload"."documentation_rels" add constraint "documentation_rels_pkey" PRIMARY KEY using index "documentation_rels_pkey";

alter table "payload"."documentation_tags" add constraint "documentation_tags_pkey" PRIMARY KEY using index "documentation_tags_pkey";

alter table "payload"."downloads" add constraint "downloads_pkey" PRIMARY KEY using index "downloads_pkey";

alter table "payload"."downloads_rels" add constraint "downloads_rels_pkey" PRIMARY KEY using index "downloads_rels_pkey";

alter table "payload"."dynamic_uuid_tables" add constraint "dynamic_uuid_tables_pkey" PRIMARY KEY using index "dynamic_uuid_tables_pkey";

alter table "payload"."media" add constraint "media_pkey" PRIMARY KEY using index "media_pkey";

alter table "payload"."payload_locked_documents" add constraint "payload_locked_documents_pkey" PRIMARY KEY using index "payload_locked_documents_pkey";

alter table "payload"."payload_locked_documents_rels" add constraint "payload_locked_documents_rels_pkey" PRIMARY KEY using index "payload_locked_documents_rels_pkey";

alter table "payload"."payload_migrations" add constraint "payload_migrations_pkey" PRIMARY KEY using index "payload_migrations_pkey";

alter table "payload"."payload_preferences" add constraint "payload_preferences_pkey" PRIMARY KEY using index "payload_preferences_pkey";

alter table "payload"."payload_preferences_rels" add constraint "payload_preferences_rels_pkey" PRIMARY KEY using index "payload_preferences_rels_pkey";

alter table "payload"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "payload"."posts__downloads" add constraint "posts__downloads_pkey" PRIMARY KEY using index "posts__downloads_pkey";

alter table "payload"."posts_categories" add constraint "posts_categories_pkey" PRIMARY KEY using index "posts_categories_pkey";

alter table "payload"."posts_rels" add constraint "posts_rels_pkey" PRIMARY KEY using index "posts_rels_pkey";

alter table "payload"."posts_tags" add constraint "posts_tags_pkey" PRIMARY KEY using index "posts_tags_pkey";

alter table "payload"."private" add constraint "private_pkey" PRIMARY KEY using index "private_pkey";

alter table "payload"."private__downloads" add constraint "private__downloads_pkey" PRIMARY KEY using index "private__downloads_pkey";

alter table "payload"."private_categories" add constraint "private_categories_pkey" PRIMARY KEY using index "private_categories_pkey";

alter table "payload"."private_rels" add constraint "private_rels_pkey" PRIMARY KEY using index "private_rels_pkey";

alter table "payload"."private_tags" add constraint "private_tags_pkey" PRIMARY KEY using index "private_tags_pkey";

alter table "payload"."quiz_questions" add constraint "quiz_questions_pkey" PRIMARY KEY using index "quiz_questions_pkey";

alter table "payload"."quiz_questions_options" add constraint "quiz_questions_options_pkey" PRIMARY KEY using index "quiz_questions_options_pkey";

alter table "payload"."quiz_questions_rels" add constraint "quiz_questions_rels_pkey" PRIMARY KEY using index "quiz_questions_rels_pkey";

alter table "payload"."survey_questions" add constraint "survey_questions_pkey" PRIMARY KEY using index "survey_questions_pkey";

alter table "payload"."survey_questions_options" add constraint "survey_questions_options_pkey" PRIMARY KEY using index "survey_questions_options_pkey";

alter table "payload"."survey_questions_rels" add constraint "survey_questions_rels_pkey" PRIMARY KEY using index "survey_questions_rels_pkey";

alter table "payload"."surveys" add constraint "surveys_pkey" PRIMARY KEY using index "surveys_pkey";

alter table "payload"."surveys__downloads" add constraint "surveys__downloads_pkey" PRIMARY KEY using index "surveys__downloads_pkey";

alter table "payload"."surveys_rels" add constraint "surveys_rels_pkey" PRIMARY KEY using index "surveys_rels_pkey";

alter table "payload"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "payload"."course_lessons" add constraint "course_lessons_course_id_fkey" FOREIGN KEY (course_id) REFERENCES payload.courses(id) ON DELETE CASCADE not valid;

alter table "payload"."course_lessons" validate constraint "course_lessons_course_id_fkey";

alter table "payload"."course_lessons" add constraint "course_lessons_course_id_id_fkey" FOREIGN KEY (course_id_id) REFERENCES payload.courses(id) ON DELETE CASCADE not valid;

alter table "payload"."course_lessons" validate constraint "course_lessons_course_id_id_fkey";

alter table "payload"."course_lessons" add constraint "course_lessons_featured_image_id_fkey" FOREIGN KEY (featured_image_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."course_lessons" validate constraint "course_lessons_featured_image_id_fkey";

alter table "payload"."course_lessons" add constraint "course_lessons_featured_image_id_id_fkey" FOREIGN KEY (featured_image_id_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."course_lessons" validate constraint "course_lessons_featured_image_id_id_fkey";

alter table "payload"."course_lessons" add constraint "course_lessons_media_id_fkey" FOREIGN KEY (media_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."course_lessons" validate constraint "course_lessons_media_id_fkey";

alter table "payload"."course_lessons" add constraint "course_lessons_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES payload.course_quizzes(id) ON DELETE SET NULL not valid;

alter table "payload"."course_lessons" validate constraint "course_lessons_quiz_id_fkey";

alter table "payload"."course_lessons" add constraint "course_lessons_quiz_id_id_fkey" FOREIGN KEY (quiz_id_id) REFERENCES payload.course_quizzes(id) ON DELETE SET NULL not valid;

alter table "payload"."course_lessons" validate constraint "course_lessons_quiz_id_id_fkey";

alter table "payload"."course_lessons" add constraint "course_lessons_slug_key" UNIQUE using index "course_lessons_slug_key";

alter table "payload"."course_lessons" add constraint "fk_course_lessons_survey" FOREIGN KEY (survey_id) REFERENCES payload.surveys(id) ON DELETE SET NULL not valid;

alter table "payload"."course_lessons" validate constraint "fk_course_lessons_survey";

alter table "payload"."course_lessons" add constraint "fk_course_lessons_survey_id" FOREIGN KEY (survey_id_id) REFERENCES payload.surveys(id) ON DELETE SET NULL not valid;

alter table "payload"."course_lessons" validate constraint "fk_course_lessons_survey_id";

alter table "payload"."course_lessons_downloads" add constraint "course_lessons_downloads_download_id_fkey" FOREIGN KEY (download_id) REFERENCES payload.downloads(id) not valid;

alter table "payload"."course_lessons_downloads" validate constraint "course_lessons_downloads_download_id_fkey";

alter table "payload"."course_lessons_downloads" add constraint "course_lessons_downloads_lesson_id_download_id_key" UNIQUE using index "course_lessons_downloads_lesson_id_download_id_key";

alter table "payload"."course_lessons_downloads" add constraint "course_lessons_downloads_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES payload.course_lessons(id) not valid;

alter table "payload"."course_lessons_downloads" validate constraint "course_lessons_downloads_lesson_id_fkey";

alter table "payload"."course_lessons_rels" add constraint "course_lessons_rels__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.course_lessons(id) ON DELETE CASCADE not valid;

alter table "payload"."course_lessons_rels" validate constraint "course_lessons_rels__parent_id_fkey";

alter table "payload"."course_quizzes" add constraint "course_quizzes_media_id_fkey" FOREIGN KEY (media_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."course_quizzes" validate constraint "course_quizzes_media_id_fkey";

alter table "payload"."course_quizzes" add constraint "course_quizzes_slug_key" UNIQUE using index "course_quizzes_slug_key";

alter table "payload"."course_quizzes_rels" add constraint "course_quizzes_rels__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.course_quizzes(id) ON DELETE CASCADE not valid;

alter table "payload"."course_quizzes_rels" validate constraint "course_quizzes_rels__parent_id_fkey";

alter table "payload"."course_quizzes_rels" add constraint "course_quizzes_rels_quiz_questions_id_fkey" FOREIGN KEY (quiz_questions_id) REFERENCES payload.quiz_questions(id) ON DELETE CASCADE not valid;

alter table "payload"."course_quizzes_rels" validate constraint "course_quizzes_rels_quiz_questions_id_fkey";

alter table "payload"."courses" add constraint "courses_featured_image_id_fkey" FOREIGN KEY (featured_image_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."courses" validate constraint "courses_featured_image_id_fkey";

alter table "payload"."courses" add constraint "courses_featured_image_id_id_fkey" FOREIGN KEY (featured_image_id_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."courses" validate constraint "courses_featured_image_id_id_fkey";

alter table "payload"."courses" add constraint "courses_slug_key" UNIQUE using index "courses_slug_key";

alter table "payload"."courses_rels" add constraint "courses_rels__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.courses(id) ON DELETE CASCADE not valid;

alter table "payload"."courses_rels" validate constraint "courses_rels__parent_id_fkey";

alter table "payload"."courses_rels" add constraint "courses_rels_course_lessons_id_fkey" FOREIGN KEY (course_lessons_id) REFERENCES payload.course_lessons(id) ON DELETE CASCADE not valid;

alter table "payload"."courses_rels" validate constraint "courses_rels_course_lessons_id_fkey";

alter table "payload"."documentation_breadcrumbs" add constraint "documentation_breadcrumbs__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.documentation(id) ON DELETE CASCADE not valid;

alter table "payload"."documentation_breadcrumbs" validate constraint "documentation_breadcrumbs__parent_id_fkey";

alter table "payload"."documentation_breadcrumbs" add constraint "documentation_breadcrumbs_doc_id_fkey" FOREIGN KEY (doc_id) REFERENCES payload.documentation(id) ON DELETE CASCADE not valid;

alter table "payload"."documentation_breadcrumbs" validate constraint "documentation_breadcrumbs_doc_id_fkey";

alter table "payload"."documentation_categories" add constraint "documentation_categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES payload.documentation(id) ON DELETE CASCADE not valid;

alter table "payload"."documentation_categories" validate constraint "documentation_categories_parent_id_fkey";

alter table "payload"."documentation_rels" add constraint "documentation_rels__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.documentation(id) ON DELETE CASCADE not valid;

alter table "payload"."documentation_rels" validate constraint "documentation_rels__parent_id_fkey";

alter table "payload"."documentation_rels" add constraint "documentation_rels_documentation_id_fkey" FOREIGN KEY (documentation_id) REFERENCES payload.documentation(id) ON DELETE CASCADE not valid;

alter table "payload"."documentation_rels" validate constraint "documentation_rels_documentation_id_fkey";

alter table "payload"."documentation_tags" add constraint "documentation_tags_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES payload.documentation(id) ON DELETE CASCADE not valid;

alter table "payload"."documentation_tags" validate constraint "documentation_tags_parent_id_fkey";

alter table "payload"."downloads" add constraint "downloads_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES payload.course_lessons(id) not valid;

alter table "payload"."downloads" validate constraint "downloads_lesson_id_fkey";

alter table "payload"."downloads_rels" add constraint "downloads_rels_parent_fk" FOREIGN KEY (_parent_id) REFERENCES payload.downloads(id) ON DELETE CASCADE not valid;

alter table "payload"."downloads_rels" validate constraint "downloads_rels_parent_fk";

alter table "payload"."payload_locked_documents" add constraint "payload_locked_documents_course_lessons_id_fkey" FOREIGN KEY (course_lessons_id) REFERENCES payload.course_lessons(id) ON DELETE SET NULL not valid;

alter table "payload"."payload_locked_documents" validate constraint "payload_locked_documents_course_lessons_id_fkey";

alter table "payload"."payload_locked_documents" add constraint "payload_locked_documents_course_quizzes_id_fkey" FOREIGN KEY (course_quizzes_id) REFERENCES payload.course_quizzes(id) ON DELETE SET NULL not valid;

alter table "payload"."payload_locked_documents" validate constraint "payload_locked_documents_course_quizzes_id_fkey";

alter table "payload"."payload_locked_documents" add constraint "payload_locked_documents_courses_id_fkey" FOREIGN KEY (courses_id) REFERENCES payload.courses(id) ON DELETE SET NULL not valid;

alter table "payload"."payload_locked_documents" validate constraint "payload_locked_documents_courses_id_fkey";

alter table "payload"."payload_locked_documents" add constraint "payload_locked_documents_documentation_id_fkey" FOREIGN KEY (documentation_id) REFERENCES payload.documentation(id) ON DELETE SET NULL not valid;

alter table "payload"."payload_locked_documents" validate constraint "payload_locked_documents_documentation_id_fkey";

alter table "payload"."payload_locked_documents" add constraint "payload_locked_documents_media_id_fkey" FOREIGN KEY (media_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."payload_locked_documents" validate constraint "payload_locked_documents_media_id_fkey";

alter table "payload"."payload_locked_documents" add constraint "payload_locked_documents_posts_id_fkey" FOREIGN KEY (posts_id) REFERENCES payload.posts(id) ON DELETE SET NULL not valid;

alter table "payload"."payload_locked_documents" validate constraint "payload_locked_documents_posts_id_fkey";

alter table "payload"."payload_locked_documents" add constraint "payload_locked_documents_quiz_questions_id_fkey" FOREIGN KEY (quiz_questions_id) REFERENCES payload.quiz_questions(id) ON DELETE SET NULL not valid;

alter table "payload"."payload_locked_documents" validate constraint "payload_locked_documents_quiz_questions_id_fkey";

alter table "payload"."payload_locked_documents" add constraint "payload_locked_documents_survey_questions_id_fkey" FOREIGN KEY (survey_questions_id) REFERENCES payload.survey_questions(id) ON DELETE SET NULL not valid;

alter table "payload"."payload_locked_documents" validate constraint "payload_locked_documents_survey_questions_id_fkey";

alter table "payload"."payload_locked_documents" add constraint "payload_locked_documents_surveys_id_fkey" FOREIGN KEY (surveys_id) REFERENCES payload.surveys(id) ON DELETE SET NULL not valid;

alter table "payload"."payload_locked_documents" validate constraint "payload_locked_documents_surveys_id_fkey";

alter table "payload"."payload_locked_documents_rels" add constraint "payload_locked_documents_rels_media_id_fkey" FOREIGN KEY (media_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."payload_locked_documents_rels" validate constraint "payload_locked_documents_rels_media_id_fkey";

alter table "payload"."payload_locked_documents_rels" add constraint "payload_locked_documents_rels_users_id_fkey" FOREIGN KEY (users_id) REFERENCES payload.users(id) ON DELETE CASCADE not valid;

alter table "payload"."payload_locked_documents_rels" validate constraint "payload_locked_documents_rels_users_id_fkey";

alter table "payload"."payload_preferences" add constraint "payload_preferences_user_fkey" FOREIGN KEY ("user") REFERENCES payload.users(id) ON DELETE CASCADE not valid;

alter table "payload"."payload_preferences" validate constraint "payload_preferences_user_fkey";

alter table "payload"."payload_preferences_rels" add constraint "payload_preferences_rels_users_id_fkey" FOREIGN KEY (users_id) REFERENCES payload.users(id) ON DELETE CASCADE not valid;

alter table "payload"."payload_preferences_rels" validate constraint "payload_preferences_rels_users_id_fkey";

alter table "payload"."posts" add constraint "posts_featured_image_id_fkey" FOREIGN KEY (featured_image_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."posts" validate constraint "posts_featured_image_id_fkey";

alter table "payload"."posts" add constraint "posts_featured_image_id_id_fkey" FOREIGN KEY (featured_image_id_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."posts" validate constraint "posts_featured_image_id_id_fkey";

alter table "payload"."posts" add constraint "posts_image_id_fkey" FOREIGN KEY (image_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."posts" validate constraint "posts_image_id_fkey";

alter table "payload"."posts" add constraint "posts_image_id_id_fkey" FOREIGN KEY (image_id_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."posts" validate constraint "posts_image_id_id_fkey";

alter table "payload"."posts_categories" add constraint "posts_categories__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.posts(id) ON DELETE CASCADE not valid;

alter table "payload"."posts_categories" validate constraint "posts_categories__parent_id_fkey";

alter table "payload"."posts_rels" add constraint "posts_rels__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.posts(id) ON DELETE CASCADE not valid;

alter table "payload"."posts_rels" validate constraint "posts_rels__parent_id_fkey";

alter table "payload"."posts_rels" add constraint "posts_rels_media_id_fkey" FOREIGN KEY (media_id) REFERENCES payload.media(id) not valid;

alter table "payload"."posts_rels" validate constraint "posts_rels_media_id_fkey";

alter table "payload"."posts_tags" add constraint "posts_tags__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.posts(id) ON DELETE CASCADE not valid;

alter table "payload"."posts_tags" validate constraint "posts_tags__parent_id_fkey";

alter table "payload"."private" add constraint "private_featured_image_id_fkey" FOREIGN KEY (featured_image_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."private" validate constraint "private_featured_image_id_fkey";

alter table "payload"."private" add constraint "private_featured_image_id_id_fkey" FOREIGN KEY (featured_image_id_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."private" validate constraint "private_featured_image_id_id_fkey";

alter table "payload"."private" add constraint "private_image_id_fkey" FOREIGN KEY (image_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."private" validate constraint "private_image_id_fkey";

alter table "payload"."private" add constraint "private_image_id_id_fkey" FOREIGN KEY (image_id_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."private" validate constraint "private_image_id_id_fkey";

alter table "payload"."private__downloads" add constraint "private__downloads__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.private(id) ON DELETE CASCADE not valid;

alter table "payload"."private__downloads" validate constraint "private__downloads__parent_id_fkey";

alter table "payload"."private__downloads" add constraint "private__downloads_downloads_id_fkey" FOREIGN KEY (downloads_id) REFERENCES payload.downloads(id) ON DELETE CASCADE not valid;

alter table "payload"."private__downloads" validate constraint "private__downloads_downloads_id_fkey";

alter table "payload"."private__downloads" add constraint "private__downloads_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES payload.private(id) ON DELETE CASCADE not valid;

alter table "payload"."private__downloads" validate constraint "private__downloads_parent_id_fkey";

alter table "payload"."private_categories" add constraint "private_categories__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.private(id) ON DELETE CASCADE not valid;

alter table "payload"."private_categories" validate constraint "private_categories__parent_id_fkey";

alter table "payload"."private_categories" add constraint "private_categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES payload.private(id) ON DELETE CASCADE not valid;

alter table "payload"."private_categories" validate constraint "private_categories_parent_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.private(id) ON DELETE CASCADE not valid;

alter table "payload"."private_rels" validate constraint "private_rels__parent_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_course_lessons_id_fkey" FOREIGN KEY (course_lessons_id) REFERENCES payload.course_lessons(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_course_lessons_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_course_quizzes_id_fkey" FOREIGN KEY (course_quizzes_id) REFERENCES payload.course_quizzes(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_course_quizzes_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_courses_id_fkey" FOREIGN KEY (courses_id) REFERENCES payload.courses(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_courses_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_documentation_id_fkey" FOREIGN KEY (documentation_id) REFERENCES payload.documentation(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_documentation_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_downloads_id_fkey" FOREIGN KEY (downloads_id) REFERENCES payload.downloads(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_downloads_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_media_id_fkey" FOREIGN KEY (media_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_media_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES payload.private(id) ON DELETE CASCADE not valid;

alter table "payload"."private_rels" validate constraint "private_rels_parent_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_posts_id_fkey" FOREIGN KEY (posts_id) REFERENCES payload.posts(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_posts_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_private_id_fkey" FOREIGN KEY (private_id) REFERENCES payload.private(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_private_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_quiz_id_id_fkey" FOREIGN KEY (quiz_id_id) REFERENCES payload.course_quizzes(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_quiz_id_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_quiz_questions_id_fkey" FOREIGN KEY (quiz_questions_id) REFERENCES payload.quiz_questions(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_quiz_questions_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_survey_questions_id_fkey" FOREIGN KEY (survey_questions_id) REFERENCES payload.survey_questions(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_survey_questions_id_fkey";

alter table "payload"."private_rels" add constraint "private_rels_surveys_id_fkey" FOREIGN KEY (surveys_id) REFERENCES payload.surveys(id) ON DELETE SET NULL not valid;

alter table "payload"."private_rels" validate constraint "private_rels_surveys_id_fkey";

alter table "payload"."private_tags" add constraint "private_tags__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.private(id) ON DELETE CASCADE not valid;

alter table "payload"."private_tags" validate constraint "private_tags__parent_id_fkey";

alter table "payload"."private_tags" add constraint "private_tags_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES payload.private(id) ON DELETE CASCADE not valid;

alter table "payload"."private_tags" validate constraint "private_tags_parent_id_fkey";

alter table "payload"."quiz_questions" add constraint "quiz_questions_media_id_fkey" FOREIGN KEY (media_id) REFERENCES payload.media(id) ON DELETE SET NULL not valid;

alter table "payload"."quiz_questions" validate constraint "quiz_questions_media_id_fkey";

alter table "payload"."quiz_questions" add constraint "quiz_questions_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES payload.course_quizzes(id) ON DELETE SET NULL not valid;

alter table "payload"."quiz_questions" validate constraint "quiz_questions_quiz_id_fkey";

alter table "payload"."quiz_questions" add constraint "quiz_questions_quiz_id_id_fkey" FOREIGN KEY (quiz_id_id) REFERENCES payload.course_quizzes(id) ON DELETE SET NULL not valid;

alter table "payload"."quiz_questions" validate constraint "quiz_questions_quiz_id_id_fkey";

alter table "payload"."quiz_questions_options" add constraint "quiz_questions_options__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.quiz_questions(id) ON DELETE CASCADE not valid;

alter table "payload"."quiz_questions_options" validate constraint "quiz_questions_options__parent_id_fkey";

alter table "payload"."quiz_questions_rels" add constraint "quiz_questions_rels__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.quiz_questions(id) ON DELETE CASCADE not valid;

alter table "payload"."quiz_questions_rels" validate constraint "quiz_questions_rels__parent_id_fkey";

alter table "payload"."survey_questions" add constraint "survey_questions_surveys_id_fkey" FOREIGN KEY (surveys_id) REFERENCES payload.surveys(id) ON DELETE SET NULL not valid;

alter table "payload"."survey_questions" validate constraint "survey_questions_surveys_id_fkey";

alter table "payload"."survey_questions_options" add constraint "survey_questions_options__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.survey_questions(id) ON DELETE CASCADE not valid;

alter table "payload"."survey_questions_options" validate constraint "survey_questions_options__parent_id_fkey";

alter table "payload"."survey_questions_rels" add constraint "survey_questions_rels__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.survey_questions(id) ON DELETE CASCADE not valid;

alter table "payload"."survey_questions_rels" validate constraint "survey_questions_rels__parent_id_fkey";

alter table "payload"."survey_questions_rels" add constraint "survey_questions_rels_surveys_id_fkey" FOREIGN KEY (surveys_id) REFERENCES payload.surveys(id) ON DELETE CASCADE not valid;

alter table "payload"."survey_questions_rels" validate constraint "survey_questions_rels_surveys_id_fkey";

alter table "payload"."surveys" add constraint "surveys_slug_key" UNIQUE using index "surveys_slug_key";

alter table "payload"."surveys_rels" add constraint "surveys_rels__parent_id_fkey" FOREIGN KEY (_parent_id) REFERENCES payload.surveys(id) ON DELETE CASCADE not valid;

alter table "payload"."surveys_rels" validate constraint "surveys_rels__parent_id_fkey";

alter table "payload"."surveys_rels" add constraint "surveys_rels_survey_questions_id_fkey" FOREIGN KEY (survey_questions_id) REFERENCES payload.survey_questions(id) ON DELETE CASCADE not valid;

alter table "payload"."surveys_rels" validate constraint "surveys_rels_survey_questions_id_fkey";

alter table "payload"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION payload.collection_has_download(collection_id text, collection_type text, download_id text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
      DECLARE
        found BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT 1 
          FROM payload.downloads_relationships dr
          WHERE dr.collection_id = collection_id
          AND dr.collection_type = collection_type
          AND dr.download_id = download_id
        ) INTO found;
        
        RETURN found;
      END;
      $function$
;

create or replace view "payload"."downloads_diagnostic" as  SELECT d.id,
    d.filename,
    d.url,
    count(cld.id) AS lesson_refs
   FROM (payload.downloads d
     LEFT JOIN payload.course_lessons_downloads cld ON ((d.id = cld.download_id)))
  GROUP BY d.id, d.filename, d.url;


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


CREATE OR REPLACE FUNCTION payload.ensure_downloads_id_column(table_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
    BEGIN
      EXECUTE format('
        ALTER TABLE payload.%I 
        ADD COLUMN IF NOT EXISTS downloads_id UUID
      ', table_name);
    END;
    $function$
;

CREATE OR REPLACE FUNCTION payload.ensure_downloads_id_column_exists(table_name text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
    DECLARE
      schema_name TEXT := 'payload';
      column_exists BOOLEAN;
    BEGIN
      -- Check if column exists
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = schema_name
        AND table_name = table_name
        AND column_name = 'downloads_id'
      ) INTO column_exists;
      
      -- If column doesn't exist, add it
      IF NOT column_exists THEN
        BEGIN
          EXECUTE format('ALTER TABLE %I.%I ADD COLUMN downloads_id UUID', schema_name, table_name);
          RETURN TRUE;
        EXCEPTION WHEN OTHERS THEN
          -- Ignore errors (e.g., if table doesn't exist or we don't have permissions)
          RETURN FALSE;
        END;
      END IF;
      
      RETURN TRUE;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION payload.ensure_relationship_columns(table_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
      BEGIN
        -- Add parent_id if it doesn't exist
        EXECUTE 'ALTER TABLE ' || table_name || 
                ' ADD COLUMN IF NOT EXISTS parent_id UUID';
                
        -- Add downloads_id if it doesn't exist
        EXECUTE 'ALTER TABLE ' || table_name || 
                ' ADD COLUMN IF NOT EXISTS downloads_id UUID';
                
        -- Add private_id if it doesn't exist
        EXECUTE 'ALTER TABLE ' || table_name || 
                ' ADD COLUMN IF NOT EXISTS private_id UUID';
                
        -- Add other important relationship columns
        EXECUTE 'ALTER TABLE ' || table_name || 
                ' ADD COLUMN IF NOT EXISTS documentation_id UUID';
        EXECUTE 'ALTER TABLE ' || table_name || 
                ' ADD COLUMN IF NOT EXISTS courses_id UUID';
        EXECUTE 'ALTER TABLE ' || table_name || 
                ' ADD COLUMN IF NOT EXISTS course_lessons_id UUID';
        EXECUTE 'ALTER TABLE ' || table_name || 
                ' ADD COLUMN IF NOT EXISTS course_quizzes_id UUID';
        EXECUTE 'ALTER TABLE ' || table_name || 
                ' ADD COLUMN IF NOT EXISTS quiz_questions_id UUID';
      END;
      $function$
;

CREATE OR REPLACE FUNCTION payload.fix_dynamic_table(table_name text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
      DECLARE
        schema_name TEXT := 'payload';
        path_exists BOOLEAN;
        col_exists BOOLEAN;
      BEGIN
        -- Add the table to tracking if not already present
        INSERT INTO payload.dynamic_uuid_tables (table_name, last_checked, has_path_column)
        VALUES (table_name, NOW(), FALSE)
        ON CONFLICT (table_name) DO UPDATE SET last_checked = NOW();

        -- Check if the table itself still exists
        EXECUTE format('
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = %L
            AND table_name = %L
          )', schema_name, table_name) INTO col_exists;
        
        -- Skip if table doesn't exist
        IF NOT col_exists THEN
          RETURN FALSE;
        END IF;

        -- Check if path column exists using safer dynamic SQL
        EXECUTE format('
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = %L
            AND table_name = %L
            AND column_name = %L
          )', schema_name, table_name, 'path') INTO path_exists;
        
        -- If path column doesn't exist, add it
        IF NOT path_exists THEN
          BEGIN
            EXECUTE format('ALTER TABLE %I.%I ADD COLUMN path TEXT', schema_name, table_name);
            
            -- Update tracking
            UPDATE payload.dynamic_uuid_tables 
            SET has_path_column = TRUE 
            WHERE table_name = $1;
            
            RETURN TRUE;
          EXCEPTION WHEN OTHERS THEN
            -- Log error but continue
            RAISE NOTICE 'Error adding path column to %: %', table_name, SQLERRM;
            RETURN FALSE;
          END;
        END IF;
        
        RETURN FALSE;
      END;
      $function$
;

CREATE OR REPLACE FUNCTION payload.get_downloads_for_collection(collection_id text, collection_type text)
 RETURNS TABLE(download_id text)
 LANGUAGE plpgsql
AS $function$
      BEGIN
        RETURN QUERY 
        SELECT dr.download_id 
        FROM payload.downloads_relationships dr
        WHERE dr.collection_id = collection_id
        AND dr.collection_type = collection_type;
      END;
      $function$
;

CREATE OR REPLACE FUNCTION payload.get_relationship_data(table_name text, id text, fallback_column text DEFAULT 'path'::text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  result TEXT;
  table_exists BOOLEAN;
  column_exists BOOLEAN;
  query TEXT;
BEGIN
  -- Check if the table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'payload'
    AND table_name = table_name
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RETURN NULL;
  END IF;
  
  -- Check if the fallback column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = table_name
    AND column_name = fallback_column
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    -- Try to add the column if it doesn't exist
    BEGIN
      IF fallback_column = 'path' THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN path TEXT', table_name);
        column_exists := TRUE;
      ELSIF fallback_column = 'parent_id' THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN parent_id TEXT', table_name);
        column_exists := TRUE;
      ELSIF fallback_column = 'downloads_id' THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN downloads_id UUID', table_name);
        column_exists := TRUE;
      ELSIF fallback_column = 'private_id' THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN private_id UUID', table_name);
        column_exists := TRUE;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If we can't add the column, return null
      RETURN NULL;
    END;
  END IF;
  
  IF column_exists THEN
    -- Try to get the data from the table
    BEGIN
      query := format('SELECT %I FROM payload.%I WHERE id = $1 LIMIT 1', 
                      fallback_column, table_name);
      EXECUTE query INTO result USING id;
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  ELSE
    RETURN NULL;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION payload.safe_uuid_conversion(text_value text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
    BEGIN
      BEGIN
        RETURN text_value::uuid;
      EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
      END;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables()
 RETURNS TABLE(table_name text, columns_added text[])
 LANGUAGE plpgsql
AS $function$
DECLARE
  uuid_table TEXT;
  added_columns TEXT[] := '{}';
  has_path BOOLEAN;
  has_parent_id BOOLEAN;
  has_downloads_id BOOLEAN;
  has_private_id BOOLEAN;
BEGIN
  -- Loop through all tables in the payload schema that match UUID pattern
  -- Fixed: Added proper table aliases to avoid the "missing FROM-clause entry for table 't'" error
  FOR uuid_table IN 
    SELECT tables.table_name
    FROM information_schema.tables AS tables
    WHERE tables.table_schema = 'payload'
    AND (
      tables.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
      OR tables.table_name ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
    )
    ORDER BY tables.table_name
  LOOP
    -- Reset added columns for this table
    added_columns := '{}';
    
    -- Check if path column exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = uuid_table
      AND column_name = 'path'
    ) INTO has_path;
    
    -- Add path column if it doesn't exist
    IF NOT has_path THEN
      EXECUTE format('ALTER TABLE payload.%I ADD COLUMN path TEXT', uuid_table);
      added_columns := array_append(added_columns, 'path');
    END IF;
    
    -- Check if parent_id column exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = uuid_table
      AND column_name = 'parent_id'
    ) INTO has_parent_id;
    
    -- Add parent_id column if it doesn't exist
    IF NOT has_parent_id THEN
      EXECUTE format('ALTER TABLE payload.%I ADD COLUMN parent_id TEXT', uuid_table);
      added_columns := array_append(added_columns, 'parent_id');
    END IF;
    
    -- Check if downloads_id column exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = uuid_table
      AND column_name = 'downloads_id'
    ) INTO has_downloads_id;
    
    -- Add downloads_id column if it doesn't exist
    IF NOT has_downloads_id THEN
      EXECUTE format('ALTER TABLE payload.%I ADD COLUMN downloads_id UUID', uuid_table);
      added_columns := array_append(added_columns, 'downloads_id');
    END IF;
    
    -- Check if private_id column exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = uuid_table
      AND column_name = 'private_id'
    ) INTO has_private_id;
    
    -- Add private_id column if it doesn't exist
    IF NOT has_private_id THEN
      EXECUTE format('ALTER TABLE payload.%I ADD COLUMN private_id UUID', uuid_table);
      added_columns := array_append(added_columns, 'private_id');
    END IF;
    
    -- Update the tracking table
    INSERT INTO payload.dynamic_uuid_tables (table_name, last_checked, has_downloads_id)
    VALUES (uuid_table, NOW(), TRUE)
    ON CONFLICT (table_name) 
    DO UPDATE SET 
      last_checked = NOW(),
      has_downloads_id = TRUE;
    
    -- Only return tables that had columns added
    IF array_length(added_columns, 1) > 0 THEN
      table_name := uuid_table;
      columns_added := added_columns;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$function$
;


CREATE TRIGGER accounts_teardown AFTER DELETE ON public.accounts FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('http://host.docker.internal:3000/api/db/webhook', 'POST', '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}', '{}', '5000');

CREATE TRIGGER invitations_insert AFTER INSERT ON public.invitations FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('http://host.docker.internal:3000/api/db/webhook', 'POST', '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}', '{}', '5000');

CREATE TRIGGER subscriptions_delete AFTER DELETE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('http://host.docker.internal:3000/api/db/webhook', 'POST', '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}', '{}', '5000');


