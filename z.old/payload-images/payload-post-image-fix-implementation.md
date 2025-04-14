# Payload Post Image Fix Implementation

This document outlines the specific technical changes needed to fix the issue with post images not rendering, building on the high-level plan in `payload-post-image-fix-plan.md`.

## Diagnostic Queries

Before making changes, we'll run these diagnostic queries to understand the current state:

```sql
-- Check media records for post images
SELECT id, filename, url FROM payload.media WHERE filename IN (
  'Presentation Tips Optimized.png',
  'Art Craft of Presentation Creation.png',
  'pitch-deck-image.png',
  'Defense of PowerPoint.png',
  'BCG-teardown-optimized.jpg',
  'Presentation Tools-optimized.png',
  'Conquering Public Speaking Anxiety.png',
  'Seneca Partnership.webp',
  'business-charts.jpg'
);

-- Check post records for image fields
SELECT id, title, slug, image_id, image_id_id FROM payload.posts;

-- Check relationship records
SELECT * FROM payload.posts_rels WHERE field = 'image_id';

-- Compare with working lessons
SELECT * FROM payload.course_lessons_rels WHERE field = 'featured_image' LIMIT 5;
```

## Code Changes

### 1. Update the SQL Migration Script

We'll modify `apps/payload/src/seed/sql/08-posts.sql` to enhance error handling and ensure relationships are properly created:

```sql
-- Enhanced version of 08-posts.sql
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

-- Ensure the posts_rels table exists (this was missing in the original)
CREATE TABLE IF NOT EXISTS payload.posts_rels (
  id UUID PRIMARY KEY,
  _parent_id UUID REFERENCES payload.posts(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  value TEXT,
  media_id UUID REFERENCES payload.media(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add debugging
DO $$
BEGIN
  RAISE NOTICE 'Tables created/verified successfully';
END $$;

-- Setup media-to-post relationship after posts are created by migrate-posts-direct.ts
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
    UPDATE payload.posts
    SET image_id = image_id,
        image_id_id = image_id
    WHERE id = post_id;

    -- Check if the relation already exists
    SELECT id INTO rel_id FROM payload.posts_rels
    WHERE _parent_id = post_id AND field = 'image_id' LIMIT 1;

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

  -- Art and Craft (repeat pattern for each post)
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
    UPDATE payload.posts
    SET image_id = image_id,
        image_id_id = image_id
    WHERE id = post_id;

    -- Check if the relation already exists
    SELECT id INTO rel_id FROM payload.posts_rels
    WHERE _parent_id = post_id AND field = 'image_id' LIMIT 1;

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

  -- Repeat for all other posts...
  -- (truncated for brevity - actual implementation would include all posts)

  -- Final summary
  RAISE NOTICE 'Processed % posts with % successful relationship creations', post_count, success_count;
END $$;

COMMIT;
```

### 2. Create Image Utility Functions

Create a new file `apps/web/lib/utils/image-utils.ts` to handle image transformations and error handling:

```typescript
/**
 * Transform image URLs to use the custom domain
 * @param url - Original URL
 * @returns Transformed URL or null if input is null
 */
export function transformImageUrl(url: string | null): string | null {
  if (!url) return null;

  // If the URL contains r2.cloudflarestorage.com, transform it to the custom domain
  if (url.includes('r2.cloudflarestorage.com')) {
    const filename = url.split('/').pop();
    return `https://images.slideheroes.com/${filename}`;
  }

  // If the URL is just a filename (no protocol/domain), add the custom domain
  if (!url.startsWith('http') && !url.startsWith('/')) {
    return `https://images.slideheroes.com/${url}`;
  }

  return url;
}

/**
 * Get a placeholder image for a post
 * @returns Path to the placeholder image
 */
export function getPostPlaceholderImage(): string {
  return '/images/blog/default-post.svg';
}

/**
 * Cache of failed image URLs to prevent repeated attempts
 */
const failedImageUrlsCache = new Set<string>();

/**
 * Record a failed image URL to prevent future attempts
 * @param url - URL that failed to load
 */
export function recordFailedImageUrl(url: string): void {
  failedImageUrlsCache.add(url);
}

/**
 * Check if an image URL has previously failed
 * @param url - URL to check
 * @returns True if the URL has previously failed
 */
export function hasImageUrlFailed(url: string): boolean {
  return failedImageUrlsCache.has(url);
}

/**
 * Get the best image URL based on available data
 * @param item - Post or Lesson object
 * @returns Best available image URL or null
 */
export function getBestImageUrl(item: any): string | null {
  // Try various ways to access the image URL based on different field patterns
  const imageUrl =
    // For posts
    item.image_id?.url ||
    (typeof item.image_id === 'object' ? item.image_id?.url : null) ||
    // For lessons
    item.featured_image_id?.url ||
    (typeof item.featured_image_id === 'object'
      ? item.featured_image_id?.url
      : null) ||
    // Fall back to direct properties
    item.image ||
    item.featuredImage ||
    null;

  // Transform the URL to use the custom domain
  return transformImageUrl(imageUrl);
}
```

### 3. Update Post Components

Modify the components that display post images to use our new utility functions:

#### Blog Post Card Component

```tsx
import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  getBestImageUrl,
  getPostPlaceholderImage,
  hasImageUrlFailed,
  recordFailedImageUrl,
} from '~/lib/utils/image-utils';

export function BlogPostCard({ post }) {
  const [imageSrc, setImageSrc] = useState(() => {
    const bestUrl = getBestImageUrl(post);
    return hasImageUrlFailed(bestUrl) ? getPostPlaceholderImage() : bestUrl;
  });

  const handleImageError = () => {
    if (imageSrc !== getPostPlaceholderImage()) {
      recordFailedImageUrl(imageSrc);
      console.log(`Image load error for post: ${post.title}`);
      setImageSrc(getPostPlaceholderImage());
    }
  };

  return (
    <div className="blog-post-card">
      <Link href={`/blog/${post.slug}`}>
        <div className="image-container">
          <Image
            src={imageSrc || getPostPlaceholderImage()}
            alt={`Cover image for ${post.title}`}
            width={400}
            height={225}
            className="rounded-md object-cover"
            onError={handleImageError}
          />
        </div>
        <h3 className="mt-4 font-semibold">{post.title}</h3>
      </Link>
      <p className="mt-2 text-gray-600">{post.description}</p>
    </div>
  );
}
```

#### Blog Post Detail Component

```tsx
import { useState } from 'react';

import Image from 'next/image';

import {
  getBestImageUrl,
  getPostPlaceholderImage,
  hasImageUrlFailed,
  recordFailedImageUrl,
} from '~/lib/utils/image-utils';

export function BlogPostHeader({ post }) {
  const [imageSrc, setImageSrc] = useState(() => {
    const bestUrl = getBestImageUrl(post);
    return hasImageUrlFailed(bestUrl) ? getPostPlaceholderImage() : bestUrl;
  });

  const handleImageError = () => {
    if (imageSrc !== getPostPlaceholderImage()) {
      recordFailedImageUrl(imageSrc);
      console.log(`Image load error for post: ${post.title}`);
      setImageSrc(getPostPlaceholderImage());
    }
  };

  return (
    <div className="blog-post-header">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <p className="mt-2 text-gray-600">{post.description}</p>

      <div className="relative mt-6 h-[400px] w-full">
        <Image
          src={imageSrc || getPostPlaceholderImage()}
          alt={`Cover image for ${post.title}`}
          fill
          className="rounded-md object-cover"
          onError={handleImageError}
        />
      </div>
    </div>
  );
}
```

### 4. Create Placeholder SVG

Create a placeholder SVG for posts at `apps/web/public/images/blog/default-post.svg`:

```svg
<svg width="800" height="450" viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#F3F4F6"/>
  <path d="M400 225C435.899 225 465 195.899 465 160C465 124.101 435.899 95 400 95C364.101 95 335 124.101 335 160C335 195.899 364.101 225 400 225Z" fill="#D1D5DB"/>
  <path d="M250 355C250 301.772 327.157 250 400 250C472.843 250 550 301.772 550 355H250Z" fill="#D1D5DB"/>
  <text x="400" y="375" font-family="sans-serif" font-size="24" text-anchor="middle" fill="#6B7280">SlideHeroes Blog</text>
</svg>
```

### 5. Alternative Direct Database Approach

If the SQL script approach continues to fail, we can modify the `migrate-posts-direct.ts` script to directly establish relationships:

```typescript
// Add to the existing migration script in packages/content-migrations/src/scripts/core/migrate-posts-direct.ts

/**
 * Creates a relationship record in the posts_rels table
 */
async function createRelationship(client, postId, mediaId) {
  try {
    // Check if the relationship already exists
    const existingRel = await client.query(
      `SELECT id FROM payload.posts_rels WHERE _parent_id = $1 AND field = 'image_id' AND media_id = $2`,
      [postId, mediaId],
    );

    if (existingRel.rows.length === 0) {
      // Insert relationship record
      await client.query(
        `INSERT INTO payload.posts_rels (
          id, 
          _parent_id, 
          field, 
          value, 
          media_id,
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [uuidv4(), postId, 'image_id', mediaId, mediaId],
      );

      console.log(
        `Created relationship for post ${postId} with media ${mediaId}`,
      );
      return true;
    } else {
      console.log(
        `Relationship already exists for post ${postId} with media ${mediaId}`,
      );
      return false;
    }
  } catch (error) {
    console.error(`Error creating relationship for post ${postId}:`, error);
    return false;
  }
}

// Add a function to handle setting the image relationship
async function setPostImageRelationship(client, postId, slug) {
  // Map of slugs to image filenames
  const imageMap = {
    'presentation-tips': 'Presentation Tips Optimized.png',
    'art-craft-business-presentation-creation':
      'Art Craft of Presentation Creation.png',
    'pitch-deck': 'pitch-deck-image.png',
    'powerpoint-presentations-defense': 'Defense of PowerPoint.png',
    'presentation-review-bcg': 'BCG-teardown-optimized.jpg',
    'presentation-tools': 'Presentation Tools-optimized.png',
    'public-speaking-anxiety': 'Conquering Public Speaking Anxiety.png',
    'seneca-partnership': 'Seneca Partnership.webp',
    'typology-business-charts': 'business-charts.jpg',
  };

  // Get the image filename for this slug
  const imageFilename = imageMap[slug];
  if (!imageFilename) {
    console.log(`No image mapping found for slug: ${slug}`);
    return false;
  }

  // Find the media ID for this filename
  const mediaResult = await client.query(
    `SELECT id FROM payload.media WHERE filename = $1`,
    [imageFilename],
  );

  if (mediaResult.rows.length === 0) {
    console.log(`No media found with filename: ${imageFilename}`);
    return false;
  }

  const mediaId = mediaResult.rows[0].id;

  // Update the post record
  await client.query(
    `UPDATE payload.posts SET image_id = $1, image_id_id = $1 WHERE id = $2`,
    [mediaId, postId],
  );

  // Create the relationship
  return await createRelationship(client, postId, mediaId);
}

// Insert this in the main function after creating/updating the post
// Inside the for loop processing each post:
await setPostImageRelationship(client, postId, slug);
```

## Verification Steps

After implementing these changes, we'll verify the solution with the following steps:

1. Run the modified SQL migration script or the enhanced post migration script.
2. Execute these diagnostic queries to verify relationships have been created:

```sql
-- Check post records for image fields
SELECT id, title, slug, image_id, image_id_id FROM payload.posts;

-- Check relationship records
SELECT * FROM payload.posts_rels WHERE field = 'image_id';
```

3. Test the frontend components to ensure images are displaying correctly.
4. Verify error handling by intentionally breaking image links.

## Rollback Plan

If issues arise, we can:

1. Revert changes to the SQL migration script
2. Revert changes to the frontend components
3. Reset the database and re-run migrations

This implementation addresses all aspects of the issue and provides a robust solution with proper error handling and fallbacks.
