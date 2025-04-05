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
  '18f08b4d-ffcf-44cd-aacb-a9a333880b93',
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
  '668d228e-132c-4545-ac3b-83244f9568e4',
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
  'ebd6f471-86b5-4ef2-9537-ff65d7790a36',
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
  '92e9b15a-09ad-4698-9105-d1f46b076671',
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
  '84c3e5cb-6110-4f7a-96b0-0893fcfb505a',
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
  '726772c7-13c1-4aea-a4e3-9a6cea0a7623',
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
  '7535f705-4025-48d2-ab2b-b8638b31a5b2',
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
  '45d1a142-742e-413e-a6dd-418e2003d56a',
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
  'cb117dd6-2fe7-4623-97e9-35c2b5bafdbe',
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
  '1c06641f-ce30-4e98-8b3f-ed10e04e8b0d',
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
  '6c57c6b3-623d-4769-9748-21229ea357f5',
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
  '1387d8a3-571a-4cd7-abbf-6ffffa731c76',
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
  'd7f5be84-4517-4b29-84b8-da78d18c77d4',
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
  'c96d2609-0755-446c-84fc-fec7fed9cccd',
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
  '90d7f6eb-5e5a-4f37-8e73-e368ae69e1e2',
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
  'abf3fca0-b7ad-4148-a954-d6c4596387a5',
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
  '45fcf27f-ef71-4c57-9c8b-1d202e943458',
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
  '3e9fcd7d-906e-43fe-9698-59804939ec22',
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
  'bedde1fb-06a0-4cbe-bfc0-e3af9ac75cc4',
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
  '0d89d8e3-c095-4dc8-8838-687ecc59eab8',
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
  'd1c57e80-eadb-4120-8b29-7519991a58de',
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
  '8f80e115-278e-432d-976c-925efc5b5dce',
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
  '2d81096d-30f5-455b-9576-117657e9dcc4',
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
  '3898619d-0192-4628-8cc6-61c610c4181b',
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
  '1f791019-17ef-4ac1-bdce-169739cd77b1',
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
  'd72fdb58-5425-414f-ac48-487cb3ee9419',
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
  '5f2386f1-7a45-443d-9a15-03dc29f8ca3e',
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
  '7d91a637-f187-4eda-b57a-2f9690c4b800',
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
  '99a3f4cd-04ad-4666-bad0-a4b24bbd9677',
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
  'b3a4ccfb-20be-4fd0-9dd2-4c45362ee5b2',
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
  '1cbfd7f7-ddf5-4138-bfc4-3e66b30af930',
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
  'c63a65e4-b0a0-4341-b5ea-be3ac53ced4d',
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
  '9788e27e-a480-4087-aa6e-c8947497f957',
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
