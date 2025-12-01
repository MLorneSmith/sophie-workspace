# Bug Fix: Course Dashboard 406 Error and Image Configuration

**Related Diagnosis**: #828
**Severity**: medium
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: (1) `.single()` Supabase method returns 406 HTTP error when no row exists; (2) `media.slideheroes.com` hostname not configured in Next.js image config
- **Fix Approach**: Replace `.single()` with `.maybeSingle()` and add `media.slideheroes.com` to `remotePatterns` in Next.js config
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `/home/course` dashboard is experiencing two distinct issues:

1. **406 HTTP Error**: When a user has no `course_progress` record, Supabase REST API returns HTTP 406 "Not Acceptable" because `.single()` requires exactly one row
2. **Image Hostname Error**: Lesson thumbnail images from `media.slideheroes.com` fail to load because the hostname is not configured in Next.js `images.remotePatterns`

Both issues degrade the user experience, causing console errors and missing images on the course dashboard.

For full details, see diagnosis issue #828.

### Solution Approaches Considered

#### Option 1: Use `.maybeSingle()` and Add Image Hostname ⭐ RECOMMENDED

**Description**: Replace `.single()` with `.maybeSingle()` which returns `null` instead of throwing an error when no rows match. Add `media.slideheroes.com` to the Next.js image configuration's `remotePatterns` array.

**Pros**:
- Minimal code change (2 lines total)
- Aligns with Supabase best practices for optional rows
- Gracefully handles missing progress records
- Straightforward Next.js configuration addition
- Zero breaking changes
- Improves page reliability without changing business logic

**Cons**:
- None significant

**Risk Assessment**: low - This is a standard Supabase pattern for optional relationships

**Complexity**: simple - Direct method substitution and config array addition

#### Option 2: Create Default course_progress Record on Demand

**Description**: Automatically create a `course_progress` record when a user first accesses a course, guaranteeing a row always exists.

**Why Not Chosen**: Over-engineered. `.maybeSingle()` is the standard pattern for optional data. Creating unnecessary records pollutes the database and adds mutation logic unnecessarily.

#### Option 3: Modify Query to Use `.maybeSingle()` but Not Add Image Hostname

**Description**: Fix the 406 error but leave the image hostname issue unresolved.

**Why Not Chosen**: Incomplete solution. Both issues degrade the user experience and are straightforward to fix together.

### Selected Solution: Use `.maybeSingle()` and Add Image Hostname

**Justification**: This approach is minimal, follows Supabase best practices, and completely resolves both issues without introducing complexity or breaking changes. The pattern is idiomatic for optional relationships in Supabase.

**Technical Approach**:
- Replace `.single()` with `.maybeSingle()` in `apps/web/app/home/(user)/course/page.tsx:71`
- Add `media.slideheroes.com` to `remotePatterns` array in `apps/web/next.config.mjs:getImagesConfig()`
- The existing fallback logic (`courseProgress || null`) already handles `null` correctly

**Architecture Changes**: None - this is a bug fix that aligns with existing patterns

**Migration Strategy**: Not needed - no database changes, no data migration

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/course/page.tsx` - Replace `.single()` with `.maybeSingle()` on line 71
- `apps/web/next.config.mjs` - Add `media.slideheroes.com` to `remotePatterns` in `getImagesConfig()` function

### New Files

No new files required

### Step-by-Step Tasks

#### Step 1: Fix Supabase Query - Replace .single() with .maybeSingle()

Replace the `.single()` call with `.maybeSingle()` on line 71 of `apps/web/app/home/(user)/course/page.tsx`.

This allows the query to return `null` gracefully when no `course_progress` record exists for the user, instead of throwing a 406 error.

- Change `.single()` to `.maybeSingle()` (1 line change)
- Verify existing fallback logic handles null (`courseProgress || null` already does this)

**Why this step first**: The 406 error is the primary issue blocking dashboard functionality

#### Step 2: Add media.slideheroes.com to Next.js Image Configuration

Add the `media.slideheroes.com` hostname to the `remotePatterns` array in `getImagesConfig()` function in `apps/web/next.config.mjs`.

- Insert new pattern object for `media.slideheroes.com` with `protocol: "https"`
- Place it alongside localhost and 127.0.0.1 patterns in development

**Why this step second**: The image loading issue is secondary but equally important for UX

#### Step 3: Add/Update Tests

Add tests to prevent regression:

- Unit test for `.maybeSingle()` returning null when no record exists
- Test that dashboard renders gracefully without `courseProgress`
- Test that image hostname is properly configured

#### Step 4: Validation

- Run type checking and linting
- Test locally: navigate to `/home/course` and verify no 406 errors in network tab
- Verify thumbnail images load correctly
- Test with user that has no `course_progress` record to verify null handling

#### Step 5: Deploy and Monitor

- Merge to main branch
- Deploy to production
- Monitor error logs for 406 errors on `/home/course` endpoint

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `.maybeSingle()` returns `null` when no course_progress record exists
- ✅ Dashboard component gracefully handles `courseProgress: null`
- ✅ Null-coalescing operator (`||`) correctly provides fallback value
- ✅ Image hostname configuration includes `media.slideheroes.com`
- ✅ Regression test: 406 error does not occur on course dashboard load

**Test files**:
- `apps/web/app/home/(user)/course/__tests__/page.test.tsx` - Page component behavior with null progress
- `apps/web/__tests__/next.config.test.ts` - Image configuration validation

### Integration Tests

- ✅ Full course page loads without errors when user has no progress record
- ✅ Progress data displays correctly when record exists
- ✅ Course images load and render properly

### E2E Tests

- ✅ User can navigate to `/home/course` without errors
- ✅ Course dashboard displays lesson cards with thumbnail images
- ✅ No console errors or network failures

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Create a test user with no `course_progress` record
- [ ] Navigate to `/home/course` in development
- [ ] Verify NO 406 error in browser network tab
- [ ] Verify NO console errors related to image loading
- [ ] Verify lesson thumbnail images render correctly
- [ ] Test with a user that DOES have progress to ensure existing data still works
- [ ] Check browser console for any new errors
- [ ] Verify responsive design still works on mobile

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Breaking existing progress queries**: If other parts of code rely on `.single()` throwing an error
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: This file is the only place using this query pattern; search codebase for other `.single()` calls on `course_progress`

2. **Image loading failures**: If `media.slideheroes.com` has CORS issues
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Test thoroughly; verify CDN is accessible from browsers; monitor error logs

3. **Type safety**: TypeScript may require adjustment for `.maybeSingle()` return type
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Let TypeScript guide; adjust types as needed

**Rollback Plan**:

If this fix causes issues in production:

1. Revert the commit: `git revert <commit-hash>`
2. Redeploy to production
3. Investigate the specific error in logs
4. Create a new issue for the specific problem

**Monitoring** (if needed):

- Monitor `/home/course` endpoint error rate in Vercel analytics
- Watch for increase in 406 errors
- Alert if image loading errors spike

## Performance Impact

**Expected Impact**: none

No performance changes expected. The `.maybeSingle()` method has identical performance to `.single()`. Adding an image hostname has zero runtime performance impact.

## Security Considerations

**Security Impact**: none

- No security implications for query change
- `media.slideheroes.com` is a public CDN; no sensitive data served from there
- Image loading restriction is security hardening, not risk

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to course dashboard with user missing course_progress
# Check network tab for 406 error on /course_progress query
# Check console for image loading error about media.slideheroes.com
```

**Expected Result**: 406 error in network tab and image loading warning in console

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if added)
pnpm --filter web test course-page

# Build
pnpm build

# Start dev server
pnpm dev

# Navigate to http://localhost:3000/home/course
# Verify no 406 errors in network tab
# Verify images load without console errors
```

**Expected Result**: All commands succeed, dashboard loads without errors, images display correctly, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Specific checks
# 1. Verify no other code uses .single() on course_progress
grep -r "course_progress.*single()" apps/web/

# 2. Verify image config is valid
node -e "console.log(require('./apps/web/next.config.mjs').default.images)"
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained

## Success Criteria

The fix is complete when:

- [ ] All validation commands pass
- [ ] 406 error no longer occurs on `/home/course`
- [ ] Lesson thumbnail images display correctly
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] No console errors in browser developer tools
- [ ] Manual testing checklist complete

## Notes

### Supabase `.single()` vs `.maybeSingle()`

**`.single()`**: Expects exactly one row. Returns 406 if zero rows or multiple rows. Throws on error.

**`.maybeSingle()`**: Expects zero or one row. Returns `null` if zero rows. Throws if multiple rows (data integrity error). Standard for optional relationships.

### Next.js Image Hostname Configuration

The `remotePatterns` array uses protocol + hostname matching (not full URL matching). A single pattern object can match multiple image URLs from the same hostname.

**Pattern object**:
```typescript
{
  protocol: "https",
  hostname: "media.slideheroes.com"
}
```

This allows any HTTPS image from `media.slideheroes.com`, including subdomain variations if needed.

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #828*
