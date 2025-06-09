import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'user');
  CREATE TYPE "payload"."enum_media_type" AS ENUM('image', 'video', 'document');
  CREATE TYPE "payload"."enum_downloads_category" AS ENUM('document', 'template', 'resource', 'software', 'media', 'archive', 'other');
  CREATE TYPE "payload"."enum_downloads_access_level" AS ENUM('public', 'registered', 'premium');
  CREATE TYPE "payload"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_documentation_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__documentation_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_private_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__private_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__courses_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_course_lessons_video_source_type" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "payload"."enum_course_lessons_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__course_lessons_v_version_video_source_type" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "payload"."enum__course_lessons_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_course_quizzes_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__course_quizzes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_quiz_questions_type" AS ENUM('multiple_choice');
  CREATE TYPE "payload"."enum_survey_questions_type" AS ENUM('multiple_choice', 'text_field', 'scale');
  CREATE TYPE "payload"."enum_survey_questions_questionspin" AS ENUM('Positive', 'Negative');
  CREATE TYPE "payload"."enum_survey_questions_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__survey_questions_v_version_type" AS ENUM('multiple_choice', 'text_field', 'scale');
  CREATE TYPE "payload"."enum__survey_questions_v_version_questionspin" AS ENUM('Positive', 'Negative');
  CREATE TYPE "payload"."enum__survey_questions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_surveys_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__surveys_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE IF NOT EXISTS "payload"."users" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"role" "payload"."enum_users_role" DEFAULT 'user' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."media_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."media" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"type" "payload"."enum_media_type",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."downloads_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."downloads" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"category" "payload"."enum_downloads_category",
  	"download_count" numeric DEFAULT 0,
  	"featured" boolean DEFAULT false,
  	"access_level" "payload"."enum_downloads_access_level" DEFAULT 'public',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."posts_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."posts_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."posts" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"content" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"image_id_id" uuid,
  	"status" "payload"."enum_posts_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_posts_v_version_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"category" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_posts_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_posts_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_image_id_id" uuid,
  	"version_status" "payload"."enum__posts_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."documentation_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."documentation_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."documentation_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"doc_id" uuid,
  	"url" varchar,
  	"label" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."documentation" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"content" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"status" "payload"."enum_documentation_status" DEFAULT 'draft',
  	"order" numeric DEFAULT 0,
  	"parent_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_documentation_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."documentation_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_documentation_v_version_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"category" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_documentation_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_documentation_v_version_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"doc_id" uuid,
  	"url" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_documentation_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_status" "payload"."enum__documentation_v_version_status" DEFAULT 'draft',
  	"version_order" numeric DEFAULT 0,
  	"version_parent_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__documentation_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_documentation_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."private_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."private_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."private" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"content" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"image_id_id" uuid,
  	"featured_image_id_id" uuid,
  	"status" "payload"."enum_private_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_private_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."private_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_private_v_version_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"category" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_private_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_private_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_image_id_id" uuid,
  	"version_featured_image_id_id" uuid,
  	"version_status" "payload"."enum__private_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__private_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_private_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."courses" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"content" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"status" "payload"."enum_courses_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_courses_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_courses_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_status" "payload"."enum__courses_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__courses_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_courses_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."course_lessons" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"bunny_video_id" varchar,
  	"bunny_library_id" varchar DEFAULT '264486',
  	"video_source_type" "payload"."enum_course_lessons_video_source_type" DEFAULT 'youtube',
  	"youtube_video_id" varchar,
  	"todo_complete_quiz" boolean DEFAULT false,
  	"slug" varchar,
  	"description" varchar,
  	"content" jsonb,
  	"lesson_number" numeric,
  	"estimated_duration" numeric,
  	"course_id_id" uuid,
  	"quiz_id_id" uuid,
  	"survey_id_id" uuid,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_course_lessons_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."course_lessons_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_course_lessons_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_bunny_video_id" varchar,
  	"version_bunny_library_id" varchar DEFAULT '264486',
  	"version_video_source_type" "payload"."enum__course_lessons_v_version_video_source_type" DEFAULT 'youtube',
  	"version_youtube_video_id" varchar,
  	"version_todo_complete_quiz" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" jsonb,
  	"version_lesson_number" numeric,
  	"version_estimated_duration" numeric,
  	"version_course_id_id" uuid,
  	"version_quiz_id_id" uuid,
  	"version_survey_id_id" uuid,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__course_lessons_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_course_lessons_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."course_quizzes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"course_id_id" uuid,
  	"pass_threshold" numeric DEFAULT 70,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_course_quizzes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."course_quizzes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"quiz_questions_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_course_quizzes_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_course_id_id" uuid,
  	"version_pass_threshold" numeric DEFAULT 70,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__course_quizzes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_course_quizzes_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"quiz_questions_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."quiz_questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"is_correct" boolean DEFAULT false
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."quiz_questions" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"question" varchar NOT NULL,
  	"type" "payload"."enum_quiz_questions_type" DEFAULT 'multiple_choice' NOT NULL,
  	"question_slug" varchar NOT NULL,
  	"explanation" jsonb,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."survey_questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."survey_questions" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"question_slug" varchar,
  	"text" varchar,
  	"type" "payload"."enum_survey_questions_type" DEFAULT 'multiple_choice',
  	"description" varchar,
  	"required" boolean DEFAULT true,
  	"category" varchar,
  	"questionspin" "payload"."enum_survey_questions_questionspin" DEFAULT 'Positive',
  	"position" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_survey_questions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_survey_questions_v_version_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"option" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_survey_questions_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_question_slug" varchar,
  	"version_text" varchar,
  	"version_type" "payload"."enum__survey_questions_v_version_type" DEFAULT 'multiple_choice',
  	"version_description" varchar,
  	"version_required" boolean DEFAULT true,
  	"version_category" varchar,
  	"version_questionspin" "payload"."enum__survey_questions_v_version_questionspin" DEFAULT 'Positive',
  	"version_position" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__survey_questions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."surveys" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"status" "payload"."enum_surveys_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_surveys_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."surveys_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_surveys_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_status" "payload"."enum__surveys_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__surveys_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."_surveys_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid,
  	"media_id" uuid,
  	"downloads_id" uuid,
  	"posts_id" uuid,
  	"documentation_id" uuid,
  	"private_id" uuid,
  	"courses_id" uuid,
  	"course_lessons_id" uuid,
  	"course_quizzes_id" uuid,
  	"quiz_questions_id" uuid,
  	"survey_questions_id" uuid,
  	"surveys_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload"."payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DO $$ BEGIN
   ALTER TABLE "payload"."media_tags" ADD CONSTRAINT "media_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."downloads_tags" ADD CONSTRAINT "downloads_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."posts_categories" ADD CONSTRAINT "posts_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."posts_tags" ADD CONSTRAINT "posts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."posts" ADD CONSTRAINT "posts_image_id_id_media_id_fk" FOREIGN KEY ("image_id_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."posts_rels" ADD CONSTRAINT "posts_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v_version_categories" ADD CONSTRAINT "_posts_v_version_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v_version_tags" ADD CONSTRAINT "_posts_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."posts"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v" ADD CONSTRAINT "_posts_v_version_image_id_id_media_id_fk" FOREIGN KEY ("version_image_id_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_categories" ADD CONSTRAINT "documentation_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_tags" ADD CONSTRAINT "documentation_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_breadcrumbs" ADD CONSTRAINT "documentation_breadcrumbs_doc_id_documentation_id_fk" FOREIGN KEY ("doc_id") REFERENCES "payload"."documentation"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_breadcrumbs" ADD CONSTRAINT "documentation_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation" ADD CONSTRAINT "documentation_parent_id_documentation_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."documentation"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_rels" ADD CONSTRAINT "documentation_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."documentation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."documentation_rels" ADD CONSTRAINT "documentation_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_version_categories" ADD CONSTRAINT "_documentation_v_version_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_documentation_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_version_tags" ADD CONSTRAINT "_documentation_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_documentation_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_version_breadcrumbs" ADD CONSTRAINT "_documentation_v_version_breadcrumbs_doc_id_documentation_id_fk" FOREIGN KEY ("doc_id") REFERENCES "payload"."documentation"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_version_breadcrumbs" ADD CONSTRAINT "_documentation_v_version_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_documentation_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v" ADD CONSTRAINT "_documentation_v_parent_id_documentation_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."documentation"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v" ADD CONSTRAINT "_documentation_v_version_parent_id_documentation_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_rels" ADD CONSTRAINT "_documentation_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_documentation_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_documentation_v_rels" ADD CONSTRAINT "_documentation_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private_categories" ADD CONSTRAINT "private_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."private"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private_tags" ADD CONSTRAINT "private_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."private"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private" ADD CONSTRAINT "private_image_id_id_downloads_id_fk" FOREIGN KEY ("image_id_id") REFERENCES "payload"."downloads"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private" ADD CONSTRAINT "private_featured_image_id_id_downloads_id_fk" FOREIGN KEY ("featured_image_id_id") REFERENCES "payload"."downloads"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private_rels" ADD CONSTRAINT "private_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."private"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."private_rels" ADD CONSTRAINT "private_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v_version_categories" ADD CONSTRAINT "_private_v_version_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_private_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v_version_tags" ADD CONSTRAINT "_private_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_private_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v" ADD CONSTRAINT "_private_v_parent_id_private_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."private"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v" ADD CONSTRAINT "_private_v_version_image_id_id_downloads_id_fk" FOREIGN KEY ("version_image_id_id") REFERENCES "payload"."downloads"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v" ADD CONSTRAINT "_private_v_version_featured_image_id_id_downloads_id_fk" FOREIGN KEY ("version_featured_image_id_id") REFERENCES "payload"."downloads"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v_rels" ADD CONSTRAINT "_private_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_private_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_private_v_rels" ADD CONSTRAINT "_private_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."courses"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."courses_rels" ADD CONSTRAINT "courses_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_courses_v" ADD CONSTRAINT "_courses_v_parent_id_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_lessons" ADD CONSTRAINT "course_lessons_course_id_id_courses_id_fk" FOREIGN KEY ("course_id_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_lessons" ADD CONSTRAINT "course_lessons_quiz_id_id_course_quizzes_id_fk" FOREIGN KEY ("quiz_id_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_lessons" ADD CONSTRAINT "course_lessons_survey_id_id_surveys_id_fk" FOREIGN KEY ("survey_id_id") REFERENCES "payload"."surveys"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_lessons_rels" ADD CONSTRAINT "course_lessons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_lessons_rels" ADD CONSTRAINT "course_lessons_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v" ADD CONSTRAINT "_course_lessons_v_parent_id_course_lessons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."course_lessons"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v" ADD CONSTRAINT "_course_lessons_v_version_course_id_id_courses_id_fk" FOREIGN KEY ("version_course_id_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v" ADD CONSTRAINT "_course_lessons_v_version_quiz_id_id_course_quizzes_id_fk" FOREIGN KEY ("version_quiz_id_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v" ADD CONSTRAINT "_course_lessons_v_version_survey_id_id_surveys_id_fk" FOREIGN KEY ("version_survey_id_id") REFERENCES "payload"."surveys"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v_rels" ADD CONSTRAINT "_course_lessons_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_course_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_lessons_v_rels" ADD CONSTRAINT "_course_lessons_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_quizzes" ADD CONSTRAINT "course_quizzes_course_id_id_courses_id_fk" FOREIGN KEY ("course_id_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_quizzes_rels" ADD CONSTRAINT "course_quizzes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."course_quizzes_rels" ADD CONSTRAINT "course_quizzes_rels_quiz_questions_fk" FOREIGN KEY ("quiz_questions_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_quizzes_v" ADD CONSTRAINT "_course_quizzes_v_parent_id_course_quizzes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_quizzes_v" ADD CONSTRAINT "_course_quizzes_v_version_course_id_id_courses_id_fk" FOREIGN KEY ("version_course_id_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_quizzes_v_rels" ADD CONSTRAINT "_course_quizzes_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_course_quizzes_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_course_quizzes_v_rels" ADD CONSTRAINT "_course_quizzes_v_rels_quiz_questions_fk" FOREIGN KEY ("quiz_questions_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."quiz_questions_options" ADD CONSTRAINT "quiz_questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."survey_questions_options" ADD CONSTRAINT "survey_questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_survey_questions_v_version_options" ADD CONSTRAINT "_survey_questions_v_version_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_survey_questions_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_survey_questions_v" ADD CONSTRAINT "_survey_questions_v_parent_id_survey_questions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."survey_questions"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."surveys_rels" ADD CONSTRAINT "surveys_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."surveys"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."surveys_rels" ADD CONSTRAINT "surveys_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_surveys_v" ADD CONSTRAINT "_surveys_v_parent_id_surveys_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."surveys"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_surveys_v_rels" ADD CONSTRAINT "_surveys_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_surveys_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."_surveys_v_rels" ADD CONSTRAINT "_surveys_v_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "payload"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documentation_fk" FOREIGN KEY ("documentation_id") REFERENCES "payload"."documentation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_private_fk" FOREIGN KEY ("private_id") REFERENCES "payload"."private"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "payload"."courses"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_lessons_fk" FOREIGN KEY ("course_lessons_id") REFERENCES "payload"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_quizzes_fk" FOREIGN KEY ("course_quizzes_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quiz_questions_fk" FOREIGN KEY ("quiz_questions_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_survey_questions_fk" FOREIGN KEY ("survey_questions_id") REFERENCES "payload"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_surveys_fk" FOREIGN KEY ("surveys_id") REFERENCES "payload"."surveys"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "media_tags_order_idx" ON "payload"."media_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "media_tags_parent_id_idx" ON "payload"."media_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "downloads_tags_order_idx" ON "payload"."downloads_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "downloads_tags_parent_id_idx" ON "payload"."downloads_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "downloads_updated_at_idx" ON "payload"."downloads" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "downloads_created_at_idx" ON "payload"."downloads" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "downloads_filename_idx" ON "payload"."downloads" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "posts_categories_order_idx" ON "payload"."posts_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "posts_categories_parent_id_idx" ON "payload"."posts_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "posts_tags_order_idx" ON "payload"."posts_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "posts_tags_parent_id_idx" ON "payload"."posts_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "posts_image_id_idx" ON "payload"."posts" USING btree ("image_id_id");
  CREATE INDEX IF NOT EXISTS "posts_updated_at_idx" ON "payload"."posts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "payload"."posts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "posts__status_idx" ON "payload"."posts" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "posts_rels_order_idx" ON "payload"."posts_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "posts_rels_parent_idx" ON "payload"."posts_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_path_idx" ON "payload"."posts_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "posts_rels_downloads_id_idx" ON "payload"."posts_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_categories_order_idx" ON "payload"."_posts_v_version_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_categories_parent_id_idx" ON "payload"."_posts_v_version_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_tags_order_idx" ON "payload"."_posts_v_version_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_tags_parent_id_idx" ON "payload"."_posts_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_parent_idx" ON "payload"."_posts_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_image_id_idx" ON "payload"."_posts_v" USING btree ("version_image_id_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_updated_at_idx" ON "payload"."_posts_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_created_at_idx" ON "payload"."_posts_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version__status_idx" ON "payload"."_posts_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_posts_v_created_at_idx" ON "payload"."_posts_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_updated_at_idx" ON "payload"."_posts_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_latest_idx" ON "payload"."_posts_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_order_idx" ON "payload"."_posts_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_parent_idx" ON "payload"."_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_path_idx" ON "payload"."_posts_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_downloads_id_idx" ON "payload"."_posts_v_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "documentation_categories_order_idx" ON "payload"."documentation_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "documentation_categories_parent_id_idx" ON "payload"."documentation_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "documentation_tags_order_idx" ON "payload"."documentation_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "documentation_tags_parent_id_idx" ON "payload"."documentation_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_order_idx" ON "payload"."documentation_breadcrumbs" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_parent_id_idx" ON "payload"."documentation_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_doc_idx" ON "payload"."documentation_breadcrumbs" USING btree ("doc_id");
  CREATE INDEX IF NOT EXISTS "documentation_parent_idx" ON "payload"."documentation" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "documentation_updated_at_idx" ON "payload"."documentation" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "documentation_created_at_idx" ON "payload"."documentation" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "documentation__status_idx" ON "payload"."documentation" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "documentation_rels_order_idx" ON "payload"."documentation_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "documentation_rels_parent_idx" ON "payload"."documentation_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "documentation_rels_path_idx" ON "payload"."documentation_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "documentation_rels_downloads_id_idx" ON "payload"."documentation_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_categories_order_idx" ON "payload"."_documentation_v_version_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_categories_parent_id_idx" ON "payload"."_documentation_v_version_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_tags_order_idx" ON "payload"."_documentation_v_version_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_tags_parent_id_idx" ON "payload"."_documentation_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_breadcrumbs_order_idx" ON "payload"."_documentation_v_version_breadcrumbs" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_breadcrumbs_parent_id_idx" ON "payload"."_documentation_v_version_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_breadcrumbs_doc_idx" ON "payload"."_documentation_v_version_breadcrumbs" USING btree ("doc_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_parent_idx" ON "payload"."_documentation_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_version_parent_idx" ON "payload"."_documentation_v" USING btree ("version_parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_version_updated_at_idx" ON "payload"."_documentation_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_version_created_at_idx" ON "payload"."_documentation_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_documentation_v_version_version__status_idx" ON "payload"."_documentation_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_documentation_v_created_at_idx" ON "payload"."_documentation_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_documentation_v_updated_at_idx" ON "payload"."_documentation_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_documentation_v_latest_idx" ON "payload"."_documentation_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_documentation_v_rels_order_idx" ON "payload"."_documentation_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_documentation_v_rels_parent_idx" ON "payload"."_documentation_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_documentation_v_rels_path_idx" ON "payload"."_documentation_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_documentation_v_rels_downloads_id_idx" ON "payload"."_documentation_v_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "private_categories_order_idx" ON "payload"."private_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "private_categories_parent_id_idx" ON "payload"."private_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "private_tags_order_idx" ON "payload"."private_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "private_tags_parent_id_idx" ON "payload"."private_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "private_image_id_idx" ON "payload"."private" USING btree ("image_id_id");
  CREATE INDEX IF NOT EXISTS "private_featured_image_id_idx" ON "payload"."private" USING btree ("featured_image_id_id");
  CREATE INDEX IF NOT EXISTS "private_updated_at_idx" ON "payload"."private" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "private_created_at_idx" ON "payload"."private" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "private__status_idx" ON "payload"."private" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "private_rels_order_idx" ON "payload"."private_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "private_rels_parent_idx" ON "payload"."private_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "private_rels_path_idx" ON "payload"."private_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "private_rels_downloads_id_idx" ON "payload"."private_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_private_v_version_categories_order_idx" ON "payload"."_private_v_version_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_private_v_version_categories_parent_id_idx" ON "payload"."_private_v_version_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_private_v_version_tags_order_idx" ON "payload"."_private_v_version_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_private_v_version_tags_parent_id_idx" ON "payload"."_private_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_private_v_parent_idx" ON "payload"."_private_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_private_v_version_version_image_id_idx" ON "payload"."_private_v" USING btree ("version_image_id_id");
  CREATE INDEX IF NOT EXISTS "_private_v_version_version_featured_image_id_idx" ON "payload"."_private_v" USING btree ("version_featured_image_id_id");
  CREATE INDEX IF NOT EXISTS "_private_v_version_version_updated_at_idx" ON "payload"."_private_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_private_v_version_version_created_at_idx" ON "payload"."_private_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_private_v_version_version__status_idx" ON "payload"."_private_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_private_v_created_at_idx" ON "payload"."_private_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_private_v_updated_at_idx" ON "payload"."_private_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_private_v_latest_idx" ON "payload"."_private_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_private_v_rels_order_idx" ON "payload"."_private_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_private_v_rels_parent_idx" ON "payload"."_private_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_private_v_rels_path_idx" ON "payload"."_private_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_private_v_rels_downloads_id_idx" ON "payload"."_private_v_rels" USING btree ("downloads_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "courses_slug_idx" ON "payload"."courses" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "courses_updated_at_idx" ON "payload"."courses" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "courses_created_at_idx" ON "payload"."courses" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "courses__status_idx" ON "payload"."courses" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "courses_rels_order_idx" ON "payload"."courses_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "courses_rels_parent_idx" ON "payload"."courses_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "courses_rels_path_idx" ON "payload"."courses_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "courses_rels_downloads_id_idx" ON "payload"."courses_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_courses_v_parent_idx" ON "payload"."_courses_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_courses_v_version_version_slug_idx" ON "payload"."_courses_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_courses_v_version_version_updated_at_idx" ON "payload"."_courses_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_courses_v_version_version_created_at_idx" ON "payload"."_courses_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_courses_v_version_version__status_idx" ON "payload"."_courses_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_courses_v_created_at_idx" ON "payload"."_courses_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_courses_v_updated_at_idx" ON "payload"."_courses_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_courses_v_latest_idx" ON "payload"."_courses_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_courses_v_rels_order_idx" ON "payload"."_courses_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_courses_v_rels_parent_idx" ON "payload"."_courses_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_courses_v_rels_path_idx" ON "payload"."_courses_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_courses_v_rels_downloads_id_idx" ON "payload"."_courses_v_rels" USING btree ("downloads_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "course_lessons_slug_idx" ON "payload"."course_lessons" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "course_lessons_course_id_idx" ON "payload"."course_lessons" USING btree ("course_id_id");
  CREATE INDEX IF NOT EXISTS "course_lessons_quiz_id_idx" ON "payload"."course_lessons" USING btree ("quiz_id_id");
  CREATE INDEX IF NOT EXISTS "course_lessons_survey_id_idx" ON "payload"."course_lessons" USING btree ("survey_id_id");
  CREATE INDEX IF NOT EXISTS "course_lessons_updated_at_idx" ON "payload"."course_lessons" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "course_lessons_created_at_idx" ON "payload"."course_lessons" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "course_lessons__status_idx" ON "payload"."course_lessons" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "course_lessons_rels_order_idx" ON "payload"."course_lessons_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "course_lessons_rels_parent_idx" ON "payload"."course_lessons_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "course_lessons_rels_path_idx" ON "payload"."course_lessons_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "course_lessons_rels_downloads_id_idx" ON "payload"."course_lessons_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_parent_idx" ON "payload"."_course_lessons_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_slug_idx" ON "payload"."_course_lessons_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_course_id_idx" ON "payload"."_course_lessons_v" USING btree ("version_course_id_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_quiz_id_idx" ON "payload"."_course_lessons_v" USING btree ("version_quiz_id_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_survey_id_idx" ON "payload"."_course_lessons_v" USING btree ("version_survey_id_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_updated_at_idx" ON "payload"."_course_lessons_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version_created_at_idx" ON "payload"."_course_lessons_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_version_version__status_idx" ON "payload"."_course_lessons_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_created_at_idx" ON "payload"."_course_lessons_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_updated_at_idx" ON "payload"."_course_lessons_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_latest_idx" ON "payload"."_course_lessons_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_rels_order_idx" ON "payload"."_course_lessons_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_rels_parent_idx" ON "payload"."_course_lessons_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_rels_path_idx" ON "payload"."_course_lessons_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_course_lessons_v_rels_downloads_id_idx" ON "payload"."_course_lessons_v_rels" USING btree ("downloads_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "course_quizzes_slug_idx" ON "payload"."course_quizzes" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "course_quizzes_course_id_idx" ON "payload"."course_quizzes" USING btree ("course_id_id");
  CREATE INDEX IF NOT EXISTS "course_quizzes_updated_at_idx" ON "payload"."course_quizzes" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "course_quizzes_created_at_idx" ON "payload"."course_quizzes" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "course_quizzes__status_idx" ON "payload"."course_quizzes" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "course_quizzes_rels_order_idx" ON "payload"."course_quizzes_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "course_quizzes_rels_parent_idx" ON "payload"."course_quizzes_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "course_quizzes_rels_path_idx" ON "payload"."course_quizzes_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "course_quizzes_rels_quiz_questions_id_idx" ON "payload"."course_quizzes_rels" USING btree ("quiz_questions_id");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_parent_idx" ON "payload"."_course_quizzes_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_version_version_slug_idx" ON "payload"."_course_quizzes_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_version_version_course_id_idx" ON "payload"."_course_quizzes_v" USING btree ("version_course_id_id");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_version_version_updated_at_idx" ON "payload"."_course_quizzes_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_version_version_created_at_idx" ON "payload"."_course_quizzes_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_version_version__status_idx" ON "payload"."_course_quizzes_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_created_at_idx" ON "payload"."_course_quizzes_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_updated_at_idx" ON "payload"."_course_quizzes_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_latest_idx" ON "payload"."_course_quizzes_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_rels_order_idx" ON "payload"."_course_quizzes_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_rels_parent_idx" ON "payload"."_course_quizzes_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_rels_path_idx" ON "payload"."_course_quizzes_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_course_quizzes_v_rels_quiz_questions_id_idx" ON "payload"."_course_quizzes_v_rels" USING btree ("quiz_questions_id");
  CREATE INDEX IF NOT EXISTS "quiz_questions_options_order_idx" ON "payload"."quiz_questions_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "quiz_questions_options_parent_id_idx" ON "payload"."quiz_questions_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "quiz_questions_question_slug_idx" ON "payload"."quiz_questions" USING btree ("question_slug");
  CREATE INDEX IF NOT EXISTS "quiz_questions_updated_at_idx" ON "payload"."quiz_questions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "quiz_questions_created_at_idx" ON "payload"."quiz_questions" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "survey_questions_options_order_idx" ON "payload"."survey_questions_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "survey_questions_options_parent_id_idx" ON "payload"."survey_questions_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "survey_questions_question_slug_idx" ON "payload"."survey_questions" USING btree ("question_slug");
  CREATE INDEX IF NOT EXISTS "survey_questions_updated_at_idx" ON "payload"."survey_questions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "survey_questions_created_at_idx" ON "payload"."survey_questions" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "survey_questions__status_idx" ON "payload"."survey_questions" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_options_order_idx" ON "payload"."_survey_questions_v_version_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_options_parent_id_idx" ON "payload"."_survey_questions_v_version_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_parent_idx" ON "payload"."_survey_questions_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_version_question_slug_idx" ON "payload"."_survey_questions_v" USING btree ("version_question_slug");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_version_updated_at_idx" ON "payload"."_survey_questions_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_version_created_at_idx" ON "payload"."_survey_questions_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_version_version__status_idx" ON "payload"."_survey_questions_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_created_at_idx" ON "payload"."_survey_questions_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_updated_at_idx" ON "payload"."_survey_questions_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_survey_questions_v_latest_idx" ON "payload"."_survey_questions_v" USING btree ("latest");
  CREATE UNIQUE INDEX IF NOT EXISTS "surveys_slug_idx" ON "payload"."surveys" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "surveys_updated_at_idx" ON "payload"."surveys" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "surveys_created_at_idx" ON "payload"."surveys" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "surveys__status_idx" ON "payload"."surveys" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "surveys_rels_order_idx" ON "payload"."surveys_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "surveys_rels_parent_idx" ON "payload"."surveys_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "surveys_rels_path_idx" ON "payload"."surveys_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "surveys_rels_downloads_id_idx" ON "payload"."surveys_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "_surveys_v_parent_idx" ON "payload"."_surveys_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_surveys_v_version_version_slug_idx" ON "payload"."_surveys_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_surveys_v_version_version_updated_at_idx" ON "payload"."_surveys_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_surveys_v_version_version_created_at_idx" ON "payload"."_surveys_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_surveys_v_version_version__status_idx" ON "payload"."_surveys_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_surveys_v_created_at_idx" ON "payload"."_surveys_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_surveys_v_updated_at_idx" ON "payload"."_surveys_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_surveys_v_latest_idx" ON "payload"."_surveys_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_surveys_v_rels_order_idx" ON "payload"."_surveys_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_surveys_v_rels_parent_idx" ON "payload"."_surveys_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_surveys_v_rels_path_idx" ON "payload"."_surveys_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_surveys_v_rels_downloads_id_idx" ON "payload"."_surveys_v_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_downloads_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("downloads_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_posts_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_documentation_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("documentation_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_private_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("private_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_courses_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_course_lessons_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("course_lessons_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_course_quizzes_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("course_quizzes_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_quiz_questions_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("quiz_questions_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_survey_questions_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("survey_questions_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_surveys_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("surveys_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");`);
}

export async function down({
	db,
	payload,
	req,
}: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."media_tags" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."downloads_tags" CASCADE;
  DROP TABLE "payload"."downloads" CASCADE;
  DROP TABLE "payload"."posts_categories" CASCADE;
  DROP TABLE "payload"."posts_tags" CASCADE;
  DROP TABLE "payload"."posts" CASCADE;
  DROP TABLE "payload"."posts_rels" CASCADE;
  DROP TABLE "payload"."_posts_v_version_categories" CASCADE;
  DROP TABLE "payload"."_posts_v_version_tags" CASCADE;
  DROP TABLE "payload"."_posts_v" CASCADE;
  DROP TABLE "payload"."_posts_v_rels" CASCADE;
  DROP TABLE "payload"."documentation_categories" CASCADE;
  DROP TABLE "payload"."documentation_tags" CASCADE;
  DROP TABLE "payload"."documentation_breadcrumbs" CASCADE;
  DROP TABLE "payload"."documentation" CASCADE;
  DROP TABLE "payload"."documentation_rels" CASCADE;
  DROP TABLE "payload"."_documentation_v_version_categories" CASCADE;
  DROP TABLE "payload"."_documentation_v_version_tags" CASCADE;
  DROP TABLE "payload"."_documentation_v_version_breadcrumbs" CASCADE;
  DROP TABLE "payload"."_documentation_v" CASCADE;
  DROP TABLE "payload"."_documentation_v_rels" CASCADE;
  DROP TABLE "payload"."private_categories" CASCADE;
  DROP TABLE "payload"."private_tags" CASCADE;
  DROP TABLE "payload"."private" CASCADE;
  DROP TABLE "payload"."private_rels" CASCADE;
  DROP TABLE "payload"."_private_v_version_categories" CASCADE;
  DROP TABLE "payload"."_private_v_version_tags" CASCADE;
  DROP TABLE "payload"."_private_v" CASCADE;
  DROP TABLE "payload"."_private_v_rels" CASCADE;
  DROP TABLE "payload"."courses" CASCADE;
  DROP TABLE "payload"."courses_rels" CASCADE;
  DROP TABLE "payload"."_courses_v" CASCADE;
  DROP TABLE "payload"."_courses_v_rels" CASCADE;
  DROP TABLE "payload"."course_lessons" CASCADE;
  DROP TABLE "payload"."course_lessons_rels" CASCADE;
  DROP TABLE "payload"."_course_lessons_v" CASCADE;
  DROP TABLE "payload"."_course_lessons_v_rels" CASCADE;
  DROP TABLE "payload"."course_quizzes" CASCADE;
  DROP TABLE "payload"."course_quizzes_rels" CASCADE;
  DROP TABLE "payload"."_course_quizzes_v" CASCADE;
  DROP TABLE "payload"."_course_quizzes_v_rels" CASCADE;
  DROP TABLE "payload"."quiz_questions_options" CASCADE;
  DROP TABLE "payload"."quiz_questions" CASCADE;
  DROP TABLE "payload"."survey_questions_options" CASCADE;
  DROP TABLE "payload"."survey_questions" CASCADE;
  DROP TABLE "payload"."_survey_questions_v_version_options" CASCADE;
  DROP TABLE "payload"."_survey_questions_v" CASCADE;
  DROP TABLE "payload"."surveys" CASCADE;
  DROP TABLE "payload"."surveys_rels" CASCADE;
  DROP TABLE "payload"."_surveys_v" CASCADE;
  DROP TABLE "payload"."_surveys_v_rels" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TYPE "payload"."enum_users_role";
  DROP TYPE "payload"."enum_media_type";
  DROP TYPE "payload"."enum_downloads_category";
  DROP TYPE "payload"."enum_downloads_access_level";
  DROP TYPE "payload"."enum_posts_status";
  DROP TYPE "payload"."enum__posts_v_version_status";
  DROP TYPE "payload"."enum_documentation_status";
  DROP TYPE "payload"."enum__documentation_v_version_status";
  DROP TYPE "payload"."enum_private_status";
  DROP TYPE "payload"."enum__private_v_version_status";
  DROP TYPE "payload"."enum_courses_status";
  DROP TYPE "payload"."enum__courses_v_version_status";
  DROP TYPE "payload"."enum_course_lessons_video_source_type";
  DROP TYPE "payload"."enum_course_lessons_status";
  DROP TYPE "payload"."enum__course_lessons_v_version_video_source_type";
  DROP TYPE "payload"."enum__course_lessons_v_version_status";
  DROP TYPE "payload"."enum_course_quizzes_status";
  DROP TYPE "payload"."enum__course_quizzes_v_version_status";
  DROP TYPE "payload"."enum_quiz_questions_type";
  DROP TYPE "payload"."enum_survey_questions_type";
  DROP TYPE "payload"."enum_survey_questions_questionspin";
  DROP TYPE "payload"."enum_survey_questions_status";
  DROP TYPE "payload"."enum__survey_questions_v_version_type";
  DROP TYPE "payload"."enum__survey_questions_v_version_questionspin";
  DROP TYPE "payload"."enum__survey_questions_v_version_status";
  DROP TYPE "payload"."enum_surveys_status";
  DROP TYPE "payload"."enum__surveys_v_version_status";`);
}
