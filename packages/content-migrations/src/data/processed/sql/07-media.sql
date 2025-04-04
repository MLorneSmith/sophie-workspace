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
  '78a1bcdd-9434-41c8-bb49-b35ac7513a83',
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
  'c14b87c6-085f-4969-92fc-b389f676311a',
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
  'ed528563-f7c8-4eb3-bce1-5ce2ac15dc96',
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
  '1460b6a0-a2e9-44ea-a3e3-3b0824229933',
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
  '9840abcf-7205-459a-acbd-9c3169dddbba',
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
  'b0e60e5d-dbbc-4ed8-9f39-02aa080f113c',
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
  'c515fcd2-ebaa-4bc6-b9aa-dc98df8acb82',
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
  'f68a55ca-c027-4ba1-bc50-9be99d377ac7',
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
  '9f3071c3-05d4-4156-a561-c5f3873abd31',
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
  'c7f6eb94-6102-4875-8acb-080d9fbdda87',
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
  '4d8295db-ed42-4392-9ff5-d880e8c63800',
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
  '84f006fe-e35e-45e2-b434-9e37fd115b04',
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
  'fb25a7e4-398e-4808-ae5b-b1ae5b9e2ccc',
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
  '41a5b638-e615-4e9e-b075-aa7ad895da94',
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
  'eebc5e12-0f68-4265-a3bd-e418d4996486',
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
  '1e73935a-3788-43d9-880b-b2498634b4e1',
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
  '4ecc4e98-4c2e-428a-8aa4-a9ed1e6e0ad9',
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
  '8f83177b-f9ca-4844-8643-00e85d2377f5',
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
  '1de9c11e-89c9-4a7c-a688-b5b71c2daeb3',
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
  '0c252fd2-5d5b-4f98-bd41-f58941ab6041',
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
  '596d8bd3-2f30-446a-ad9f-e6d28f62107c',
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
  '7b926091-3df3-41e7-9113-d2edfa657f26',
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
  'e3d49d4a-5dbb-486f-9588-2b13a10775e9',
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
  '3cff187a-ee57-4597-a69d-3054c882a090',
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
  '89849ec5-4fb7-4eb5-91b7-86171e85d885',
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
  'ce103e54-6a57-4853-95a5-e315a37b0702',
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
  '60067614-2938-4904-ae7a-643e8bca52de',
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
  'ef5e78f2-6eee-488f-b287-ae3a64dfb852',
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
  '7395c3fe-ecf2-4d78-9882-8d76e9090443',
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
  '1f95b91a-5147-4388-9607-12db2c2998c8',
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
  '9d6283b4-d257-4478-b963-23903d39a022',
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
  '6ec576c5-444a-46c4-82d9-edd79f73256f',
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
  '6862a6c3-acd4-44a0-8a98-d3ed43950e5e',
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
