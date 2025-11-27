# Bug Fix: Lexical Editor Block Type Error Due to Turbopack Caching

**Related Diagnosis**: #650
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Turbopack/Next.js build cache is not being cleared after config changes, causing old configuration (without BlocksFeature) to be loaded at runtime
- **Fix Approach**: Create a script-based cache clearing mechanism and update developer documentation to prevent future occurrences
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Lexical editor error "parseEditorState: type 'block' not found" persists when viewing blog posts in the Payload CMS admin panel, despite the correct configuration fix being applied in commit `8a14a4ee7`. The configuration code that adds `BlocksFeature` to the global Lexical editor is correct, but the Turbopack bundler is caching the old configuration without `BlocksFeature`, causing the Lexical parser to fail when it encounters block nodes in the editor state during SSR.

For full details, see diagnosis issue #650.

### Solution Approaches Considered

#### Option 1: Create Cache-Clearing Script ⭐ RECOMMENDED

**Description**: Create a bash/npm script that clears Turbopack and Next.js caches specifically for the Payload app, ensuring fresh compilation when needed. Make it easy for developers to run manually or integrate into development workflow.

**Pros**:
- Solves the immediate issue without code changes
- Gives developers control over when to clear cache
- Can be integrated into dev scripts for automatic clearing
- Low risk - purely a developer tooling addition
- Works with current code structure

**Cons**:
- Requires developer knowledge of when to use it
- Doesn't prevent the issue from happening again

**Risk Assessment**: low - This is a non-breaking change that only affects development workflow

**Complexity**: simple - Just file deletion automation

#### Option 2: Modify Build Configuration

**Description**: Update the Turbopack configuration to invalidate cache when `payload.config.ts` changes, forcing recompilation on config changes.

**Pros**:
- Prevents the issue automatically
- No manual developer intervention needed
- Long-term solution

**Cons**:
- Requires deeper Turbopack/Next.js configuration knowledge
- May have unintended side effects on build performance
- More complex implementation
- Could affect CI/CD caching strategies

**Why Not Chosen**: While this would be a perfect long-term solution, it's overkill for this immediate fix. The diagnosis clearly indicates the issue is known and reproducible, so giving developers a clear cache-clearing mechanism is more practical. We can consider this for future optimization.

#### Option 3: Document Only

**Description**: Just add documentation about clearing cache when config files change.

**Pros**:
- Zero code changes
- Simple to implement

**Cons**:
- Relies on developers remembering to clear cache
- Doesn't actually solve the problem
- Error will continue to surprise developers

**Why Not Chosen**: Documentation alone is insufficient. Developers need tooling support to easily resolve this issue when it occurs.

### Selected Solution: Create Cache-Clearing Script

**Justification**: This approach provides immediate, practical relief for developers while keeping the implementation simple. It gives developers explicit control over cache clearing and documents the issue clearly. We can pair it with updated developer documentation about config file changes. This solves the immediate problem while laying groundwork for a more automated solution.

**Technical Approach**:
- Create a new npm script `cache:clear` in the Payload app's package.json
- The script removes `.next` directory (Turbopack/Next.js build cache)
- Update `pnpm dev` to optionally clear cache on first run
- Add developer documentation explaining when and why to clear cache
- Update PR/commit guidelines to mention cache clearing for config changes

**Architecture Changes**:
- No architectural changes - this is purely developer tooling
- Affects only the development experience, not production code
- Compatible with existing build system

## Implementation Plan

### Affected Files

- `apps/payload/package.json` - Add cache:clear script
- `CLAUDE.md` - Update developer guidelines for config changes
- `.ai/ai_docs/context-docs/development/` - Create or update Payload-specific documentation (optional but recommended)

### New Files

No new files required. Scripts will be npm tasks.

### Step-by-Step Tasks

#### Step 1: Add Cache-Clearing Scripts to Payload Package.json

Add npm scripts that developers can use to clear caches:

- Create a `cache:clear` script that removes the `.next` directory
- Create a `clean` script that removes `.next` and node_modules
- Update `dev` script to optionally clear cache (with environment variable control)

**Why this step first**: This gives developers immediate access to cache-clearing tools that work with the existing build system.

#### Step 2: Create Cache-Clearing Helper Script

Create a bash helper script `apps/payload/scripts/clear-cache.sh`:

- Removes `apps/payload/.next` directory
- Provides clear output to user
- Can be called from npm scripts or manually

**Why this step**: Provides a reusable, testable component for cache clearing that's easy to understand and maintain.

#### Step 3: Update CLAUDE.md Developer Guidelines

Add section to project documentation:

- Document the cache clearing issue
- Explain when to clear cache (after `payload.config.ts` changes)
- Provide clear instructions for running cache clearing
- Add to commit guidelines for config file changes

**Why this step**: Prevents future developers from hitting this same issue by providing clear guidance.

#### Step 4: Add Testing & Validation

- Create a simple test that verifies cache clearing script works
- Add validation that `.next` directory is successfully removed
- Test that `pnpm dev` runs successfully after cache clear

#### Step 5: Update Documentation with Prevention Guidelines

- Add note to CLAUDE.md about config file changes requiring cache clear
- Update PR template to mention cache clearing for config file changes (if applicable)
- Document in developer onboarding

## Testing Strategy

### Manual Testing Checklist

This bug fix is primarily about tooling and documentation. Testing should verify:

- [ ] `pnpm --filter payload cache:clear` successfully removes `.next` directory
- [ ] `pnpm --filter payload dev` works correctly after cache clear
- [ ] The problematic post loads without error after following the fix procedure
- [ ] YouTube video block displays correctly
- [ ] Call To Action block displays correctly
- [ ] Bunny video block displays correctly
- [ ] No new console errors appear after cache clear

### Regression Testing

Since this is a tooling/documentation fix, regression testing is minimal:

- [ ] Verify existing Payload CMS functionality is unaffected
- [ ] Confirm dev server still starts normally
- [ ] Check that cache:clear script doesn't interfere with CI/CD

### Testing Procedure

Before the fix (to reproduce the bug):
1. Navigate to Posts collection in Payload admin
2. Click "4 Powerful Tools to Improve Your Presentation"
3. Confirm the error appears: "parseEditorState: type 'block' not found"

After applying the fix:
1. Stop the dev server
2. Run `pnpm --filter payload cache:clear`
3. Run `pnpm --filter payload dev`
4. Navigate to the same post
5. Confirm it loads without error
6. Verify all blocks (YouTube, CTA, Bunny) render correctly

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Script may not work on Windows**: WSL/Git Bash compatibility
   - **Likelihood**: medium
   - **Impact**: low (Windows developers can clear cache manually)
   - **Mitigation**: Create both bash and npm-based solutions; test on Windows CI

2. **Cache clearing could lose useful cache data**: Though unlikely since Next.js rebuilds on demand
   - **Likelihood**: low
   - **Impact**: low (Just takes longer to rebuild next time)
   - **Mitigation**: Document that cache rebuilds automatically

3. **Developers ignore the new script and documentation**: Issue persists
   - **Likelihood**: medium
   - **Impact**: medium (Issue will recur for new developers)
   - **Mitigation**: Add warning/help output to dev script about cache

**Rollback Plan**:

If this fix causes issues:
1. Remove the new npm scripts from package.json
2. Remove the helper script
3. Revert CLAUDE.md changes
4. Issue continues to be a manual cache clear (status quo before fix)

No code is affected, so rollback is zero-risk.

**Monitoring** (if needed):

No production monitoring needed. This is a development-only fix.

## Performance Impact

**Expected Impact**: none

The cache-clearing scripts only affect development server startup time. They will not impact production performance.

**Performance Testing**:

- Verify that `pnpm dev` startup time is acceptable after cache clear
- Confirm that clearing cache doesn't permanently slow down development (Next.js rebuilds optimally)

## Security Considerations

**Security Impact**: none

This fix is purely development tooling and doesn't affect production code or security.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start Payload dev server (if not already running)
pnpm --filter payload dev

# In another terminal, wait for server to start, then try to view the post
# curl or visit the admin panel would show error in SSR
# Browser console shows: parseEditorState: type "block" not found
```

**Expected Result**: Error occurs when trying to view the post in admin panel.

### After Fix (Bug Should Be Resolved)

```bash
# Clear the cache
pnpm --filter payload cache:clear

# Start development server
pnpm --filter payload dev

# Verify the post loads without error
# Check admin panel - no error should appear
# All blocks should render: YouTube, CTA, Bunny video

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build (to verify no regressions)
pnpm build
```

**Expected Result**: All commands succeed, post loads without error, all blocks display correctly.

### Regression Prevention

```bash
# Verify existing functionality
pnpm --filter payload dev

# Test other posts load correctly
# Test creating a new post with blocks
# Verify all block types work: youtube-video, call-to-action, bunny-video

# Run any existing Payload tests
pnpm --filter payload test
```

## Dependencies

### New Dependencies

**No new dependencies required**

All work uses existing npm/bash scripts and standard Node.js capabilities.

## Database Changes

**No database changes required**

This is a development tooling fix only.

## Deployment Considerations

**Deployment Risk**: none

This fix only affects development experience. No changes to production code.

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained (100% backwards compatible - purely additive)

## Success Criteria

The fix is complete when:
- [ ] `cache:clear` npm script works correctly in Payload app
- [ ] Documentation in CLAUDE.md clearly explains the cache clearing solution
- [ ] Manual testing confirms the problematic post loads without error after cache clear
- [ ] All blocks (YouTube, CTA, Bunny) render correctly
- [ ] No regressions in existing Payload functionality
- [ ] Developers can easily understand and use the cache clearing solution

## Notes

This bug reveals a potential systemic issue with Turbopack caching for config files. While this fix solves the immediate problem, consider:

1. **Long-term improvement**: Update Turbopack configuration to invalidate cache on config file changes (Option 2 from analysis)
2. **Developer education**: Consider creating a troubleshooting guide for Turbopack caching issues
3. **CI/CD safety**: Ensure CI/CD always clears cache before building (it likely does, but verify)

The diagnosis issue #650 provides excellent context for understanding this problem and preventing similar issues in the future.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #650*
