-- Seed data for the quiz questions table
-- This file should be run after the quizzes seed file to ensure the quizzes exist
-- Updated to store options directly in the quiz_questions table as JSONB array
-- matching the collection definition. Using jsonb_build_array and dollar-quoting.

-- Start a transaction
BEGIN;

-- Questions for quiz: Standard Graphs Quiz (basic-graphs-quiz, ID: c11dbb26-7561-4d12-88c8-141c653a43fd)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'cd01c3f9-b427-4526-a27d-1d1f1bf84d68',
  $$There are many types of relationships that we use graphs to display. What chart type best communicates the 'Part-to-Whole' relationship?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Line Charts$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Scatter Plots$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Maps$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Box Plot$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Bar charts$$, 'isCorrect', true)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '85d52720-7e76-4966-80a4-5ab1f34d94bc',
  $$What chart type best communicates the 'Correlation' relationship?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Line Charts$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Scatter Plots$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Maps$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Box Plot$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Bar Charts$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'a837d583-eafe-4c51-8ec6-95e08348d8c8',
  $$What chart type best communicates the 'Time Series' relationship?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Line Charts$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Scatter Plots$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Maps$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Box Plot$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Bar Charts$$, 'isCorrect', false)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '6e43ad37-f92b-4f0a-852f-6ee09b2c24f5',
  $$What chart types best communicates the 'Deviation' relationship?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Line Charts$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Scatter Plots$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Maps$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Box Plot$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Bar Charts$$, 'isCorrect', true)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '474c22bb-959d-4716-9b7b-89e01eca31d0',
  $$What chart type best communicates the 'Distribution' relationship?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Line Charts$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Scatter Plots$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Maps$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Box Plot$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Bar Charts$$, 'isCorrect', false)
  ),
  '', 4, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '91a5b94b-3cd3-4485-8e89-a0dba13ca9e2',
  $$What chart type best communicates the 'Nominal Comparison' relationship$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Line Chart$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Scatter Plot$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Map$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Box Plot$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Bar Chart$$, 'isCorrect', true)
  ),
  '', 5, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '0c13fb7a-23dc-46f4-8755-7658939b1695',
  $$What chart type best communicates the 'Geospatial' relationship?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Line Chart$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Scatter Plot$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Map$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Box Plot$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Bar Chart$$, 'isCorrect', false)
  ),
  '', 6, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '3bad5025-4ccc-44c9-9371-c1dc7139d554',
  $$When should we use Pie Charts?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$For part-to-whole relationships.$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$For time series relationships$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$For nominal comparison relationships$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Never.$$, 'isCorrect', true)
  ),
  '', 7, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: The Fundamental Elements of Design in Detail Quiz (elements-of-design-detail-quiz, ID: 42564568-76bb-4405-88a9-8e9fd0a9154a)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '9861e067-9bf9-45bf-aa4f-0c8c8a4deee7',
  $$Why do we use contrast?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To make our computer monitor easier to read$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To fill up space$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Our eyes like it. It looks good$$, 'isCorrect', true)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '9d48eb08-a169-42af-853d-81e97a7a18ba',
  $$How important is alignment?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Critically important (make sure you have learned how to use PowerPoint's alignment tools)$$, 'isCorrect', true)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '76449f48-2fed-4ab5-9ecb-c158ffd69217',
  $$How is the principle of proximity helpful?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Helps us understand how groups are created (intentionally or unintentionally)$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Allows us to squeeze more onto the page$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Helps us get to know people$$, 'isCorrect', false)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '5a81db7e-6442-48e4-aa76-068d0005137f',
  $$How many different font types should you use in a single presentation?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$As many as you can$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$4$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$1$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$2$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$3$$, 'isCorrect', false)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'cf7b7bd2-d63a-4df7-9cc6-13fb428ea4ee',
  $$How many colors should we use in a presentation?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$2 more than the number of fonts$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$7$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$4 to 5$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$2 to 3$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$1$$, 'isCorrect', false)
  ),
  '', 4, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '551cd53f-1e87-4754-9a79-530894410287',
  $$What should you do with whitespace?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Ensure you are using enough of it$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Color it blue, it is prettier$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Fill it up with text!$$, 'isCorrect', false)
  ),
  '', 5, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Overview of Fact-based Persuasion Quiz (fact-persuasion-quiz, ID: 791e27de-2c98-49ef-b684-6c88667d1571)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'eb7da40e-44da-4fed-863d-35fb4cbd8837',
  $$What is the bare assertion fallacy?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A premise in an argument that is assumed to be true merely because it says that it is true$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A Dan Brown novel$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Claiming to be right because you say you are right$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A dream where you are presenting naked$$, 'isCorrect', false)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '513ceeab-b02c-4072-92cb-60c31058691b',
  $$What is graphical excellence?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Beautiful$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Honest$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Multivariate$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Efficient$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Complicated$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Curved$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Gestalt Principles of Visual Perception Quiz (gestalt-principles-quiz, ID: 3c72b383-e17e-4b07-8a47-451cfbff29c0)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '804f35a3-875e-4d49-869a-5bdb85989534',
  $$Why have we repeated the principle of proximity in this lesson and the previous lesson?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Didn't notice. The course is brilliant. Carry on!$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Because repetition ad nauseum helps me learn?...$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Yo lazy$$, 'isCorrect', false)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '2e62e970-c4ac-4d05-b6a7-dad81250e986',
  $$The principle of similarity states that we tend to group things which share visual characteristics such as:$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Size$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Shape$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Color$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Orientation$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Sound$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Length$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Distance$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '52d80636-f0c3-4442-8347-9db8aadca929',
  $$What is symmetry associated with?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Stability$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Consistency$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Structure$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Rhythm$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Twins$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Music$$, 'isCorrect', false)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'f413516d-0a53-4fa6-853d-cc03cf5b9c0b',
  $$What does the principle of connection state?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Elements that are visually connected are perceived as more related than elements with no connection$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$We need to connect our most important ideas$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$I just can't make no connection$$, 'isCorrect', false)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Idea Generation Quiz (idea-generation-quiz, ID: a84d3844-8c19-4c82-8a98-902c530a1a99)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '70d953b9-8cc8-4837-833e-5c7a6ad81a20',
  $$What is the key to making brainstorming as effective as possible?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Conduct brainstorming sessions early in the day$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Eat lots of sugar$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Don't use brainstorming, it doesn't work$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Engage in debate and dissent$$, 'isCorrect', true)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '35c01b75-5e0c-460b-af2b-c2c41e88b391',
  $$What are our Cardinal Rules of brainstorming?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Plan your participants$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Focus on ideas$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Structure the session$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Establish rules in advance$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Free associate$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Only invite the single people$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Focus on having fun$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Eat, drink, and be merry$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Conduct sessions on a Friday$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '89cfb8fd-79d6-41a5-9202-517963d38cb9',
  $$What was the golden rule talked about in this lesson?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Facts known by the audience go in the Introduction$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$We are creating our presentation to answer a question in the mind of our audience$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Our audience is the hero$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Our objective is to compel our audience to do something$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Follow a process$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Create ideas first, slides second$$, 'isCorrect', true)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: The Why (Introductions) Quiz (introductions-quiz, ID: b75e29c7-1d9f-4f41-8c91-a72847d13747)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '7c8bc078-fd9d-414f-aad1-44c5eb1ca3c2',
  $$Hypothetical example: We are in the finance department and are giving an update. What is the best way for us to frame our presentation?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Finance update$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Cost cutting recommendations$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Quarterly review$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How did we perform last quarter, and what do we need to do differently?$$, 'isCorrect', true)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '81e96916-d43a-48bd-9830-adb4dc203114',
  $$Why are we creating our presentation?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To sell our product to a customer$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To answer a question in the mind of our audience$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To practice our PowerPoint skills$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To raise money for our start-up$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Becuase we have been asked to by our boss$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '2c43066e-8ba3-4e56-a593-ee7be3dd6731',
  $$What are they four parts to our introduction?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Context$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Catalyst$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Beginning$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$End$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Middle$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The Why$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Answer$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Question$$, 'isCorrect', true)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '430848dc-4a9a-4a45-acf9-decdf9224ad5',
  $$What is the Context part of the Introduction?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The objective of the presentation$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The background to the presentation that includes facts already known to your audience$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The answer to the question$$, 'isCorrect', false)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '48419040-d6fe-4295-acfd-2de626ff5432',
  $$What is the Catalyst portion of the Introduction?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$An event or trigger, sometimes referred to as the complication$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The techniques that speed-up the development of a presentation$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A leading presentation development platform$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What happened or changed that created the need for you to write this presentation$$, 'isCorrect', true)
  ),
  '', 4, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '5a123e41-d963-435d-a41a-6dd107ba4763',
  $$What is the Question portion of the Introduction?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What we are trying to plant in the mind of the audience with the context and catalyst portions of the Introduction$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The natural question that arises in the mind of the audience$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The ''topic'' of the presentation$$, 'isCorrect', true)
  ),
  '', 5, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Our Process Quiz (our-process-quiz, ID: 5a8d6b7c-9e2f-4d3a-8b1c-0f9a2e4d5c6b)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'e937888c-5c00-4f38-bd3b-f8177f2958f6',
  $$Why is it important to follow a process to develop a presentation?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$If you are really good, you don't need to follow a process!$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Because creating presentations is all about left brain thinking$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Because there is not such thing as creativity$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Because it is very easy to focus on the wrong thing, and be led astray$$, 'isCorrect', true)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'f12ce635-30be-44ba-b60b-f83808a64241',
  $$What is the 1st step of our process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Who is our audience?$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Why are we speaking to our audience (identify their question)?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What is our answer?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How will we deliver this presentation?$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '6e1c58d6-fa2a-4abd-a87d-637dcc5937ba',
  $$What is the 2nd step of our process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Who is our audience?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Why are we speaking to our audience (identify their question)?$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What is our answer?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How will we deliver this presentation?$$, 'isCorrect', false)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '262b193c-b494-4aaa-868a-1b52cdd98c34',
  $$What is the 3rd step of our process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Who is our audience?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Why are we speaking to our audience (identify their question)?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What is our answer?$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How will we deliver this presentation?$$, 'isCorrect', false)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '3d65df89-ba7b-4039-816b-f6a86ed6fb4a',
  $$What is the 4th step of our process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Who is our audience?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Why are we speaking to our audience (identify their question)?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What is our answer?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How will we deliver this presentation?$$, 'isCorrect', true)
  ),
  '', 4, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '2f7a2198-6da3-41f9-a394-c002c9218834',
  $$Our first step is 'The Who'. What do we mean by this?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Determine who your audience truly is. Who are you speaking to?$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The Who is a famous English rock band$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Determining our answer to a key question$$, 'isCorrect', false)
  ),
  '', 5, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '544f2d62-5cf3-403b-aba0-e972bf5230e0',
  $$The second step in our process is 'The Why'. What do we mean by this?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Determine the question inside the mind of our audience and what we want the audience to do a the end$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Determine our personal objective from creating the presentation$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A process of deep existential soul searching to ensure you are a confident speaker$$, 'isCorrect', false)
  ),
  '', 6, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'eba73326-9b97-4afb-a1c8-5ab78b4aa422',
  $$The third step in our process is 'The What'. What does 'The What' focus on?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Themes from Biggie Smalls'' debut album ''Ready to Die'' which featured ''The What'' on track 9$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Determining what types of slides we need to create$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Determining what it is we want our Audience to do as a result of the presentation$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Determining the answer to the question that has been planted in the mind of the audience$$, 'isCorrect', true)
  ),
  '', 7, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'fef27c73-e8f1-4285-817b-ec73b7135ad1',
  $$The final step in our process is 'The How'. What is the focus of 'The How'?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How to create beautiful slides$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How to answer our audience's question$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$This is how we do it!$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How we will deliver the presentation$$, 'isCorrect', true)
  ),
  '', 8, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Overview of the Fundamental Elements of Design Quiz (overview-elements-of-design-quiz, ID: c7d8e9f0-a1b2-3c4d-5e6f-7a8b9c0d1e2f)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '1044fc96-82b5-4fab-8796-6836bd26d926',
  $$What are some of the fundamental elements and principles of design?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Shape & Form$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Rick Astley$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Color$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Composition$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Contrast$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Line$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Point$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Negative Space$$, 'isCorrect', true)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Performance Quiz (performance-quiz, ID: 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'd07bcf9b-d2bb-4b7e-9904-560e05d76d83',
  $$What can we do to try and set the right tone?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Send a well prepared agenda in advance$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Dress appropriately$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Adopt the appropriate disposition for the meeting$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Tell a joke$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Lead the group in song$$, 'isCorrect', false)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'd558f5a8-8f2f-4a19-81e9-b0a351e1b2a8',
  $$What are some things you can do to manage stress?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Quite your mind$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Laugh$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Primal therapy$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Prepare$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Breathe$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Don't worry about the presentation until the last minute$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Talk to yourself like a crazy person$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '16738dcb-4705-4ad2-9708-fb241f22574a',
  $$What body language and delivery mistakes should you be on the lookout for?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Verbal ticks$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Talking to the screen$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Closed posture$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Being over prepared$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Not displaying any emotion$$, 'isCorrect', true)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Perparation & Practice Quiz (preparation-practice-quiz, ID: f1e2d3c4-b5a6-9876-5432-1098f7e6d5c4)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '9fdfc27e-9482-4913-81d9-e6dfd78bbeba',
  $$When preparing and practicing the delivery of your presentation, what four factors should you focus on?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Timing of your jokes$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Clarity$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Hair, make-up and clothes$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Pace$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Engaging with the audience$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Timbre of your voice$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Smiling and making eye contact$$, 'isCorrect', true)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'de0042d7-d5f8-4cd0-a7dd-c43d086ff4f9',
  $$What is the first step of the recommended preparation process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Get a good night sleep and review the script once, maybe twice before the presentation$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Present to someone else. Get feedback$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the presentation two or three time working on length, simplifying language, and identifying likely questions$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Write down the verbal voice over and create a formal script$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Test the length of the presentation. Revise the deck, eliminating or combining slide ideas$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the script a few more times and the put it aside$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '26739c2c-56c2-48b2-8699-1f4a02784846',
  $$What is the second step of the recommended preparation process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Get a good night sleep and review the script once, maybe twice before the presentation$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Present to someone else. Get feedback$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the presentation two or three time working on length, simplifying language, and identifying likely questions$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Write down the verbal voice over and create a formal script$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Test the length of the presentation. Revise the deck, eliminating or combining slide ideas$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the script a few more times and the put it aside$$, 'isCorrect', false)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '983a0625-a2b8-4020-954f-0120aacba00a',
  $$What is the third step of the recommended preparation process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Get a good night sleep and review the script once, maybe twice before the presentation$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Present to someone else. Get feedback$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the presentation two or three time working on length, simplifying language, and identifying likely questions$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Write down the verbal voice over and create a formal script$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Test the length of the presentation. Revise the deck, eliminating or combining slide ideas$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the script a few more times and the put it aside$$, 'isCorrect', false)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '4b951049-4e15-4cb0-b048-3db4d691255c',
  $$What is the fourth step of the recommended preparation process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Get a good night sleep and review the script once, maybe twice before the presentation$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Present to someone else. Get feedback$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the presentation two or three time working on length, simplifying language, and identifying likely questions$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Write down the verbal voice over and create a formal script$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Test the length of the presentation. Revise the deck, eliminating or combining slide ideas$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the script a few more times and the put it aside$$, 'isCorrect', false)
  ),
  '', 4, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'b5a552f4-050a-4fc2-a4d2-f892bdeb2294',
  $$What is the fifth step pf the recommended preparation process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Get a good night sleep and review the script once, maybe twice before the presentation$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Present to someone else. Get feedback$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the presentation two or three time working on length, simplifying language, and identifying likely questions$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Write down the verbal voice over and create a formal script$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Test the length of the presentation. Revise the deck, eliminating or combining slide ideas$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the script a few more times and the put it aside$$, 'isCorrect', false)
  ),
  '', 5, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '5da8fb96-f481-43f5-ae53-659c97e5b795',
  $$What is the sixth step of the recommended preparation process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Get a good night sleep and review the script once, maybe twice before the presentation$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Present to someone else. Get feedback$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the presentation two or three time working on length, simplifying language, and identifying likely questions$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Write down the verbal voice over and create a formal script$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Test the length of the presentation. Revise the deck, eliminating or combining slide ideas$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the script a few more times and the put it aside$$, 'isCorrect', true)
  ),
  '', 6, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'c55c5774-b0a4-4144-a742-3cd46a984a4f',
  $$What is the seventh step of the recommended preparation process?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Get a good night sleep and review the script once, maybe twice before the presentation$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Present to someone else. Get feedback$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the presentation two or three time working on length, simplifying language, and identifying likely questions$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Write down the verbal voice over and create a formal script$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Test the length of the presentation. Revise the deck, eliminating or combining slide ideas$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Run through the script a few more times and the put it aside$$, 'isCorrect', false)
  ),
  '', 7, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Slide Composition Quiz (slide-composition-quiz, ID: a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'ceec5eb2-d618-43c4-8f9c-78897f4998ce',
  $$What goes in the headline?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Your footnotes$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Your voice-over script$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Your slide title$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The main message of the slide$$, 'isCorrect', true)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'eaa3bbc0-261c-4dc2-9048-f4e533079018',
  $$What goes in the body of the slide?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The supporting evidence that supports the main message$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Text$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Charts$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Clip art$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '92fcaf84-9e1a-4be9-8061-4cc7a32f5561',
  $$What is a swipe file?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Collection of useful slide designs and frameworks that you can utilize for inspiration$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Hacker code to get free templates$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Where you store illicit data$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Another name for a garbage can$$, 'isCorrect', false)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'ed7919e8-1a3c-4bcc-9f9c-9ecbe5dc1cc9',
  $$When is the best time to use clip art?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Never$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$In marketing and sales presentations, but not in finance presentations$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$No restrictions$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$When the clip art is of a cute cat$$, 'isCorrect', false)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'fce7779c-e79a-4f77-84af-c165c2ccd5e2',
  $$What elements can be repeated on all slides?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Company logo$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Location for a headline$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Location for footnotes$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Trademark and confidentiality messages$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Banners$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Location  for page numbers$$, 'isCorrect', true)
  ),
  '', 4, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Specialist Graphs Quiz (specialist-graphs-quiz, ID: d4c3b2a1-f6e5-8a7b-9c0d-1e2f3a4b5c6d)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '2be4078b-d3e5-4a31-89df-30e5e7006e66',
  $$What do we use Tornado diagrams for?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Composition of markets$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Nominal comparison$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Sensitivity analysis$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To display how several variables change over time$$, 'isCorrect', false)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '98e29446-d063-4c4b-b9a4-bcc676d8c8f3',
  $$When do we use a Bubble Chart?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$For nominal comparisons$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$When your scatter plot is ugly$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$When you want to show three variables$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To show a time series$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'f1448bc2-6467-4389-9ad4-2f047ad8423e',
  $$What chart types should we try and avoid using?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Donut Chart$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Waterfall Chart$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Pie Chart$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Circle chart$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Anything 3-D$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Merimekko Chart$$, 'isCorrect', false)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '22030887-66b9-4443-b2a7-68f2f9aa4380',
  $$What is the best use of a Waterfall Chart?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To show a time series$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To show how increases and decreases in a balance affect that balance over time$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To show a part-to-whole relationship$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$As a fancy nominal comparison bar chart$$, 'isCorrect', false)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '2f7792ed-8e41-46bb-8078-9396eb0aaa27',
  $$What is one of the more common uses of a Marimekko Chart?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To confuse our audience$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To show a time series$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To show data on the Finnish textile industry$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To display the composition of markets$$, 'isCorrect', true)
  ),
  '', 4, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '7efdfa17-cc9c-4571-9944-9deece95a32f',
  $$What are Motion Charts used for?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To explore how several variables change over time$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Sensitivity analysis$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Nominal comparison$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Composition of markets$$, 'isCorrect', false)
  ),
  '', 5, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Storyboards in Film Quiz (storyboards-in-film-quiz, ID: 1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'd47c3f7b-70ef-43e7-93b8-51af5277c521',
  $$What is a storyboard?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A blueprint of the movie$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A cardboard board to pin up cartoon drawings$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What happens when you are subject to a boring story$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A Landyachts longboard design$$, 'isCorrect', false)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '63d41ee5-0cc8-41d9-9d9f-a7cfa4ec8695',
  $$Who invented storyboards?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Steve Jobs$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$John Lasseter$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Eric Goldberg$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Walt Disney$$, 'isCorrect', true)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'e0db9c42-3f72-463e-b762-11bc56ea73cd',
  $$What was the great innovation of storyboarding?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The introduction of sound (Talkies)$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Allowed film makers to edit the film before making it$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The introduction of color$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The ability to draw your story$$, 'isCorrect', false)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Storyboards in Presentations Quiz (storyboards-in-presentations-quiz, ID: a6b5c4d3-e2f1-0a9b-8c7d-6e5f4a3b2c1d)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '2586a170-d406-41c1-960e-76c807c59801',
  $$What are the two approaches discussed in the lesson?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Black & white and full color$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Animated and static$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Hand-drawn and computer assisted$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Text-based outlining and storyboarding$$, 'isCorrect', true)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'e430ee32-6d08-45be-b16c-4a63d4ddb825',
  $$What tools are recommended to use for storyboarding?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A stone tablet and chisel$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$PowerPoint$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Adobe Edge Animate$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Pen and paper$$, 'isCorrect', true)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: What is Structure? Quiz (structure-quiz, ID: c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '81d527a3-f6c1-4e02-ad45-849d4ee40e3b',
  $$What is the principle of Abstraction?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A grouping principle, whereby a hierarchy is adhered to with higher levels of abstraction (less detail) placed near the top, with more specific concepts underneath $$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A John Grisham novel$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$An approach whereby we simplify our question so profoundly that we reach a level of enlightenment$$, 'isCorrect', false)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '1afedce0-b82e-4ffd-aeb8-b4b17724f894',
  $$Which lists are MECE (pick 2)$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Profit=revenue minus expenses$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Star Wars films: New Hope, Empire, Revenge of the Sith$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The global population broken down into age groups of 0-20 year-olds, 21-40 year-olds, 41-60 year-olds, 61-80 year-olds, and 81 and over$$, 'isCorrect', true)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'e3efc846-c4dc-418c-8452-98644c1e8b57',
  $$What are the three Golden Rules to follow when applying the principle of abstraction and organizing your ideas?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Concepts should be arranged in the shape of a triangle$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Concepts at any level must be presented in a strict logical order$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Concepts in any group are always the same kind of idea$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Concepts or ideas at any level of your argument must be more abstract summaries of the concepts that are grouped below$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Concepts must be ordered alphabetically$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Ideas should be clever$$, 'isCorrect', false)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '92c122a5-b54c-4741-8464-b01e865648fa',
  $$Match the argument with whether it is deductive or inductive: 'Jill and Bob are friends. Jill likes to dance, cook and write. Bob likes to dance and cook. Therefore it can be assumed he also likes to write.$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Deductive$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Inductive$$, 'isCorrect', true)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '563dee08-0058-4fcb-a9d5-aca66e0675a0',
  $$Match the argument with whether it is deductive or inductive: 'All dogs are mammals. All mammals have kidneys. Therefore all dogs have kidneys.$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Inductive$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Deductive$$, 'isCorrect', true)
  ),
  '', 4, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '0a7fcdf6-2c26-4272-801a-d037946fac20',
  $$What is the rule of 7 (updated)?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$There is no such thing as 7 or 9 of anything. We should seek to structure our ideas into groups of 4-5 or less$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Rule for calculating compound interest$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Organize your ideas into groups of 7$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Movie staring Brad Pitt$$, 'isCorrect', false)
  ),
  '', 5, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Tables vs Graphs Quiz (tables-vs-graphs-quiz, ID: f4e3d2c1-b6a5-8d7c-0e9f-5a4b3c2d1e0f)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '49b524ea-19cf-4cf9-a3e7-c7f49b3ce767',
  $$What are the two defining characteristics of Tables?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Information is encoded as text (words and numbers)$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$They are black and white$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$They are not as nice to look at as graphs$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$They are arranged in columns and rows$$, 'isCorrect', true)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '17075e05-b7b6-4978-8025-147842f6337d',
  $$What re some of the primary benefits of a table?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Tables make it easy to look up individual values$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Tables make it easy to compare pairs of related values$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Textual encoding provides a level of precision that you cannot get in graphs$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Tables are easier to create than graphs$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Tables can handle larger data sets than graphs$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '97d252f3-a7b5-41ab-bbbc-f6457d99ef4e',
  $$What are some of the characteristics that define graphs?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Information is encoded as text (words and numbers)$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Axes provide scales (quantitative and categorical) that are used to label and assign value to the visual objects$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$They are nicer to look at than tables$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$They are typically in color$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Values are encoded as visual objects in relation to the axis$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Values are displayed within an area delineated by one or more axis$$, 'isCorrect', true)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '5a00e6fa-81dd-4adb-a881-6aa820eace27',
  $$When should you use graphs?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$When the message or story is contained in the shape of the data$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$When the display will be used to reveal relationships among whole sets of values$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$When you need to ''sex-up'' a slide$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$When you have production support and they can create the graph for you$$, 'isCorrect', false)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: The Who Quiz (the-who-quiz, ID: d5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'a9e9b4bd-ead5-43ef-ac52-13585ba09f57',
  $$Who is the hero of our presentation?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Batman baby!$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$I am dammit!$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The audience$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Superman owns Batman$$, 'isCorrect', false)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'eca538ee-0a37-4967-98ac-b2186adb5c72',
  $$What is the Audience Map used for?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To be used to find your presentation venue. X marks the spot.$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To help identify the main decision maker$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To develop a strategic approach for engaging with your 'room'$$, 'isCorrect', true)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '82d249e9-7d95-49cc-99b7-76578e8e0643',
  $$What are the 4 quadrants of the Audience Map?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Senior, Junior, Advocate, Foe$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Personality, Power, Access, Resistance$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Friend, Foe, Advocate, Neutral$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$North, South East and West$$, 'isCorrect', false)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '0c09da5c-fff3-41f1-9505-da246426eb4e',
  $$Pick the question that corresponds with the 'Personality' quadrant$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How do decisions get made?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What is their style, energy level, and emotional state?$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Who are your 'friends in court'?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How does your audience like to consume information?$$, 'isCorrect', false)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'b7ccad07-70f8-4dc9-a7f7-42152391eaca',
  $$Pick the question that corresponds with the 'Access' quadrant$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How does your audience like to consume information?$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What is their style, energy level, and emotional state?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How do decisions get made?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Who are your 'friends in court'?$$, 'isCorrect', false)
  ),
  '', 4, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '7c271ff2-e251-472c-8772-0cbc3928c4df',
  $$Pick the question that corresponds with the 'Power' quadrant$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How does your audience like to consume information?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Who are your 'friends in court'?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How do decisions get made?$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What is their style, energy level, and emotional state?$$, 'isCorrect', false)
  ),
  '', 5, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'bc77d985-46bd-445e-bbdd-f089f8a4bcc6',
  $$Pick the question that corresponds with the 'Resistance' quadrant$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How does your audience like to consume information?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Who are your 'friends in court'?$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$How do decisions get made?$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$What is their style, energy level, and emotional state?$$, 'isCorrect', false)
  ),
  '', 6, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Using Stories Quiz (using-stories-quiz, ID: a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d5)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '2bf3a20e-e707-4d61-88f0-be78e56fce7d',
  $$Why are stories like a cup?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Because they are the brain's natural container for information$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Because they are simple and straightforward$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Because you can put in them whatever you like$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Because they are delicate, and need to be handled carefully$$, 'isCorrect', false)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '7b635d60-8dbd-4786-b63e-6dbec5450f17',
  $$What do stories add to our presentations? Why should be use them?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Stories stop disagreement$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Stories make people laugh$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Stories lull your audience to sleep$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Stories make your message more memorable$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Stories increase trust$$, 'isCorrect', true)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '79543cce-1051-408d-a767-f198184244e6',
  $$What characteristics make stories memorable?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Concreteness$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Unexpectedness$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Credibility$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Simplicity$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Emotion$$, 'isCorrect', true)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: Visual Perception and Communication Quiz (visual-perception-quiz, ID: f9e8d7c6-b5a4-3210-f9e8-d7c6b5a43210)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'fc904a38-82f9-43aa-a0fd-1ae817d2c1dd',
  $$What is visual thinking?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Doodling$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$The phenomenon of thinking through visual processing$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A thought cloud$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Complex visual charts$$, 'isCorrect', false)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '2ce69acb-8d3f-41b3-9851-7cd5cd508dc8',
  $$Match the type of mental processing with the characteristic: 'Conscious, sequential, and slow/hard'$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Attentive processing$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Pre-attentive processing$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'adb4e50f-a262-47e9-b4a3-bc61eec40ae5',
  $$Match the type of mental processing with the characteristic: 'Below the level of consciousness, very rapid'$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Attentive processing$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Pre-attentive processing$$, 'isCorrect', true)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '74794823-dcb6-4f2d-a964-3e94f5863f5d',
  $$What are the visual attribute triggers of pre-attentive processing?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Length$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$3D position$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Color$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Size$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Motion$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Hue$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Texture$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Shape$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Width$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Orientation$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Enclosure$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$2D position$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Intensity$$, 'isCorrect', true)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Questions for quiz: The Why (Next Steps) Quiz (why-next-steps-quiz, ID: e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3)
INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '34dd66c5-562c-40f0-adea-7f36d2a0aed4',
  $$Who is Cicero?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$A PowerPoint macro$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Some Italian dude who wasn't nearly as effective as Demosthenes$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$Drake's blind brother$$, 'isCorrect', false)
  ),
  '', 0, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  '1c418096-f1fb-4f11-b962-2b109a0af007',
  $$What is the ultimate objective of our presentation?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To prompt action!$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To get it over with$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$To get praise for our slick PowerPoint skills$$, 'isCorrect', false)
  ),
  '', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'e0b655e4-9165-4c1a-b90b-fe594739ac90',
  $$Which of the following are reasonable next steps to follow your presentation?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$For your to develop a full proposal for the customer$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$For the customer to test your software as part of a trial$$, 'isCorrect', true),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$For the customer to schedule a follow-up demo with field staff$$, 'isCorrect', true)
  ),
  '', 2, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payload.quiz_questions (
  id, question, type, options, explanation, "order", created_at, updated_at
) VALUES (
  'cf35debf-358c-4c43-89d7-61d541610693',
  $$Where should the next steps go in your presentation?$$,
  'multiple_choice',
  jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$In your introduction, that is why you need to identify them at the beginning$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$In the footnotes$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$In a follow-up email$$, 'isCorrect', false),
    jsonb_build_object('id', gen_random_uuid()::text, 'text', $$At the end of the presentation, but we need to identify their nature early as it might inform the development of the rest of the presentation$$, 'isCorrect', true)
  ),
  '', 3, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Commit the transaction
COMMIT;
