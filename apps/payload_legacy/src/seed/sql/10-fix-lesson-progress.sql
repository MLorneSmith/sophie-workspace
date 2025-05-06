-- Fix lesson progress records with missing course_id
-- This file should be run after the lessons seed file

-- Start a transaction
BEGIN;

-- Update lesson progress records for lesson 801 (Congratulations) to set the course_id
UPDATE public.lesson_progress
SET course_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'
WHERE lesson_id = '5934f67b-b89e-49af-ab84-6cb1ab0f2acb'
  AND (course_id IS NULL OR course_id = '');

-- Update lesson progress records for lesson 802 (Before you go...) to set the course_id
UPDATE public.lesson_progress
SET course_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'
WHERE lesson_id = '9c9e431f-0be2-4cfc-9f98-934b2de3bc1c'
  AND (course_id IS NULL OR course_id = '');

-- Commit the transaction
COMMIT;
