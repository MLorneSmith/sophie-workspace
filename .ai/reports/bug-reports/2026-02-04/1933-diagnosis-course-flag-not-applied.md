# Bug Diagnosis: Course feature flag database override not implemented

**ID**: ISSUE-1933
**Created**: 2026-02-04T12:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The course feature flag toggle in admin settings (`/admin/settings`) successfully saves the `enable_courses` value to the database, but the navigation and route protection code never reads from the database. The navigation config and route layouts use the static `featureFlagsConfig.enableCourses` value which is set once at build/startup time from the `NEXT_PUBLIC_ENABLE_COURSES` environment variable only. The planned "database override" logic was never implemented.

## Environment

- **Application Version**: dev branch (commit b659415d0)
- **Environment**: development
- **Browser**: N/A (server-side issue)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: N/A (feature never worked)

## Reproduction Steps

1. Navigate to `/admin/settings`
2. Toggle "Enable Courses" switch ON
3. Click "Save Changes" - success message appears
4. Navigate to `/home`
5. **Expected**: Course tab visible in navigation
6. **Actual**: Course tab NOT visible in navigation

## Expected Behavior

When the `enable_courses` flag is set to `true` in the database via admin settings, the Course and Assessment navigation items should appear in the sidebar, and direct access to `/home/course` should be allowed.

## Actual Behavior

The admin settings page correctly saves the `enable_courses` value to the database, but the navigation and route protection code reads from the static `featureFlagsConfig.enableCourses` value (set from environment variable at build time), so database changes have no effect.

## Diagnostic Data

### Code Analysis

**`apps/web/config/feature-flags.config.ts`** (lines 87-88):
```typescript
enableCourses: getBoolean(process.env.NEXT_PUBLIC_ENABLE_COURSES, false),
```

This reads ONLY from the environment variable at module load time. There is no database fetch logic.

**`apps/web/config/personal-account-navigation.config.tsx`** (lines 29-35, 51-57):
```typescript
featureFlagsConfig.enableCourses
  ? {
      label: "common:routes.course",
      path: pathsConfig.app.course,
      Icon: <GraduationCap className={iconClasses} />,
    }
  : undefined,
```

Uses the static `featureFlagsConfig.enableCourses` value, which is always the value from the environment variable.

**`apps/web/app/home/(user)/course/layout.tsx`** (lines 16-17):
```typescript
if (!featureFlagsConfig.enableCourses) {
  redirect(pathsConfig.app.home);
}
```

Also uses the static config value that never changes.

### Database Analysis

The admin settings page correctly updates the database:

**`apps/web/app/admin/settings/_lib/server/update-config-server-actions.ts`**:
```typescript
const { error } = await client
  .from("config")
  .update({
    enable_courses: data.enableCourses,
  })
  .not("enable_team_accounts", "is", null);
```

This works correctly - the database IS being updated.

### Feature Plan vs Implementation

**Feature Plan (Task 4)** specified:
> Implement database override logic:
> - Create async function to fetch `enable_courses` from `public.config`
> - Read `NEXT_PUBLIC_ENABLE_COURSES` environment variable
> - **Return database value if set, otherwise use environment variable**

**Actual Implementation**: Only reads from environment variable. No database fetch function was created.

## Related Code

- **Affected Files**:
  - `apps/web/config/feature-flags.config.ts` - Missing database override logic
  - `apps/web/config/personal-account-navigation.config.tsx` - Uses static flag value
  - `apps/web/app/home/(user)/course/layout.tsx` - Uses static flag value
  - `apps/web/app/home/(user)/assessment/layout.tsx` - Uses static flag value
  - `apps/web/app/(marketing)/_components/site-footer.tsx` - Uses static flag value

- **Recent Changes**: Commit b659415d0 added the feature flag system
- **Suspected Functions**: `featureFlagsConfig` object needs to dynamically read from database

## Related Issues & Context

### Direct Predecessors
- #1931 (CLOSED): "Feature: Course Feature Flag" - This is the implementation issue that introduced this bug

### Historical Context
This is a missing implementation from Issue #1931, not a regression. The feature plan specified database override logic, but only the environment variable reading was implemented.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The database override logic specified in Task 4 of the feature plan was never implemented - `featureFlagsConfig.enableCourses` only reads from the environment variable at build/startup time.

**Detailed Explanation**:
The feature plan clearly specifies that the `enableCourses` flag should check the database value first, falling back to the environment variable. However, the implementation in `feature-flags.config.ts` only contains:

```typescript
enableCourses: getBoolean(process.env.NEXT_PUBLIC_ENABLE_COURSES, false),
```

This is a static value computed once at module load time. The planned async function to fetch `enable_courses` from `public.config` was never created. As a result:

1. The admin settings page saves to the database (works correctly)
2. The navigation/layouts read from `featureFlagsConfig.enableCourses` (static env var value)
3. These are completely disconnected - database changes have no effect

**Supporting Evidence**:
- `feature-flags.config.ts:87-88` - Only env var, no database fetch
- Feature plan Task 4 explicitly mentions "Create async function to fetch `enable_courses` from `public.config`" - this function does not exist
- Implementation report incorrectly claims "Database override pattern where config table value takes precedence" but code review shows this is not implemented

### How This Causes the Observed Behavior

1. Admin enables courses in settings → Database `enable_courses` set to `true` ✓
2. User navigates to `/home` → Server renders navigation
3. Navigation config reads `featureFlagsConfig.enableCourses` → Value is `false` (from env var)
4. Course tab is filtered out because `false ? {...} : undefined`
5. User sees no course tab despite database having `true`

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code inspection shows no database read logic in feature-flags.config.ts
- The feature plan explicitly describes the missing functionality
- The navigation/layout code clearly uses the static config value
- This is a missing implementation, not a subtle bug

## Fix Approach (High-Level)

The fix requires implementing the database override pattern in one of two ways:

**Option A: Server-side data fetching (Recommended)**
- Create a server-side utility function `getEnableCoursesFlag()` that reads from database
- Modify navigation config to be dynamically generated server-side
- Pass the database value to layouts/navigation components

**Option B: Modify feature-flags.config.ts**
- Since this is a synchronous config file, would need to refactor to support async database reads
- This is more invasive and may not fit the existing pattern

The navigation config and route layouts need to read the live database value on each request, not a static value from module initialization.

## Diagnosis Determination

**Root cause confirmed**: The database override logic specified in Issue #1931's feature plan (Task 4) was never implemented. The `featureFlagsConfig.enableCourses` value is statically set from the environment variable at build/startup time and never queries the database.

The admin settings UI correctly saves to the database, but nothing reads from it for navigation/routing decisions.

## Additional Context

- The implementation report (`1931-implementation-course-feature-flag.md`) incorrectly states "Database override pattern where config table value takes precedence" - this was planned but not implemented
- The feature plan had detailed implementation steps that were partially followed (admin UI, database schema) but the critical "database override" part was missed
- This is a completeness issue from Issue #1931, not a new bug

---
*Generated by Claude Debug Assistant*
*Tools Used: gh issue view, Grep, Read (feature-flags.config.ts, personal-account-navigation.config.tsx, course/layout.tsx, update-config-server-actions.ts, api/admin/config/route.ts, feature plan, implementation report)*
