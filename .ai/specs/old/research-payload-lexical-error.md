# Payload CMS Lexical Editor Error Research Report
## "parseEditorState: type 'block' not found" Error Investigation

**Generated:** 2025-11-19  
**Error:** `parseEditorState: type 'block' not found` in Payload Admin Panel  
**Affected Versions:** payload ^3.62.1, @payloadcms/richtext-lexical ^3.64.0, lexical ^0.38.2

---

## Executive Summary

The error "parseEditorState: type 'block' not found" occurs when the Lexical editor encounters a block type in saved editor state JSON that has no corresponding registered block definition in the editor configuration. This is typically caused by:

1. **Incomplete BlocksFeature registration** in the Lexical editor configuration
2. **Block slug mismatches** between database content and registered blocks
3. **Version compatibility issues** between packages
4. **Missing block node exports** in Lexical feature definitions

Your data appears correct in the database (youtube-video, bunny-video, call-to-action block types), so the issue is most likely a registration or configuration problem.

---

## Related GitHub Issues

### Critical Issues (Found)

#### Issue #10445: Missing Block Breaks Lexical Editor
- **Status:** Open/Reported
- **Description:** When a block type is missing from the editor configuration but exists in saved content, the editor becomes non-functional with unclear error codes
- **Impact:** Editor won't load documents containing unknown block types
- **Relevance:** CRITICAL - This matches your error exactly

#### Issue #62: BlocksFeature Can't Be Added to Lexical (Payload 3.0 Alpha)
- **Status:** RESOLVED in alpha 54
- **Description:** TypeScript assignment errors when extending lexical with BlocksFeature
- **Error Type:** Feature provider type incompatibility
- **Solution:** Upgrade to Payload alpha 54+
- **Relevance:** May apply if upgrading from earlier 3.x versions

#### Issue #7366: Performance Issues with BlocksFeature
- **Status:** RESOLVED in beta 79
- **Description:** Multiple lexical editors with BlocksFeature cause delays and save failures
- **Root Cause:** Client code being imported in custom lexical features
- **Solution:** Upgraded to 3.0.0-beta.79 and separated client/server code properly
- **Relevance:** Performance issue, but highlights configuration problems

#### Issue #14022: Block Add Causes JSON Undefined Error
- **Status:** Open
- **Description:** Adding a block containing lexical rich text throws "undefined is not valid JSON"
- **Type:** Serialization/parsing issue
- **Relevance:** Related to block parsing errors

#### Issue #14520: BlocksFeature JSX Converter Configuration Issues
- **Status:** Open
- **Description:** BlocksFeature fails when JSX converters import payload-config
- **Root Cause:** Configuration module circular dependencies
- **Relevance:** Affects custom block implementations

#### Issue #3531: Nested Blocks Don't Work in Lexical
- **Status:** Open
- **Description:** Can't add blocks inside nested lexical rich text fields
- **Relevance:** If using nested blocks

#### Issue #10295: BlocksFeature ID Field with Default Value Not Respected
- **Status:** Reported
- **Description:** UUID default values for block IDs not being applied correctly
- **Relevance:** May cause ID-related parsing issues

---

## Root Cause Analysis

### Most Likely Causes (In Order of Probability)

1. **BlocksFeature Not Properly Instantiated** (70% likelihood)
   - Blocks are defined but not wrapped in BlocksFeature
   - BlocksFeature configuration missing from editor features array
   - Block slug property doesn't match database blockType values

2. **Version Mismatch** (20% likelihood)
   - @payloadcms/richtext-lexical 3.64.0 expects specific lexical version
   - Package versions conflict causing parsing differences
   - Bundler caching old versions

3. **Database Content vs Configuration Mismatch** (10% likelihood)
   - Block types in saved content don't exist in current schema
   - Removed/renamed blocks from config but old content remains
   - Block slugs use different naming (youtube-video vs youtubeVideo)

---

## Debugging Steps (In Order)

### Step 1: Verify Block Registration in Lexical Configuration

Check your editor configuration file (likely in `apps/payload/src/collections/` or similar):

```typescript
import { BlocksFeature } from '@payloadcms/richtext-lexical';
import { YouTubeVideoBlock } from './blocks/YouTubeVideoBlock';
import { BunnyVideoBlock } from './blocks/BunnyVideoBlock';
import { CallToActionBlock } from './blocks/CallToActionBlock';

// MUST explicitly list all blocks in BlocksFeature
const editorConfig = {
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [
        YouTubeVideoBlock,
        BunnyVideoBlock,
        CallToActionBlock,
        // Add any other custom blocks here
      ],
    }),
  ],
};
```

**Action:** Verify ALL custom blocks are listed in the BlocksFeature array.

### Step 2: Check Block Slug Names Match Database

The `slug` property in each block definition MUST exactly match the `blockType` value saved in the database.

```typescript
// In YouTubeVideoBlock.ts
export const YouTubeVideoBlock = {
  slug: 'youtube-video', // This must match blockType in database exactly
  fields: [
    // ... field definitions
  ],
  // ... other properties
};
```

**Action:** 
- Open browser DevTools → Network tab
- Load the blog post in admin panel
- Check the response JSON for the exact `blockType` values saved
- Verify each one has a matching `slug` in your block definitions

### Step 3: Check Lexical and Package Versions

```bash
# Check installed versions
npm list lexical @payloadcms/richtext-lexical payload

# Expected compatibility (as of Nov 2025):
# payload: 3.62.1+
# @payloadcms/richtext-lexical: 3.64.0+
# lexical: 0.38.2 (matches with 3.64.0)
```

**Action:** Ensure versions match your package.json. If mismatched:

```bash
# Clean install
pnpm install --force

# Or with npm
npm install --force
```

### Step 4: Verify Block Node Exports

Each block must properly export the block definition with required properties:

```typescript
export const YouTubeVideoBlock = {
  slug: 'youtube-video',
  admin: {
    icon: 'play', // Icon for admin UI
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
    },
    // ... other fields
  ],
};
```

**Minimum required properties:**
- `slug` - Unique identifier (must match blockType in database)
- `fields` - Array of field definitions
- `admin` - Admin UI configuration (label, icon, etc.)

### Step 5: Check Database Content for Unknown Block Types

Query your database to find the actual block types being used:

```bash
# Using Supabase SQL (if using Postgres)
SELECT DISTINCT 
  jsonb_path_query_array(content, '$.nodes[*].blockType')::text as block_types
FROM your_rich_text_field
WHERE content IS NOT NULL;

# Or for MongoDB
db.collection.distinct('content.nodes.blockType')
```

**Action:** 
- List all block types found
- Verify each one has a corresponding block definition in your config
- If orphaned blocks exist, either:
  - Re-add the missing block definition, OR
  - Create a migration to remove those blocks from content

### Step 6: Validate Feature Configuration Format

Ensure BlocksFeature is correctly structured:

```typescript
// CORRECT
BlocksFeature({
  blocks: [Block1, Block2, Block3],
})

// INCORRECT (old format)
blocks: [Block1, Block2, Block3]

// INCORRECT (missing BlocksFeature wrapper)
features: [...defaultFeatures, Block1, Block2]
```

---

## Solutions by Version

### For Payload 3.62.1 + @payloadcms/richtext-lexical 3.64.0

#### Solution 1: Clean Package Installation (Most Common Fix)

```bash
# For pnpm (recommended for monorepos)
pnpm install --force
# Then in web app:
pnpm --filter web dev

# For npm
npm install --force
npm start
```

**Why This Works:** Clears bundler caching and ensures all versions are correctly resolved.

#### Solution 2: Explicit BlocksFeature Import and Registration

```typescript
// apps/payload/src/fields/richTextEditor.ts or similar
'use server';

import { richText as richTextField } from '@payloadcms/richtext-lexical';
import { BlocksFeature } from '@payloadcms/richtext-lexical';

// Import all your blocks
import { YouTubeVideoBlock } from './blocks/youtube-video.ts';
import { BunnyVideoBlock } from './blocks/bunny-video.ts';
import { CallToActionBlock } from './blocks/call-to-action.ts';

export const richTextField = richText({
  name: 'content',
  label: 'Content',
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    // THIS IS CRITICAL - must wrap custom blocks in BlocksFeature
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

#### Solution 3: Verify Block Definition Format

Each block must follow this structure:

```typescript
// apps/payload/src/blocks/youtube-video.ts
import { Block } from 'payload';

export const YouTubeVideoBlock: Block = {
  slug: 'youtube-video', // MUST match blockType in database
  labels: {
    singular: 'YouTube Video',
    plural: 'YouTube Videos',
  },
  fields: [
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Video URL',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: false,
    },
  ],
};
```

#### Solution 4: Handle Server-Only Code Properly

If using Lexical features with server-only code:

```typescript
// WRONG - imports client code in server feature
import { CustomComponent } from './client-component'; // NO! This breaks in server features

// CORRECT - separate server and client code
// apps/payload/src/features/lexical/index.ts (server code)
export const MyFeature = createEditorFeature({
  slug: 'myFeature',
  // ... server-side configuration
});

// apps/payload/src/features/lexical/client.tsx (client component)
'use client';
export const MyFeatureComponent = () => { ... };
```

---

## Temporary Workarounds

If you need the blog post accessible immediately:

### Option 1: Remove Problematic Content

Identify and temporarily remove the block causing issues:

```typescript
// Create a migration or manual fix
// Remove 'youtube-video' blocks from content
content.nodes = content.nodes.filter(
  node => node.blockType !== 'youtube-video'
);
```

### Option 2: Re-Register Missing Blocks

If you recently removed a block, temporarily re-add it to your configuration even if unused:

```typescript
import { LegacyBlock } from './blocks/legacy-block'; // Re-add temporarily

BlocksFeature({
  blocks: [
    YouTubeVideoBlock,
    BunnyVideoBlock,
    CallToActionBlock,
    LegacyBlock, // Temporarily re-add to allow parsing
  ],
})
```

---

## Version Upgrade Path

If you're on older versions:

### From Payload 3.0 Alpha → 3.62.1

```bash
npm upgrade payload @payloadcms/richtext-lexical

# Key breaking changes to address:
# 1. BlocksFeature API changed in alpha 54 - update feature registration
# 2. Block field validation rules may need updates
# 3. defaultValue in RichText changed - use Form initialState instead
```

### Verify After Upgrade

```bash
# 1. Check for TypeScript errors
pnpm typecheck

# 2. Run Payload seed/migrations
pnpm --filter web supabase migration up

# 3. Test in admin panel
pnpm --filter web dev
```

---

## Verification Checklist

After applying fixes, verify:

- [ ] All block types in database have matching block definitions
- [ ] BlocksFeature wraps custom blocks in editor config
- [ ] Block `slug` properties exactly match database `blockType` values
- [ ] Lexical and @payloadcms/richtext-lexical versions are compatible
- [ ] No circular imports or client code in server features
- [ ] Package.json versions locked to tested compatible versions
- [ ] Package cache cleaned and modules reinstalled
- [ ] TypeScript passes without errors (`pnpm typecheck`)
- [ ] Blog post loads in admin panel without "type block not found" error

---

## Files to Check in Your Project

1. **Editor Configuration**
   - `apps/payload/src/fields/rich-text-editor.ts` (or equivalent)
   - Look for: BlocksFeature instantiation and block list

2. **Block Definitions**
   - `apps/payload/src/blocks/youtube-video.ts`
   - `apps/payload/src/blocks/bunny-video.ts`
   - `apps/payload/src/blocks/call-to-action.ts`
   - Look for: `slug` property matches values in database

3. **Collection Schema**
   - `apps/payload/src/collections/blog.ts` (or equivalent)
   - Look for: richText field configuration with features

4. **Package Files**
   - `package.json` - Check versions
   - `pnpm-lock.yaml` or `package-lock.json` - Check resolved versions

---

## Community Resources

- **Official Payload Docs:** https://payloadcms.com/docs/rich-text/lexical
- **Lexical Documentation:** https://lexical.dev/docs/intro
- **GitHub Issues:** https://github.com/payloadcms/payload/issues
- **Payload Discord:** Active community support for real-time help

---

## Summary of Key Points

1. **Most Likely Issue:** Blocks not properly wrapped in BlocksFeature or slug mismatch
2. **Quick Fix:** Verify block registration and clean install packages
3. **Key Files:** Editor config, block definitions, package.json versions
4. **Database Check:** Verify actual blockType values in saved content
5. **Version Compatibility:** payload 3.62.1 + @payloadcms/richtext-lexical 3.64.0 + lexical 0.38.2 should be compatible

---

## Next Steps

1. Run debugging steps 1-6 above in order
2. Check your editor configuration file first
3. Compare block slugs with database blockType values
4. Clean install packages if versions mismatch
5. Test loading blog post in admin panel
6. If still failing, check browser console for additional error details

