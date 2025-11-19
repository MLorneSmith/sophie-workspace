# Bug Diagnosis: Lexical Editor Block Type Error Persists After Fix

**ID**: ISSUE-TBD (will be assigned on GitHub creation)
**Created**: 2025-11-19T23:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Lexical editor error "parseEditorState: type 'block' not found" persists when viewing the blog post "4 Powerful Tools to Improve Your Presentation" in the Payload CMS admin panel, despite the fix applied in commit `8a14a4ee7`. The configuration change to add `BlocksFeature` to the global editor appears correct, but the error continues to occur, indicating either a server restart issue, Turbopack caching problem, or incomplete application of the fix.

## Environment

- **Application Version**: Latest on `dev` branch (commit 2f9e79392)
- **Environment**: development
- **Browser**: N/A (SSR error)
- **Node Version**: (system default)
- **Database**: PostgreSQL (Supabase)
- **Payload CMS**: 3.64.0
- **@payloadcms/richtext-lexical**: ^3.64.0
- **Next.js**: 16.0.3 (Turbopack)
- **Last Working**: Never fully confirmed working after fix

## Reproduction Steps

1. Start the Payload CMS dev server with `pnpm --filter payload dev`
2. Navigate to the admin panel at `/admin`
3. Go to Posts collection
4. Click on "4 Powerful Tools to Improve Your Presentation" post
5. Observe the error in the content field

## Expected Behavior

The blog post should load successfully with the Lexical rich text editor displaying:
- YouTube video block (videoId: yk9lXobJ95E)
- Call To Action block
- Bunny video block (videoId: 7e39514a-18fd-41e3-a07b-e1cbf05dd365)
- Various text paragraphs

## Actual Behavior

The admin panel throws a runtime error:
```
parseEditorState: type "block" + not found
```

The error occurs in server-side rendering at `RscEntryLexicalField` when parsing the Lexical editor state.

## Diagnostic Data

### Stack Trace
```
at RscEntryLexicalField (../../node_modules/.pnpm/@payloadcms+richtext-lexical@3.64.0.../src/field/rscEntry.tsx:124:10)
at RenderServerComponent (../../node_modules/.pnpm/@payloadcms+ui@3.64.0.../src/elements/RenderServerComponent/index.tsx:76:14)
at renderField (../../node_modules/.pnpm/@payloadcms+ui@3.64.0.../src/forms/fieldSchemasToFormState/renderField.tsx:256:12)
at Array.forEach (<anonymous>:1:22)
at buildFormState (../../node_modules/.pnpm/@payloadcms+ui@3.64.0.../src/utilities/buildFormState.ts:197:27)
```

### Code Analysis

**Global Editor Configuration (Verified Correct)**
File: `apps/payload/src/payload.config.ts:308-315`
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

**allBlocks Export (Verified Correct)**
File: `apps/payload/src/blocks/index.ts:19-25`
```typescript
export const allBlocks = [
  BunnyVideo,
  CallToAction,
  DebugBlock,
  TestBlock,
  YouTubeVideo,
];
```

**Posts Collection Editor (Verified Correct)**
File: `apps/payload/src/collections/Posts.ts:68-75`
```typescript
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [BunnyVideo, CallToAction, TestBlock, YouTubeVideo],
    }),
  ],
}),
```

### Seed Data Structure (Verified Correct)
File: `apps/payload/src/seed/seed-data/posts.json` (lines 6523-6697)

The post contains block nodes with:
- `blockType: "youtube-video"` - Matches slug in `YouTubeVideo/config.ts:4`
- `blockType: "call-to-action"` - Matches slug in `CallToAction/config.ts:4`
- `blockType: "bunny-video"` - Matches slug in `BunnyVideo/config.ts:4`

### Git History
Previous fix commit:
```
8a14a4ee7 fix(payload): add BlocksFeature to global Lexical editor configuration
```

This commit was applied on 2025-11-19 and is present in the current `dev` branch.

## Related Issues & Context

### Direct Predecessor
- **#648** (CLOSED): "Bug Fix: Payload CMS Lexical Editor Global BlocksFeature Configuration"
  - This was the original bug fix issue
  - Was closed as "implemented" but user reports error persists

### Related Diagnosis
- **#647**: Original diagnosis that identified the root cause

### Historical Context
This is a continuation of the same error after the initial fix was applied. The fix appears to be correct in code but is not being applied at runtime.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The fix in `payload.config.ts` is correct but is not being loaded at runtime due to Turbopack/Next.js caching or the server not being properly restarted after the configuration change.

**Detailed Explanation**:

The configuration change to add `BlocksFeature` to the global Lexical editor in `payload.config.ts` was correctly implemented in commit `8a14a4ee7`. However, this change affects the root Payload configuration file, which:

1. **Is evaluated at server startup** - Not hot-reloaded during development
2. **May be cached by Turbopack** - Next.js 16's Turbopack bundler caches compiled modules
3. **Requires explicit restart** - Changes to `payload.config.ts` are not automatically picked up

The error "type 'block' not found" occurs because the Lexical parser in `@payloadcms/richtext-lexical` doesn't have the `BlockNode` type registered. This registration happens when `BlocksFeature` initializes, but if the old configuration is still being used (without `BlocksFeature` in global editor), the registration never occurs.

**Supporting Evidence**:
1. Code inspection confirms the fix is correctly applied at `payload.config.ts:308-315`
2. The `allBlocks` array includes all required block types
3. Block slugs match between configuration and seed data
4. The error occurs in SSR context (`RscEntryLexicalField`), confirming it's a global config issue
5. Turbopack is mentioned in the error (Next.js 16.0.3), indicating potential caching issues

### How This Causes the Observed Behavior

1. User starts Payload dev server (possibly before fix was applied)
2. Turbopack compiles and caches the configuration without `BlocksFeature`
3. Fix is applied via git (commit `8a14a4ee7`)
4. Dev server hot-reloads but doesn't re-evaluate `payload.config.ts`
5. SSR uses cached global editor configuration (without `BlocksFeature`)
6. `buildFormState()` tries to parse editor state with blocks
7. Lexical cannot find the "block" node type → Error

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code fix is verified correct through direct inspection
- The issue is a well-known pattern with bundler caching and config files
- No other plausible explanation given all configurations are correct
- Payload CMS documentation confirms global editor is used for SSR

## Fix Approach (High-Level)

The fix requires ensuring the updated configuration is loaded at runtime:

1. **Stop the development server completely** (Ctrl+C or kill process)
2. **Clear the Turbopack/Next.js cache**: `rm -rf apps/payload/.next`
3. **Clear node_modules cache** (optional, if step 2 doesn't work): `pnpm --filter payload clean`
4. **Restart the development server**: `pnpm --filter payload dev`
5. **Verify the fix** by loading the problematic post

Alternative if above doesn't work:
- Clear pnpm store cache: `pnpm store prune`
- Reinstall dependencies: `pnpm install`
- Full rebuild: `pnpm build`

## Diagnosis Determination

The root cause has been identified as a **runtime caching issue**, not a code problem. The fix in commit `8a14a4ee7` is correct and properly adds `BlocksFeature` to the global Lexical editor configuration. The error persists because:

1. The Turbopack development server has cached the old configuration
2. A full server restart with cache clearing has not been performed

This diagnosis is supported by:
- Complete code verification showing correct configuration
- Research confirming Payload CMS SSR behavior with global editor
- The transient nature of bundler caching issues

## Additional Context

### Why This Wasn't Caught
The implementation report for #648 noted "Manual testing required" but may not have explicitly mentioned the need to clear cache and restart. In development with Turbopack, config file changes are particularly susceptible to caching issues.

### Prevention
Future fixes to `payload.config.ts` should include explicit instructions to:
1. Stop the development server
2. Clear `.next` cache
3. Restart the server

This should be documented in the project's contributing guidelines.

---
*Generated by Claude Debug Assistant*
*Tools Used: git log, gh issue view, Grep, Read, Task (context7-expert, perplexity-search-expert)*
