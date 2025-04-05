# Content Migration Fixes Implementation Plan

This document outlines the implementation plan for fixing two issues with the content migration system:

1. The `featured_image_id_id` field in the course lessons collection is not being populated
2. The posts collection is not being populated due to a filename mismatch

## Issue 1: Featured Image ID Not Populated Correctly

**Findings:**

- The `featured_image_id` field in the `course_lessons` table is correctly populated (23 rows have values)
- The `featured_image_id_id` field is completely empty (0 rows have values)
- The relationship table `course_lessons_rels` has 23 entries for the `featured_image` field
- This is similar to how `course_id_id` and `quiz_id_id` are handled in the `fixRelationships` function

**Root Cause:**
The issue is that Payload CMS uses both a direct field (`featured_image_id`) and a duplicate field (`featured_image_id_id`) for compatibility with its internal systems. While the direct field is being populated, the duplicate field is not, causing the relationship to not work properly in the admin UI.

## Issue 2: Posts Collection Not Being Populated

**Findings:**

- The `posts` table is completely empty (0 rows)
- There's a filename mismatch: the migration is looking for `09-posts.sql` but the file in the seed directory is named `08-posts.sql`
- This mismatch causes the posts SQL file to be skipped during migration

**Root Cause:**
The content processing migration is looking for a file with a different name than what exists in the seed directory, causing it to skip the posts SQL file.

## Implementation Steps

### 1. Fix Featured Image ID Issue

Update the `fixRelationships` function in `apps/payload/src/migrations/20250403_200000_process_content.ts` to populate the `featured_image_id_id` field with the same values as `featured_image_id`.

```typescript
// Add this code after the quiz_id_id update
// Update featured_image_id_id to match featured_image_id
const { rowCount: featuredImageLessonsUpdated } = await db.execute(sql`
  UPDATE payload.course_lessons 
  SET featured_image_id_id = featured_image_id 
  WHERE featured_image_id IS NOT NULL AND featured_image_id_id IS NULL
`);
console.log(
  `Updated featured_image_id_id for ${featuredImageLessonsUpdated} course lessons`,
);
```

### 2. Fix Posts Collection Issue

Update the `seedFiles` array in `apps/payload/src/migrations/20250403_200000_process_content.ts` to use the correct filename:

```typescript
// Change this line
'09-posts.sql',
// To this
'08-posts.sql',
```

### 3. Add Posts SQL Generation Function

For long-term maintainability, add a function to generate the posts SQL file from raw data in `packages/content-migrations/src/scripts/sql/generate-sql-seed-files-fixed.ts`:

```typescript
/**
 * Generates SQL for posts from .mdoc files
 * @param postsDir - Directory containing post .mdoc files
 * @returns SQL for posts
 */
function generatePostsSql(postsDir: string): string {
  // Get all .mdoc files in the posts directory
  const postFiles = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Start building the SQL
  let sql = `-- Seed data for the posts table
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

`;

  // Process each post file
  for (const file of postFiles) {
    const filePath = path.join(postsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    // Generate a UUID for the post
    const postId = uuidv4();

    // Get the media ID for this post's image
    const mediaId =
      data.image && global.mediaIds ? global.mediaIds[data.image] : null;

    // Add the post to the SQL
    sql += `-- Insert post: ${data.title}
INSERT INTO payload.posts (
  id,
  title,
  slug,
  description,
  content,
  status,
  ${mediaId ? 'image_id,' : ''}
  published_at,
  created_at,
  updated_at
) VALUES (
  '${postId}', -- Generated UUID for the post
  '${data.title.replace(/'/g, "''")}',
  '${path.basename(file, '.mdoc')}',
  '${(data.description || '').replace(/'/g, "''")}',
  markdown_to_lexical('${content.replace(/'/g, "''")}'),
  '${data.status || 'published'}',
  ${mediaId ? `'${mediaId}',` : ''}
  '${data.publishedAt || new Date().toISOString()}',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING; -- Skip if the post already exists

`;

    // Add the relationship entry for the media if available
    if (mediaId) {
      sql += `-- Create relationship entry for the post to the media
INSERT INTO payload.posts_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${postId}',
  'image_id',
  '${mediaId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;
    }

    // Add categories if available
    if (data.categories && Array.isArray(data.categories)) {
      for (let i = 0; i < data.categories.length; i++) {
        const category = data.categories[i];
        sql += `-- Add category: ${category}
INSERT INTO payload.posts_categories (
  id,
  _parent_id,
  category,
  updated_at,
  created_at,
  "order"
) VALUES (
  gen_random_uuid(),
  '${postId}',
  '${category.replace(/'/g, "''")}',
  NOW(),
  NOW(),
  ${i}
) ON CONFLICT DO NOTHING; -- Skip if the category already exists

`;
      }
    }

    // Add tags if available
    if (data.tags && Array.isArray(data.tags)) {
      for (let i = 0; i < data.tags.length; i++) {
        const tag = data.tags[i];
        sql += `-- Add tag: ${tag}
INSERT INTO payload.posts_tags (
  id,
  _parent_id,
  tag,
  updated_at,
  created_at,
  "order"
) VALUES (
  gen_random_uuid(),
  '${postId}',
  '${tag.replace(/'/g, "''")}',
  NOW(),
  NOW(),
  ${i}
) ON CONFLICT DO NOTHING; -- Skip if the tag already exists

`;
      }
    }
  }

  // Drop the temporary function
  sql += `-- Drop the temporary function
DROP FUNCTION markdown_to_lexical;

-- Commit the transaction
COMMIT;
`;

  return sql;
}
```

Update the `generateSqlSeedFiles` function to include posts SQL:

```typescript
async function generateSqlSeedFiles() {
  // ... existing code

  // Generate posts SQL
  console.log('Generating posts SQL...');
  const postsSql = generatePostsSql(RAW_POSTS_DIR);
  fs.writeFileSync(path.join(PAYLOAD_SQL_SEED_DIR, '08-posts.sql'), postsSql);

  // ... existing code

  // Copy the posts SQL file to the processed SQL directory
  fs.copyFileSync(
    path.join(PAYLOAD_SQL_SEED_DIR, '08-posts.sql'),
    path.join(PROCESSED_SQL_DIR, '08-posts.sql'),
  );

  // ... existing code
}
```

### 4. Add Media Relationship Verification

Add a verification step for posts-to-media relationships in the `verifyContent` function:

```typescript
// Add to verifyContent function
// Verify media relationships with posts
const { rows: postMediaRelationshipsCount } = await db.execute(sql`
  SELECT COUNT(*) as count
  FROM payload.posts_rels r
  WHERE r.field = 'image_id'
`);
console.log(
  `Post media relationships count: ${postMediaRelationshipsCount[0].count}`,
);

// Verify posts relationship columns
const { rows: postsMissingRels } = await db.execute(sql`
  SELECT COUNT(*) as count
  FROM payload.posts p
  WHERE p.image_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM payload.posts_rels r
    WHERE r._parent_id = p.id
    AND r.field = 'image_id'
    AND r.value = p.image_id
  )
`);

if (parseInt(postsMissingRels[0].count) > 0) {
  console.warn(
    `WARNING: ${postsMissingRels[0].count} posts are missing media relationships!`,
  );
} else {
  console.log('✅ All posts have proper media relationships');
}
```

## Testing Plan

1. **Test Featured Image ID Fix**:

   - Run the migration with the updated `fixRelationships` function
   - Verify that `featured_image_id_id` is populated by querying the database:
     ```sql
     SELECT COUNT(*) FROM payload.course_lessons WHERE featured_image_id_id IS NOT NULL;
     ```
   - Verify that the count matches the count of lessons with `featured_image_id`:
     ```sql
     SELECT COUNT(*) FROM payload.course_lessons WHERE featured_image_id IS NOT NULL;
     ```

2. **Test Posts Collection Fix**:
   - Update the migration file or rename the posts SQL file
   - Run the migration
   - Verify that posts are populated by querying the database:
     ```sql
     SELECT COUNT(*) FROM payload.posts;
     ```
   - Verify that post-to-media relationships are established:
     ```sql
     SELECT COUNT(*) FROM payload.posts_rels WHERE field = 'image_id';
     ```
