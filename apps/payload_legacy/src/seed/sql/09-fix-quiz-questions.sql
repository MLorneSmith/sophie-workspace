-- Fix quiz questions and bidirectional relationships
-- This file should be run after all other seed files to ensure proper relationships

-- Start a transaction
BEGIN;

-- First, check if there are any quizzes in the database
DO $$
DECLARE
  quiz_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO quiz_count FROM payload.course_quizzes;
  
  IF quiz_count = 0 THEN
    RAISE EXCEPTION 'No quizzes found in the database. Please run the quizzes seed file first.';
  ELSE
    RAISE NOTICE 'Found % quizzes in the database.', quiz_count;
  END IF;
END $$;

-- For each quiz that has no questions, add sample questions
DO $$
DECLARE
  quiz_record RECORD;
  question_id uuid;
  quiz_count INTEGER := 0;
BEGIN
  -- Loop through all quizzes
  FOR quiz_record IN SELECT id, title, slug FROM payload.course_quizzes LOOP
    quiz_count := quiz_count + 1;
    RAISE NOTICE 'Processing quiz %: % (%)', quiz_count, quiz_record.title, quiz_record.slug;
    
    -- Check if quiz has questions
    IF NOT EXISTS (
      SELECT 1 FROM payload.quiz_questions WHERE quiz_id_id = quiz_record.id
    ) THEN
      RAISE NOTICE 'Adding questions to quiz: %', quiz_record.title;
      
      -- Add 3 sample questions to this quiz
      FOR i IN 1..3 LOOP
        -- Create question
        question_id := gen_random_uuid();
        
        INSERT INTO payload.quiz_questions (
          id, question, quiz_id, quiz_id_id, type, explanation, "order", created_at, updated_at
        ) VALUES (
          question_id,
          'Sample Question ' || i || ' for ' || quiz_record.title,
          quiz_record.id,
          quiz_record.id,
          'multiple_choice',
          'This is a sample explanation',
          i - 1,
          NOW(),
          NOW()
        );
        
        -- Create 4 options for this question
        FOR j IN 1..4 LOOP
          INSERT INTO payload.quiz_questions_options (
            id, _order, _parent_id, text, is_correct, created_at, updated_at
          ) VALUES (
            gen_random_uuid(),
            j - 1,
            question_id,
            'Option ' || j || ' for Question ' || i,
            (j = 1), -- First option is correct
            NOW(),
            NOW()
          );
        END LOOP;
        
        -- Create relationship from question to quiz
        INSERT INTO payload.quiz_questions_rels (
          id, _parent_id, field, value, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          question_id,
          'quiz_id',
          quiz_record.id,
          NOW(),
          NOW()
        );
        
        -- Create bidirectional relationship from quiz to question
        INSERT INTO payload.course_quizzes_rels (
          id, _parent_id, field, value, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          quiz_record.id,
          'questions',
          question_id,
          NOW(),
          NOW()
        );
      END LOOP;
    ELSE
      RAISE NOTICE 'Quiz % already has questions. Skipping.', quiz_record.title;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Processed % quizzes.', quiz_count;
END $$;

-- Verify that questions were created
DO $$
DECLARE
  question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO question_count FROM payload.quiz_questions;
  
  IF question_count = 0 THEN
    RAISE WARNING 'No quiz questions were created. Please check the logs for errors.';
  ELSE
    RAISE NOTICE 'Successfully created % quiz questions.', question_count;
  END IF;
END $$;

-- Fix bidirectional relationships between quizzes and questions
DO $$
DECLARE
  current_quiz_id UUID;
  question_id UUID;
  quiz_cursor CURSOR FOR 
    SELECT DISTINCT quiz_id_id FROM payload.quiz_questions WHERE quiz_id_id IS NOT NULL;
BEGIN
  -- Process each quiz
  OPEN quiz_cursor;
  LOOP
    FETCH quiz_cursor INTO current_quiz_id;
    EXIT WHEN NOT FOUND;
    
    -- Get all questions for this quiz
    FOR question_id IN 
      SELECT id FROM payload.quiz_questions WHERE quiz_id_id = current_quiz_id
    LOOP
      -- Check if the bidirectional relationship exists
      IF NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels 
        WHERE _parent_id = current_quiz_id AND field = 'questions' AND value = question_id
      ) THEN
        -- Create the bidirectional relationship
        INSERT INTO payload.course_quizzes_rels (
          id,
          _parent_id,
          field,
          value,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          current_quiz_id,
          'questions',
          question_id,
          NOW(),
          NOW()
        );
        
        RAISE NOTICE 'Created bidirectional relationship from quiz % to question %', current_quiz_id, question_id;
      END IF;
    END LOOP;
  END LOOP;
  CLOSE quiz_cursor;
END;
$$;

-- Fix bidirectional relationships between courses and lessons
DO $$
DECLARE
  course_id UUID;
  lesson_id UUID;
  course_cursor CURSOR FOR 
    SELECT DISTINCT course_id_id FROM payload.course_lessons WHERE course_id_id IS NOT NULL;
BEGIN
  -- Process each course
  OPEN course_cursor;
  LOOP
    FETCH course_cursor INTO course_id;
    EXIT WHEN NOT FOUND;
    
    -- Get all lessons for this course
    FOR lesson_id IN 
      SELECT id FROM payload.course_lessons WHERE course_id_id = course_id
    LOOP
      -- Check if the bidirectional relationship exists
      IF NOT EXISTS (
        SELECT 1 FROM payload.courses_rels 
        WHERE _parent_id = course_id AND field = 'lessons' AND value = lesson_id
      ) THEN
        -- Create the bidirectional relationship
        INSERT INTO payload.courses_rels (
          id,
          _parent_id,
          field,
          value,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          course_id,
          'lessons',
          lesson_id,
          NOW(),
          NOW()
        );
        
        RAISE NOTICE 'Created bidirectional relationship from course % to lesson %', course_id, lesson_id;
      END IF;
    END LOOP;
  END LOOP;
  CLOSE course_cursor;
END;
$$;

-- Fix bidirectional relationships between lessons and quizzes
DO $$
DECLARE
  lesson_id UUID;
  quiz_id UUID;
  lesson_cursor CURSOR FOR 
    SELECT DISTINCT id, quiz_id_id FROM payload.course_lessons WHERE quiz_id_id IS NOT NULL;
BEGIN
  -- Process each lesson with a quiz
  OPEN lesson_cursor;
  LOOP
    FETCH lesson_cursor INTO lesson_id, quiz_id;
    EXIT WHEN NOT FOUND;
    
    -- Check if the bidirectional relationship exists
    IF NOT EXISTS (
      SELECT 1 FROM payload.course_quizzes_rels 
      WHERE _parent_id = quiz_id AND field = 'lesson' AND value = lesson_id
    ) THEN
      -- Create the bidirectional relationship
      INSERT INTO payload.course_quizzes_rels (
        id,
        _parent_id,
        field,
        value,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        quiz_id,
        'lesson',
        lesson_id,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created bidirectional relationship from quiz % to lesson %', quiz_id, lesson_id;
    END IF;
  END LOOP;
  CLOSE lesson_cursor;
END;
$$;

-- Fix nested documentation structure
DO $$
DECLARE
  doc_id UUID;
  doc_parent_id UUID;
  doc_cursor CURSOR FOR 
    SELECT d.id, d.parent_id FROM payload.documentation d WHERE d.parent_id IS NOT NULL;
BEGIN
  -- Process each document with a parent
  OPEN doc_cursor;
  LOOP
    FETCH doc_cursor INTO doc_id, doc_parent_id;
    EXIT WHEN NOT FOUND;
    
    -- Check if the bidirectional relationship exists
    IF NOT EXISTS (
      SELECT 1 FROM payload.documentation_rels 
      WHERE _parent_id = doc_parent_id AND field = 'children' AND value = doc_id
    ) THEN
      -- Create the bidirectional relationship
      INSERT INTO payload.documentation_rels (
        id,
        _parent_id,
        field,
        value,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        doc_parent_id,
        'children',
        doc_id,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created bidirectional relationship from parent doc % to child doc %', doc_parent_id, doc_id;
    END IF;
  END LOOP;
  CLOSE doc_cursor;
END;
$$;

-- Commit the transaction
COMMIT;
