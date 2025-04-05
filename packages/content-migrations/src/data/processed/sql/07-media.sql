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
  '22ab24a0-3942-4604-811c-4886e9e54106',
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
  'e9b162ac-306d-4307-b86f-2b00eb9d67a5',
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
  '6a0863f7-b8b2-4e32-9e0b-a12ab21fd1f3',
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
  'a87893a8-e3b6-4e5b-a7ce-13af163ebbc5',
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
  '33c3f08c-792e-4f99-8fc3-f9325fd0d238',
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
  '4169e200-54c9-45f4-9fcf-8a896293cbce',
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
  '0f0a417f-2210-4613-b602-d6e35e3cb2ad',
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
  '6f29783c-d007-49d6-9840-3c4c5ddad87c',
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
  'e6e9d7c4-c891-4109-80d9-d3bd2a9a9cd9',
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
  '0c583116-ccaa-424d-90e2-ba8d3bbaacb6',
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
  '1d532a63-8dd6-47cc-b9bf-abe372f96bef',
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
  '58032b7f-c7e9-4d2d-8ca5-efe9a7f16c35',
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
  'b5082c7b-ad8c-4945-96f7-cb6c67b397fa',
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
  'd6e58cef-371d-43c3-b137-c08d76d9ce16',
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
  'b58f7c8d-4f60-46a6-b9e1-a49b169ccdc3',
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
  '3e165223-70be-4525-a465-ad34ff767fb5',
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
  'a0954b23-7793-4f6b-92fa-5e77938f8442',
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
  'f29659a3-48ef-4b66-a93b-800e5d1c6b57',
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
  '85db02ea-58e7-44d8-bbd0-5d94b0ddc248',
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
  'd272008b-9393-46a7-883b-da712f8bd5fd',
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
  '7e7ffba9-d978-4cac-9e95-7488f77a9da6',
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
  '5447a38f-32b3-4aed-bb34-04fa775925be',
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
  '9c268b58-d773-4775-862e-fccf243c34a4',
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
  '7b9527e0-93f4-44fd-af72-22e5f8e4096a',
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
  '08baec60-9282-4a15-9e81-7d0df4bcac26',
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
  '762155e8-f3ed-492c-9683-ecba77fa9375',
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
  '9c7fc684-d1da-4e4c-a47b-6684d1669190',
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
  '3d7f122a-5e2c-441c-95cc-0e71294316b1',
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
  'ef38c54b-d109-4e5f-a654-63f756730d9c',
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
  'c085f026-e2bc-4b41-918d-49ff79d8a31c',
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
  '1a1817de-0f72-41c9-953d-1edb213fb234',
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
  '8447d268-39c7-4433-9f1d-c9c929267378',
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
  '37ad904d-a6c8-4f16-a5fa-c41c10511b1f',
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
