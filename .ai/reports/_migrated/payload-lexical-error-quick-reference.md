# Payload CMS Lexical Block Error - Quick Reference

## The Error
```
parseEditorState: type "block" not found
```

## The Solution (Already Implemented)
Add `BlocksFeature` to the global Lexical editor configuration.

### Before (Broken)
```typescript
// apps/payload/src/payload.config.ts:307
editor: lexicalEditor({})  // ❌ No BlocksFeature
```

### After (Fixed)
```typescript
// apps/payload/src/payload.config.ts:308-315
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: allBlocks,  // Import from ./blocks/index
    }),
  ],
})
```

## Key Facts

| Aspect | Details |
|--------|---------|
| **Error Type** | Server-side rendering configuration issue |
| **Root Cause** | Global Lexical editor missing BlocksFeature |
| **Affected Component** | RscEntryLexicalField (SSR component) |
| **Payload Version** | 3.x (3.62.1+) |
| **Lexical Version** | 0.38.2+ |
| **Data Status** | Database content is VALID, no migration needed |
| **Fix Complexity** | Simple (3-5 lines of code) |
| **Fix in SlideHeroes** | ✅ Applied in commit 8a14a4ee7 |

## Why It Happens

1. **Lexical node types must be registered globally** via `BlocksFeature`
2. **SSR components use global editor** for parsing, not collection-level editors
3. **When BlocksFeature is missing**, Lexical can't parse `"type": "block"` nodes
4. **Collection-level editors alone are insufficient** for SSR operations

## The Two-Tier System

```
┌─────────────────────────────────────────┐
│ Global Editor (payload.config.ts)       │ ← Used by SSR components
│ - Defines ALL Lexical node types        │
│ - Must include BlocksFeature            │
└─────────────────────────────────────────┘
                    ↓
         (extends/overrides)
                    ↓
┌─────────────────────────────────────────┐
│ Collection Editors (Posts.ts, etc.)     │ ← UI enhancement only
│ - Can customize for specific needs      │
│ - Doesn't replace global config         │
└─────────────────────────────────────────┘
```

## blockType vs BlockNode Type

**Lexical Node Type** (what broke):
- The generic `"type": "block"` in JSON
- Registered via `BlocksFeature`
- Internal parsing concern

**blockType** (what was correct):
- The specific block type: `"youtube-video"`, `"call-to-action"`, etc.
- Stored in `fields.blockType` in database
- User-facing block identifier

```json
{
  "type": "block",              ← This is the Lexical node type
  "fields": {
    "blockType": "youtube-video"  ← This is the blockType
  }
}
```

## Collections Using Blocks

Once fixed, all these can safely use blocks:
- Posts ✅
- CourseLessons
- Documentation  
- Private
- Surveys

## Blocks Registered

Currently configured blocks in `allBlocks`:
- BunnyVideo (`bunny-video`)
- CallToAction (`call-to-action`)
- DebugBlock (`debug-block`)
- TestBlock (`test-block`)
- YouTubeVideo (`youtube-video`)

## Files Involved

| File | Purpose | Status |
|------|---------|--------|
| `apps/payload/src/payload.config.ts` | Global editor config | ✅ Fixed |
| `apps/payload/src/blocks/index.ts` | Block exports | ✅ Correct |
| `apps/payload/src/blocks/*/config.ts` | Individual blocks | ✅ Correct |
| `apps/payload/src/collections/Posts.ts` | Collection editor | ✅ Correct |

## Verification

To verify the fix is working:

1. Navigate to Payload admin panel
2. Go to Posts collection
3. Open a post with blocks (e.g., "4 Powerful Tools to Improve Your Presentation")
4. Confirm:
   - Content field loads without "type block not found" error
   - YouTube/Bunny/CTA blocks display correctly
   - No console errors

## Adding New Blocks

When you add a new block:

1. Create `apps/payload/src/blocks/[BlockName]/config.ts`
2. Export from `blocks/index.ts`
3. Add to `allBlocks` array in `blocks/index.ts`
4. Done! Global editor automatically includes it

No need to modify `payload.config.ts`—it already uses `allBlocks`.

## Related Project Issues

- **#648** - The error that was fixed
- **#531** - Similar error with different root cause (now resolved)

## Don't Confuse With

- ❌ Database corruption (database is fine)
- ❌ Block definition errors (blocks are defined correctly)
- ❌ Slug mismatches (slugs match blockTypes correctly)
- ❌ Package version issues (versions are compatible)

It's purely a **configuration gap** in the global editor setup.

---

**Fix Status:** RESOLVED  
**Last Updated:** November 19, 2025
