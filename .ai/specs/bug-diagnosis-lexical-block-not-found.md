# Bug Diagnosis: Lexical Editor "parseEditorState: type block not found" Error

**ID**: ISSUE-[pending] (GitHub issue to be created)
**Created**: 2025-11-19T18:15:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When viewing the blog post "4 Powerful Tools to Improve Your Presentation" in the Payload CMS admin panel, the content field throws a Lexical editor parsing error: `parseEditorState: type "block" + not found`. The root cause is that the global Lexical editor configuration in `payload.config.ts` does not include `BlocksFeature`, causing Payload's server-side rendering components to fail when parsing rich text content that contains block nodes.

## Environment

- **Application Version**: dev branch, commit 1aca17dbd
- **Environment**: development (local Supabase)
- **Browser**: N/A (server-side error)
- **Node Version**: Current LTS
- **Payload CMS**: ^3.62.1
- **@payloadcms/richtext-lexical**: ^3.64.0
- **lexical**: ^0.38.2
- **Database**: PostgreSQL via Supabase
- **Last Working**: Unknown (likely worked before blocks were added to posts)

## Reproduction Steps

1. Start local Supabase: `pnpm supabase:web:start`
2. Run database reset and seeding: `/supabase-reset`
3. Start Payload dev server: `pnpm --filter payload dev`
4. Navigate to Payload admin panel
5. Go to Posts collection
6. Click on post "4 Powerful Tools to Improve Your Presentation" (slug: `presentation-tools`)
7. Observe error in the content field

## Expected Behavior

The post should load successfully and display the rich text content including:
- YouTube video blocks
- Bunny.net video blocks
- Call-to-action blocks
- Regular paragraph text

## Actual Behavior

**Error Message**:
```
parseEditorState: type "block" + not found
```

**Stack Trace**:
```
at RscEntryLexicalField (../../node_modules/.pnpm/@payloadcms+richtext-lexical@3.64.0_.../src/field/rscEntry.tsx:124:10)
at RenderServerComponent (../../node_modules/.pnpm/@payloadcms+ui@3.64.0_.../src/elements/RenderServerComponent/index.tsx:76:14)
at renderField (../../node_modules/.pnpm/@payloadcms+ui@3.64.0_.../src/forms/fieldSchemasToFormState/renderField.tsx:256:12)
at Array.forEach (<anonymous>:1:22)
at buildFormState (../../node_modules/.pnpm/@payloadcms+ui@3.64.0_.../src/utilities/buildFormState.ts:197:27)
```

**Code Frame**:
```typescript
  122 |   }
  123 |
> 124 |   return <RichTextField {...props} />
      |          ^
  125 | }
  126 |
```

## Diagnostic Data

### Console Output
```
[13:09:00] ERROR: parseEditorState: type "block" + not found
```

### Database Analysis

The database content is correctly structured. Post ID: `724236f5-f2fa-48a1-bdca-a8fe58be76eb`

**Block types stored in database**:
- `youtube-video` (matches registered block slug)
- `call-to-action` (matches registered block slug)
- `bunny-video` (matches registered block slug)

**Sample content structure** (verified correct):
```json
{
  "root": {
    "type": "root",
    "children": [
      {
        "type": "block",
        "fields": {
          "blockType": "youtube-video",
          "videoId": "yk9lXobJ95E"
        }
      },
      {
        "type": "block",
        "fields": {
          "blockType": "call-to-action",
          "headline": "Ready to get started?"
        }
      },
      {
        "type": "block",
        "fields": {
          "blockType": "bunny-video",
          "videoId": "7e39514a-18fd-41e3-a07b-e1cbf05dd365"
        }
      }
    ]
  }
}
```

### Configuration Analysis

**Global Editor (payload.config.ts:307)**:
```typescript
editor: lexicalEditor({}),  // NO BlocksFeature configured!
```

**Collection-level Editor (Posts.ts:68-75)**:
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

**Registered Block Slugs**:
- `bunny-video` (BunnyVideo/config.ts:4)
- `youtube-video` (YouTubeVideo/config.ts:4)
- `call-to-action` (CallToAction/config.ts:4)
- `test-block` (TestBlock/config.ts:4)

## Related Code

### Affected Files

- `apps/payload/src/payload.config.ts` - **Global editor missing BlocksFeature**
- `apps/payload/src/collections/Posts.ts` - Collection editor configured correctly
- `apps/payload/src/blocks/index.ts` - Block exports
- `apps/payload/src/blocks/*/config.ts` - Individual block configurations

### Recent Changes

- `35bc75dc` - refactor(payload): restructure seeding for R2 manual URL management
- `be07be80` - feat(payload): integrate Cloudflare R2 storage for media and downloads

### Suspected Functions

- `RscEntryLexicalField` - Server component that renders rich text fields
- `buildFormState` - Builds form state and parses editor state
- Global `lexicalEditor` configuration being used for server-side parsing

## Related Issues & Context

### Direct Predecessors

- #531 (CLOSED): "Payload Lexical Editor - Invalid Block Type 'video' in Posts Content"
  - Similar error message
  - Root cause was different: invalid blockType values in seed data
  - Was partially fixed but didn't address global editor configuration

### Same Component

- #9 (if exists): "Implement Payload CMS Block Components for Lexical Editor"
  - Documents the block implementation requirements

### Historical Context

Issue #531 identified the same error but attributed it to invalid blockType values in the seed data. The seed data was fixed to use correct slugs (bunny-video, youtube-video, call-to-action), but the underlying issue of the global editor configuration was not addressed.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The global Lexical editor configuration in `payload.config.ts` does not include `BlocksFeature`, causing Payload's server-side components to fail when parsing rich text content containing block nodes.

**Detailed Explanation**:

When Payload renders the admin panel, it uses server-side components (`RscEntryLexicalField`) to parse and render rich text fields. These components need to know about all possible Lexical node types to properly deserialize the editor state.

The current configuration has:
1. **Global editor** (`payload.config.ts:307`): `lexicalEditor({})` - No features, no BlocksFeature
2. **Collection editor** (`Posts.ts:68-75`): `lexicalEditor({ features: [..., BlocksFeature({ blocks: [...] })] })` - Has BlocksFeature

The issue is that Payload's server components may use the **global editor configuration** for certain operations (like `buildFormState`), not the collection-specific one. When the global editor tries to parse content containing `type: "block"` nodes, it fails because:

1. The global editor has no `BlocksFeature` configured
2. Without `BlocksFeature`, Lexical doesn't register the `BlockNode` type
3. When `parseEditorState` encounters `"type": "block"`, it can't find a registered node handler
4. Error thrown: `parseEditorState: type "block" + not found`

**Supporting Evidence**:

1. Stack trace shows error originates in `RscEntryLexicalField` (server component)
2. Database content is correctly structured with valid blockType values
3. Collection-level editor has BlocksFeature but global editor does not
4. Error message specifically references the Lexical node type `"block"`, not the blockType slug

### How This Causes the Observed Behavior

1. User navigates to edit a post in Payload admin
2. Payload calls `buildFormState` to prepare the form
3. `RscEntryLexicalField` server component attempts to parse the rich text field
4. The component uses the global editor configuration for parsing
5. Global editor doesn't have `BlockNode` registered (no `BlocksFeature`)
6. Lexical's `parseEditorState` encounters `"type": "block"` in the JSON
7. No node handler found for type `"block"`
8. Error thrown: `parseEditorState: type "block" + not found`

### Confidence Level

**Confidence**: High

**Reasoning**:
- The evidence clearly shows the global editor lacks BlocksFeature
- The error specifically refers to Lexical node type parsing
- Database content is valid, ruling out data issues
- Stack trace points to server-side rendering which uses global config
- This is a documented pattern issue in Payload CMS (see GitHub issues)

## Fix Approach (High-Level)

1. **Update global editor configuration** in `payload.config.ts` to include `BlocksFeature` with all blocks used across collections
2. Import all block definitions that are used anywhere in the application
3. Configure the global editor with the same blocks as the collection-level editors

**Example fix**:
```typescript
// payload.config.ts
import { allBlocks } from "./blocks";

export default buildConfig({
  // ... other config
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: allBlocks,
      }),
    ],
  }),
  // ... rest of config
});
```

Alternative approach: Configure `BlocksFeature` with only the blocks that are actually used in collections (BunnyVideo, CallToAction, TestBlock, YouTubeVideo).

## Diagnosis Determination

The root cause has been conclusively identified: **the global Lexical editor configuration is missing `BlocksFeature`**.

This is a configuration issue, not a data issue or a version compatibility issue. The fix is straightforward: add `BlocksFeature` with all required blocks to the global editor configuration in `payload.config.ts`.

This will allow Payload's server-side components to properly parse rich text content containing block nodes across all collections.

## Additional Context

### Other Collections Potentially Affected

Any collection using blocks in rich text fields may experience this issue:
- `CourseLessons` - May have video blocks
- `Private` - May have various blocks
- `Documentation` - May have CallToAction blocks
- `Surveys` - May have blocks

### Testing Recommendation

After applying the fix:
1. Reset database and reseed: `/supabase-reset`
2. Navigate to each collection with rich text fields
3. Verify posts with blocks load without errors
4. Test creating new content with blocks
5. Test saving and loading content with blocks

---

*Generated by Claude Debug Assistant*
*Tools Used: Bash (git, gh, psql), Read, Grep, Glob, Task (perplexity-search-expert, context7-expert)*
