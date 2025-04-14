-- Seed data for the media table
-- This file should be run after the migrations to ensure the media table exists

-- Start a transaction
BEGIN;

-- Insert media for /cms/images/basic-graphs/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '7f0f3fd6-839f-4316-943f-bffe9f8f3b8f',
  'standard graphs',
  'standard_graphs.png',
  'image/png',
  0,
  'https://images.slideheroes.com/standard_graphs.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/gestalt-principles/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '687a08b7-f3ad-47bd-a508-acad430a9d55',
  'gestalt principles of perception',
  'gestalt_principles_of_perception.png',
  'image/png',
  0,
  'https://images.slideheroes.com/gestalt_principles_of_perception.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/idea-generation/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'f9482dd0-195c-40be-9935-b55b69611f1b',
  'idea generation',
  'idea_generation.png',
  'image/png',
  0,
  'https://images.slideheroes.com/idea_generation.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/lesson-0/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'c911ea70-c5a8-4402-8a49-0f284cddb180',
  'lesson zero',
  'lesson_zero.png',
  'image/png',
  0,
  'https://images.slideheroes.com/lesson_zero.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/our-process/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'cf243f6a-36a8-4599-aef6-b8ce1b54418f',
  'our process',
  'our_process.png',
  'image/png',
  0,
  'https://images.slideheroes.com/our_process.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/fundamental-design-overview/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'bb97aa53-88a6-472c-aca4-78a5732ada6e',
  'overview elements design',
  'overview_elements_design.png',
  'image/png',
  0,
  'https://images.slideheroes.com/overview_elements_design.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/performance/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'e200c957-4552-4a17-a54a-a72a2539fda0',
  'performance',
  'performance.png',
  'image/png',
  0,
  'https://images.slideheroes.com/performance.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/preparation-practice/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'd311bbd2-cb06-4984-aeff-fd30003f8344',
  'preparation practice',
  'preparation_practice.png',
  'image/png',
  0,
  'https://images.slideheroes.com/preparation_practice.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/skills-self-assessment/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'e4e81809-9905-4a65-8daf-92ea7fe3b4e3',
  'self assessment',
  'self_assessment.png',
  'image/png',
  0,
  'https://images.slideheroes.com/self_assessment.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/slide-composition/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '33fcc5f1-f82a-43f2-8668-e9354ae33810',
  'slide composition',
  'slide_composition.png',
  'image/png',
  0,
  'https://images.slideheroes.com/slide_composition.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/specialist-graphs/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '40fedb80-11ef-42f0-be56-9013bc80bf6f',
  'specialist graphs',
  'specialist_graphs.png',
  'image/png',
  0,
  'https://images.slideheroes.com/specialist_graphs.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/storyboards-film/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '387ae9c1-09c1-4a82-a865-51abb4f85cfd',
  'storyboards in film',
  'storyboards_in_film.png',
  'image/png',
  0,
  'https://images.slideheroes.com/storyboards_in_film.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/storyboards-presentations/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '3780db29-99a2-4b19-b8d1-1b69619c2b6e',
  'storyboards in presentations',
  'storyboards_in_presentations.png',
  'image/png',
  0,
  'https://images.slideheroes.com/storyboards_in_presentations.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/tables-vs-graphs/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '06476442-bf96-46df-ab22-512a421b117e',
  'tables vs graphs',
  'tables_vs_graphs.png',
  'image/png',
  0,
  'https://images.slideheroes.com/tables_vs_graphs.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/the-who/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '20a1fe91-bae3-47b9-9208-d2bb2f4df24e',
  'the who',
  'the_who.png',
  'image/png',
  0,
  'https://images.slideheroes.com/the_who.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/the-why-introductions/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '4c1e8035-1eb1-4bba-be99-24f3808326b7',
  'the why introductions',
  'the_why_introductions.png',
  'image/png',
  0,
  'https://images.slideheroes.com/the_why_introductions.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/the-why-next-steps/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '88ae0836-e5c3-4398-b115-3eebef32d051',
  'the why next steps',
  'the_why_next_steps.png',
  'image/png',
  0,
  'https://images.slideheroes.com/the_why_next_steps.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/tools-and-resources/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'a4612cc1-aaa8-4637-a9b5-5224498f6d39',
  'tools resources',
  'tools_resources.png',
  'image/png',
  0,
  'https://images.slideheroes.com/tools_resources.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/using-stories/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '839b212d-68d5-4960-b9ef-c5cff0db28c8',
  'using stories',
  'using_stories.png',
  'image/png',
  0,
  'https://images.slideheroes.com/using_stories.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/visual-perception/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '4cd164fc-33a3-47ee-aaeb-c5d847805c6c',
  'visual perception',
  'visual_perception.png',
  'image/png',
  0,
  'https://images.slideheroes.com/visual_perception.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/fact-based-persuasion/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'b7c228f6-eac4-4dcc-a2b1-5c9f35b2bf8b',
  'fact based persuasion overview',
  'fact_based_persuasion_overview.png',
  'image/png',
  0,
  'https://images.slideheroes.com/fact_based_persuasion_overview.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/what-is-structure/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '754278cb-ed7e-466a-8a74-e12de3153acb',
  'what structure',
  'what_structure.png',
  'image/png',
  0,
  'https://images.slideheroes.com/what_structure.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/before-we-begin/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '06b35d2b-c7dc-4d53-ba61-38dfcc9bfdbe',
  'before we begin',
  'before_we_begin.png',
  'image/png',
  0,
  'https://images.slideheroes.com/before_we_begin.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/fundamental-design-detail/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '7a26604c-2205-4219-af20-1141df03ad30',
  'detail elements of design',
  'detail_elements_of_design.png',
  'image/png',
  0,
  'https://images.slideheroes.com/detail_elements_of_design.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/art-craft-business-presentation-creation/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'b0175b34-3580-41a4-b6ad-d4a7f8fca845',
  'Art Craft of Presentation Creation',
  'Art Craft of Presentation Creation.png',
  'image/png',
  0,
  'https://images.slideheroes.com/Art Craft of Presentation Creation.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/pitch-deck/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '22cfd1ad-0d53-4d53-b1d0-9fb0624e872c',
  'pitch-deck-image',
  'pitch-deck-image.png',
  'image/png',
  0,
  'https://images.slideheroes.com/pitch-deck-image.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/powerpoint-presentations-defense/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '1e294d7b-1d01-4a63-b815-f98f21a32a16',
  'Defense of PowerPoint',
  'Defense of PowerPoint.png',
  'image/png',
  0,
  'https://images.slideheroes.com/Defense of PowerPoint.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/presentation-review-bcg/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '8642fb5a-84a0-4a1f-975d-bb99a152e018',
  'BCG-teardown-optimized',
  'BCG-teardown-optimized.jpg',
  'image/jpeg',
  0,
  'https://images.slideheroes.com/BCG-teardown-optimized.jpg',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/presentation-tips/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  'dc4dcdfd-00b9-442b-9b9b-4e4f52d844a2',
  'Presentation Tips Optimized',
  'Presentation Tips Optimized.png',
  'image/png',
  0,
  'https://images.slideheroes.com/Presentation Tips Optimized.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/presentation-tools/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '1af66bcb-531d-4edd-ac14-4defd31e4086',
  'Presentation Tools-optimized',
  'Presentation Tools-optimized.png',
  'image/png',
  0,
  'https://images.slideheroes.com/Presentation Tools-optimized.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/public-speaking-anxiety/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '8e5a8e51-be56-4af0-bb8e-175ffdb7e4f1',
  'Conquering Public Speaking Anxiety',
  'Conquering Public Speaking Anxiety.png',
  'image/png',
  0,
  'https://images.slideheroes.com/Conquering Public Speaking Anxiety.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/seneca-partnership/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '16b58b9b-fb52-4969-a079-acd4281107c4',
  'Seneca Partnership',
  'Seneca Partnership.webp',
  'image/webp',
  0,
  'https://images.slideheroes.com/Seneca Partnership.webp',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert media for /cms/images/typology-business-charts/image.png
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '9dbc3d2e-1c39-4de3-870f-ff682fbc7f92',
  'business-charts',
  'business-charts.jpg',
  'image/jpeg',
  0,
  'https://images.slideheroes.com/business-charts.jpg',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Commit the transaction
COMMIT;
