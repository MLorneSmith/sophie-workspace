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

-- Insert blog posts from existing .mdoc files
INSERT INTO payload.posts (
  id,
  title,
  slug,
  description,
  content,
  status,
  published_at,
  updated_at,
  created_at
) VALUES
(gen_random_uuid(), 'Presentation Tips: Mistakes that will get you Fired', 'presentation-tips', 
 '10 Business Presentation Mistakes That Will Get You Fired, Demoted or Ignored', 
 markdown_to_lexical('The vast majority of business presentations suck. We know this. Usually we blame bad PowerPoint. This article provides presentation tips on 10 mistakes we should avoid accidentally making...'), 
 'published', NOW(), NOW(), NOW()),
(gen_random_uuid(), 'Art and Craft of Business Presentation Creation', 'art-craft-business-presentation-creation', 
 'The art and craft of creating effective business presentations', 
 markdown_to_lexical('Creating effective business presentations requires both art and craft...'), 
 'published', NOW(), NOW(), NOW()),
(gen_random_uuid(), 'Pitch Deck', 'pitch-deck', 
 'How to create an effective pitch deck', 
 markdown_to_lexical('A pitch deck is a brief presentation that provides investors with an overview of your business...'), 
 'published', NOW(), NOW(), NOW()),
(gen_random_uuid(), 'PowerPoint Presentations Defense', 'powerpoint-presentations-defense', 
 'In defense of PowerPoint presentations', 
 markdown_to_lexical('PowerPoint presentations often get a bad rap, but when used correctly...'), 
 'published', NOW(), NOW(), NOW()),
(gen_random_uuid(), 'Presentation Review BCG', 'presentation-review-bcg', 
 'Review of BCG presentation style', 
 markdown_to_lexical('BCG has a distinctive presentation style that...'), 
 'published', NOW(), NOW(), NOW()),
(gen_random_uuid(), 'Presentation Tools', 'presentation-tools', 
 'Tools for creating effective presentations', 
 markdown_to_lexical('There are many tools available for creating presentations...'), 
 'published', NOW(), NOW(), NOW()),
(gen_random_uuid(), 'Public Speaking Anxiety', 'public-speaking-anxiety', 
 'How to overcome public speaking anxiety', 
 markdown_to_lexical('Public speaking anxiety is a common fear...'), 
 'published', NOW(), NOW(), NOW()),
(gen_random_uuid(), 'Seneca Partnership', 'seneca-partnership', 
 'Our partnership with Seneca', 
 markdown_to_lexical('We are excited to announce our partnership with Seneca...'), 
 'published', NOW(), NOW(), NOW()),
(gen_random_uuid(), 'Typology of Business Charts', 'typology-business-charts', 
 'Understanding different types of business charts', 
 markdown_to_lexical('There are many types of business charts, each with its own purpose...'), 
 'published', NOW(), NOW(), NOW())
ON CONFLICT (slug) DO NOTHING; -- Skip if the post already exists

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
