-- Seed data for lesson-quiz references
-- This file is generated from static lesson-quiz relation definitions

-- Start a transaction
BEGIN;

-- Update lesson to reference quiz
UPDATE payload.course_lessons
SET quiz_id = 'c11dbb26-7561-4d12-88c8-141c653a43fd',
    quiz_id_id = 'c11dbb26-7561-4d12-88c8-141c653a43fd' -- Duplicate field for compatibility
WHERE slug = 'basic-graphs';

-- Update lesson to reference quiz
UPDATE payload.course_lessons
SET quiz_id = '42564568-76bb-4405-88a9-8e9fd0a9154a',
    quiz_id_id = '42564568-76bb-4405-88a9-8e9fd0a9154a' -- Duplicate field for compatibility
WHERE slug = 'elements-of-design-detail';

-- Update lesson to reference quiz
UPDATE payload.course_lessons
SET quiz_id = '791e27de-2c98-49ef-b684-6c88667d1571',
    quiz_id_id = '791e27de-2c98-49ef-b684-6c88667d1571' -- Duplicate field for compatibility
WHERE slug = 'fact-persuasion';

-- Update lesson to reference quiz
UPDATE payload.course_lessons
SET quiz_id = '3c72b383-e17e-4b07-8a47-451cfbff29c0',
    quiz_id_id = '3c72b383-e17e-4b07-8a47-451cfbff29c0' -- Duplicate field for compatibility
WHERE slug = 'gestalt-principles';

-- Commit the transaction
COMMIT;
