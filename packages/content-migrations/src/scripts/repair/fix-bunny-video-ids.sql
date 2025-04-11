-- SQL script to fix bunny_video_id values for course lessons
-- This script reads the values from a mapping and updates the database

BEGIN;

-- Update lessons with bunny video IDs
UPDATE payload.course_lessons SET bunny_video_id = '2620df68-c2a8-4255-986e-24c1d4c1dbf2' WHERE slug = 'lesson-0';
UPDATE payload.course_lessons SET bunny_video_id = '70b1f616-8e55-4c58-8898-c5cefa05417b' WHERE slug = 'our-process';
UPDATE payload.course_lessons SET bunny_video_id = '8e80b4f3-76d4-44a3-994b-29937ee870ec' WHERE slug = 'the-who';
UPDATE payload.course_lessons SET bunny_video_id = 'eaa1e745-ec67-42c4-b474-e34bd6bdc830' WHERE slug = 'the-why-introductions';
UPDATE payload.course_lessons SET bunny_video_id = '22511e58-40ce-4f11-9961-90070c1a3e94' WHERE slug = 'the-why-next-steps';
UPDATE payload.course_lessons SET bunny_video_id = '2caf80c4-e364-4565-b92e-a353d4e531ff' WHERE slug = 'idea-generation';
UPDATE payload.course_lessons SET bunny_video_id = '17d23794-696e-41df-af6c-faf9b54bd87d' WHERE slug = 'what-is-structure';
UPDATE payload.course_lessons SET bunny_video_id = 'f311d324-c0ca-4157-afeb-bba29e71a9ce' WHERE slug = 'using-stories';
UPDATE payload.course_lessons SET bunny_video_id = '7f63356c-2bca-4c36-8765-4fe9efd59d71' WHERE slug = 'storyboards-presentations';
UPDATE payload.course_lessons SET bunny_video_id = '5c9b5f03-f5d0-479a-84b2-2cd489fc8584' WHERE slug = 'visual-perception';
UPDATE payload.course_lessons SET bunny_video_id = 'd91060f9-9a36-4827-8f15-aa56cf8f6b7c' WHERE slug = 'fundamental-design-detail';
UPDATE payload.course_lessons SET bunny_video_id = 'e2256d0f-8a14-4567-9992-ac20713c9793' WHERE slug = 'gestalt-principles';
UPDATE payload.course_lessons SET bunny_video_id = '08100ca6-f998-42dc-8924-4a6d7f8bffeb' WHERE slug = 'slide-composition';
UPDATE payload.course_lessons SET bunny_video_id = 'aae42644-8e3a-4ef3-a186-869f802869eb' WHERE slug = 'tables-vs-graphs';
UPDATE payload.course_lessons SET bunny_video_id = '74be3c05-f774-4e3c-bbe0-495580a17931' WHERE slug = 'basic-graphs';
UPDATE payload.course_lessons SET bunny_video_id = '1a745407-88b6-41ea-bfe1-fb1e5da7f2ef' WHERE slug = 'fact-based-persuasion';
UPDATE payload.course_lessons SET bunny_video_id = '579076d8-e225-497d-8ff3-52fad07c9640' WHERE slug = 'specialist-graphs';
UPDATE payload.course_lessons SET bunny_video_id = '582ab921-8eec-45c2-9223-c54fed288be9' WHERE slug = 'preparation-practice';
UPDATE payload.course_lessons SET bunny_video_id = '04697977-e686-43c2-b12b-cc81ba1e5aec' WHERE slug = 'performance';

-- Verify the updates
SELECT COUNT(*) AS updated_lessons FROM payload.course_lessons WHERE bunny_video_id IS NOT NULL;

COMMIT;
