# Bug Fix: Course feature flag database override not being read in navigation

**Related Diagnosis**: #1933
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The feature flag config is computed once at module load time from environment variables only. Navigation and layouts read this static value instead of the current database value.
- **Fix Approach**: Create a server-side function to fetch the live database value and use it in navigation config generation.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The admin settings page successfully saves the `enable_courses` value to the `public.config` table, but the navigation config and route layouts never read from this database. They only read from the static `featureFlagsConfig.enableCourses` which is computed once at server startup from the environment variable `NEXT_PUBLIC_ENABLE_COURSES`.

**Exact Issue**:
- Admin saves `enable_courses = true` to database ✅
- Navigation config still shows `featureFlagsConfig.enableCourses = false` (from env var) ❌
- Course tab never appears in navigation ❌

**Why This Happens**:
The navigation config is a **synchronous, static export** evaluated at module load time:
```typescript
// Line 29-35: This is evaluated ONCE when the module loads
featureFlagsConfig.enableCourses
  ? { label: "common:routes.course", ... }
  : undefined
```

This static boolean value is never re-evaluated on subsequent requests.

### Solution Approaches Considered

#### Option 1: Make navigation config async (Not viable)
**Description**: Refactor navigation config to be async and fetch database on each request

**Cons**:
- Breaking change to navigation schema - affects all layouts
- Requires wrapping all uses in Suspense
- More complex error handling
- Navigation becomes slower (adds DB round-trip)

**Why Not Chosen**: Too invasive for the actual problem

#### Option 2: Fetch flag in route layouts (Not ideal)
**Description**: Have each layout that needs the flag fetch it from the database

**Cons**:
- Duplicates logic across multiple files
- Multiple DB queries instead of one
- Hard to maintain consistency

**Why Not Chosen**: Not DRY

#### Option 3: Server-side function that returns conditional navigation ⭐ RECOMMENDED

**Description**: Create a server-side utility function that:
1. Fetches the live database value
2. Returns the navigation config with conditionals applied
3. Use this in layouts that need the conditional items

**Pros**:
- Single DB query per request
- Clean, reusable function
- No breaking changes
- Works with existing async Server Component pattern
- Simple to test and maintain

**Cons**:
- Adds one DB query per page load

**Why Chosen**: Minimal changes, solves the problem elegantly, leverages Server Components pattern

### Selected Solution: Server-side database-aware flag function

**Technical Approach**:

1. Create a new server-side function `getEnableCourses()` that:
   - Fetches the current database value from `public.config.enable_courses`
   - Falls back to `featureFlagsConfig.enableCourses` if DB query fails
   - Returns a boolean

2. Modify navigation config to:
   - Move conditionals into the server component that renders the navigation
   - Use the dynamic `getEnableCourses()` value instead of static `featureFlagsConfig.enableCourses`

3. Update route layouts to:
   - Check the dynamic value before showing course/assessment pages
   - Redirect to home if course is disabled at request time

**Architecture Changes**: None - this is internal to the navigation config

**Migration Strategy**: No migration needed - backward compatible

## Implementation Plan

### Affected Files

- `apps/web/config/feature-flags.config.ts` - Add `getEnableCourses()` function (or create new utility)
- `apps/web/config/personal-account-navigation.config.tsx` - Refactor to fetch live flag value
- `apps/web/config/team-account-navigation.config.tsx` - Same refactor if course flag is used
- `apps/web/app/home/(user)/course/layout.tsx` - Add route protection
- `apps/web/app/home/(user)/assessment/layout.tsx` - Add route protection
- `apps/web/app/(marketing)/_components/site-footer.tsx` - Check if course flag is used

### New Files

- (Optional) `apps/web/lib/server/feature-flags.server.ts` - Utility for fetching flags from database

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create server-side feature flag utility

Create a new utility file that fetches feature flags from the database with proper error handling.

- Create `apps/web/lib/server/feature-flags.server.ts`
- Implement `getEnableCourses()` function that:
  - Uses `getSupabaseServerClient()` to query the database
  - Fetches from `public.config` table
  - Falls back to static config if DB fails
  - Returns a boolean
- Export the function for use in other files

**Why this step first**: Provides the foundation for reading the dynamic flag value

#### Step 2: Refactor navigation config to use dynamic flag

Modify the navigation config to fetch the live database value instead of using the static config.

- Import the new `getEnableCourses()` function
- Create an async function that builds the navigation routes with the dynamic flag
- Update exports to use the async function
- Ensure the navigation config works with the existing layout structure

#### Step 3: Add route protection to course/assessment pages

Protect course and assessment routes to redirect users if the feature is disabled.

- Create a layout wrapper component for course page
- Create a layout wrapper component for assessment page
- Both should check `getEnableCourses()` and redirect to home if disabled
- Use Next.js `redirect()` function for the redirect

#### Step 4: Verify footer and other components

Check if site footer and other components reference the course flag and update if needed.

- Search for other uses of `enableCourses` in the codebase
- Update any direct references to use the server-side function
- Verify no stale references remain

#### Step 5: Add tests and validation

Test that the fix works correctly.

- Verify navigation shows/hides course tab based on database value
- Test that course pages redirect when flag is disabled
- Test that toggling the admin setting properly updates the flag
- Verify no DB connection errors break the app

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `getEnableCourses()` returns true when database value is true
- ✅ `getEnableCourses()` returns false when database value is false
- ✅ `getEnableCourses()` falls back to static config on DB error
- ✅ Navigation config includes course items when flag is true
- ✅ Navigation config excludes course items when flag is false

**Test files**:
- `apps/web/lib/server/__tests__/feature-flags.server.spec.ts` - Server flag utility tests

### Integration Tests

- ✅ Admin saves `enableCourses = true` to database
- ✅ Next request shows course tab in navigation
- ✅ Admin saves `enableCourses = false` to database
- ✅ Next request hides course tab in navigation
- ✅ Direct access to `/home/course` redirects when disabled
- ✅ Direct access to `/home/assessment` redirects when disabled

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start app with `NEXT_PUBLIC_ENABLE_COURSES=false`
- [ ] Navigate to `/admin/settings`
- [ ] Verify "Enable Courses" toggle is OFF
- [ ] Toggle it ON and click "Save Changes"
- [ ] Verify success message appears
- [ ] Navigate to `/home`
- [ ] **Verify Course tab now appears in navigation** ✅ (This was failing before)
- [ ] Click Course tab and verify page loads
- [ ] Toggle OFF in admin settings
- [ ] Verify success message appears
- [ ] Navigate to `/home`
- [ ] **Verify Course tab now disappears from navigation** ✅ (This was failing before)
- [ ] Try to navigate directly to `/home/course`
- [ ] Verify redirect to `/home`
- [ ] Check browser console for errors

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Database Connection Error**: If the database is temporarily unavailable
   - **Likelihood**: low
   - **Impact**: medium (feature flag would default to static value)
   - **Mitigation**: Fallback to static config value, add error logging

2. **Performance**: Adding a database query to navigation
   - **Likelihood**: low
   - **Impact**: low (one query per page load, cached)
   - **Mitigation**: Request deduplication via React cache() is automatic

3. **Navigation Config Serialization**: Navigation config must remain serializable
   - **Likelihood**: low
   - **Impact**: medium (page would fail to load)
   - **Mitigation**: Ensure no functions or closures are returned in config

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the navigation config changes to use static flag
2. Keep the database utility function (it's safe)
3. The app falls back to environment variable behavior
4. Users must use environment variables to control the feature until the fix is re-applied

**Monitoring** (if needed):
- Monitor for database query errors in `/admin/settings` requests
- Monitor for navigation rendering errors
- Alert if course page redirects become excessive

## Performance Impact

**Expected Impact**: minimal

This adds one Supabase database query per page load that renders navigation. However:
- React Server Components automatically deduplicate requests within a single render
- The query is simple (single row from config table)
- Supabase typically responds in < 50ms

**Performance Testing**:
- Measure page load time before/after
- Verify < 100ms added latency
- Check that no additional queries are issued due to missing deduplication

## Security Considerations

**Security Impact**: none

The database already has RLS policies protecting the config table. This change:
- Only reads from the table (no security bypass)
- Uses the standard server client (respects RLS)
- Doesn't expose any new permissions

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start app with courses disabled
NEXT_PUBLIC_ENABLE_COURSES=false pnpm --filter web dev

# In browser:
# 1. Navigate to http://localhost:3000/admin/settings
# 2. Toggle "Enable Courses" ON and save
# 3. Navigate to http://localhost:3000/home
# Expected: Course tab is STILL HIDDEN (bug!)
# Actual Before Fix: Course tab is hidden ❌
```

**Expected Result**: Course tab remains hidden even after enabling in database

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit --run apps/web/lib/server/__tests__/feature-flags.server.spec.ts

# Build
pnpm build

# Manual verification
NEXT_PUBLIC_ENABLE_COURSES=false pnpm --filter web dev

# In browser:
# 1. Navigate to http://localhost:3000/admin/settings
# 2. Toggle "Enable Courses" ON and save
# 3. Refresh http://localhost:3000/home
# Expected: Course tab is NOW VISIBLE (fixed!)
# Actual After Fix: Course tab is visible ✅
```

**Expected Result**: All commands succeed, course tab appears/disappears based on database value

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks
pnpm typecheck
pnpm lint
```

## Dependencies

### New Dependencies

**No new dependencies required** - uses existing Supabase client

## Database Changes

**Migration needed**: no

The `public.config` table already exists and has the `enable_courses` column. This fix only reads from it.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] `getEnableCourses()` function created and tested
- [ ] Navigation config fetches live database value
- [ ] Course/assessment pages redirect when disabled
- [ ] All validation commands pass
- [ ] Manual testing checklist complete
- [ ] No database connection errors logged
- [ ] Performance impact measured and acceptable (< 100ms added)
- [ ] Zero regressions detected in full test suite

## Notes

**Implementation Notes**:
- The navigation config pattern is used in both personal and team account navigation - both may need updates
- Consider whether the `featureFlagsConfig` object should be refactored to support optional database overrides in the future
- The existing API endpoint `/api/admin/config` in the admin settings client could be leveraged or refactored

**Related Documentation**:
- Architecture Overview: `.ai/ai_docs/context-docs/development/architecture-overview.md`
- Database Patterns: `.ai/ai_docs/context-docs/development/database-patterns.md`
- React Query Patterns: `.ai/ai_docs/context-docs/development/react-query-patterns.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1933*
