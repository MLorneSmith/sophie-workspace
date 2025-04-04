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
  '7f34acb4-01e0-4bf8-8876-8cdcaf58b236',
  'standard graphs',
  'standard_graphs.png',
  'image/png',
  0,
  'standard_graphs.png',
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
  '36ca2dcf-3a96-43c5-98cb-881748c0268a',
  'gestalt principles of perception',
  'gestalt_principles_of_perception.png',
  'image/png',
  0,
  'gestalt_principles_of_perception.png',
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
  '3c37c444-90ae-4ea3-81c0-2b057f412d8d',
  'idea generation',
  'idea_generation.png',
  'image/png',
  0,
  'idea_generation.png',
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
  '2928b4fd-7523-4393-898c-e27adf3d7567',
  'lesson zero',
  'lesson_zero.png',
  'image/png',
  0,
  'lesson_zero.png',
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
  '2e604779-7f83-42c7-bca2-26d1b9c84f16',
  'our process',
  'our_process.png',
  'image/png',
  0,
  'our_process.png',
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
  'c92f0f32-f617-459b-9944-eae3cbad0ed3',
  'overview elements design',
  'overview_elements_design.png',
  'image/png',
  0,
  'overview_elements_design.png',
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
  'd5c41196-18f3-4678-a994-c5e0402813eb',
  'performance',
  'performance.png',
  'image/png',
  0,
  'performance.png',
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
  '8bb2f292-ba02-489b-8824-9d821ef29a77',
  'preparation practice',
  'preparation_practice.png',
  'image/png',
  0,
  'preparation_practice.png',
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
  'ef708d27-0fe5-4a70-8d1b-ddebc9b9ba8d',
  'self assessment',
  'self_assessment.png',
  'image/png',
  0,
  'self_assessment.png',
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
  'bf025d24-5a07-425b-8777-4112450ded09',
  'slide composition',
  'slide_composition.png',
  'image/png',
  0,
  'slide_composition.png',
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
  '777a6bb6-f7da-4de2-8dcd-afa60f678a3b',
  'specialist graphs',
  'specialist_graphs.png',
  'image/png',
  0,
  'specialist_graphs.png',
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
  '9d2ff5b9-8a5d-4f2b-9540-078e78afc272',
  'storyboards in film',
  'storyboards_in_film.png',
  'image/png',
  0,
  'storyboards_in_film.png',
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
  '1a936c74-1a30-49f5-a210-1b7380e6fded',
  'storyboards in presentations',
  'storyboards_in_presentations.png',
  'image/png',
  0,
  'storyboards_in_presentations.png',
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
  '1798948f-362a-4699-819c-425f84dd240f',
  'tables vs graphs',
  'tables_vs_graphs.png',
  'image/png',
  0,
  'tables_vs_graphs.png',
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
  'b36e15e8-2989-4d55-939b-d822610b4ae8',
  'the who',
  'the_who.png',
  'image/png',
  0,
  'the_who.png',
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
  'f5554ee8-ab31-4ff2-87b6-19d34aa6501b',
  'the why introductions',
  'the_why_introductions.png',
  'image/png',
  0,
  'the_why_introductions.png',
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
  '1cb9d764-2216-403b-ad3d-20ac5ff10a81',
  'the why next steps',
  'the_why_next_steps.png',
  'image/png',
  0,
  'the_why_next_steps.png',
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
  '699270ef-318c-474d-92c7-191c7a53bdaa',
  'tools resources',
  'tools_resources.png',
  'image/png',
  0,
  'tools_resources.png',
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
  'ebb5a2ce-4238-41b4-9349-629a32bbec2e',
  'using stories',
  'using_stories.png',
  'image/png',
  0,
  'using_stories.png',
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
  '4c6a5aa8-82d6-424f-b4cc-a3baf93912a4',
  'visual perception',
  'visual_perception.png',
  'image/png',
  0,
  'visual_perception.png',
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
  'fd4a3d8a-f464-43e7-b720-dd1c372c338d',
  'what structure',
  'what_structure.png',
  'image/png',
  0,
  'what_structure.png',
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
  'e4efff7f-a46b-4c75-853c-63f5bb50dfc5',
  'before we begin',
  'before_we_begin.png',
  'image/png',
  0,
  'before_we_begin.png',
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
  'a663df89-d6c5-40a4-8928-da4cc52697b8',
  'detail elements of design',
  'detail_elements_of_design.png',
  'image/png',
  0,
  'detail_elements_of_design.png',
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
  '691dbd33-8052-428f-924e-f46bcf78b4ee',
  'Art Craft of Presentation Creation',
  'Art Craft of Presentation Creation.png',
  'image/png',
  0,
  'Art Craft of Presentation Creation.png',
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
  '48e829ca-094f-4abe-9dca-eaf56f863f7b',
  'pitch-deck-image',
  'pitch-deck-image.png',
  'image/png',
  0,
  'pitch-deck-image.png',
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
  'cfafc119-d085-49a8-8abc-6e1d32f260b7',
  'Defense of PowerPoint',
  'Defense of PowerPoint.png',
  'image/png',
  0,
  'Defense of PowerPoint.png',
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
  'c83ff597-98da-435f-ab22-8a068d610353',
  'BCG-teardown-optimized',
  'BCG-teardown-optimized.jpg',
  'image/jpeg',
  0,
  'BCG-teardown-optimized.jpg',
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
  '4a2ba195-ae2f-4da4-ba15-c94a8b4b09f3',
  'Presentation Tips Optimized',
  'Presentation Tips Optimized.png',
  'image/png',
  0,
  'Presentation Tips Optimized.png',
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
  '4be5acdc-2115-4f55-9360-10ae35aaa86f',
  'Presentation Tools-optimized',
  'Presentation Tools-optimized.png',
  'image/png',
  0,
  'Presentation Tools-optimized.png',
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
  '537516e9-9525-4d3c-a143-84f9490298e6',
  'Conquering Public Speaking Anxiety',
  'Conquering Public Speaking Anxiety.png',
  'image/png',
  0,
  'Conquering Public Speaking Anxiety.png',
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
  '4aef375e-6ed0-48b9-af9f-e4892621436d',
  'Seneca Partnership',
  'Seneca Partnership.webp',
  'image/webp',
  0,
  'Seneca Partnership.webp',
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
  'b9b23c0e-1886-4521-b3f8-5670b9bee3c5',
  'business-charts',
  'business-charts.jpg',
  'image/jpeg',
  0,
  'business-charts.jpg',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Commit the transaction
COMMIT;
