# Payload CMS Lexical "parseEditorState: type block not found" - Complete Research Summary

**Research Completed:** November 19, 2025  
**Status:** RESOLVED  
**GitHub Issue:** #648  
**Commit:** 8a14a4ee7

---

## What This Error Is

```text
parseEditorState: type "block" not found
```

A **server-side rendering configuration error** that occurs when Payload CMS tries to parse rich text
content containing block nodes, but the global Lexical editor configuration doesn't have
`BlocksFeature` registered.

---

## The Solution (Already Applied)

Add `BlocksFeature` with `allBlocks` to the global editor in `payload.config.ts`:

```typescript
// Before (Line 307 - BROKEN)
editor: lexicalEditor({})

// After (Lines 308-315 - FIXED)
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: allBlocks,
    }),
  ],
}),
```

**Files Changed:**

1. `apps/payload/src/payload.config.ts` - Global editor configuration (fixed)
2. All other files remain unchanged and working correctly

---

## Why This Happened

### The Two-Tier Architecture

Payload CMS has **two separate editor configurations:**

1. **Global Editor** (`payload.config.ts`)
   - Used by Server-Side Rendering (SSR) components
   - Parses all rich text content across the application
   - Must include BlocksFeature if any collection uses blocks

2. **Collection Editor** (e.g., `Posts.ts`)
   - Used by browser-side editing UI
   - Provides rich editing interface
   - Doesn't replace global config for SSR

### The Architectural Issue

When Payload renders the admin panel:

1. **Server** builds form state using **global editor**
2. Server SSR component calls `RscEntryLexicalField`
3. This component parses rich text using **global editor config**
4. If global editor lacks BlocksFeature, parsing fails
5. Collection-level editor config is irrelevant at this stage

**The original bug:**

- Global editor was minimal: `lexicalEditor({})`
- Collection editor had BlocksFeature configured correctly
- This worked fine for browser UI but broke SSR parsing
- When loading the admin form, SSR would fail before collection editor even loaded

---

## Critical Distinction: BlockType vs BlockNode Type

### Lexical Node Type (`"type": "block"`)

- Internal Lexical parsing concept
- Registered globally via BlocksFeature
- Generic "block" wrapper for all block types
- **This is what the error refers to**

### blockType (e.g., `"youtube-video"`)

- User-facing block identifier
- Stored in database content
- Specific block implementation
- **This was correct in the database**

```json
{
  "type": "block",              ← Lexical node type (SSR issue)
  "fields": {
    "blockType": "youtube-video"  ← User block type (was correct)
  }
}
```

The error wasn't about invalid blockType values—it was about Lexical being unable to parse the block node structure itself.

---

## Server-Side Rendering vs Client-Side Editing

### The Problem: SSR

- Payload admin panel uses Next.js Server Components
- When form loads, SSR must parse rich text field content
- Parsing uses **global editor** config (not collection config)
- Without BlocksFeature globally, parsing fails
- Error appears before user ever sees editing UI

### The Solution: Global Configuration

- Global editor must have BlocksFeature with all blocks
- SSR can now parse block content
- Form renders successfully to browser
- Collection editor then provides interactive UI

### Why Collection Editor Wasn't Enough

- Collection editor only runs in browser after SSR succeeds
- If SSR fails, collection editor never loads
- Global config is the foundation, collection config is enhancement

---

## Files Involved

### Modified ✅

- **`apps/payload/src/payload.config.ts`** - Added BlocksFeature to global editor

### Verified Correct (No Changes Needed)

- **`apps/payload/src/blocks/index.ts`** - Exports allBlocks correctly
- **`apps/payload/src/blocks/*/config.ts`** - Individual blocks defined properly
- **`apps/payload/src/collections/Posts.ts`** - Collection editor configured correctly
- **Database** - Content stored with valid blockType values

---

## Blocks Currently Configured

The `allBlocks` array includes:

- **BunnyVideo** - Bunny.net video player blocks (`bunny-video`)
- **CallToAction** - CTA blocks with headline (`call-to-action`)
- **DebugBlock** - Testing block (`debug-block`)
- **TestBlock** - Testing block (`test-block`)
- **YouTubeVideo** - YouTube embeds (`youtube-video`)

When you add new blocks:

1. Create block config in `apps/payload/src/blocks/[BlockName]/config.ts`
2. Export from `blocks/index.ts`
3. Add to `allBlocks` array
4. Global editor automatically includes it—no changes to `payload.config.ts` needed

---

## Related GitHub Issues (Historical Context)

1. **#10445** - Missing Block Breaks Lexical Editor
   - Known issue in Payload 3.x
   - Solution: Register all blocks globally

2. **#62** - BlocksFeature Can't Be Added (Alpha)
   - RESOLVED in alpha 54+
   - Now works correctly in 3.x

3. **#7366** - Performance with BlocksFeature
   - RESOLVED by proper code separation

4. **#14022** - Block Add JSON Error
   - Related serialization issue
   - Fixed by global BlocksFeature

5. **#14520** - BlocksFeature JSX Converter Issues
   - Circular dependency problems
   - Fixed by module separation

---

## Key Insights

### 1. Configuration Hierarchy

```text
Global Editor (base)
    ↓ (inheritance/override)
Collection Editor (enhancement)
```

You must have the **base** correct even if the **enhancement** is perfect.

### 2. SSR Dependency

Server-side rendering components depend on global configuration, not collection-specific settings.
This is why the error appeared before any client-side code ran.

### 3. Data Validation

The error is NOT about database corruption or invalid data. The rich text content is correctly
structured and stored. It's purely a **parsing capability issue**.

### 4. Simple Fix

3-5 lines of code resolves a critical issue that makes the entire admin panel unusable for affected collections.

---

## Verification Checklist

The fix has been verified in this project:

- [x] Global editor configuration includes BlocksFeature
- [x] allBlocks array contains all defined blocks
- [x] Block slug names match database blockType values
- [x] Posts with blocks load without parsing errors
- [x] YouTube video blocks display correctly
- [x] Bunny.net video blocks display correctly
- [x] Call-to-action blocks display correctly
- [x] Block content can be edited and saved
- [x] TypeScript compilation passes
- [x] No console errors related to Lexical parsing

---

## When to Apply This Fix

If you encounter the "parseEditorState: type block not found" error:

1. Check `payload.config.ts` for BlocksFeature in global editor
2. If missing, add BlocksFeature configuration
3. Import allBlocks from blocks/index
4. Restart Payload dev server
5. Verify admin panel loads without errors

---

## Production Implications

- **Breaking Changes:** None
- **Data Migration:** Not needed
- **Backwards Compatibility:** Fully maintained
- **Safe to Deploy:** Yes, immediately after testing
- **Rollback Risk:** Very low (simple config change)

---

## Related Documentation Files

Created as part of this research:

1. **`reports/research-payload-lexical-blocknotfound-2025-11-19.md`**
   - Comprehensive technical analysis
   - Root cause explanation
   - Prevention checklist
   - Best practices

2. **`reports/payload-lexical-error-quick-reference.md`**
   - Quick reference guide
   - Key facts summary
   - Common misconceptions
   - Troubleshooting checklist

3. **`reports/payload-ssr-vs-collection-config-analysis.md`**
   - Deep architectural analysis
   - Why SSR vs collection config matters
   - Request/response lifecycle
   - Common misconceptions explained

---

## Summary

| Aspect | Detail |
|--------|--------|
| **Error** | parseEditorState: type "block" not found |
| **Type** | Configuration issue (not data or version issue) |
| **Cause** | Global Lexical editor missing BlocksFeature |
| **Fix** | Add BlocksFeature to payload.config.ts |
| **Complexity** | Simple (3-5 lines) |
| **Status** | ✅ FIXED in SlideHeroes |
| **Data Impact** | None (parsing-only issue) |
| **Risk Level** | Very Low |

---

**Research Completed:** November 19, 2025  
**Status:** RESOLVED  
**Confidence Level:** Very High (fix implemented and tested)  
**Project:** SlideHeroes (GitHub Issue #648)
