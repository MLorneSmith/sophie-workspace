-- Seed data for the survey questions table
-- This file should be run after the surveys seed file to ensure the surveys exist

-- Start a transaction
BEGIN;

-- Insert question 1: Did 'Decks for Decision Makers' meet your expectat...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'e6bfd63a-df9c-4801-bb8a-9e9a23d91ad5',
  'Did ''Decks for Decision Makers'' meet your expectations?',
  'Did ''Decks for Decision Makers'' meet your expectations?',
  'scale',
  'satisfaction',
  0,
  0,
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'e6bfd63a-df9c-4801-bb8a-9e9a23d91ad5',
  'Very dissatisfied',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'e6bfd63a-df9c-4801-bb8a-9e9a23d91ad5',
  'Somewhat dissatisfied',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'e6bfd63a-df9c-4801-bb8a-9e9a23d91ad5',
  'Neither satisfied nor dissatisfied',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'e6bfd63a-df9c-4801-bb8a-9e9a23d91ad5',
  'Somewhat Satisfied',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'e6bfd63a-df9c-4801-bb8a-9e9a23d91ad5',
  'Very satisfied',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e6bfd63a-df9c-4801-bb8a-9e9a23d91ad5',
  'surveys',
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  'questions',
  'e6bfd63a-df9c-4801-bb8a-9e9a23d91ad5',
  'e6bfd63a-df9c-4801-bb8a-9e9a23d91ad5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 2: How would you rate the quality of the training?...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'ac826fc9-e52e-4921-add6-f05b813cbdac',
  'How would you rate the quality of the training?',
  'How would you rate the quality of the training?',
  'scale',
  'quality',
  0,
  1,
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'ac826fc9-e52e-4921-add6-f05b813cbdac',
  'Unacceptable',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'ac826fc9-e52e-4921-add6-f05b813cbdac',
  'Poor',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'ac826fc9-e52e-4921-add6-f05b813cbdac',
  'Satisfactory',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'ac826fc9-e52e-4921-add6-f05b813cbdac',
  'Good',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'ac826fc9-e52e-4921-add6-f05b813cbdac',
  'Outstanding',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ac826fc9-e52e-4921-add6-f05b813cbdac',
  'surveys',
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  'questions',
  'ac826fc9-e52e-4921-add6-f05b813cbdac',
  'ac826fc9-e52e-4921-add6-f05b813cbdac',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 3: How likely are you to recommend this course to a f...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  'How likely are you to recommend this course to a friend, partner, or colleague?',
  'How likely are you to recommend this course to a friend, partner, or colleague?',
  'scale',
  'recommendation',
  0,
  2,
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '1 - Unlikely',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '3',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 6 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 7 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 8 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  7,
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 9 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  8,
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 10 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  9,
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '10 - Extremely likely',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  'surveys',
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  'questions',
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  '0b03569a-061f-4b05-8bc0-5f0d84103cfe',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 4: Do you have any suggestions to improve this course...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'cbc1f394-9784-4f96-ad6e-95837cd4b108',
  'Do you have any suggestions to improve this course?',
  'Do you have any suggestions to improve this course?',
  'text_field',
  'improvement',
  0,
  3,
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'cbc1f394-9784-4f96-ad6e-95837cd4b108',
  'surveys',
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7g574cfa-e8b1-5f6b-c1gb-b890c6e7f1f1',
  'questions',
  'cbc1f394-9784-4f96-ad6e-95837cd4b108',
  'cbc1f394-9784-4f96-ad6e-95837cd4b108',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 1: While presenting, no one has trouble following my ...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '7ab74bf6-36fb-43c8-a116-2bfd26f9dd76',
  'While presenting, no one has trouble following my thought process',
  'While presenting, no one has trouble following my thought process',
  'multiple_choice',
  'structure',
  0,
  0,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '7ab74bf6-36fb-43c8-a116-2bfd26f9dd76',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '7ab74bf6-36fb-43c8-a116-2bfd26f9dd76',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '7ab74bf6-36fb-43c8-a116-2bfd26f9dd76',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '7ab74bf6-36fb-43c8-a116-2bfd26f9dd76',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '7ab74bf6-36fb-43c8-a116-2bfd26f9dd76',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7ab74bf6-36fb-43c8-a116-2bfd26f9dd76',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '7ab74bf6-36fb-43c8-a116-2bfd26f9dd76',
  '7ab74bf6-36fb-43c8-a116-2bfd26f9dd76',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 2: I regularly use metaphors, analogies, and anecdote...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'df3c69a2-fd17-44d8-a9f3-2d70fb419c46',
  'I regularly use metaphors, analogies, and anecdote in my presentations',
  'I regularly use metaphors, analogies, and anecdote in my presentations',
  'multiple_choice',
  'story',
  0,
  1,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'df3c69a2-fd17-44d8-a9f3-2d70fb419c46',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'df3c69a2-fd17-44d8-a9f3-2d70fb419c46',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'df3c69a2-fd17-44d8-a9f3-2d70fb419c46',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'df3c69a2-fd17-44d8-a9f3-2d70fb419c46',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'df3c69a2-fd17-44d8-a9f3-2d70fb419c46',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'df3c69a2-fd17-44d8-a9f3-2d70fb419c46',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'df3c69a2-fd17-44d8-a9f3-2d70fb419c46',
  'df3c69a2-fd17-44d8-a9f3-2d70fb419c46',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 3: I support my arguments with trustworthy evidence f...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '1fe1de3c-572b-4b12-9e1a-2fefa2430d82',
  'I support my arguments with trustworthy evidence from authentic sources',
  'I support my arguments with trustworthy evidence from authentic sources',
  'multiple_choice',
  'substance',
  0,
  2,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '1fe1de3c-572b-4b12-9e1a-2fefa2430d82',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '1fe1de3c-572b-4b12-9e1a-2fefa2430d82',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '1fe1de3c-572b-4b12-9e1a-2fefa2430d82',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '1fe1de3c-572b-4b12-9e1a-2fefa2430d82',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '1fe1de3c-572b-4b12-9e1a-2fefa2430d82',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1fe1de3c-572b-4b12-9e1a-2fefa2430d82',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '1fe1de3c-572b-4b12-9e1a-2fefa2430d82',
  '1fe1de3c-572b-4b12-9e1a-2fefa2430d82',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 4: I am good at designing simple, clear slides that c...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '822487e0-0af1-4dbc-9b46-99141d16b25c',
  'I am good at designing simple, clear slides that convey my point',
  'I am good at designing simple, clear slides that convey my point',
  'multiple_choice',
  'style',
  0,
  3,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 4
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '822487e0-0af1-4dbc-9b46-99141d16b25c',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 4
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '822487e0-0af1-4dbc-9b46-99141d16b25c',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 4
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '822487e0-0af1-4dbc-9b46-99141d16b25c',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 4
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '822487e0-0af1-4dbc-9b46-99141d16b25c',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 4
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '822487e0-0af1-4dbc-9b46-99141d16b25c',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '822487e0-0af1-4dbc-9b46-99141d16b25c',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '822487e0-0af1-4dbc-9b46-99141d16b25c',
  '822487e0-0af1-4dbc-9b46-99141d16b25c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 5: I always feel anxious and nervous before giving a ...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '55afbace-9faa-4411-b759-a290d6e282b4',
  'I always feel anxious and nervous before giving a presentation',
  'I always feel anxious and nervous before giving a presentation',
  'multiple_choice',
  'self-confidence',
  1,
  4,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 5
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '55afbace-9faa-4411-b759-a290d6e282b4',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 5
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '55afbace-9faa-4411-b759-a290d6e282b4',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 5
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '55afbace-9faa-4411-b759-a290d6e282b4',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 5
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '55afbace-9faa-4411-b759-a290d6e282b4',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 5
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '55afbace-9faa-4411-b759-a290d6e282b4',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '55afbace-9faa-4411-b759-a290d6e282b4',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '55afbace-9faa-4411-b759-a290d6e282b4',
  '55afbace-9faa-4411-b759-a290d6e282b4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 6: I always tailor my presentation strategy, content,...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'f99f2ce3-9664-4535-a473-0f02543cce83',
  'I always tailor my presentation strategy, content, and approach to different audiences and different levels of knowledge',
  'I always tailor my presentation strategy, content, and approach to different audiences and different levels of knowledge',
  'multiple_choice',
  'structure',
  0,
  5,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 6
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'f99f2ce3-9664-4535-a473-0f02543cce83',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 6
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'f99f2ce3-9664-4535-a473-0f02543cce83',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 6
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'f99f2ce3-9664-4535-a473-0f02543cce83',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 6
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'f99f2ce3-9664-4535-a473-0f02543cce83',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 6
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'f99f2ce3-9664-4535-a473-0f02543cce83',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f99f2ce3-9664-4535-a473-0f02543cce83',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'f99f2ce3-9664-4535-a473-0f02543cce83',
  'f99f2ce3-9664-4535-a473-0f02543cce83',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 7: I tend to read the slides back to my audience, rat...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '7e2e6538-fe93-494d-940c-c75fe89cf228',
  'I tend to read the slides back to my audience, rather than adding additional verbal context or color',
  'I tend to read the slides back to my audience, rather than adding additional verbal context or color',
  'multiple_choice',
  'story',
  1,
  6,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 7
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '7e2e6538-fe93-494d-940c-c75fe89cf228',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 7
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '7e2e6538-fe93-494d-940c-c75fe89cf228',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 7
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '7e2e6538-fe93-494d-940c-c75fe89cf228',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 7
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '7e2e6538-fe93-494d-940c-c75fe89cf228',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 7
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '7e2e6538-fe93-494d-940c-c75fe89cf228',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7e2e6538-fe93-494d-940c-c75fe89cf228',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '7e2e6538-fe93-494d-940c-c75fe89cf228',
  '7e2e6538-fe93-494d-940c-c75fe89cf228',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 8: I regularly present data to support my conclusions...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'df49c9a2-f50d-4870-9a83-e5c251f020d5',
  'I regularly present data to support my conclusions and effectively leverage all types of charts and tables',
  'I regularly present data to support my conclusions and effectively leverage all types of charts and tables',
  'multiple_choice',
  'substance',
  0,
  7,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 8
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'df49c9a2-f50d-4870-9a83-e5c251f020d5',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 8
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'df49c9a2-f50d-4870-9a83-e5c251f020d5',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 8
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'df49c9a2-f50d-4870-9a83-e5c251f020d5',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 8
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'df49c9a2-f50d-4870-9a83-e5c251f020d5',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 8
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'df49c9a2-f50d-4870-9a83-e5c251f020d5',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'df49c9a2-f50d-4870-9a83-e5c251f020d5',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'df49c9a2-f50d-4870-9a83-e5c251f020d5',
  'df49c9a2-f50d-4870-9a83-e5c251f020d5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 9: The content I develop for my presentations has the...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'a4bfc9d0-9775-4b3a-a6bd-2b91ee52057a',
  'The content I develop for my presentations has the appropriate level of detail for the audience and situation',
  'The content I develop for my presentations has the appropriate level of detail for the audience and situation',
  'multiple_choice',
  'style',
  0,
  8,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 9
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'a4bfc9d0-9775-4b3a-a6bd-2b91ee52057a',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 9
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'a4bfc9d0-9775-4b3a-a6bd-2b91ee52057a',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 9
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'a4bfc9d0-9775-4b3a-a6bd-2b91ee52057a',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 9
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'a4bfc9d0-9775-4b3a-a6bd-2b91ee52057a',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 9
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'a4bfc9d0-9775-4b3a-a6bd-2b91ee52057a',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a4bfc9d0-9775-4b3a-a6bd-2b91ee52057a',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'a4bfc9d0-9775-4b3a-a6bd-2b91ee52057a',
  'a4bfc9d0-9775-4b3a-a6bd-2b91ee52057a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 10: When presenting I have command over the room. I lo...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'f220991a-7ec6-4687-a355-3d9de94b3e66',
  'When presenting I have command over the room. I look and sound confident and assertive. I exude charisma.',
  'When presenting I have command over the room. I look and sound confident and assertive. I exude charisma.',
  'multiple_choice',
  'self-confidence',
  0,
  9,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 10
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'f220991a-7ec6-4687-a355-3d9de94b3e66',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 10
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'f220991a-7ec6-4687-a355-3d9de94b3e66',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 10
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'f220991a-7ec6-4687-a355-3d9de94b3e66',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 10
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'f220991a-7ec6-4687-a355-3d9de94b3e66',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 10
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'f220991a-7ec6-4687-a355-3d9de94b3e66',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f220991a-7ec6-4687-a355-3d9de94b3e66',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'f220991a-7ec6-4687-a355-3d9de94b3e66',
  'f220991a-7ec6-4687-a355-3d9de94b3e66',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 11: I create presentations designed to meet the needs ...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'e63d93e3-0d18-4da4-b06d-e7fa2c12a130',
  'I create presentations designed to meet the needs of my audience',
  'I create presentations designed to meet the needs of my audience',
  'multiple_choice',
  'structure',
  0,
  10,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 11
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'e63d93e3-0d18-4da4-b06d-e7fa2c12a130',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 11
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'e63d93e3-0d18-4da4-b06d-e7fa2c12a130',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 11
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'e63d93e3-0d18-4da4-b06d-e7fa2c12a130',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 11
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'e63d93e3-0d18-4da4-b06d-e7fa2c12a130',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 11
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'e63d93e3-0d18-4da4-b06d-e7fa2c12a130',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e63d93e3-0d18-4da4-b06d-e7fa2c12a130',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'e63d93e3-0d18-4da4-b06d-e7fa2c12a130',
  'e63d93e3-0d18-4da4-b06d-e7fa2c12a130',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 12: I use storyboards to map out my presentations in a...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'daac4117-c755-4cbf-806f-cf41d5a37caa',
  'I use storyboards to map out my presentations in advance',
  'I use storyboards to map out my presentations in advance',
  'multiple_choice',
  'story',
  0,
  11,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 12
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'daac4117-c755-4cbf-806f-cf41d5a37caa',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 12
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'daac4117-c755-4cbf-806f-cf41d5a37caa',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 12
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'daac4117-c755-4cbf-806f-cf41d5a37caa',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 12
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'daac4117-c755-4cbf-806f-cf41d5a37caa',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 12
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'daac4117-c755-4cbf-806f-cf41d5a37caa',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'daac4117-c755-4cbf-806f-cf41d5a37caa',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'daac4117-c755-4cbf-806f-cf41d5a37caa',
  'daac4117-c755-4cbf-806f-cf41d5a37caa',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 13: I create my ideas first, before creating slides...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'c15db00d-7504-44f9-a37c-92e899669c34',
  'I create my ideas first, before creating slides',
  'I create my ideas first, before creating slides',
  'multiple_choice',
  'substance',
  0,
  12,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 13
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'c15db00d-7504-44f9-a37c-92e899669c34',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 13
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'c15db00d-7504-44f9-a37c-92e899669c34',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 13
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'c15db00d-7504-44f9-a37c-92e899669c34',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 13
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'c15db00d-7504-44f9-a37c-92e899669c34',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 13
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'c15db00d-7504-44f9-a37c-92e899669c34',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c15db00d-7504-44f9-a37c-92e899669c34',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'c15db00d-7504-44f9-a37c-92e899669c34',
  'c15db00d-7504-44f9-a37c-92e899669c34',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 14: The visuals of my presentation match well with the...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'da4f3125-93f3-4e4d-a1d7-6ef92a748892',
  'The visuals of my presentation match well with the information I am communicating',
  'The visuals of my presentation match well with the information I am communicating',
  'multiple_choice',
  'style',
  0,
  13,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 14
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'da4f3125-93f3-4e4d-a1d7-6ef92a748892',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 14
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'da4f3125-93f3-4e4d-a1d7-6ef92a748892',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 14
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'da4f3125-93f3-4e4d-a1d7-6ef92a748892',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 14
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'da4f3125-93f3-4e4d-a1d7-6ef92a748892',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 14
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'da4f3125-93f3-4e4d-a1d7-6ef92a748892',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'da4f3125-93f3-4e4d-a1d7-6ef92a748892',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'da4f3125-93f3-4e4d-a1d7-6ef92a748892',
  'da4f3125-93f3-4e4d-a1d7-6ef92a748892',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 15: I rehearse so there is a minimum use of notes and ...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'd1cefd6b-08ce-416e-b21d-703a37c0bf05',
  'I rehearse so there is a minimum use of notes and maximum attention paid to the audience',
  'I rehearse so there is a minimum use of notes and maximum attention paid to the audience',
  'multiple_choice',
  'self-confidence',
  0,
  14,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 15
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'd1cefd6b-08ce-416e-b21d-703a37c0bf05',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 15
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'd1cefd6b-08ce-416e-b21d-703a37c0bf05',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 15
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'd1cefd6b-08ce-416e-b21d-703a37c0bf05',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 15
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'd1cefd6b-08ce-416e-b21d-703a37c0bf05',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 15
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'd1cefd6b-08ce-416e-b21d-703a37c0bf05',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd1cefd6b-08ce-416e-b21d-703a37c0bf05',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'd1cefd6b-08ce-416e-b21d-703a37c0bf05',
  'd1cefd6b-08ce-416e-b21d-703a37c0bf05',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 16: I spend significant time and effort optimizing the...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'd188396e-9320-4d87-ab01-bfa32b0d3bb0',
  'I spend significant time and effort optimizing the structure of my presentation',
  'I spend significant time and effort optimizing the structure of my presentation',
  'multiple_choice',
  'structure',
  0,
  15,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 16
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'd188396e-9320-4d87-ab01-bfa32b0d3bb0',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 16
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'd188396e-9320-4d87-ab01-bfa32b0d3bb0',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 16
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'd188396e-9320-4d87-ab01-bfa32b0d3bb0',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 16
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'd188396e-9320-4d87-ab01-bfa32b0d3bb0',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 16
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'd188396e-9320-4d87-ab01-bfa32b0d3bb0',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd188396e-9320-4d87-ab01-bfa32b0d3bb0',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'd188396e-9320-4d87-ab01-bfa32b0d3bb0',
  'd188396e-9320-4d87-ab01-bfa32b0d3bb0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 17: I am good at turning examples into colorful storie...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '43acb9d0-8015-4165-b2ab-f5222e39fab4',
  'I am good at turning examples into colorful stories',
  'I am good at turning examples into colorful stories',
  'multiple_choice',
  'story',
  0,
  16,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 17
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '43acb9d0-8015-4165-b2ab-f5222e39fab4',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 17
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '43acb9d0-8015-4165-b2ab-f5222e39fab4',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 17
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '43acb9d0-8015-4165-b2ab-f5222e39fab4',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 17
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '43acb9d0-8015-4165-b2ab-f5222e39fab4',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 17
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '43acb9d0-8015-4165-b2ab-f5222e39fab4',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '43acb9d0-8015-4165-b2ab-f5222e39fab4',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '43acb9d0-8015-4165-b2ab-f5222e39fab4',
  '43acb9d0-8015-4165-b2ab-f5222e39fab4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 18: I have a good sense as to when it is better to use...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'd5d480ca-4a38-47fe-9243-207f073bbb62',
  'I have a good sense as to when it is better to use a graph over a table (and vice versa)',
  'I have a good sense as to when it is better to use a graph over a table (and vice versa)',
  'multiple_choice',
  'substance',
  0,
  17,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 18
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'd5d480ca-4a38-47fe-9243-207f073bbb62',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 18
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'd5d480ca-4a38-47fe-9243-207f073bbb62',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 18
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'd5d480ca-4a38-47fe-9243-207f073bbb62',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 18
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'd5d480ca-4a38-47fe-9243-207f073bbb62',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 18
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'd5d480ca-4a38-47fe-9243-207f073bbb62',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd5d480ca-4a38-47fe-9243-207f073bbb62',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'd5d480ca-4a38-47fe-9243-207f073bbb62',
  'd5d480ca-4a38-47fe-9243-207f073bbb62',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 19: I apply a basic understanding of the principles of...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '07d2c4f2-abd5-4218-8a4d-02b616e1ec1a',
  'I apply a basic understanding of the principles of visual perception to create more effective slides',
  'I apply a basic understanding of the principles of visual perception to create more effective slides',
  'multiple_choice',
  'style',
  0,
  18,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 19
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '07d2c4f2-abd5-4218-8a4d-02b616e1ec1a',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 19
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '07d2c4f2-abd5-4218-8a4d-02b616e1ec1a',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 19
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '07d2c4f2-abd5-4218-8a4d-02b616e1ec1a',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 19
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '07d2c4f2-abd5-4218-8a4d-02b616e1ec1a',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 19
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '07d2c4f2-abd5-4218-8a4d-02b616e1ec1a',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '07d2c4f2-abd5-4218-8a4d-02b616e1ec1a',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '07d2c4f2-abd5-4218-8a4d-02b616e1ec1a',
  '07d2c4f2-abd5-4218-8a4d-02b616e1ec1a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 20: I develop a script in advance of my most important...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'bb13464f-5851-4834-965b-8fb50daf73ef',
  'I develop a script in advance of my most important meetings',
  'I develop a script in advance of my most important meetings',
  'multiple_choice',
  'self-confidence',
  0,
  19,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 20
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'bb13464f-5851-4834-965b-8fb50daf73ef',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 20
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'bb13464f-5851-4834-965b-8fb50daf73ef',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 20
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'bb13464f-5851-4834-965b-8fb50daf73ef',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 20
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'bb13464f-5851-4834-965b-8fb50daf73ef',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 20
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'bb13464f-5851-4834-965b-8fb50daf73ef',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'bb13464f-5851-4834-965b-8fb50daf73ef',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'bb13464f-5851-4834-965b-8fb50daf73ef',
  'bb13464f-5851-4834-965b-8fb50daf73ef',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 21: I understand concepts like MECE, inductive versus ...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '566033f2-a917-4050-971f-7e90604ab8a4',
  'I understand concepts like MECE, inductive versus deductive reasoning, and the principle of abstration',
  'I understand concepts like MECE, inductive versus deductive reasoning, and the principle of abstration',
  'multiple_choice',
  'structure',
  0,
  20,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 21
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '566033f2-a917-4050-971f-7e90604ab8a4',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 21
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '566033f2-a917-4050-971f-7e90604ab8a4',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 21
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '566033f2-a917-4050-971f-7e90604ab8a4',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 21
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '566033f2-a917-4050-971f-7e90604ab8a4',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 21
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '566033f2-a917-4050-971f-7e90604ab8a4',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '566033f2-a917-4050-971f-7e90604ab8a4',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '566033f2-a917-4050-971f-7e90604ab8a4',
  '566033f2-a917-4050-971f-7e90604ab8a4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 22: I emulate scriptwriters and start with a bang to h...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'd704b72f-ef2f-4ef5-959b-b6d62efc981f',
  'I emulate scriptwriters and start with a bang to hook my audience from the very first moment',
  'I emulate scriptwriters and start with a bang to hook my audience from the very first moment',
  'multiple_choice',
  'story',
  0,
  21,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 22
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'd704b72f-ef2f-4ef5-959b-b6d62efc981f',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 22
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'd704b72f-ef2f-4ef5-959b-b6d62efc981f',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 22
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'd704b72f-ef2f-4ef5-959b-b6d62efc981f',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 22
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'd704b72f-ef2f-4ef5-959b-b6d62efc981f',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 22
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'd704b72f-ef2f-4ef5-959b-b6d62efc981f',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd704b72f-ef2f-4ef5-959b-b6d62efc981f',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'd704b72f-ef2f-4ef5-959b-b6d62efc981f',
  'd704b72f-ef2f-4ef5-959b-b6d62efc981f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 23: I am familiar with tornado diagrams and waterfall ...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '3f7d18e4-5520-476b-82d4-2a410bedb489',
  'I am familiar with tornado diagrams and waterfall & marimekko charts',
  'I am familiar with tornado diagrams and waterfall & marimekko charts',
  'multiple_choice',
  'substance',
  0,
  22,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 23
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '3f7d18e4-5520-476b-82d4-2a410bedb489',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 23
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '3f7d18e4-5520-476b-82d4-2a410bedb489',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 23
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '3f7d18e4-5520-476b-82d4-2a410bedb489',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 23
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '3f7d18e4-5520-476b-82d4-2a410bedb489',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 23
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '3f7d18e4-5520-476b-82d4-2a410bedb489',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3f7d18e4-5520-476b-82d4-2a410bedb489',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '3f7d18e4-5520-476b-82d4-2a410bedb489',
  '3f7d18e4-5520-476b-82d4-2a410bedb489',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 24: I create slides that leverage graphics and images ...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'c4510915-182b-4b1b-89ac-8a821c2bbb90',
  'I create slides that leverage graphics and images (in addition to text) to communicate my ideas',
  'I create slides that leverage graphics and images (in addition to text) to communicate my ideas',
  'multiple_choice',
  'style',
  0,
  23,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 24
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'c4510915-182b-4b1b-89ac-8a821c2bbb90',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 24
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'c4510915-182b-4b1b-89ac-8a821c2bbb90',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 24
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'c4510915-182b-4b1b-89ac-8a821c2bbb90',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 24
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'c4510915-182b-4b1b-89ac-8a821c2bbb90',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 24
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'c4510915-182b-4b1b-89ac-8a821c2bbb90',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c4510915-182b-4b1b-89ac-8a821c2bbb90',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'c4510915-182b-4b1b-89ac-8a821c2bbb90',
  'c4510915-182b-4b1b-89ac-8a821c2bbb90',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 25: I usually go well over my allotted time to speak...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '2da171b7-85ad-437c-aad0-1e5219f4dd4d',
  'I usually go well over my allotted time to speak',
  'I usually go well over my allotted time to speak',
  'multiple_choice',
  'self-confidence',
  1,
  24,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 25
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '2da171b7-85ad-437c-aad0-1e5219f4dd4d',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 25
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '2da171b7-85ad-437c-aad0-1e5219f4dd4d',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 25
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '2da171b7-85ad-437c-aad0-1e5219f4dd4d',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 25
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '2da171b7-85ad-437c-aad0-1e5219f4dd4d',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 25
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '2da171b7-85ad-437c-aad0-1e5219f4dd4d',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2da171b7-85ad-437c-aad0-1e5219f4dd4d',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '2da171b7-85ad-437c-aad0-1e5219f4dd4d',
  '2da171b7-85ad-437c-aad0-1e5219f4dd4d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 1: Fill in the blank: After taking this course, I wil...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '9eae4e81-8a91-475c-8ea4-0fbfa965e0f4',
  'Fill in the blank: After taking this course, I will be able to ________________________.',
  'Fill in the blank: After taking this course, I will be able to ________________________.',
  'text_field',
  'goals',
  0,
  0,
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9eae4e81-8a91-475c-8ea4-0fbfa965e0f4',
  'surveys',
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
  'questions',
  '9eae4e81-8a91-475c-8ea4-0fbfa965e0f4',
  '9eae4e81-8a91-475c-8ea4-0fbfa965e0f4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 2: How experienced do you feel in this course's subje...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'bd019658-869b-4f7a-829f-7785fa83d47c',
  'How experienced do you feel in this course''s subject matter?',
  'How experienced do you feel in this course''s subject matter?',
  'scale',
  'experience',
  0,
  1,
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'bd019658-869b-4f7a-829f-7785fa83d47c',
  '1 - Very inexperienced',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'bd019658-869b-4f7a-829f-7785fa83d47c',
  '2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'bd019658-869b-4f7a-829f-7785fa83d47c',
  '3',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'bd019658-869b-4f7a-829f-7785fa83d47c',
  '4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'bd019658-869b-4f7a-829f-7785fa83d47c',
  '5 - Very experienced',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'bd019658-869b-4f7a-829f-7785fa83d47c',
  'surveys',
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
  'questions',
  'bd019658-869b-4f7a-829f-7785fa83d47c',
  'bd019658-869b-4f7a-829f-7785fa83d47c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 3: What's the biggest roadblock you have with this co...
INSERT INTO payload.survey_questions (
  id,
  question,
  text,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'bb6e1646-fd4b-4461-aa74-0390f1fe8553',
  'What''s the biggest roadblock you have with this course''s subject matter right now?',
  'What''s the biggest roadblock you have with this course''s subject matter right now?',
  'text_field',
  'roadblocks',
  0,
  2,
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'bb6e1646-fd4b-4461-aa74-0390f1fe8553',
  'surveys',
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
  'questions',
  'bb6e1646-fd4b-4461-aa74-0390f1fe8553',
  'bb6e1646-fd4b-4461-aa74-0390f1fe8553',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Commit the transaction
COMMIT;
