# Payload CMS "parseEditorState: type block not found" - Research & Solutions

**Research Date:** November 19, 2025  
**Error:** `parseEditorState: type "block" not found` in Payload CMS 3.x with @payloadcms/richtext-lexical  
**Status:** RESOLVED in this project  
**Related GitHub Issue:** #648

---

## Executive Summary

The **"parseEditorState: type block not found"** error in Payload CMS occurs when the **global Lexical editor configuration** lacks the `BlocksFeature` required to parse rich text content containing block nodes. This is NOT a data corruption issue—the content is correctly stored in the database with valid block types (e.g., `youtube-video`, `bunny-video`, `call-to-action`).

**Root Cause:** Incomplete editor configuration at the application level (global) while collection-level editors have the proper BlocksFeature configuration.

**Solution Implemented:** Add `BlocksFeature` with `allBlocks` to the global Lexical editor configuration in `payload.config.ts`.

---

## Error Details

### Symptoms
- Error appears when viewing blog posts/content with block nodes in Payload admin panel
- Error message: `parseEditorState: type "block" not found`
- Stack trace originates from `RscEntryLexicalField` (server-side rendering component)
- Affects server-side parsing during form state building

### Environment
- **Payload CMS:** ^3.62.1
- **@payloadcms/richtext-lexical:** ^3.64.0
- **lexical:** ^0.38.2
- **Framework:** Next.js 15+ with Supabase database
- **Versions:** Payload 3.x (2024-2025)

### Code Location in Error
```typescript
// apps/payload/src/payload.config.ts:307
editor: lexicalEditor({})  // ❌ WRONG: No BlocksFeature
```

---

## Root Cause Analysis

### Why This Happens

Payload CMS uses a **two-tier editor configuration system:**

1. **Global Editor Config** (`payload.config.ts`)
   - Used by server-side rendering components (`RscEntryLexicalField`)
   - Defines all Lexical node types available to the application
   - Must include `BlocksFeature` if ANY collection uses blocks

2. **Collection-Level Editors** (e.g., `Posts.ts`, `Documentation.ts`)
   - Can override/extend global configuration for specific needs
   - Collection-specific block definitions
   - Doesn't replace global config for SSR operations

### The Gap

When you have:
```typescript
// Global config (INCOMPLETE)
editor: lexicalEditor({})  // No BlocksFeature, no blocks

// Collection config (CORRECT)
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [BunnyVideo, CallToAction, YouTubeVideo],
    }),
  ],
})
```

Payload's SSR components can't parse the `BlockNode` type because:
1. Global editor has no `BlocksFeature` registered
2. `BlockNode` type is not available to the Lexical parser
3. When parsing JSON with `"type": "block"`, Lexical throws: "type block not found"

### Why Database Content Is Valid

The database stores blocks correctly as:
```json
{
  "type": "block",
  "fields": {
    "blockType": "youtube-video",
    "videoId": "..."
  }
}
```

The `blockType` field (youtube-video, bunny-video, call-to-action) is correct—the issue is that Lexical can't recognize the **Lexical node type** `"block"` because `BlocksFeature` is missing globally.

---

## Solution: Global BlocksFeature Configuration

### Implementation (RESOLVED)

**File:** `apps/payload/src/payload.config.ts`

**Current (Fixed) Code:**
```typescript
// Line 9: Import BlocksFeature
import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";

// Line 33: Import all blocks
import { allBlocks } from "./blocks/index";

// Lines 308-315: Global editor configuration
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: allBlocks,
    }),
  ],
}),
```

### How It Works

1. **BlocksFeature Registration:** The `BlocksFeature` from `@payloadcms/richtext-lexical` registers the `BlockNode` type with Lexical
2. **Block Array:** `allBlocks` provides the complete list of all block types:
   - BunnyVideo
   - CallToAction
   - DebugBlock
   - TestBlock
   - YouTubeVideo
3. **Global Availability:** All Payload SSR components can now parse block content across all collections

### Block Definitions

**File:** `apps/payload/src/blocks/index.ts`

```typescript
export const allBlocks = [
  BunnyVideo,      // Bunny.net video player blocks
  CallToAction,    // CTA blocks with headline, description, link
  DebugBlock,      // Testing/debug block
  TestBlock,       // Testing block
  YouTubeVideo,    // YouTube video embeds
];
```

Each block is imported from its config file (`./[BlockName]/config.ts`), ensuring:
- Proper slug matching (`youtube-video`, `bunny-video`, `call-to-action`)
- Correct field definitions
- Admin UI configuration (labels, icons)

---

## Critical Distinction: SSR vs Client-Side

### Server-Side Rendering (SSR) - The Issue
- Payload admin panel uses **server components** to render forms
- SSR components (`RscEntryLexicalField`) need the **global editor** to parse rich text
- This is where the `BlockNode` type must be registered
- **This was missing** → caused the error

### Collection-Level Configuration
- Provides rich editing UI in the browser
- Can override global settings for specific collections
- Doesn't replace SSR parsing requirements
- **This was correctly configured** but insufficient on its own

### Key Insight
**You can have perfectly configured collection editors while global SSR still fails.** The global config must be complete for both:
1. Server-side HTML generation
2. Admin panel form rendering
3. Content serialization/deserialization

---

## Block Slug vs BlockType: Understanding the Difference

### BlockType (Database)
- Stored in rich text content under `fields.blockType`
- Examples: `"youtube-video"`, `"bunny-video"`, `"call-to-action"`
- Must exactly match the block's `slug` property
- User-facing identifier for which block is used

### Lexical Node Type
- Internal Lexical parsing concept
- Generic type is `"block"` for all block nodes
- Registered globally via `BlocksFeature`
- NOT the same as `blockType`

**The Error**
```
parseEditorState: type "block" not found
```

This means: "I found a JSON node with type='block', but BlocksFeature 
isn't registered, so I don't know how to parse it."

It's NOT about the blockType value being wrong—it's about the block 
node structure itself being unrecognized.

---

## Related GitHub Issues & Patterns

### Payload CMS GitHub Issues (Historical Context)

1. **Issue #10445**: Missing Block Breaks Lexical Editor
   - Status: Known issue in Payload 3.x
   - Solution: Register all blocks in BlocksFeature globally

2. **Issue #62**: BlocksFeature Can't Be Added to Lexical (Alpha)
   - Status: RESOLVED in alpha 54+
   - Version: Applied to 3.0.0 final

3. **Issue #7366**: Performance Issues with BlocksFeature
   - Status: RESOLVED
   - Solution: Separate client/server code properly

4. **Issue #14022**: Block Add Causes JSON Undefined Error
   - Status: Related serialization issue
   - Often fixed by global BlocksFeature registration

5. **Issue #14520**: BlocksFeature JSX Converter Issues
   - Status: Configuration dependency issues
   - Solution: Proper module separation

### Standard Payload Pattern
Per official documentation, the correct pattern is:
```typescript
// Global config MUST have BlocksFeature if blocks are used anywhere
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({ blocks: allBlocks }),
  ],
})

// Collection configs can extend/override as needed
// but rely on global BlocksFeature for SSR
```

---

## Affected Collections

Once the global BlocksFeature is configured, these collections can safely use blocks:

- **Posts** (primary use case for this project)
- **CourseLessons** (video block support)
- **Documentation** (various blocks support)
- **Private** (flexible block support)
- **Surveys** (structured block support)

All collections sharing the same global Lexical configuration benefit from proper block parsing.

---

## Prevention Checklist

To prevent this error in future projects:

- [x] Import `BlocksFeature` from `@payloadcms/richtext-lexical`
- [x] Create `allBlocks` export from a centralized blocks index
- [x] Add `BlocksFeature({ blocks: allBlocks })` to global editor in `payload.config.ts`
- [x] Verify block slug names match database blockType values
- [x] Test loading content with blocks in admin panel
- [x] Verify server-side rendering doesn't throw parsing errors

---

## Verification in SlideHeroes Project

### Current Status: FIXED ✅

**Commit:** `8a14a4ee7` - "fix(payload): add BlocksFeature to global Lexical editor configuration"

**Changes Made:**
- Added `BlocksFeature` import to line 9 of `payload.config.ts`
- Added `allBlocks` import on line 33 of `payload.config.ts`
- Updated editor configuration (lines 308-315) to include BlocksFeature

**Testing Performed:**
- Post "4 Powerful Tools to Improve Your Presentation" loads without error
- YouTube video blocks display correctly
- Bunny.net video blocks display correctly
- Call-to-action blocks display correctly
- Block content can be edited and saved
- All TypeScript checks pass
- No console errors related to Lexical parsing

### Files Modified
1. **apps/payload/src/payload.config.ts** - Global editor configuration
   - No changes needed to block definitions
   - No changes needed to collection configurations
   - No database migrations required

### Files Verified
1. **apps/payload/src/blocks/index.ts** - Block exports (unchanged, working correctly)
2. **apps/payload/src/blocks/[Name]/config.ts** - Individual block configs (unchanged)
3. **apps/payload/src/collections/Posts.ts** - Collection editor (unchanged, uses global blocks)

---

## Best Practices Going Forward

### When Adding New Blocks
1. Create block config in `apps/payload/src/blocks/[BlockName]/config.ts`
2. Export from `blocks/index.ts` and add to `allBlocks` array
3. Use in any collection's editor via inherited global BlocksFeature
4. No need to update `payload.config.ts`—it uses `allBlocks` automatically

### When Removing Blocks
1. Remove from `blocks/index.ts` and `allBlocks` array
2. Consider migration for existing content using that block
3. Global editor automatically stops recognizing the block

### When Migrating Content
```typescript
// Migration example: Replace old block type with new one
content.nodes = content.nodes.map(node => {
  if (node.type === 'block' && node.fields?.blockType === 'old-block-type') {
    node.fields.blockType = 'new-block-type';
  }
  return node;
});
```

---

## Troubleshooting Guide

### Error Still Occurs After Fix
1. **Clear node_modules:** `pnpm install --force` (pnpm) or `npm install --force`
2. **Rebuild Payload:** `pnpm --filter payload dev` with server restart
3. **Check imports:** Verify `allBlocks` exports in `blocks/index.ts`
4. **Verify database:** Check actual blockType values stored in content

### TypeScript Errors
```bash
# Verify no import errors
pnpm typecheck

# Check block definitions have proper types
pnpm lint:fix
```

### Block Types in Database Not Matching
Use SQL to find actual stored blockTypes:
```sql
-- Supabase PostgreSQL
SELECT DISTINCT 
  jsonb_path_query_array(content, '$.root.children[*].fields.blockType')::text as block_types
FROM posts
WHERE content IS NOT NULL;
```

Ensure returned blockTypes have matching block definitions with those slugs.

---

## Related Documentation

- **Payload CMS Docs:** https://payloadcms.com/docs/rich-text/lexical
- **Lexical Documentation:** https://lexical.dev/docs/intro
- **GitHub Issues:** https://github.com/payloadcms/payload/issues
- **Payload Discord:** Community support for real-time help

---

## Key Takeaways

1. **Global Editor Required:** All Payload projects using blocks must configure BlocksFeature globally
2. **SSR Dependency:** Server-side rendering components depend on global editor configuration
3. **Collection Editors Secondary:** Collection-level editors enhance but don't replace global config
4. **Not a Data Issue:** The error doesn't indicate database problems—correctly stored data fails to parse due to SSR configuration
5. **Simple Fix:** Adding 3-5 lines of configuration resolves the issue completely
6. **No Migration Needed:** Existing block content requires no changes—it's just a parsing issue

---

**Research Completed:** November 19, 2025  
**Status:** Issue Resolved in SlideHeroes Project  
**Confidence Level:** Very High (fix implemented and tested)
