# Bug Fix: Payload CMS Lexical Editor Global BlocksFeature Configuration

**Related Diagnosis**: #647 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Global Lexical editor configuration in `payload.config.ts` does not include `BlocksFeature`, causing server-side rendering to fail when parsing rich text content with block nodes
- **Fix Approach**: Add `BlocksFeature` with all registered blocks to global editor configuration
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When viewing blog posts with block content (YouTube videos, Bunny videos, call-to-action blocks) in the Payload CMS admin panel, the content field throws a Lexical editor parsing error: `parseEditorState: type "block" + not found`.

The root cause is that the global Lexical editor configuration in `payload.config.ts` line 307 is initialized as `lexicalEditor({})` without any features, while the Posts collection editor correctly includes `BlocksFeature` with block definitions.

Payload's server-side rendering components (`RscEntryLexicalField`) use the global editor configuration to parse rich text, which doesn't have the `BlockNode` type registered. When Lexical encounters `"type": "block"` in the JSON state, it fails because the block node type is not defined.

For full details, see diagnosis issue #647.

### Solution Approaches Considered

#### Option 1: Add BlocksFeature to Global Editor ⭐ RECOMMENDED

**Description**: Update `payload.config.ts` to include `BlocksFeature` with all registered blocks in the global editor configuration, mirroring the collection-level setup.

**Pros**:
- Direct fix to the root cause (global editor missing BlocksFeature)
- Minimal code change (3-5 lines)
- Ensures consistency between global and collection-level editors
- Future-proofs: any new blocks automatically available globally
- Allows server-side components to properly parse block content across all collections
- Leverages existing `allBlocks` export from blocks/index.ts

**Cons**:
- None identified; this is the standard Payload CMS pattern

**Risk Assessment**: low - Only adds missing configuration that should have been there from the start

**Complexity**: simple - Just import and configure

#### Option 2: Make Posts Editor Use Only Default Features

**Description**: Remove BlocksFeature from Posts collection editor and only use defaultFeatures globally.

**Why Not Chosen**: This would break existing posts with block content and remove the ability to edit blocks in the admin UI. The problem is the *global* configuration, not the collection configuration.

#### Option 3: Create a Custom Server Component for Posts

**Description**: Build a custom server component that overrides the Lexical field parser specifically for Posts.

**Why Not Chosen**: This adds unnecessary complexity, maintenance burden, and doesn't align with Payload's standard configuration patterns. The proper fix is to configure the global editor correctly.

### Selected Solution: Add BlocksFeature to Global Editor

**Justification**: This is the direct, maintainable fix that aligns with Payload CMS best practices. The global editor configuration should include all block types used anywhere in the application to support server-side rendering operations. This approach:

1. Fixes the root cause identified in the diagnosis
2. Requires minimal code changes (3-5 lines)
3. Follows Payload documentation patterns
4. Reduces future bugs by ensuring consistency
5. Requires no breaking changes

**Technical Approach**:
- Import `BlocksFeature` from `@payloadcms/richtext-lexical` (already imported)
- Import `allBlocks` from `./blocks/index.ts` (already exists)
- Update `editor: lexicalEditor({})` to include BlocksFeature configuration
- Configure with same blocks that are used across the application

**Architecture Changes**: None - just completing the configuration that was incomplete

**Migration Strategy**: No data migration needed - the database content is already correctly structured with valid block types

## Implementation Plan

### Affected Files

- `apps/payload/src/payload.config.ts` - Global editor missing BlocksFeature configuration

### New Files

None required

### Step-by-Step Tasks

#### Step 1: Update Global Editor Configuration

Update `payload.config.ts` line 307 to include `BlocksFeature` with all registered blocks.

**Current code** (line 307):
```typescript
editor: lexicalEditor({}),
```

**New code**:
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

**Why this step first**: This is the core fix that resolves the root cause. The global editor must have BlocksFeature to parse block content in server-side rendering.

**Affected lines**: 1-20 (imports) and line 307 (editor configuration)

#### Step 2: Verify Imports

Ensure all required imports are present at the top of `payload.config.ts`:

- `BlocksFeature` from `@payloadcms/richtext-lexical` (already imported on line 9)
- `allBlocks` from `./blocks/index.ts` (needs to be added)

The `allBlocks` export already exists in `blocks/index.ts` (lines 19-25).

**Why this step**: Necessary to avoid import errors when applying Step 1

#### Step 3: Verify Block Exports

Verify that `blocks/index.ts` exports all blocks correctly:

Currently exports:
- `BunnyVideo`
- `CallToAction`
- `DebugBlock`
- `TestBlock`
- `YouTubeVideo`
- `allBlocks` (array containing all blocks)

No changes needed to `blocks/index.ts`.

**Why this step**: Confirms the blocks are properly exported before using in global config

#### Step 4: Reproduce Bug and Verify Fix

1. Reset database: `pnpm supabase:web:reset`
2. Start Supabase: `pnpm supabase:web:start`
3. Start Payload dev server: `pnpm --filter payload dev`
4. Navigate to Payload admin panel → Posts
5. Click post "4 Powerful Tools to Improve Your Presentation"
6. Verify content field loads without error
7. Verify block content displays correctly (YouTube, Bunny, CTA blocks)

**Why this step**: Confirms the bug is fixed in practice

#### Step 5: Code Quality Checks

- Run `pnpm typecheck` to verify no type errors
- Run `pnpm lint:fix` to check code style
- Run `pnpm format:fix` to ensure consistent formatting

**Why this step**: Ensures the change meets project standards

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration change, not algorithmic code. The fix is verified through functional testing.

### Integration Tests

No new integration tests required. Existing Payload CMS admin functionality will implicitly test this:
- Creating/editing posts with blocks
- Viewing posts in admin panel
- Saving and loading block content

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reset Supabase database: `pnpm supabase:web:reset`
- [ ] Start local Supabase: `pnpm supabase:web:start`
- [ ] Start Payload dev: `pnpm --filter payload dev`
- [ ] Navigate to Payload admin panel
- [ ] Go to Posts collection
- [ ] Click post "4 Powerful Tools to Improve Your Presentation" (slug: `presentation-tools`)
- [ ] Verify content field loads without error "parseEditorState: type block not found"
- [ ] Verify content displays all blocks:
  - [ ] YouTube video block
  - [ ] Bunny.net video block
  - [ ] Call-to-action block
  - [ ] Regular paragraph text
- [ ] Click "Save" to verify block content can be saved
- [ ] Refresh page to verify block content persists
- [ ] Navigate to another post with blocks to verify fix works across collection
- [ ] Create new post with blocks to verify new content can be created with blocks
- [ ] Verify browser console has no errors related to Lexical parsing
- [ ] Verify no TypeScript errors: `pnpm typecheck`
- [ ] Verify linting passes: `pnpm lint`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **TypeScript Import Error**: If `allBlocks` import fails
   - **Likelihood**: low - Import path is straightforward, export already exists
   - **Impact**: medium - Build would fail, easy to fix
   - **Mitigation**: Verify import exists in blocks/index.ts before applying. The export is already there (line 19-25).

2. **Unexpected Side Effects**: Adding blocks to global editor affects all collections
   - **Likelihood**: low - This is standard Payload configuration
   - **Impact**: low - All blocks are valid and used across collections. No breaking changes.
   - **Mitigation**: Test with multiple collections post-fix

3. **Block Configuration Conflict**: Blocks configured twice (global + collection-specific)
   - **Likelihood**: very low - Payload handles this cleanly
   - **Impact**: low - Collection-specific configurations override global. Expected behavior.
   - **Mitigation**: No action needed. This is standard Payload pattern.

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert `payload.config.ts` line 307 to `editor: lexicalEditor({})`
2. Remove import of `allBlocks` if added
3. Restart Payload dev server: `pnpm --filter payload dev`
4. Verify previous behavior restored

**Monitoring**: Not needed - this is a configuration fix with low risk and high confidence

## Performance Impact

**Expected Impact**: none

No performance implications. This is a configuration change that allows proper parsing of existing data. No additional runtime overhead.

## Security Considerations

**Security Impact**: none

No security implications. This change:
- Does not modify data structures
- Does not add new authentication/authorization
- Does not expose new endpoints or capabilities
- Simply allows proper parsing of already-stored block content

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start services
pnpm supabase:web:start
pnpm --filter payload dev

# In browser, navigate to:
# http://localhost:3000/admin/collections/posts
# Click post "4 Powerful Tools to Improve Your Presentation"
```

**Expected Result**: Error "parseEditorState: type block not found" appears in browser console and/or admin panel

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Manual verification (in browser)
# Navigate to: http://localhost:3000/admin/collections/posts
# Click post "4 Powerful Tools to Improve Your Presentation"
# Verify no parsing errors and all blocks display correctly
```

**Expected Result**:
- All commands succeed
- Content field loads without error
- All blocks display correctly
- No console errors

### Regression Prevention

```bash
# Test with other collections that might have blocks
# Navigate to:
# - Documentation (may have blocks)
# - CourseLessons (may have video blocks)
# - Private (may have various blocks)
# - Surveys (may have blocks)

# Verify:
# 1. No parsing errors
# 2. Block content displays correctly
# 3. Blocks can be edited
# 4. Blocks can be saved
```

## Dependencies

### New Dependencies

No new dependencies required. All necessary imports already exist:
- `BlocksFeature` is already imported from `@payloadcms/richtext-lexical`
- `allBlocks` export already exists in `blocks/index.ts`

## Database Changes

**Migration needed**: no

No database schema or data migration required. The fix allows proper parsing of existing block content that is already correctly stored in the database.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix is fully backwards compatible:
- No breaking changes to API or schema
- Existing data is unaffected
- Existing functionality is preserved
- Only adds missing server-side configuration

Can be safely deployed to production immediately after testing.

## Success Criteria

The fix is complete when:
- [ ] Global editor configuration includes BlocksFeature with allBlocks
- [ ] Import of allBlocks is correct and resolves without error
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Bug no longer reproduces (content field loads without error)
- [ ] Block content displays correctly in all affected collections
- [ ] All blocks can be edited and saved successfully
- [ ] No regressions in other collections
- [ ] No TypeScript errors
- [ ] Manual testing checklist complete

## Notes

### Why This Bug Existed

The global editor was likely initialized without BlocksFeature as a placeholder, with the intention that collection-specific editors would configure blocks independently. However, Payload's server-side rendering components (`RscEntryLexicalField`) use the global editor configuration for parsing, which creates this issue when content contains block nodes.

### Related Issues

- #531 (CLOSED): Similar error with different root cause (invalid blockType values in seed data)
  - That fix corrected the seed data but didn't address the global configuration issue
  - This fix completes the solution started in #531

### Standard Payload Pattern

This is a documented pattern in Payload CMS:
- Global editor should include all possible Lexical node types
- Collection editors can override or extend global configuration
- Server-side rendering uses global editor for parsing
- Always configure BlocksFeature globally if blocks are used anywhere in the application

### Collections Potentially Benefiting From This Fix

Once fixed, all these collections can safely use blocks in their rich text fields:
- `Posts` (already using blocks)
- `CourseLessons` (likely to use video blocks)
- `Documentation` (likely to use various blocks)
- `Private` (may use various blocks)
- `Surveys` (may use blocks)

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #647*
