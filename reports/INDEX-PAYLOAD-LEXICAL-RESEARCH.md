# Payload CMS Lexical Block Error Research - Complete Index

**Research Date:** November 19, 2025  
**Status:** RESOLVED  
**Issue:** #648  
**Commit:** 8a14a4ee7

---

## Quick Links

### For Quick Understanding (5 minutes)
1. **Project Overview:** `/home/msmith/projects/2025slideheroes/RESEARCH_SUMMARY.md`
2. **Quick Reference:** `payload-lexical-error-quick-reference.md`

### For Detailed Technical Analysis (15 minutes)
1. **Comprehensive Research:** `research-payload-lexical-blocknotfound-2025-11-19.md`
2. **Architecture Analysis:** `payload-ssr-vs-collection-config-analysis.md`

### Original Project Documentation
1. **Bug Diagnosis:** `/home/msmith/projects/2025slideheroes/.ai/specs/bug-diagnosis-lexical-block-not-found.md`
2. **Bug Fix Plan:** `/home/msmith/projects/2025slideheroes/.ai/specs/bug-fix-payload-lexical-blockfeature.md`
3. **Research Notes:** `/home/msmith/projects/2025slideheroes/.ai/specs/research-payload-lexical-error.md`

---

## The Error

```
parseEditorState: type "block" not found
```

---

## The Solution

Add `BlocksFeature` to the global Lexical editor configuration in `payload.config.ts`.

**Already Applied:** ✅ Commit 8a14a4ee7

```typescript
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: allBlocks,
    }),
  ],
}),
```

---

## Understanding This Error

### The Three Key Misconceptions

1. **"It's a data issue"**
   - ❌ NO - Database content is correctly structured
   - ✅ YES - It's a parsing configuration issue

2. **"The block definitions are wrong"**
   - ❌ NO - Blocks are defined correctly
   - ✅ YES - Global editor wasn't configured to use them

3. **"I fixed the collection editor, so SSR should work"**
   - ❌ NO - SSR uses global editor, not collection editor
   - ✅ YES - Global editor must have BlocksFeature for SSR

### The Core Issue

**Payload CMS uses two separate editor configurations:**

```
┌─────────────────────────────────┐
│ Global Editor (payload.config)  │ ← Used by SSR (SERVER)
│ - Parses content                │
│ - Builds form state             │
│ - MISSING BlocksFeature         │
└─────────────────────────────────┘
           ↓ (inheritance)
┌─────────────────────────────────┐
│ Collection Editor (Posts.ts)    │ ← Used by UI (BROWSER)
│ - Provides editing interface    │
│ - HAS BlocksFeature             │
│ - Never gets loaded if SSR fails│
└─────────────────────────────────┘
```

When SSR fails (because global editor lacks BlocksFeature), the collection editor never loads because the page can't render.

---

## Document Organization

### 1. Project Summary
**File:** `/home/msmith/projects/2025slideheroes/RESEARCH_SUMMARY.md`

Quick overview of:
- What the error is
- Why it happened
- What was fixed
- Impact and implications

**Best for:** Executive summary, quick understanding

---

### 2. Quick Reference
**File:** `payload-lexical-error-quick-reference.md`

Quick lookup guide with:
- Key facts table
- Solution code
- Common misconceptions
- When to apply fix

**Best for:** Quick lookups, troubleshooting reference

---

### 3. Comprehensive Research
**File:** `research-payload-lexical-blocknotfound-2025-11-19.md`

Detailed technical analysis:
- Full root cause analysis
- Database structure explanation
- Related GitHub issues
- Prevention checklist
- Best practices going forward
- Troubleshooting guide

**Best for:** Understanding the issue deeply, prevention

---

### 4. Architecture Analysis
**File:** `payload-ssr-vs-collection-config-analysis.md`

Deep dive into Payload architecture:
- Why SSR and collection configs are separate
- Request/response lifecycle
- Configuration locations and purposes
- Why the bug existed for a long time
- Common architectural misconceptions
- Best practices for configuration

**Best for:** Understanding Payload CMS architecture, preventing similar issues

---

### 5. Original Specs (Project Internal)
**Files:** `.ai/specs/bug-*.md` and `research-*.md`

Original diagnostic and planning documents created during investigation.

**Contents:**
- Detailed bug diagnosis with reproduction steps
- Analysis of root causes
- Step-by-step fix implementation plan
- Testing strategy
- Risk assessment

---

## Key Findings

### Root Cause
The **global Lexical editor** in `payload.config.ts` was initialized without `BlocksFeature`, while the **collection-level editor** in `Posts.ts` correctly included `BlocksFeature`.

### Why It Failed
Payload's server-side rendering components (`RscEntryLexicalField`) use the **global editor** to parse rich text content, not the collection-level editor. When parsing encountered a block node (`"type": "block"`), the global editor couldn't find a handler for it because `BlocksFeature` wasn't registered.

### Why It Was Hard to Debug
1. Collection editor seemed correct (it was)
2. Database content seemed valid (it was)
3. Error occurred in Lexical internals, not user code
4. The connection between SSR and global config isn't obvious
5. Takes deep Payload architecture knowledge to spot

### The Fix
Add `BlocksFeature` with `allBlocks` to the global editor. Simple, 3-5 lines of code.

---

## Technical Details

### Files Involved

**Modified:**
- `apps/payload/src/payload.config.ts` - Lines 9, 33, 308-315

**Verified Correct:**
- `apps/payload/src/blocks/index.ts` - allBlocks export
- `apps/payload/src/blocks/*/config.ts` - Individual blocks
- `apps/payload/src/collections/Posts.ts` - Collection editor
- Database - Content with valid blockType values

### Blocks Configured

- BunnyVideo (`bunny-video`)
- CallToAction (`call-to-action`)
- DebugBlock (`debug-block`)
- TestBlock (`test-block`)
- YouTubeVideo (`youtube-video`)

### Collections Affected

Once fixed, these collections can safely use blocks:
- Posts
- CourseLessons
- Documentation
- Private
- Surveys

---

## When to Reference This Research

### "I'm getting parseEditorState: type block not found error"
→ Read `RESEARCH_SUMMARY.md` (5 min) then `payload-lexical-error-quick-reference.md`

### "I want to understand why this happens"
→ Read `payload-ssr-vs-collection-config-analysis.md` (15 min)

### "I need to prevent this in a new project"
→ Read `research-payload-lexical-blocknotfound-2025-11-19.md` section on "Prevention Checklist"

### "I need to add new blocks to this project"
→ Read `RESEARCH_SUMMARY.md` section "When you add new blocks" + `research-payload-lexical-blocknotfound-2025-11-19.md` "Best Practices Going Forward"

### "I'm getting a similar SSR error in Payload"
→ Read `payload-ssr-vs-collection-config-analysis.md` section "Checklist for Similar Issues"

---

## Key Concepts

### Lexical Node Type vs blockType

**Lexical Node Type** (`"type": "block"`)
- Internal Lexical concept
- The wrapper around block content
- Registered via BlocksFeature
- **This was missing → caused error**

**blockType** (e.g., `"youtube-video"`)
- User-facing identifier
- Specific implementation
- Stored in database
- **This was correct**

### Two-Tier Configuration

**Global Editor**
- Application-wide default
- Used by SSR
- Parses all content
- **MUST have BlocksFeature**

**Collection Editor**
- Collection-specific customization
- Used by browser UI
- Doesn't replace global
- **Can have BlocksFeature**

### Server vs Browser

**Server (SSR)**
- Builds form state
- Parses content
- Uses global editor
- **THIS FAILED**

**Browser**
- Provides editing UI
- Handles interactions
- Uses collection editor
- **Never loaded due to SSR failure**

---

## Related Issues

| Issue | Status | Relevance |
|-------|--------|-----------|
| #648 | RESOLVED | Current issue (this research) |
| #531 | RESOLVED | Similar error, different cause |
| Payload #10445 | Known Issue | Pattern: Global editor missing blocks |
| Payload #62 | RESOLVED | Alpha BlocksFeature issues |
| Payload #7366 | RESOLVED | BlocksFeature performance |
| Payload #14022 | Related | Block serialization |
| Payload #14520 | Related | BlocksFeature configuration |

---

## Verification Status

✅ **All Tests Passing**

- [x] Global editor has BlocksFeature
- [x] allBlocks exports correctly
- [x] Block slugs match database blockTypes
- [x] Posts load without parsing errors
- [x] All block types display correctly
- [x] Content can be edited and saved
- [x] TypeScript passes
- [x] No console errors
- [x] No SSR failures

---

## Quick Reference Table

| Question | Answer | Reference |
|----------|--------|-----------|
| What's the error? | `parseEditorState: type "block" not found` | RESEARCH_SUMMARY.md |
| What caused it? | Global editor missing BlocksFeature | RESEARCH_SUMMARY.md |
| Is it fixed? | Yes, commit 8a14a4ee7 | RESEARCH_SUMMARY.md |
| How was it fixed? | Added BlocksFeature to payload.config.ts | quick-reference.md |
| Why did it happen? | SSR uses global editor, not collection editor | payload-ssr-vs-collection-config-analysis.md |
| Is data corrupted? | No, content is correctly stored | research-payload-lexical-blocknotfound.md |
| Should I be concerned? | No, fix is simple and low-risk | RESEARCH_SUMMARY.md |
| How do I add blocks? | Create config, export, add to allBlocks array | RESEARCH_SUMMARY.md |
| Do I need to migrate data? | No, this is parsing-only issue | bug-fix-payload-lexical-blockfeature.md |
| Can this happen again? | Yes, if global editor config is incomplete | research-payload-lexical-blocknotfound.md |

---

## Document Statistics

- **Total Research Documents:** 6
- **Total Words:** ~15,000
- **Code Examples:** 30+
- **Diagrams:** 5
- **Related GitHub Issues Analyzed:** 7
- **Research Time:** November 19, 2025
- **Implementation Status:** ✅ COMPLETE

---

## Next Steps

### For Developers Working on This Project
1. Review `RESEARCH_SUMMARY.md` for context
2. When adding new blocks, follow "When you add new blocks" section
3. Keep global editor config in mind for future Lexical changes

### For Payload CMS Users Encountering This Error
1. Start with `quick-reference.md`
2. If needed, read `RESEARCH_SUMMARY.md`
3. For deep understanding, read `payload-ssr-vs-collection-config-analysis.md`

### For Best Practices Going Forward
1. Always configure global editor with all Lexical features
2. Consider collection editors as UI customizations
3. Test SSR by loading admin panel after Lexical changes
4. Remember: global is foundation, collection is enhancement

---

**Research Completed:** November 19, 2025  
**Status:** RESOLVED  
**Confidence:** Very High  
**Project:** SlideHeroes

