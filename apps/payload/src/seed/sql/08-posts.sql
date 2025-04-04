-- Seed data for the posts table
-- This file should be run after the migrations to ensure the posts table exists

-- Start a transaction
BEGIN;

-- Function to convert Markdown content to Lexical JSON
CREATE OR REPLACE FUNCTION markdown_to_lexical(text_content TEXT) RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'root', jsonb_build_object(
      'children', jsonb_build_array(
        jsonb_build_object(
          'children', jsonb_build_array(
            jsonb_build_object(
              'detail', 0,
              'format', 0,
              'mode', 'normal',
              'style', '',
              'text', text_content,
              'type', 'text',
              'version', 1
            )
          ),
          'direction', 'ltr',
          'format', '',
          'indent', 0,
          'type', 'paragraph',
          'version', 1
        )
      ),
      'direction', 'ltr',
      'format', '',
      'indent', 0,
      'type', 'root',
      'version', 1
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Insert blog posts from existing .mdoc files with image references
DO $$
DECLARE
  presentation_tips_id uuid := gen_random_uuid();
  art_craft_id uuid := gen_random_uuid();
  pitch_deck_id uuid := gen_random_uuid();
  powerpoint_defense_id uuid := gen_random_uuid();
  bcg_review_id uuid := gen_random_uuid();
  presentation_tools_id uuid := gen_random_uuid();
  public_speaking_id uuid := gen_random_uuid();
  seneca_partnership_id uuid := gen_random_uuid();
  business_charts_id uuid := gen_random_uuid();
  
  presentation_tips_image_id uuid;
  art_craft_image_id uuid;
  pitch_deck_image_id uuid;
  powerpoint_defense_image_id uuid;
  bcg_review_image_id uuid;
  presentation_tools_image_id uuid;
  public_speaking_image_id uuid;
  seneca_partnership_image_id uuid;
  business_charts_image_id uuid;
BEGIN
  -- Get media IDs based on filenames
  SELECT id INTO presentation_tips_image_id FROM payload.media WHERE filename = 'Presentation Tips Optimized.png' LIMIT 1;
  SELECT id INTO art_craft_image_id FROM payload.media WHERE filename = 'Art Craft of Presentation Creation.png' LIMIT 1;
  SELECT id INTO pitch_deck_image_id FROM payload.media WHERE filename = 'pitch-deck-image.png' LIMIT 1;
  SELECT id INTO powerpoint_defense_image_id FROM payload.media WHERE filename = 'Defense of PowerPoint.png' LIMIT 1;
  SELECT id INTO bcg_review_image_id FROM payload.media WHERE filename = 'BCG-teardown-optimized.jpg' LIMIT 1;
  SELECT id INTO presentation_tools_image_id FROM payload.media WHERE filename = 'Presentation Tools-optimized.png' LIMIT 1;
  SELECT id INTO public_speaking_image_id FROM payload.media WHERE filename = 'Conquering Public Speaking Anxiety.png' LIMIT 1;
  SELECT id INTO seneca_partnership_image_id FROM payload.media WHERE filename = 'Seneca Partnership.webp' LIMIT 1;
  SELECT id INTO business_charts_image_id FROM payload.media WHERE filename = 'business-charts.jpg' LIMIT 1;
  
  -- Insert posts with image IDs
  INSERT INTO payload.posts (
    id,
    title,
    slug,
    description,
    content,
    status,
    image_id,
    image_id_id,
    published_at,
    updated_at,
    created_at
  ) VALUES
  (presentation_tips_id, 'Presentation Tips: Mistakes that will get you Fired', 'presentation-tips', 
   '10 Business Presentation Mistakes That Will Get You Fired, Demoted or Ignored', 
   markdown_to_lexical('The vast majority of business presentations suck. We know this. Usually we blame bad PowerPoint. This article provides presentation tips on 10 mistakes we should avoid accidentally making...'), 
   'published', presentation_tips_image_id, presentation_tips_image_id, NOW(), NOW(), NOW()),
  (art_craft_id, 'Art and Craft of Business Presentation Creation', 'art-craft-business-presentation-creation', 
   'The art and craft of creating effective business presentations', 
   markdown_to_lexical('Creating effective business presentations requires both art and craft...'), 
   'published', art_craft_image_id, art_craft_image_id, NOW(), NOW(), NOW()),
  (pitch_deck_id, 'Pitch Deck', 'pitch-deck', 
   'How to create an effective pitch deck', 
   markdown_to_lexical('A pitch deck is a brief presentation that provides investors with an overview of your business...'), 
   'published', pitch_deck_image_id, pitch_deck_image_id, NOW(), NOW(), NOW()),
  (powerpoint_defense_id, 'PowerPoint Presentations Defense', 'powerpoint-presentations-defense', 
   'In defense of PowerPoint presentations', 
   markdown_to_lexical('PowerPoint presentations often get a bad rap, but when used correctly...'), 
   'published', powerpoint_defense_image_id, powerpoint_defense_image_id, NOW(), NOW(), NOW()),
  (bcg_review_id, 'Presentation Review BCG', 'presentation-review-bcg', 
   'Review of BCG presentation style', 
   markdown_to_lexical('BCG has a distinctive presentation style that...'), 
   'published', bcg_review_image_id, bcg_review_image_id, NOW(), NOW(), NOW()),
  (presentation_tools_id, 'Presentation Tools', 'presentation-tools', 
   'Tools for creating effective presentations', 
   markdown_to_lexical('There are many tools available for creating presentations...'), 
   'published', presentation_tools_image_id, presentation_tools_image_id, NOW(), NOW(), NOW()),
  (public_speaking_id, 'Public Speaking Anxiety', 'public-speaking-anxiety', 
   'How to overcome public speaking anxiety', 
   markdown_to_lexical('Public speaking anxiety is a common fear...'), 
   'published', public_speaking_image_id, public_speaking_image_id, NOW(), NOW(), NOW()),
  (seneca_partnership_id, 'Seneca Partnership', 'seneca-partnership', 
   'Our partnership with Seneca', 
   markdown_to_lexical('We are excited to announce our partnership with Seneca...'), 
   'published', seneca_partnership_image_id, seneca_partnership_image_id, NOW(), NOW(), NOW()),
  (business_charts_id, 'Typology of Business Charts', 'typology-business-charts', 
   'Understanding different types of business charts', 
   markdown_to_lexical('There are many types of business charts, each with its own purpose...'), 
   'published', business_charts_image_id, business_charts_image_id, NOW(), NOW(), NOW())
  ON CONFLICT (slug) DO NOTHING; -- Skip if the post already exists
  
  -- Create relationship entries for posts to media
  IF presentation_tips_image_id IS NOT NULL THEN
    INSERT INTO payload.posts_rels (
      id,
      _parent_id,
      field,
      value,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      presentation_tips_id,
      'image_id',
      presentation_tips_image_id,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF art_craft_image_id IS NOT NULL THEN
    INSERT INTO payload.posts_rels (
      id,
      _parent_id,
      field,
      value,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      art_craft_id,
      'image_id',
      art_craft_image_id,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF pitch_deck_image_id IS NOT NULL THEN
    INSERT INTO payload.posts_rels (
      id,
      _parent_id,
      field,
      value,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      pitch_deck_id,
      'image_id',
      pitch_deck_image_id,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF powerpoint_defense_image_id IS NOT NULL THEN
    INSERT INTO payload.posts_rels (
      id,
      _parent_id,
      field,
      value,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      powerpoint_defense_id,
      'image_id',
      powerpoint_defense_image_id,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF bcg_review_image_id IS NOT NULL THEN
    INSERT INTO payload.posts_rels (
      id,
      _parent_id,
      field,
      value,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      bcg_review_id,
      'image_id',
      bcg_review_image_id,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF presentation_tools_image_id IS NOT NULL THEN
    INSERT INTO payload.posts_rels (
      id,
      _parent_id,
      field,
      value,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      presentation_tools_id,
      'image_id',
      presentation_tools_image_id,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF public_speaking_image_id IS NOT NULL THEN
    INSERT INTO payload.posts_rels (
      id,
      _parent_id,
      field,
      value,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      public_speaking_id,
      'image_id',
      public_speaking_image_id,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF seneca_partnership_image_id IS NOT NULL THEN
    INSERT INTO payload.posts_rels (
      id,
      _parent_id,
      field,
      value,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      seneca_partnership_id,
      'image_id',
      seneca_partnership_image_id,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF business_charts_image_id IS NOT NULL THEN
    INSERT INTO payload.posts_rels (
      id,
      _parent_id,
      field,
      value,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      business_charts_id,
      'image_id',
      business_charts_image_id,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Add categories to posts
DO $$
DECLARE
  post_id uuid;
BEGIN
  -- Get the ID of the presentation tips post
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'presentation-tips' LIMIT 1;
  
  IF post_id IS NOT NULL THEN
    -- Add categories
    INSERT INTO payload.posts_categories (
      id, _parent_id, category, updated_at, created_at, "order"
    ) VALUES
    (gen_random_uuid(), post_id, 'Tips', NOW(), NOW(), 0)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Get the ID of the pitch deck post
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'pitch-deck' LIMIT 1;
  
  IF post_id IS NOT NULL THEN
    -- Add categories
    INSERT INTO payload.posts_categories (
      id, _parent_id, category, updated_at, created_at, "order"
    ) VALUES
    (gen_random_uuid(), post_id, 'Tutorials', NOW(), NOW(), 0)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Get the ID of the public speaking anxiety post
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'public-speaking-anxiety' LIMIT 1;
  
  IF post_id IS NOT NULL THEN
    -- Add categories
    INSERT INTO payload.posts_categories (
      id, _parent_id, category, updated_at, created_at, "order"
    ) VALUES
    (gen_random_uuid(), post_id, 'Tips', NOW(), NOW(), 0)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Get the ID of the typology of business charts post
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'typology-business-charts' LIMIT 1;
  
  IF post_id IS NOT NULL THEN
    -- Add categories
    INSERT INTO payload.posts_categories (
      id, _parent_id, category, updated_at, created_at, "order"
    ) VALUES
    (gen_random_uuid(), post_id, 'Tutorials', NOW(), NOW(), 0)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Drop the temporary function
DROP FUNCTION markdown_to_lexical;

-- Commit the transaction
COMMIT;
