-- Create the 'payload' schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS payload;

-- Create enum types
CREATE TYPE payload.enum_documentation_status AS ENUM ('draft', 'published');
CREATE TYPE payload.enum_posts_status AS ENUM ('draft', 'published');
CREATE TYPE payload.enum_surveys_status AS ENUM ('draft', 'published');
CREATE TYPE payload.enum_survey_questions_type AS ENUM ('multiple_choice');
CREATE TYPE payload.enum_survey_questions_questionspin AS ENUM ('Positive', 'Negative');
CREATE TYPE payload.enum_courses_status AS ENUM ('draft', 'published');
CREATE TYPE payload.enum_quiz_questions_type AS ENUM ('multiple_choice');

-- Create tables
CREATE TABLE payload.users (
  id SERIAL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  email VARCHAR NOT NULL,
  reset_password_token VARCHAR,
  reset_password_expiration TIMESTAMP WITH TIME ZONE,
  salt VARCHAR,
  hash VARCHAR,
  login_attempts NUMERIC DEFAULT '0',
  lock_until TIMESTAMP WITH TIME ZONE
);

CREATE TABLE payload.media (
  id SERIAL PRIMARY KEY,
  alt VARCHAR NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  url VARCHAR,
  thumbnail_u_r_l VARCHAR,
  filename VARCHAR,
  mime_type VARCHAR,
  filesize NUMERIC,
  width NUMERIC,
  height NUMERIC,
  focal_x NUMERIC,
  focal_y NUMERIC
);

CREATE TABLE payload.documentation (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  slug VARCHAR NOT NULL,
  description VARCHAR,
  content JSONB,
  published_at TIMESTAMP WITH TIME ZONE,
  status payload.enum_documentation_status DEFAULT 'draft' NOT NULL,
  "order" NUMERIC DEFAULT '0',
  parent_id INTEGER REFERENCES payload.documentation(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE payload.documentation_categories (
  _order INTEGER NOT NULL,
  _parent_id INTEGER NOT NULL,
  id VARCHAR PRIMARY KEY,
  category VARCHAR,
  CONSTRAINT documentation_categories_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.documentation(id) ON DELETE CASCADE
);

CREATE TABLE payload.documentation_tags (
  _order INTEGER NOT NULL,
  _parent_id INTEGER NOT NULL,
  id VARCHAR PRIMARY KEY,
  tag VARCHAR,
  CONSTRAINT documentation_tags_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.documentation(id) ON DELETE CASCADE
);

CREATE TABLE payload.documentation_breadcrumbs (
  _order INTEGER NOT NULL,
  _parent_id INTEGER NOT NULL,
  id VARCHAR PRIMARY KEY,
  doc_id INTEGER REFERENCES payload.documentation(id) ON DELETE SET NULL,
  url VARCHAR,
  label VARCHAR,
  CONSTRAINT documentation_breadcrumbs_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.documentation(id) ON DELETE CASCADE
);

CREATE TABLE payload.posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  slug VARCHAR NOT NULL,
  description VARCHAR,
  content JSONB NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  image_id INTEGER REFERENCES payload.media(id) ON DELETE SET NULL,
  status payload.enum_posts_status DEFAULT 'draft' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE payload.posts_categories (
  _order INTEGER NOT NULL,
  _parent_id INTEGER NOT NULL,
  id VARCHAR PRIMARY KEY,
  category VARCHAR,
  CONSTRAINT posts_categories_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.posts(id) ON DELETE CASCADE
);

CREATE TABLE payload.posts_tags (
  _order INTEGER NOT NULL,
  _parent_id INTEGER NOT NULL,
  id VARCHAR PRIMARY KEY,
  tag VARCHAR,
  CONSTRAINT posts_tags_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.posts(id) ON DELETE CASCADE
);

CREATE TABLE payload.surveys (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  slug VARCHAR NOT NULL,
  description VARCHAR,
  start_message JSONB,
  end_message JSONB,
  show_progress_bar BOOLEAN DEFAULT TRUE,
  summary_content JSONB,
  status payload.enum_surveys_status DEFAULT 'draft' NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE payload.survey_questions (
  id SERIAL PRIMARY KEY,
  text VARCHAR NOT NULL,
  type payload.enum_survey_questions_type DEFAULT 'multiple_choice' NOT NULL,
  description VARCHAR,
  required BOOLEAN DEFAULT TRUE,
  category VARCHAR NOT NULL,
  questionspin payload.enum_survey_questions_questionspin DEFAULT 'Positive' NOT NULL,
  position NUMERIC DEFAULT '0',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE payload.surveys_rels (
  id SERIAL PRIMARY KEY,
  "order" INTEGER,
  parent_id INTEGER NOT NULL,
  path VARCHAR NOT NULL,
  survey_questions_id INTEGER,
  CONSTRAINT surveys_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES payload.surveys(id) ON DELETE CASCADE,
  CONSTRAINT surveys_rels_survey_questions_fk FOREIGN KEY (survey_questions_id) REFERENCES payload.survey_questions(id) ON DELETE CASCADE
);

CREATE TABLE payload.survey_questions_options (
  _order INTEGER NOT NULL,
  _parent_id INTEGER NOT NULL,
  id VARCHAR PRIMARY KEY,
  option VARCHAR NOT NULL,
  CONSTRAINT survey_questions_options_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.survey_questions(id) ON DELETE CASCADE
);

CREATE TABLE payload.courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  slug VARCHAR NOT NULL,
  description VARCHAR,
  status payload.enum_courses_status DEFAULT 'draft' NOT NULL,
  featured_image_id INTEGER REFERENCES payload.media(id) ON DELETE SET NULL,
  intro_content JSONB,
  completion_content JSONB,
  estimated_duration NUMERIC,
  show_progress_bar BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE payload.course_quizzes (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description VARCHAR,
  passing_score NUMERIC DEFAULT '70' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE payload.course_lessons (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  slug VARCHAR NOT NULL,
  description VARCHAR,
  featured_image_id INTEGER REFERENCES payload.media(id) ON DELETE SET NULL,
  content JSONB,
  lesson_number NUMERIC NOT NULL,
  estimated_duration NUMERIC,
  course_id INTEGER NOT NULL REFERENCES payload.courses(id) ON DELETE SET NULL,
  quiz_id INTEGER REFERENCES payload.course_quizzes(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE payload.courses_rels (
  id SERIAL PRIMARY KEY,
  "order" INTEGER,
  parent_id INTEGER NOT NULL,
  path VARCHAR NOT NULL,
  course_lessons_id INTEGER,
  CONSTRAINT courses_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES payload.courses(id) ON DELETE CASCADE,
  CONSTRAINT courses_rels_course_lessons_fk FOREIGN KEY (course_lessons_id) REFERENCES payload.course_lessons(id) ON DELETE CASCADE
);

CREATE TABLE payload.quiz_questions (
  id SERIAL PRIMARY KEY,
  question VARCHAR NOT NULL,
  quiz_id INTEGER NOT NULL REFERENCES payload.course_quizzes(id) ON DELETE SET NULL,
  type payload.enum_quiz_questions_type DEFAULT 'multiple_choice' NOT NULL,
  explanation VARCHAR,
  "order" NUMERIC DEFAULT '0',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE payload.quiz_questions_options (
  _order INTEGER NOT NULL,
  _parent_id INTEGER NOT NULL,
  id VARCHAR PRIMARY KEY,
  text VARCHAR NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  CONSTRAINT quiz_questions_options_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.quiz_questions(id) ON DELETE CASCADE
);

CREATE TABLE payload.payload_locked_documents (
  id SERIAL PRIMARY KEY,
  global_slug VARCHAR,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE payload.payload_locked_documents_rels (
  id SERIAL PRIMARY KEY,
  "order" INTEGER,
  parent_id INTEGER NOT NULL,
  path VARCHAR NOT NULL,
  users_id INTEGER,
  media_id INTEGER,
  documentation_id INTEGER,
  posts_id INTEGER,
  surveys_id INTEGER,
  survey_questions_id INTEGER,
  courses_id INTEGER,
  course_lessons_id INTEGER,
  course_quizzes_id INTEGER,
  quiz_questions_id INTEGER,
  CONSTRAINT payload_locked_documents_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES payload.payload_locked_documents(id) ON DELETE CASCADE,
  CONSTRAINT payload_locked_documents_rels_users_fk FOREIGN KEY (users_id) REFERENCES payload.users(id) ON DELETE CASCADE,
  CONSTRAINT payload_locked_documents_rels_media_fk FOREIGN KEY (media_id) REFERENCES payload.media(id) ON DELETE CASCADE,
  CONSTRAINT payload_locked_documents_rels_documentation_fk FOREIGN KEY (documentation_id) REFERENCES payload.documentation(id) ON DELETE CASCADE,
  CONSTRAINT payload_locked_documents_rels_posts_fk FOREIGN KEY (posts_id) REFERENCES payload.posts(id) ON DELETE CASCADE,
  CONSTRAINT payload_locked_documents_rels_surveys_fk FOREIGN KEY (surveys_id) REFERENCES payload.surveys(id) ON DELETE CASCADE,
  CONSTRAINT payload_locked_documents_rels_survey_questions_fk FOREIGN KEY (survey_questions_id) REFERENCES payload.survey_questions(id) ON DELETE CASCADE,
  CONSTRAINT payload_locked_documents_rels_courses_fk FOREIGN KEY (courses_id) REFERENCES payload.courses(id) ON DELETE CASCADE,
  CONSTRAINT payload_locked_documents_rels_course_lessons_fk FOREIGN KEY (course_lessons_id) REFERENCES payload.course_lessons(id) ON DELETE CASCADE,
  CONSTRAINT payload_locked_documents_rels_course_quizzes_fk FOREIGN KEY (course_quizzes_id) REFERENCES payload.course_quizzes(id) ON DELETE CASCADE,
  CONSTRAINT payload_locked_documents_rels_quiz_questions_fk FOREIGN KEY (quiz_questions_id) REFERENCES payload.quiz_questions(id) ON DELETE CASCADE
);

CREATE TABLE payload.payload_preferences (
  id SERIAL PRIMARY KEY,
  key VARCHAR,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE payload.payload_preferences_rels (
  id SERIAL PRIMARY KEY,
  "order" INTEGER,
  parent_id INTEGER NOT NULL,
  path VARCHAR NOT NULL,
  users_id INTEGER,
  CONSTRAINT payload_preferences_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES payload.payload_preferences(id) ON DELETE CASCADE,
  CONSTRAINT payload_preferences_rels_users_fk FOREIGN KEY (users_id) REFERENCES payload.users(id) ON DELETE CASCADE
);

CREATE TABLE payload.payload_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR,
  batch NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX users_updated_at_idx ON payload.users(updated_at);
CREATE INDEX users_created_at_idx ON payload.users(created_at);
CREATE UNIQUE INDEX users_email_idx ON payload.users(email);

CREATE INDEX media_updated_at_idx ON payload.media(updated_at);
CREATE INDEX media_created_at_idx ON payload.media(created_at);
CREATE UNIQUE INDEX media_filename_idx ON payload.media(filename);

CREATE INDEX documentation_parent_idx ON payload.documentation(parent_id);
CREATE INDEX documentation_updated_at_idx ON payload.documentation(updated_at);
CREATE INDEX documentation_created_at_idx ON payload.documentation(created_at);

CREATE INDEX documentation_categories_order_idx ON payload.documentation_categories(_order);
CREATE INDEX documentation_categories_parent_id_idx ON payload.documentation_categories(_parent_id);

CREATE INDEX documentation_tags_order_idx ON payload.documentation_tags(_order);
CREATE INDEX documentation_tags_parent_id_idx ON payload.documentation_tags(_parent_id);

CREATE INDEX documentation_breadcrumbs_order_idx ON payload.documentation_breadcrumbs(_order);
CREATE INDEX documentation_breadcrumbs_parent_id_idx ON payload.documentation_breadcrumbs(_parent_id);
CREATE INDEX documentation_breadcrumbs_doc_idx ON payload.documentation_breadcrumbs(doc_id);

CREATE INDEX posts_image_idx ON payload.posts(image_id);
CREATE INDEX posts_updated_at_idx ON payload.posts(updated_at);
CREATE INDEX posts_created_at_idx ON payload.posts(created_at);

CREATE INDEX posts_categories_order_idx ON payload.posts_categories(_order);
CREATE INDEX posts_categories_parent_id_idx ON payload.posts_categories(_parent_id);

CREATE INDEX posts_tags_order_idx ON payload.posts_tags(_order);
CREATE INDEX posts_tags_parent_id_idx ON payload.posts_tags(_parent_id);

CREATE UNIQUE INDEX surveys_slug_idx ON payload.surveys(slug);
CREATE INDEX surveys_updated_at_idx ON payload.surveys(updated_at);
CREATE INDEX surveys_created_at_idx ON payload.surveys(created_at);

CREATE INDEX surveys_rels_order_idx ON payload.surveys_rels("order");
CREATE INDEX surveys_rels_parent_idx ON payload.surveys_rels(parent_id);
CREATE INDEX surveys_rels_path_idx ON payload.surveys_rels(path);
CREATE INDEX surveys_rels_survey_questions_id_idx ON payload.surveys_rels(survey_questions_id);

CREATE INDEX survey_questions_options_order_idx ON payload.survey_questions_options(_order);
CREATE INDEX survey_questions_options_parent_id_idx ON payload.survey_questions_options(_parent_id);

CREATE INDEX survey_questions_updated_at_idx ON payload.survey_questions(updated_at);
CREATE INDEX survey_questions_created_at_idx ON payload.survey_questions(created_at);

CREATE UNIQUE INDEX courses_slug_idx ON payload.courses(slug);
CREATE INDEX courses_featured_image_idx ON payload.courses(featured_image_id);
CREATE INDEX courses_updated_at_idx ON payload.courses(updated_at);
CREATE INDEX courses_created_at_idx ON payload.courses(created_at);

CREATE INDEX courses_rels_order_idx ON payload.courses_rels("order");
CREATE INDEX courses_rels_parent_idx ON payload.courses_rels(parent_id);
CREATE INDEX courses_rels_path_idx ON payload.courses_rels(path);
CREATE INDEX courses_rels_course_lessons_id_idx ON payload.courses_rels(course_lessons_id);

CREATE UNIQUE INDEX course_lessons_slug_idx ON payload.course_lessons(slug);
CREATE INDEX course_lessons_featured_image_idx ON payload.course_lessons(featured_image_id);
CREATE INDEX course_lessons_course_idx ON payload.course_lessons(course_id);
CREATE INDEX course_lessons_quiz_idx ON payload.course_lessons(quiz_id);
CREATE INDEX course_lessons_updated_at_idx ON payload.course_lessons(updated_at);
CREATE INDEX course_lessons_created_at_idx ON payload.course_lessons(created_at);

CREATE INDEX course_quizzes_updated_at_idx ON payload.course_quizzes(updated_at);
CREATE INDEX course_quizzes_created_at_idx ON payload.course_quizzes(created_at);

CREATE INDEX quiz_questions_quiz_idx ON payload.quiz_questions(quiz_id);
CREATE INDEX quiz_questions_updated_at_idx ON payload.quiz_questions(updated_at);
CREATE INDEX quiz_questions_created_at_idx ON payload.quiz_questions(created_at);

CREATE INDEX quiz_questions_options_order_idx ON payload.quiz_questions_options(_order);
CREATE INDEX quiz_questions_options_parent_id_idx ON payload.quiz_questions_options(_parent_id);

CREATE INDEX payload_locked_documents_global_slug_idx ON payload.payload_locked_documents(global_slug);
CREATE INDEX payload_locked_documents_updated_at_idx ON payload.payload_locked_documents(updated_at);
CREATE INDEX payload_locked_documents_created_at_idx ON payload.payload_locked_documents(created_at);

CREATE INDEX payload_locked_documents_rels_order_idx ON payload.payload_locked_documents_rels("order");
CREATE INDEX payload_locked_documents_rels_parent_idx ON payload.payload_locked_documents_rels(parent_id);
CREATE INDEX payload_locked_documents_rels_path_idx ON payload.payload_locked_documents_rels(path);
CREATE INDEX payload_locked_documents_rels_users_id_idx ON payload.payload_locked_documents_rels(users_id);
CREATE INDEX payload_locked_documents_rels_media_id_idx ON payload.payload_locked_documents_rels(media_id);
CREATE INDEX payload_locked_documents_rels_documentation_id_idx ON payload.payload_locked_documents_rels(documentation_id);
CREATE INDEX payload_locked_documents_rels_posts_id_idx ON payload.payload_locked_documents_rels(posts_id);
CREATE INDEX payload_locked_documents_rels_surveys_id_idx ON payload.payload_locked_documents_rels(surveys_id);
CREATE INDEX payload_locked_documents_rels_survey_questions_id_idx ON payload.payload_locked_documents_rels(survey_questions_id);
CREATE INDEX payload_locked_documents_rels_courses_id_idx ON payload.payload_locked_documents_rels(courses_id);
CREATE INDEX payload_locked_documents_rels_course_lessons_id_idx ON payload.payload_locked_documents_rels(course_lessons_id);
CREATE INDEX payload_locked_documents_rels_course_quizzes_id_idx ON payload.payload_locked_documents_rels(course_quizzes_id);
CREATE INDEX payload_locked_documents_rels_quiz_questions_id_idx ON payload.payload_locked_documents_rels(quiz_questions_id);

CREATE INDEX payload_preferences_key_idx ON payload.payload_preferences(key);
CREATE INDEX payload_preferences_updated_at_idx ON payload.payload_preferences(updated_at);
CREATE INDEX payload_preferences_created_at_idx ON payload.payload_preferences(created_at);

CREATE INDEX payload_preferences_rels_order_idx ON payload.payload_preferences_rels("order");
CREATE INDEX payload_preferences_rels_parent_idx ON payload.payload_preferences_rels(parent_id);
CREATE INDEX payload_preferences_rels_path_idx ON payload.payload_preferences_rels(path);
CREATE INDEX payload_preferences_rels_users_id_idx ON payload.payload_preferences_rels(users_id);

CREATE INDEX payload_migrations_updated_at_idx ON payload.payload_migrations(updated_at);
CREATE INDEX payload_migrations_created_at_idx ON payload.payload_migrations(created_at);
