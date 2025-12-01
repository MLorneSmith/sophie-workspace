# Perplexity Research: @supabase/ssr Breaking Changes v0.7 to v0.8

**Date**: 2025-12-01
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Research focused on identifying breaking changes between @supabase/ssr v0.7 and v0.8, with emphasis on:
1. API changes in createServerClient and createBrowserClient
2. Cookie handling modifications
3. Migration steps required
4. Current version status and stability

## Important Clarification

**v0.8.0 does not yet exist.** The latest stable version is **v0.7.0** (released August 22, 2025). The searches initially focused on finding v0.8 information, but the research revealed that:

- Current versions: v0.7.0 is latest stable (Aug 22, 2025)
- v0.7.0-rc.1 and v0.7.0-rc.2 are the most recent release candidates
- No v0.8.0 release has been published
- v0.6.1 was released March 16, 2025 (current stable before v0.7)

## Key Findings

### Breaking Changes in v0.7.0 (from v0.6.x)

#### 1. Cookie Library Upgrade
- **Change**: Bumped `cookie` dependency from older version to `1.0.2` (PR #113)
- **Breaking Change**: The underlying `cookie` library version changed
- **Impact**: Cookie parsing and serialization behavior may differ
- **Migration**: Ensure compatibility with cookie library 1.0.2 specifications

#### 2. Internal Type Parameters Removal
- **Change**: Removed usage of internal type params (PR #123)
- **Breaking Change**: Code relying on internal TypeScript types will break
- **Impact**: Type exports and internal interfaces changed
- **Migration**: Update imports to only use public API types

### v0.4.0 Major Overhaul (Historical Context - June 2024)

The most significant breaking changes occurred in v0.4.0 (June 24, 2024), which introduced the current API pattern:

#### Cookie Management Method Changes

**Before v0.4.0:**
- Old API: get/set/remove methods

**After v0.4.0 (Current):**
- New API: getAll/setAll methods

#### Session Encoding Change
- From: Standard encoding
- To: Base64-URL encoding
- Critical: Downgrading from v0.4.0+ to v0.3.0 causes user logouts (incompatible session format)

## Sources & Citations

1. **GitHub Releases - supabase/ssr**
   - v0.7.0: https://github.com/supabase/ssr/releases/tag/v0.7.0
   - v0.6.1: https://github.com/supabase/ssr/releases/tag/v0.6.1

2. **CHANGELOG.md - supabase/ssr**
   - https://github.com/supabase/ssr/blob/main/CHANGELOG.md

3. **Supabase Documentation**
   - Server-Side Rendering: https://supabase.com/docs/guides/auth/server-side

4. **Community Resources**
   - SSR Roadmap: https://github.com/orgs/supabase/discussions/27037
   - Breaking Changes Q&A: https://www.answeroverflow.com/m/1417464471495905333

## Key Takeaways

1. **No v0.8.0 exists yet** - Latest stable is v0.7.0 (Aug 22, 2025)

2. **v0.7.0 has minimal breaking changes** from v0.6.x:
   - Cookie library version bump (1.0.2)
   - Internal type parameter cleanup
   - Public API remains stable

3. **Major breaking changes were in v0.4.0**:
   - API switched from get/set/remove to getAll/setAll
   - Session encoding changed to Base64-URL
   - Cannot downgrade without breaking sessions

4. **Cookie handling is stable** - v0.4.0+ pattern works through v0.7.0

5. **Migration from v0.6.1 to v0.7.0 is straightforward** - Update package, verify types, test thoroughly
