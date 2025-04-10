-- Ensure all relationship tables exist with required columns
-- This file is generated from the relationship table generator

-- Start a transaction
BEGIN;

-- Ensure relationship table documentation_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.documentation_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure relationship table posts_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.posts_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure relationship table surveys_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.surveys_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure relationship table survey_questions_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.survey_questions_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure relationship table courses_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.courses_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure relationship table course_lessons_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.course_lessons_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure relationship table course_quizzes_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.course_quizzes_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure relationship table quiz_questions_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.quiz_questions_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure relationship table downloads_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.downloads_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure relationship table payload_locked_documents_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.payload_locked_documents_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure relationship table payload_preferences_rels exists with all required columns

CREATE TABLE IF NOT EXISTS payload.payload_preferences_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commit the transaction
COMMIT;
