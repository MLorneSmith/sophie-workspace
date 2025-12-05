# Payload CMS Lexical - Debugging Checklist

## Quick Diagnosis Script

Run this to identify the issue:

```bash
#!/bin/bash
# Check 1: Package versions
echo "=== Checking package versions ==="
pnpm list payload @payloadcms/richtext-lexical lexical

# Check 2: BlocksFeature usage
echo -e "\n=== Searching for BlocksFeature usage ==="
grep -r "BlocksFeature" apps/payload/src --include="*.ts" --include="*.tsx"

# Check 3: Block definitions
echo -e "\n=== Searching for block definitions ==="
find apps/payload/src -name "*block*" -type f

# Check 4: Rich text field configuration
echo -e "\n=== Searching for rich text field config ==="
grep -r "richText(" apps/payload/src --include="*.ts" --include="*.tsx" -A 5

# Check 5: TypeScript errors
echo -e "\n=== TypeScript check ==="
pnpm typecheck --filter web 2>&1 | head -50
```

---

## Step-by-Step Verification

### 1. Package Version Check

```bash
# Command
npm list --depth=0 payload @payloadcms/richtext-lexical lexical

# Expected Output for Your Setup
payload@3.62.1
@payloadcms/richtext-lexical@3.64.0
lexical@0.38.2

# If versions don't match, run:
pnpm install --force
```

### 2. Find Your Editor Configuration File

```bash
# Search for where BlocksFeature is used
grep -r "BlocksFeature" apps/payload/src

# Usually in one of these locations:
# - apps/payload/src/fields/rich-text-editor.ts
# - apps/payload/src/collections/blog.ts
# - apps/payload/src/config.ts
```

### 3. Verify Block Registration Pattern

Once you find the file, check it looks like this:

```typescript
// CORRECT PATTERN
import { BlocksFeature } from '@payloadcms/richtext-lexical';
import { YouTubeVideoBlock } from './blocks/youtube-video';
import { BunnyVideoBlock } from './blocks/bunny-video';
import { CallToActionBlock } from './blocks/call-to-action';

const richTextField = richText({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [
        YouTubeVideoBlock,
        BunnyVideoBlock,
        CallToActionBlock,
      ],
    }),
  ],
});
```

### 4. Check Block Slug Names

Find your block definition files and verify:

```typescript
// In apps/payload/src/blocks/youtube-video.ts
export const YouTubeVideoBlock = {
  slug: 'youtube-video', // ← This is the key
  fields: [
    // ... fields
  ],
};
```

**Action:** Note down all slug values:
- [ ] `youtube-video`
- [ ] `bunny-video`
- [ ] `call-to-action`
- [ ] (any others)

### 5. Check Database for Block Types

If you have database access:

**PostgreSQL/Supabase:**
```sql
-- Find all unique block types in your content
SELECT DISTINCT 
  jsonb_path_query_array(content, '$.nodes[*].blockType')::text as blockType
FROM your_table_name
WHERE content IS NOT NULL
GROUP BY blockType;
```

**MongoDB:**
```javascript
db.collection_name.distinct('content.nodes.blockType')
```

**Firebase/Other:**
- Query your rich text field and extract blockType values
- Compare against registered block slugs

### 6. Compare Lists

Create two lists and compare:

**Registered Blocks** (from editor config):
- youtube-video
- bunny-video
- call-to-action

**Database Blocks** (from query above):
- youtube-video
- bunny-video
- call-to-action

**They should be IDENTICAL** - every blockType in database must have a matching slug in registered blocks.

### 7. Check for Client/Server Code Issues

Search for client code in server features:

```bash
# Find potential issues
grep -r "'use client'" apps/payload/src/blocks --include="*.ts" --include="*.tsx"
grep -r "'use server'" apps/payload/src/blocks --include="*.ts" --include="*.tsx"

# Look for imports that cross boundaries
grep -r "import.*from.*@payload" apps/payload/src/blocks --include="*.ts" --include="*.tsx"
```

**Expected:**
- Client components: `'use client'` at top
- Server features: `'use server'` at top
- No importing client components in server features

### 8. Run Type Check

```bash
pnpm typecheck --filter web

# Should see no errors related to:
# - BlocksFeature
# - FeatureProvider
# - Block types
```

---

## Common Issues & Quick Fixes

### Issue: Block slug mismatch
```
Error: parseEditorState: type 'youtube-video' not found
Database has: 'youtube-video'
Registered as: 'youtubeVideo'
```

**Fix:** Make sure slugs match EXACTLY (including hyphens vs camelCase)

```typescript
// Change this:
export const YouTubeVideoBlock = {
  slug: 'youtubeVideo', // Wrong!
  
// To this:
export const YouTubeVideoBlock = {
  slug: 'youtube-video', // Correct!
```

### Issue: Block not in BlocksFeature array
```
Error: parseEditorState: type 'bunny-video' not found
```

**Fix:** Add to BlocksFeature

```typescript
// Was:
BlocksFeature({
  blocks: [YouTubeVideoBlock, CallToActionBlock],
})

// Now:
BlocksFeature({
  blocks: [YouTubeVideoBlock, BunnyVideoBlock, CallToActionBlock],
})
```

### Issue: Package version mismatch
```
TypeError: BlocksFeature is not a function
Cannot read property 'blocks' of undefined
```

**Fix:** Reinstall packages

```bash
pnpm install --force
# Or
npm install --force

# Then test
pnpm --filter web dev
```

### Issue: Client code in server feature
```
Error: Client component with properties cannot be imported in a Server component
```

**Fix:** Separate client and server code

```typescript
// BAD: apps/payload/src/features/lexical/block.ts
import { ClientComponent } from './client'; // Error!

// GOOD: apps/payload/src/features/lexical/server.ts
// No client imports here

// GOOD: apps/payload/src/features/lexical/client.tsx
'use client';
import { ClientComponent } from './client';
```

---

## Browser Console Debugging

1. Open Payload Admin Panel
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to Console tab
4. Try to load blog post with blocks
5. Look for error messages:

```
// Good sign (no error)
✓ Editor loaded successfully

// Bad sign (error)
✗ parseEditorState: type 'youtube-video' not found
✗ Cannot find block configuration for type: bunny-video
✗ Unknown node type: call-to-action
```

**Note:** Copy the exact error message - it tells you which block type is missing.

---

## Network Tab Debugging

1. Open DevTools → Network tab
2. Load the blog post
3. Find the API request for the post (usually `/api/posts/[id]`)
4. Click it and view Response JSON
5. Search for `blockType`:

```json
{
  "content": {
    "nodes": [
      {
        "type": "block",
        "blockType": "youtube-video",  ← Check this value
        "fields": {...}
      }
    ]
  }
}
```

**Action:** Write down all unique `blockType` values you see.

---

## File Location Checklist

Check these files exist and are correctly configured:

```
apps/payload/
├── src/
│   ├── config.ts (or payload.config.ts)
│   │   └── Check: BlocksFeature configured in richText field
│   ├── blocks/
│   │   ├── youtube-video.ts
│   │   │   └── Check: slug: 'youtube-video'
│   │   ├── bunny-video.ts
│   │   │   └── Check: slug: 'bunny-video'
│   │   └── call-to-action.ts
│   │       └── Check: slug: 'call-to-action'
│   ├── collections/
│   │   └── blog.ts (or posts.ts)
│   │       └── Check: richText field with BlocksFeature
│   └── fields/
│       └── rich-text-editor.ts (if separate)
│           └── Check: BlocksFeature wraps all blocks
└── package.json
    └── Check: payload@3.62.1, @payloadcms/richtext-lexical@3.64.0, lexical@0.38.2
```

---

## Final Verification

After making changes, run in order:

```bash
# 1. Format code
pnpm format:fix

# 2. Lint code
pnpm lint:fix

# 3. Type check
pnpm typecheck

# 4. Start dev server
pnpm --filter web dev

# 5. Open admin panel and test
# Navigate to: http://localhost:3000/admin
# Try to edit a blog post with blocks
```

**Success Indicators:**
- ✓ No TypeScript errors
- ✓ Blog post loads in admin panel
- ✓ Can edit and save blocks
- ✓ No console errors

**Failure Indicators:**
- ✗ TypeScript errors about BlocksFeature
- ✗ "parseEditorState: type X not found" error
- ✗ Blocks appear but can't edit
- ✗ Save fails silently

---

## Emergency Workaround

If you need immediate access while debugging:

```bash
# Option 1: Temporarily disable the problematic block type
# Comment out the block from BlocksFeature:
BlocksFeature({
  blocks: [
    YouTubeVideoBlock,
    BunnyVideoBlock,
    // CallToActionBlock, // Temporarily disabled
  ],
})

# Option 2: Create a migration to remove problematic blocks
# This removes all 'call-to-action' blocks from content
// SQL
UPDATE posts 
SET content = jsonb_set(
  content,
  '{nodes}',
  content->'nodes' - (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(content->'nodes') elem
    WHERE elem->>'blockType' != 'call-to-action'
  )
)
WHERE content IS NOT NULL;
```

---

## Additional Resources

- TypeScript Errors: Run `pnpm typecheck`
- Lint Issues: Run `pnpm lint`
- Format Issues: Run `pnpm format:fix`
- Package Issues: Check `pnpm-lock.yaml` or `package-lock.json`
- Payload Docs: https://payloadcms.com/docs/rich-text/lexical
- GitHub Issues: https://github.com/payloadcms/payload/issues

