-- Seed data for the quiz questions table (Generated from source of truth)
-- This file should be run after the quizzes seed file to ensure the quizzes exist

BEGIN;


INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '2e62e970-c4ac-4d05-b6a7-dad81250e986',
  $$The principle of similarity states that we tend to group things which share visual characteristics such as:$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '01def190-58c6-4860-827a-93f1c2bc2a5a'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '5d7212ce-7e7b-477f-88e8-e49ec1d9c1b8'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'cbcade9c-8abd-4eab-bb14-3a7179963424'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '98ef0029-8c02-4440-b19e-ac472bf550e5'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '01def190-58c6-4860-827a-93f1c2bc2a5a' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '74794823-dcb6-4f2d-a964-3e94f5863f5d',
  $$What are the visual attribute triggers of pre-attentive processing?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '972328d3-f42d-4b4a-a9c3-cac0af149b3e'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'f015c6c3-c88d-4f82-8555-54e662988931'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '405f5450-4439-43bf-925d-f551d157a94b'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '3e8a4be4-e15f-4caa-b594-374bb798b311'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '972328d3-f42d-4b4a-a9c3-cac0af149b3e' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'fc904a38-82f9-43aa-a0fd-1ae817d2c1dd',
  $$What is visual thinking?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '750e0c22-62c6-4b49-90e5-9ceca03b3aa9'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '1ad8b87a-9f04-4fc0-ae0e-3396caa951c0'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '8e4f38aa-1e5c-4558-8637-0fbdb8bb9928'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'f619d010-892e-467e-92ca-aa99cf6636f2'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  '750e0c22-62c6-4b49-90e5-9ceca03b3aa9' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'e3efc846-c4dc-418c-8452-98644c1e8b57',
  $$What are the three Golden Rules to follow when applying the principle of abstraction and organizing your ideas?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'd543a4c8-afb8-4f30-86cc-84112e27eef2'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'df8c659e-2b84-466e-9879-dc3bab76ceea'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '6256b7b2-0ec0-4251-bcdc-d6e0af424058'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '7c96681b-9da9-46f3-914d-3d437365bb71'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  'd543a4c8-afb8-4f30-86cc-84112e27eef2' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '262b193c-b494-4aaa-868a-1b52cdd98c34',
  $$What is the 3rd step of our process?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '55b24db6-2b8c-45ab-ba4b-cfb019bb1fa6'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '065cf2f6-043d-463b-b529-06c9d40506d6'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'abe23ea5-4b2f-4f19-95a4-d12e2acde7bf'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'b2411ffe-77cf-4c38-8923-e35366cfaf98'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '55b24db6-2b8c-45ab-ba4b-cfb019bb1fa6' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '26739c2c-56c2-48b2-8699-1f4a02784846',
  $$What is the second step of the recommended preparation process?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '12fa6974-870c-43f0-8313-ce2b84155d62'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'ee6eda27-c1bd-4177-8d02-815b57905401'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '0575853f-144a-4756-bf1a-13109a59f100'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'da97053c-fae8-4007-9140-cef071503437'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '12fa6974-870c-43f0-8313-ce2b84155d62' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '2ce69acb-8d3f-41b3-9851-7cd5cd508dc8',
  $$Match the type of mental processing with the characteristic: 'Conscious, sequential, and slow/hard'$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '54fd579d-085c-458d-a8aa-fa3c04a4d4a2'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '4c718ad0-9677-4a54-a97b-55ac94119b60'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'de5cd38c-f0ef-406c-8727-93f3eed93a22'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'dbd99805-dd96-46aa-b5ca-77829221d3ba'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  '54fd579d-085c-458d-a8aa-fa3c04a4d4a2' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '3d65df89-ba7b-4039-816b-f6a86ed6fb4a',
  $$What is the 4th step of our process?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '70e3b97c-79bd-4427-a2ca-f3443b93ad5f'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '4f7a3911-3e90-4d99-bc91-c986299c1b73'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'c39c7714-8c74-4601-ae22-0dd6852206dd'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'ab8c4a16-e027-43d7-aed7-19a14bd04bc5'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  3, -- Use index as order for now
  NOW(),
  NOW(),
  '70e3b97c-79bd-4427-a2ca-f3443b93ad5f' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '4b951049-4e15-4cb0-b048-3db4d691255c',
  $$What is the fourth step of the recommended preparation process?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '693afd13-6a29-41dc-b035-9fd4cbdac1a5'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'f05ba6af-1693-4572-b94b-c8f20db95f4c'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'ab6d2a5e-5c96-4038-8ccd-48bfa349c76f'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'f673266e-8684-4bd6-95f5-eedd5de90167'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  4, -- Use index as order for now
  NOW(),
  NOW(),
  '693afd13-6a29-41dc-b035-9fd4cbdac1a5' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0a7fcdf6-2c26-4272-801a-d037946fac20',
  $$What is the rule of 7 (updated)?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '9e00f0e8-65e3-47a7-96d6-092843dda64d'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'efa66a62-7115-4448-a7c3-3060b3923619'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '7a35e11c-14b1-4c1a-bf75-452dc22b4767'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '36b93ce5-82e3-4e3c-ae0b-971d4b98b04e'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '9e00f0e8-65e3-47a7-96d6-092843dda64d' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0c09da5c-fff3-41f1-9505-da246426eb4e',
  $$Pick the question that corresponds with the 'Personality' quadrant$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'd4fbdf1c-a67d-48a2-b587-e181f8d37827'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '9bed2ed7-f596-46c5-8e89-0b612282d98f'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '63b77cab-0f11-4106-a297-5dac4395659f'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'f886931f-7390-47ba-a19e-0dfd9b5e4575'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  'd4fbdf1c-a67d-48a2-b587-e181f8d37827' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0c13fb7a-23dc-46f4-8755-7658939b1695',
  $$What chart type best communicates the 'Geospatial' relationship?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '9470ef12-80ae-4539-b21b-f7b37b7c63e0'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '525580e0-5ca3-4be0-936f-55134f15fb86'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '9ea81761-bec5-474e-8879-d4e9669b78f5'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '0256cf61-762b-4300-b25a-0e50da8da82c'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  '9470ef12-80ae-4539-b21b-f7b37b7c63e0' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '1044fc96-82b5-4fab-8796-6836bd26d926',
  $$What are some of the fundamental elements and principles of design?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'dbd2a49e-194c-414d-a04a-2a58a103069b'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '78e2d017-df51-4b0a-aeea-ea6c2a2e09e0'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '1f37f025-ae13-45b0-a090-128f82ce2615'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '3cdc4cd3-4deb-40b4-9905-a2387cca390d'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  'dbd2a49e-194c-414d-a04a-2a58a103069b' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'fce7779c-e79a-4f77-84af-c165c2ccd5e2',
  $$What elements can be repeated on all slides?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '91db1f2c-0b83-409f-b85a-bafcb46dc809'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'c562c182-b12a-40b4-bd90-9a140da9660f'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'f4acc89c-3772-400f-b904-0eac618bbeee'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '293fd77a-c26f-4ffd-96e2-4f6a101cdc60'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '91db1f2c-0b83-409f-b85a-bafcb46dc809' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0a7fcdf6-2c26-4272-801a-d037946fac20',
  $$What is the rule of 7 (updated)?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'bc996ed1-d120-40c2-9a36-d1395d817934'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '2605189f-3b3a-4c56-ae63-53165a8aaaf6'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'd97e3920-7bc5-431a-8bcb-4e495cb43f22'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'f9197de6-5bb7-456c-83af-d75533dc3a6d'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  'bc996ed1-d120-40c2-9a36-d1395d817934' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0c09da5c-fff3-41f1-9505-da246426eb4e',
  $$Pick the question that corresponds with the 'Personality' quadrant$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '81948df3-327e-47de-bacf-ffa330ae0005'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '85db0488-8fee-4f78-bd78-cb80905aeabb'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '9013cfe4-b3d0-4fae-a81f-d49c26a53589'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'adb100f4-7113-4cd5-8a41-fe180054ca46'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '81948df3-327e-47de-bacf-ffa330ae0005' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0c13fb7a-23dc-46f4-8755-7658939b1695',
  $$What chart type best communicates the 'Geospatial' relationship?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '266001ed-4e74-4973-a9b0-ba625169e034'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '260c18d1-d6ef-4818-b68a-0448d16390f1'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '2a9d7bd9-344c-4e57-abcb-d24b491bfeb0'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'a8817ccb-f1af-44b3-b0eb-3c12b8227435'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  '266001ed-4e74-4973-a9b0-ba625169e034' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0a7fcdf6-2c26-4272-801a-d037946fac20',
  $$What is the rule of 7 (updated)?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'fc964afe-aa86-44b4-b703-e3e29585f3df'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'ce65d9c1-c31b-4891-8a34-690ca1a396b6'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '159b4186-5e0e-426d-8d8f-56b00cb95c23'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '9e9ceb1e-ffa3-43d1-b56c-5112bd2468f0'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  'fc964afe-aa86-44b4-b703-e3e29585f3df' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0c09da5c-fff3-41f1-9505-da246426eb4e',
  $$Pick the question that corresponds with the 'Personality' quadrant$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '2b8bebda-dfe6-4bda-b3c0-f237b2b481fc'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '1d4e8c80-9b6a-4a5a-9ec1-f47f916c4b50'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '007d3073-2eb5-4b9f-b99c-d6d92ee66235'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'b50f2661-dc06-428a-828d-03be4b47990c'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '2b8bebda-dfe6-4bda-b3c0-f237b2b481fc' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0c13fb7a-23dc-46f4-8755-7658939b1695',
  $$What chart type best communicates the 'Geospatial' relationship?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'ccb945ed-f7c3-4e7d-92b8-ed2008ed109a'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '904f269b-7adb-4393-b4c5-5e4d871672a8'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'aeff8383-d040-4eae-bc14-39dfa27f16be'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '623b4ec7-7f88-49ae-85c7-6cc4ab02ba0a'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  'ccb945ed-f7c3-4e7d-92b8-ed2008ed109a' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'eaa3bbc0-261c-4dc2-9048-f4e533079018',
  $$What goes in the body of the slide?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '90f198c5-85fd-4d20-84d3-27682a34ce65'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'a7d860dd-1351-493f-9169-695a631c24e0'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '46378fd1-09a0-4c2f-b05c-7108408db8f6'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'eced78c6-abb2-46bc-a808-190593050ff8'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '90f198c5-85fd-4d20-84d3-27682a34ce65' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'fce7779c-e79a-4f77-84af-c165c2ccd5e2',
  $$What elements can be repeated on all slides?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'a7a7c5bb-b153-4c39-9dac-a3efb4ad393f'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '15372be1-e3d8-4bb5-80ed-883b90f5bd7b'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '276e5645-bc49-4151-9d94-04e4cb174e35'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '91d6be93-83d5-4d5b-b446-778ef5687245'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  'a7a7c5bb-b153-4c39-9dac-a3efb4ad393f' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '513ceeab-b02c-4072-92cb-60c31058691b',
  $$What is graphical excellence?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '97576962-2e4c-4cf7-a691-ee16401625e7'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '0729286a-528a-40c4-8914-4c7848826fcd'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'ce84b822-b726-4362-9ffc-7c8540b884f2'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'cf15d0a4-1514-4db1-bc0b-c97ef9e2a4d8'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '97576962-2e4c-4cf7-a691-ee16401625e7' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '5a00e6fa-81dd-4adb-a881-6aa820eace27',
  $$When should you use graphs?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '616e2981-437d-4c99-be79-ab9e2ff9c679'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'a6ee7794-29dd-4539-b5ae-4929b5e38b6f'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'ac013ab1-4227-447b-894c-28ab84715daa'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'e30021f4-4a28-4870-bcdd-30025e68148d'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '616e2981-437d-4c99-be79-ab9e2ff9c679' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '97d252f3-a7b5-41ab-bbbc-f6457d99ef4e',
  $$What are some of the characteristics that define graphs?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '91d2c72d-ca80-4442-9a9e-abfd8984fdf3'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'b806e35c-7dfc-406b-9b69-c63559057ccb'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '5a1665df-80ba-4cdc-bcaf-029470a09b57'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'f5898b4a-eceb-4df7-937b-70b1a734cab9'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  '91d2c72d-ca80-4442-9a9e-abfd8984fdf3' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'cd01c3f9-b427-4526-a27d-1d1f1bf84d68',
  $$There are many types of relationships that we use graphs to display. What chart type best communicates the 'Part-to-Whole' relationship?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '54f0c11a-cfea-4036-bf36-f58d741916eb'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'd56e0789-36f3-48b2-9f03-7c9ac7490645'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'a31e417b-c7ac-4ee7-a12f-ff5c9fe28dc6'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '089ba5e1-ae51-4d3e-a70f-4c5d891d5cdc'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  3, -- Use index as order for now
  NOW(),
  NOW(),
  '54f0c11a-cfea-4036-bf36-f58d741916eb' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '513ceeab-b02c-4072-92cb-60c31058691b',
  $$What is graphical excellence?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'd94716e1-7936-443e-94ba-2e408224643a'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '539f1706-dc76-4722-a292-dacf5b853aec'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '3be9ffa2-c592-4f5d-ab2c-1cb9083dcf9c'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'fead248c-4791-4ff9-95ce-233bd0cbbc5f'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  'd94716e1-7936-443e-94ba-2e408224643a' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '5a00e6fa-81dd-4adb-a881-6aa820eace27',
  $$When should you use graphs?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '9c69f37a-02de-4a0e-b4ca-c35b289498ea'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'bcf3f4e1-b5b5-4310-a22c-6f1a551e2e48'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'cafb6a7c-6eac-4741-b81d-a545cd03acc2'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '4a2c90d5-b7e7-4dfe-9b7a-35214e1fe9c1'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '9c69f37a-02de-4a0e-b4ca-c35b289498ea' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '97d252f3-a7b5-41ab-bbbc-f6457d99ef4e',
  $$What are some of the characteristics that define graphs?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '22edc85e-d15e-4b8e-87d2-5f9d3498a5da'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'cefa0478-991b-468e-ae8d-b51b72930c21'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'c8fac8dd-7c6d-4ab6-a812-16d5a55b8765'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'ca9a633b-09df-4fd8-b485-b366f4d472a4'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  '22edc85e-d15e-4b8e-87d2-5f9d3498a5da' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'cd01c3f9-b427-4526-a27d-1d1f1bf84d68',
  $$There are many types of relationships that we use graphs to display. What chart type best communicates the 'Part-to-Whole' relationship?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'ac3b73e7-b745-4dbe-80a0-53521110d6dd'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '9dff145a-ce68-404b-bc60-00ae2fa7aa9f'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '7d08356c-565a-4f09-913d-495738792c08'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '36e8eb05-62f4-4263-974c-85007d66c0ee'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  3, -- Use index as order for now
  NOW(),
  NOW(),
  'ac3b73e7-b745-4dbe-80a0-53521110d6dd' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '63d41ee5-0cc8-41d9-9d9f-a7cfa4ec8695',
  $$Who invented storyboards?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '0f3dedd2-8596-42ae-a30f-8b21b9cd77b9'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '3c81a18a-b8a9-4e8c-b7ed-546cb7edac6d'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '399ab2be-ec87-44fe-86c4-d82c907098c2'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'b71963d5-2dbf-42a6-8560-56f9be8c0f30'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '0f3dedd2-8596-42ae-a30f-8b21b9cd77b9' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'd47c3f7b-70ef-43e7-93b8-51af5277c521',
  $$What is a storyboard?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '22279851-b6a3-41b8-ba59-83cc6f8828be'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'ec80f701-a25c-4838-a8e9-43a125feabc9'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '044737c0-9d3a-49dc-bae5-8a91ad6b5601'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '0491defb-d7c6-441a-9c68-7ef277c38658'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '22279851-b6a3-41b8-ba59-83cc6f8828be' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'e0db9c42-3f72-463e-b762-11bc56ea73cd',
  $$What was the great innovation of storyboarding?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '23afe2d5-9fcb-4210-895c-5305771b676d'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '43282055-5323-427c-8fc8-8e584ddc36c7'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'e5fa373a-2b28-4a27-b7c5-1efe1d5695b8'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '16df80de-9674-490e-adcd-b172716e37c4'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  '23afe2d5-9fcb-4210-895c-5305771b676d' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'e430ee32-6d08-45be-b16c-4a63d4ddb825',
  $$What tools are recommended to use for storyboarding?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'd50bbfdb-698b-47e6-8948-643682401399'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'aa2bb920-8532-40c5-9caf-e516bdec99ee'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '9d3769fc-d5df-4a00-a7b9-76a1fde04fe1'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '6ad99f47-9192-45a9-8715-de9142e6bc56'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  3, -- Use index as order for now
  NOW(),
  NOW(),
  'd50bbfdb-698b-47e6-8948-643682401399' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '63d41ee5-0cc8-41d9-9d9f-a7cfa4ec8695',
  $$Who invented storyboards?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'd9b84b35-6fea-4ab0-ac2b-e2ad12bebf11'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '6385ad4c-8403-4299-addf-8cf790ce7d80'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '4e08b975-5ac1-4761-a74f-a03d55afef89'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'cdf843bd-8dea-4adf-b55a-f17eeab5f3ec'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  'd9b84b35-6fea-4ab0-ac2b-e2ad12bebf11' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'd47c3f7b-70ef-43e7-93b8-51af5277c521',
  $$What is a storyboard?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '584c029e-3253-490f-96b8-6c144eea0702'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'b7b9289d-aa82-4ce6-96be-55579f19fad6'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '164f52d3-cab4-43d4-9051-eb7592f75109'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '960a1889-6f8a-4e20-9354-e618b9867df7'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '584c029e-3253-490f-96b8-6c144eea0702' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'e0db9c42-3f72-463e-b762-11bc56ea73cd',
  $$What was the great innovation of storyboarding?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '69ae6d7a-ba04-48af-be16-86b306be0312'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'c140ea61-aac4-4603-8ce5-ef5a5747add0'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'd741302d-bc5b-427c-ae9c-a44057b96351'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '60ad5ef9-84b5-48d1-bb7a-67ff7edeff15'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  '69ae6d7a-ba04-48af-be16-86b306be0312' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'e430ee32-6d08-45be-b16c-4a63d4ddb825',
  $$What tools are recommended to use for storyboarding?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '33bb8a04-0b94-4ba4-89b1-862aed0093eb'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'dc04d496-8f5d-4a41-a23e-7748ec26e75a'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'f3ac0648-24be-44d3-9387-70dd43d202ae'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '82a79d17-da8a-43bb-b6c0-5a6c5a95dcdc'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  3, -- Use index as order for now
  NOW(),
  NOW(),
  '33bb8a04-0b94-4ba4-89b1-862aed0093eb' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '17075e05-b7b6-4978-8025-147842f6337d',
  $$What re some of the primary benefits of a table?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '6fc15757-63b6-4933-9c94-a7278af78f08'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '15730f53-35ed-4134-b158-5827bea528be'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '97416b74-309e-4662-baf9-8c0976ef643d'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '633ad4b8-cecc-4cf0-8db2-7edaf10b4836'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '6fc15757-63b6-4933-9c94-a7278af78f08' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '49b524ea-19cf-4cf9-a3e7-c7f49b3ce767',
  $$What are the two defining characteristics of Tables?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'af6a499c-214f-460b-9ee8-957469edbc13'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'a45ea722-3324-473b-aa98-62db501c72bf'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '2efb7d2f-09ae-4444-ae3b-591768c78c86'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'e2bf6610-efff-4a1c-8409-af4ae6da1fa0'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  'af6a499c-214f-460b-9ee8-957469edbc13' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '513ceeab-b02c-4072-92cb-60c31058691b',
  $$What is graphical excellence?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'dbb0139e-2ea5-41c9-8339-1c97f9bd4b24'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '6d36766c-63d3-4fa5-8a0c-d0d92a34cbf2'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'aa89b56c-ab46-4efd-86dc-9a9d0efdf8fd'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '764f922b-f923-4335-a163-77941b0896fe'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  'dbb0139e-2ea5-41c9-8339-1c97f9bd4b24' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '5a00e6fa-81dd-4adb-a881-6aa820eace27',
  $$When should you use graphs?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '4f012ca2-2b8d-4ce4-a2cc-7b0949509012'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '438ebdeb-4a4a-4131-aa67-cf4883c4dea9'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'e3b0736e-19e8-4bb1-9845-cfcb66287e09'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '5d1c7624-c7e6-4765-87d7-0d351bcc9f65'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  3, -- Use index as order for now
  NOW(),
  NOW(),
  '4f012ca2-2b8d-4ce4-a2cc-7b0949509012' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '97d252f3-a7b5-41ab-bbbc-f6457d99ef4e',
  $$What are some of the characteristics that define graphs?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'b8d71690-2916-4d98-affa-89d6acc929a4'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '8cd50a0d-3200-44fe-9944-7e27cb044e3b'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '23b58404-6f08-4671-bd4d-618766faf17c'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'f5cdbba9-d064-47a2-80fc-abafee543b79'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  4, -- Use index as order for now
  NOW(),
  NOW(),
  'b8d71690-2916-4d98-affa-89d6acc929a4' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '1044fc96-82b5-4fab-8796-6836bd26d926',
  $$What are some of the fundamental elements and principles of design?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'c17107f5-e56b-49fc-b47a-12e654940a46'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '41138bce-fdab-46f3-84c5-63dc9349f945'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '245c7ef9-cc74-4061-9f96-61628000491d'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '739ee4bf-39e0-4c1b-a5e2-8f1fa99333e6'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  'c17107f5-e56b-49fc-b47a-12e654940a46' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'fce7779c-e79a-4f77-84af-c165c2ccd5e2',
  $$What elements can be repeated on all slides?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '94e9ebf0-20a1-4820-b272-98033754f915'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '2ba69b19-dbc5-4479-ab1d-d9c0cbec020d'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '41d67527-cb47-45a1-844e-b6f64d56f8f4'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'd701653d-55cb-4973-9fec-757a3e9be659'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '94e9ebf0-20a1-4820-b272-98033754f915' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '2f7a2198-6da3-41f9-a394-c002c9218834',
  $$Our first step is 'The Who'. What do we mean by this?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '6f03affb-718c-45f1-a94f-82686b31b966'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '229326bd-a5c0-46f4-b658-79d3ae240f88'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'ec81ac6a-aed0-4602-b539-86428054c73f'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '37a649f5-1a69-41ae-86ff-be35eb03a601'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '6f03affb-718c-45f1-a94f-82686b31b966' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '34dd66c5-562c-40f0-adea-7f36d2a0aed4',
  $$Who is Cicero?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'be883848-b1dc-4211-9f23-f691489d9e63'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'af643f08-0386-4377-a233-61820b007a40'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '1f66cec9-1d93-4e71-ad15-830dc7ce8312'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'dd60ed39-5f5d-4dba-bc83-435e1b096b08'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  'be883848-b1dc-4211-9f23-f691489d9e63' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '63d41ee5-0cc8-41d9-9d9f-a7cfa4ec8695',
  $$Who invented storyboards?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '67442b98-cd18-43cb-8a76-ef3f0b8ea01e'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'fb4a0522-9642-4325-880a-94775815209a'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'e5313942-6bb2-4055-b60b-9308c90c1bb8'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '748beda9-b14c-48b6-a07b-8f55b28c45ad'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  '67442b98-cd18-43cb-8a76-ef3f0b8ea01e' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '82d249e9-7d95-49cc-99b7-76578e8e0643',
  $$What are the 4 quadrants of the Audience Map?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '675bc8f6-504a-4885-8c5a-7a4ca9c8907d'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '1862ac99-e44c-4a34-bdad-ca3f6d53fc20'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '7120f6c7-f5d8-43aa-aa4f-9af5089334c7'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '752f107e-280c-49cb-85e4-990511481c23'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  3, -- Use index as order for now
  NOW(),
  NOW(),
  '675bc8f6-504a-4885-8c5a-7a4ca9c8907d' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'a9e9b4bd-ead5-43ef-ac52-13585ba09f57',
  $$Who is the hero of our presentation?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'c0a0bd29-f4ff-4b34-ae6f-b5169b1721db'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '5a2272e6-4f15-4ac6-973b-fc71f42cb272'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '3c10974a-f57f-498b-bf6e-f5bcae39b962'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '27d9e9d3-0bd4-4690-8b7e-6f18a1f984c5'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  4, -- Use index as order for now
  NOW(),
  NOW(),
  'c0a0bd29-f4ff-4b34-ae6f-b5169b1721db' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '2bf3a20e-e707-4d61-88f0-be78e56fce7d',
  $$Why are stories like a cup?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '16777d61-4d83-4aaa-a0b2-b1e19859434e'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '04b13f1f-505c-4d1e-a31a-25f5ac5ee699'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'a0f5a6a7-7780-4f3b-b751-1d5f6f30e176'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '002449cb-0916-4bf0-ab2a-434da0877c0b'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '16777d61-4d83-4aaa-a0b2-b1e19859434e' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '544f2d62-5cf3-403b-aba0-e972bf5230e0',
  $$The second step in our process is 'The Why'. What do we mean by this?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '2f45397a-d58d-400f-b7e5-7e92addadec3'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '91b731cc-31aa-4e82-9b15-2ae55cec107b'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '08b95718-094b-42a9-a6fa-b174d92072ae'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'ddc06c24-8fe8-422c-bb22-765e3d6f491b'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '2f45397a-d58d-400f-b7e5-7e92addadec3' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '7b635d60-8dbd-4786-b63e-6dbec5450f17',
  $$What do stories add to our presentations? Why should be use them?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '35457ad4-e695-4545-805a-2d40a4931687'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '0a87faaa-7396-44a0-8547-79bb750ae74b'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '5dd5b3c8-dd8f-407a-a77f-8d9caae505e1'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'cad4cf27-9e70-405b-8218-f52090698aca'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  '35457ad4-e695-4545-805a-2d40a4931687' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '804f35a3-875e-4d49-869a-5bdb85989534',
  $$Why have we repeated the principle of proximity in this lesson and the previous lesson?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '251d80f6-b9fc-4833-ac3a-58706729b6aa'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'd9e312a0-66e4-4373-9216-9d816359c6ce'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '0f0caa93-a6a2-4f55-aa29-f3b2d63a8efc'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '1a0e1198-757a-44c1-ac8e-348e19467fbb'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  3, -- Use index as order for now
  NOW(),
  NOW(),
  '251d80f6-b9fc-4833-ac3a-58706729b6aa' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '81e96916-d43a-48bd-9830-adb4dc203114',
  $$Why are we creating our presentation?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'a535effe-e99c-45f7-acc6-c72d347b4972'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '34a3cf0e-df0e-4b9b-af62-1ec9dedd59bf'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '21648aeb-a06e-481c-9d2c-f8a5aa31179f'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '4969e5b5-3d08-4910-a253-e0ae47428ade'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  4, -- Use index as order for now
  NOW(),
  NOW(),
  'a535effe-e99c-45f7-acc6-c72d347b4972' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '2bf3a20e-e707-4d61-88f0-be78e56fce7d',
  $$Why are stories like a cup?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '3493e060-3d21-4850-8504-6bcf3301ba70'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '74d2bd0d-9d11-442a-9f33-02c92e98816a'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '0513a22d-f5c2-4d77-8bc8-410690f52f63'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'bb541e18-5c6e-41fd-a33b-9fb61afedc32'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '3493e060-3d21-4850-8504-6bcf3301ba70' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '544f2d62-5cf3-403b-aba0-e972bf5230e0',
  $$The second step in our process is 'The Why'. What do we mean by this?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '75997d9e-c93d-4848-b4e7-08552ae00983'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'd0eb2f86-8dae-47a2-b1ea-a2a2874d03c7'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'bb289ba3-391d-4b8b-80dc-466e977000b8'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '07e8c8ac-5b94-48b6-99eb-31de736266b8'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '75997d9e-c93d-4848-b4e7-08552ae00983' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '7b635d60-8dbd-4786-b63e-6dbec5450f17',
  $$What do stories add to our presentations? Why should be use them?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'ff5c3170-6125-4ed1-8f4b-e6318d319154'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'b1b45d49-e862-4d88-824d-307643f912e0'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '1cdac11e-93d9-4e15-9567-e268715197e0'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '81ece044-31d5-49fb-98d3-b5c1cfcc1969'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  'ff5c3170-6125-4ed1-8f4b-e6318d319154' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '804f35a3-875e-4d49-869a-5bdb85989534',
  $$Why have we repeated the principle of proximity in this lesson and the previous lesson?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '917a56d9-e504-451a-90a5-1fe99f1693bd'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'ed333c7f-d4f0-4d9b-80ee-2118866fb314'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'c68064d3-e11f-4b40-b18c-97e3c3caa9b8'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'b26e64a8-c637-4746-839f-6adb8398be9b'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  3, -- Use index as order for now
  NOW(),
  NOW(),
  '917a56d9-e504-451a-90a5-1fe99f1693bd' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '81e96916-d43a-48bd-9830-adb4dc203114',
  $$Why are we creating our presentation?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '68515840-6c2a-4176-8034-d39fbd5365c9'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'e84523ff-ce6d-452f-a608-525de841fde6'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'b4ac11d8-9fd8-478c-bc76-4c3442397697'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '39c5f6d4-cb85-4362-8f30-2b0d277767ff'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  4, -- Use index as order for now
  NOW(),
  NOW(),
  '68515840-6c2a-4176-8034-d39fbd5365c9' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'f1448bc2-6467-4389-9ad4-2f047ad8423e',
  $$What chart types should we try and avoid using?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '7060ad26-78f1-4c43-b701-2d6d192bc74a'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '0760e7f1-deb1-498d-be44-9395931e4c21'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '493d48f0-bc10-474f-83a7-6b02c950622b'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '573f6af0-ddb3-494a-96dd-c65f489abff5'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '7060ad26-78f1-4c43-b701-2d6d192bc74a' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '2e62e970-c4ac-4d05-b6a7-dad81250e986',
  $$The principle of similarity states that we tend to group things which share visual characteristics such as:$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '44b1f92d-8222-4833-be0f-863f3e0ff94b'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '352f8b4c-6f08-4546-a388-5056cc9b535a'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', 'e3c5d374-aa13-4815-9acc-94737d0352b4'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '658c8ddc-dc0c-4d46-a890-27a63c429a5d'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  '44b1f92d-8222-4833-be0f-863f3e0ff94b' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '74794823-dcb6-4f2d-a964-3e94f5863f5d',
  $$What are the visual attribute triggers of pre-attentive processing?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'b07c8762-2910-45b9-b3b8-777696c8aec4'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'f210cf41-bc97-4992-8b3e-2dff879ecb96'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '960328e1-1afc-46f4-9823-7c47d348707a'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '2e29dead-8401-487e-abd6-a0e1e8fc0109'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  'b07c8762-2910-45b9-b3b8-777696c8aec4' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  'fc904a38-82f9-43aa-a0fd-1ae817d2c1dd',
  $$What is visual thinking?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'f0450270-5430-4615-a5f5-ffc3b45f0b03'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'ae9eef4e-e965-437b-b20b-71b675599e14'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '8a20bce3-5982-4a23-944f-6280d28a4c78'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '71aa3b9a-8190-46fc-8f5e-0f82220ffdc2'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  'f0450270-5430-4615-a5f5-ffc3b45f0b03' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0a7fcdf6-2c26-4272-801a-d037946fac20',
  $$What is the rule of 7 (updated)?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'd447417a-6cd8-4c08-8f60-cc69f8cd9f0b'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'a904fc98-08b5-465b-b757-410f925a5e6f'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '562c010f-dcaf-477d-a91d-3805ba2cde47'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '7bbc9be6-dce9-40c9-be5b-edb8bd79c34e'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  0, -- Use index as order for now
  NOW(),
  NOW(),
  'd447417a-6cd8-4c08-8f60-cc69f8cd9f0b' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0c09da5c-fff3-41f1-9505-da246426eb4e',
  $$Pick the question that corresponds with the 'Personality' quadrant$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', '7faca8b9-67c2-4256-92d7-da109bc5da75'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', '705dfe13-c8e6-4ab2-8c88-778bb7cd9447'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '4ec9f0cd-e512-4810-9365-61ac8835c99b'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', '183799f8-55d9-497a-b24a-a2c8a1827906'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  1, -- Use index as order for now
  NOW(),
  NOW(),
  '7faca8b9-67c2-4256-92d7-da109bc5da75' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at, correct_answer
) VALUES (
  '0c13fb7a-23dc-46f4-8755-7658939b1695',
  $$What chart type best communicates the 'Geospatial' relationship?$$,
  'multiple_choice', -- Assuming all are multiple choice based on source structure
  jsonb_build_array(jsonb_build_object('id', 'f60936d9-7a76-40cc-bc74-7ff5889fd6eb'::text, 'text', $$Option 1 (correct)$$, 'isCorrect', true), jsonb_build_object('id', 'ba8e0c2e-5844-4655-8be0-309af62b13ec'::text, 'text', $$Option 2$$, 'isCorrect', false), jsonb_build_object('id', '82a883e3-e4d9-44b9-8402-bb0060081951'::text, 'text', $$Option 3$$, 'isCorrect', false), jsonb_build_object('id', 'bc7af664-7cc2-4ac4-9034-db76d2401de1'::text, 'text', $$Option 4$$, 'isCorrect', false)),
  '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}'::jsonb,
  2, -- Use index as order for now
  NOW(),
  NOW(),
  'f60936d9-7a76-40cc-bc74-7ff5889fd6eb' -- Correct option ID
) ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "order" = EXCLUDED.order,
  updated_at = NOW(),
  correct_answer = EXCLUDED.correct_answer;

COMMIT;