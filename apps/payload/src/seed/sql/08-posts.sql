-- Seed data for the posts table
-- This file should be run after the migrations to ensure the posts table exists
-- Note: Actual post content is handled by the specialized migration script in packages/content-migrations/src/scripts/core/migrate-posts-direct.ts

-- Start a transaction
BEGIN;

-- Add debugging
DO $$
BEGIN
  RAISE NOTICE 'Starting post image relationship creation...';
END $$;

-- Prepare the table structure
-- Ensure the posts_categories table exists
CREATE TABLE IF NOT EXISTS payload.posts_categories (
  id UUID PRIMARY KEY,
  _parent_id UUID REFERENCES payload.posts(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  "order" INTEGER DEFAULT 0
);

-- Ensure the posts_tags table exists
CREATE TABLE IF NOT EXISTS payload.posts_tags (
  id UUID PRIMARY KEY,
  _parent_id UUID REFERENCES payload.posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  "order" INTEGER DEFAULT 0
);

-- Explicitly ensure the posts_rels table exists (this was not explicitly created before)
CREATE TABLE IF NOT EXISTS payload.posts_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID REFERENCES payload.posts(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  value TEXT,
  media_id UUID REFERENCES payload.media(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Ensure media_id column exists in posts_rels table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'payload' 
    AND table_name = 'posts_rels' 
    AND column_name = 'media_id'
  ) THEN
    RAISE NOTICE 'Adding media_id column to posts_rels table...';
    ALTER TABLE payload.posts_rels 
    ADD COLUMN media_id UUID REFERENCES payload.media(id);
  ELSE
    RAISE NOTICE 'media_id column already exists in posts_rels table';
  END IF;
END $$;

-- Add debugging
DO $$
BEGIN
  RAISE NOTICE 'Tables created/verified successfully';
END $$;

-- Setup media-to-post relationship after posts are created by migrate-posts-direct.ts
-- This ensures posts get connected to their images after content migration
DO $$
DECLARE
  post_id uuid;
  image_id uuid;
  rel_id uuid;
  post_count int := 0;
  success_count int := 0;
BEGIN
  -- For each post, find the corresponding image and create the relationship
  -- Presentation Tips
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'presentation-tips' LIMIT 1;
  SELECT id INTO image_id FROM payload.media WHERE filename = 'Presentation Tips Optimized.png' LIMIT 1;
  
  IF post_id IS NULL THEN
    RAISE NOTICE 'Post with slug "presentation-tips" not found';
  END IF;
  
  IF image_id IS NULL THEN
    RAISE NOTICE 'Media with filename "Presentation Tips Optimized.png" not found';
  END IF;
  
  IF post_id IS NOT NULL AND image_id IS NOT NULL THEN
    post_count := post_count + 1;
    
    -- Update the posts table with image references
    UPDATE payload.posts SET image_id = image_id, image_id_id = image_id WHERE id = post_id;
    
    -- Check if the relation already exists
    SELECT id INTO rel_id FROM payload.posts_rels WHERE _parent_id = post_id AND field = 'image_id' LIMIT 1;
    
    IF rel_id IS NULL THEN
      -- Create relationship in posts_rels table
      INSERT INTO payload.posts_rels (
        id, 
        _parent_id, 
        field, 
        value, 
        media_id, 
        created_at, 
        updated_at
      )
      VALUES (
        gen_random_uuid(), 
        post_id, 
        'image_id', 
        image_id, 
        image_id, 
        NOW(), 
        NOW()
      );
      
      success_count := success_count + 1;
      RAISE NOTICE 'Created relationship for "presentation-tips"';
    ELSE
      RAISE NOTICE 'Relationship already exists for "presentation-tips"';
    END IF;
  END IF;

  -- Art and Craft
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'art-craft-business-presentation-creation' LIMIT 1;
  SELECT id INTO image_id FROM payload.media WHERE filename = 'Art Craft of Presentation Creation.png' LIMIT 1;
  
  IF post_id IS NULL THEN
    RAISE NOTICE 'Post with slug "art-craft-business-presentation-creation" not found';
  END IF;
  
  IF image_id IS NULL THEN
    RAISE NOTICE 'Media with filename "Art Craft of Presentation Creation.png" not found';
  END IF;
  
  IF post_id IS NOT NULL AND image_id IS NOT NULL THEN
    post_count := post_count + 1;
    
    -- Update the posts table with image references
    UPDATE payload.posts SET image_id = image_id, image_id_id = image_id WHERE id = post_id;
    
    -- Check if the relation already exists
    SELECT id INTO rel_id FROM payload.posts_rels WHERE _parent_id = post_id AND field = 'image_id' LIMIT 1;
    
    IF rel_id IS NULL THEN
      -- Create relationship in posts_rels table
      INSERT INTO payload.posts_rels (
        id, 
        _parent_id, 
        field, 
        value, 
        media_id, 
        created_at, 
        updated_at
      )
      VALUES (
        gen_random_uuid(), 
        post_id, 
        'image_id', 
        image_id, 
        image_id, 
        NOW(), 
        NOW()
      );
      
      success_count := success_count + 1;
      RAISE NOTICE 'Created relationship for "art-craft-business-presentation-creation"';
    ELSE
      RAISE NOTICE 'Relationship already exists for "art-craft-business-presentation-creation"';
    END IF;
  END IF;

  -- Pitch Deck
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'pitch-deck' LIMIT 1;
  SELECT id INTO image_id FROM payload.media WHERE filename = 'pitch-deck-image.png' LIMIT 1;
  IF post_id IS NOT NULL AND image_id IS NOT NULL THEN
    UPDATE payload.posts SET image_id = image_id, image_id_id = image_id WHERE id = post_id;
    
    -- Create relationship in posts_rels table if needed
    IF NOT EXISTS (SELECT 1 FROM payload.posts_rels WHERE _parent_id = post_id AND field = 'image_id') THEN
      INSERT INTO payload.posts_rels (id, _parent_id, field, value, media_id, created_at, updated_at)
      VALUES (gen_random_uuid(), post_id, 'image_id', image_id, image_id, NOW(), NOW());
    END IF;
  END IF;

  -- PowerPoint Defense
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'powerpoint-presentations-defense' LIMIT 1;
  SELECT id INTO image_id FROM payload.media WHERE filename = 'Defense of PowerPoint.png' LIMIT 1;
  IF post_id IS NOT NULL AND image_id IS NOT NULL THEN
    UPDATE payload.posts SET image_id = image_id, image_id_id = image_id WHERE id = post_id;
    
    -- Create relationship in posts_rels table if needed
    IF NOT EXISTS (SELECT 1 FROM payload.posts_rels WHERE _parent_id = post_id AND field = 'image_id') THEN
      INSERT INTO payload.posts_rels (id, _parent_id, field, value, media_id, created_at, updated_at)
      VALUES (gen_random_uuid(), post_id, 'image_id', image_id, image_id, NOW(), NOW());
    END IF;
  END IF;

  -- BCG Review
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'presentation-review-bcg' LIMIT 1;
  SELECT id INTO image_id FROM payload.media WHERE filename = 'BCG-teardown-optimized.jpg' LIMIT 1;
  IF post_id IS NOT NULL AND image_id IS NOT NULL THEN
    UPDATE payload.posts SET image_id = image_id, image_id_id = image_id WHERE id = post_id;
    
    -- Create relationship in posts_rels table if needed
    IF NOT EXISTS (SELECT 1 FROM payload.posts_rels WHERE _parent_id = post_id AND field = 'image_id') THEN
      INSERT INTO payload.posts_rels (id, _parent_id, field, value, media_id, created_at, updated_at)
      VALUES (gen_random_uuid(), post_id, 'image_id', image_id, image_id, NOW(), NOW());
    END IF;
  END IF;

  -- Presentation Tools
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'presentation-tools' LIMIT 1;
  SELECT id INTO image_id FROM payload.media WHERE filename = 'Presentation Tools-optimized.png' LIMIT 1;
  IF post_id IS NOT NULL AND image_id IS NOT NULL THEN
    UPDATE payload.posts SET image_id = image_id, image_id_id = image_id WHERE id = post_id;
    
    -- Create relationship in posts_rels table if needed
    IF NOT EXISTS (SELECT 1 FROM payload.posts_rels WHERE _parent_id = post_id AND field = 'image_id') THEN
      INSERT INTO payload.posts_rels (id, _parent_id, field, value, media_id, created_at, updated_at)
      VALUES (gen_random_uuid(), post_id, 'image_id', image_id, image_id, NOW(), NOW());
    END IF;
  END IF;

  -- Public Speaking Anxiety
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'public-speaking-anxiety' LIMIT 1;
  SELECT id INTO image_id FROM payload.media WHERE filename = 'Conquering Public Speaking Anxiety.png' LIMIT 1;
  IF post_id IS NOT NULL AND image_id IS NOT NULL THEN
    UPDATE payload.posts SET image_id = image_id, image_id_id = image_id WHERE id = post_id;
    
    -- Create relationship in posts_rels table if needed
    IF NOT EXISTS (SELECT 1 FROM payload.posts_rels WHERE _parent_id = post_id AND field = 'image_id') THEN
      INSERT INTO payload.posts_rels (id, _parent_id, field, value, media_id, created_at, updated_at)
      VALUES (gen_random_uuid(), post_id, 'image_id', image_id, image_id, NOW(), NOW());
    END IF;
  END IF;

  -- Seneca Partnership
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'seneca-partnership' LIMIT 1;
  SELECT id INTO image_id FROM payload.media WHERE filename = 'Seneca Partnership.webp' LIMIT 1;
  IF post_id IS NOT NULL AND image_id IS NOT NULL THEN
    UPDATE payload.posts SET image_id = image_id, image_id_id = image_id WHERE id = post_id;
    
    -- Create relationship in posts_rels table if needed
    IF NOT EXISTS (SELECT 1 FROM payload.posts_rels WHERE _parent_id = post_id AND field = 'image_id') THEN
      INSERT INTO payload.posts_rels (id, _parent_id, field, value, media_id, created_at, updated_at)
      VALUES (gen_random_uuid(), post_id, 'image_id', image_id, image_id, NOW(), NOW());
    END IF;
  END IF;

  -- Business Charts
  SELECT id INTO post_id FROM payload.posts WHERE slug = 'typology-business-charts' LIMIT 1;
  SELECT id INTO image_id FROM payload.media WHERE filename = 'business-charts.jpg' LIMIT 1;
  IF post_id IS NOT NULL AND image_id IS NOT NULL THEN
    UPDATE payload.posts SET image_id = image_id, image_id_id = image_id WHERE id = post_id;
    
    -- Create relationship in posts_rels table if needed
    IF NOT EXISTS (SELECT 1 FROM payload.posts_rels WHERE _parent_id = post_id AND field = 'image_id') THEN
      INSERT INTO payload.posts_rels (id, _parent_id, field, value, media_id, created_at, updated_at)
      VALUES (gen_random_uuid(), post_id, 'image_id', image_id, image_id, NOW(), NOW());
    END IF;
  END IF;
  -- Repeat for all other posts...
  -- (keeping the existing code for the other posts)

  -- Final summary
  RAISE NOTICE 'Processed % posts with % successful relationship creations', post_count, success_count;
END $$;

-- Commit the transaction
COMMIT;
