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
  'cbfcf4e7-5295-44ac-92a5-2574431998ba',
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
  '80827652-f0d3-4574-ad12-fb4aaa75ad5b',
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
  'c38d165b-78a3-4d26-8b1d-d7925891b2c8',
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
  '17d3fe83-23b7-4376-a9a4-eddca1ba073e',
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
  '467fd1e1-d463-4608-b723-b80115940f86',
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
  'e8cd40a1-9c50-4c8c-afe2-5457dba267d7',
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
  '1b265031-a5ba-411a-a43a-c70791990064',
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
  'db009ec5-c578-423c-9ce4-00b1c5123e16',
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
  '107afb42-1687-4417-ad9b-13d743538102',
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
  '2107caf8-ca7e-4198-9e9f-912dafdbcfc5',
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
  '46278f0e-204b-4f72-b7d8-4e27eb3216b0',
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
  'f4788db4-19d2-4e7c-926c-3a9a2c35c0fd',
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
  '427f7b1b-10c9-40d2-9099-35fb649fe290',
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
  '8f23fc1f-70c3-4332-a852-86dc9d04223c',
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
  '78968838-1ebb-4361-8e33-8219bde0dede',
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
  '1f51bf4e-bf5e-4a51-b10a-01d22399c18f',
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
  'f98ed742-8d66-4f40-bfef-0690db063296',
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
  '7dd0c2a1-a4e0-4bcc-aa33-4848fb08a875',
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
  '8508a12f-2384-47d1-bc6f-3cae5346aea5',
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
  '70e8e927-6dcf-4191-b292-d9529e3dcb64',
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
  '0f7298f0-545f-468b-ae24-e0dd161c77b4',
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
  'a4f59826-7dc6-464c-a1bb-be2369327208',
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
  '3281d793-5a41-486c-8ed1-17584b57f701',
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
  '27efdc0f-1c22-4702-b4ff-bc47f810069a',
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
  '3a9eab94-648e-4ef7-9388-4c3dc0827b36',
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
  'c779b3dd-5738-49c5-8eae-a497ae08090a',
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
  '766b669b-91c7-4f2a-bf97-1cbce17e7e29',
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
  '6fae5f21-da22-499a-96e5-d8b01dd93734',
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
  'aae3737d-1a3e-4859-82b7-07c89a159ded',
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
  'be6c8591-34e0-4fa7-afc6-e5b68e207c28',
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
  'f666ca9a-034f-47aa-a125-694bd074ff82',
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
  '601adff8-5fde-4d7e-96fa-ca7567c65b54',
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
  '79330878-8d79-421b-b07c-7fee1c0467bd',
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
