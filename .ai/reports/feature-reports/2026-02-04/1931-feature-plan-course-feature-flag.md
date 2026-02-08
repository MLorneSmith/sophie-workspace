# Feature: Course Feature Flag

## Feature Description

Implement a feature flag system to hide all course-related UI and navigation during alpha testing, allowing testers to focus on the slide deck agentic workflow. The flag will be managed via an admin settings page with a database override pattern that allows runtime control without redeployment.

## User Story

As an **alpha tester**
I want to **not see course-related navigation items and pages**
So that **I can focus on testing the slide deck agentic workflow without distractions**

As an **admin**
I want to **toggle the course feature flag via the admin settings page**
So that **I can enable/disable the feature at runtime without redeploying**

## Problem Statement

During alpha testing, testers should focus exclusively on validating the slide deck agentic workflow. Course and assessment content creates distraction and cognitive load. Currently, all course-related UI is always visible, forcing testers to either ignore it or be confused by the aspirational content that isn't fully implemented. We need a safe, easy way to hide course features during alpha while maintaining the ability to show them to select users or in production.

## Solution Statement

Implement a single `enable_courses` feature flag that:

1. **Controls visibility** of Course and Assessment navigation items (sidebar, mobile, footer)
2. **Protects routes** by redirecting direct URL access to `/home` dashboard
3. **Provides admin control** via a new `/admin/settings` page with a toggle switch
4. **Uses database override** where the database value takes precedence over environment variable
5. **Defaults to disabled** (`false`) for safe alpha testing - explicitly opt-in to show courses

The solution leverages existing patterns in the codebase:
- Extends the `public.config` table with a new `enable_courses` column
- Follows existing feature flag configuration pattern in `feature-flags.config.ts`
- Uses conditional navigation rendering pattern from `personal-account-navigation.config.tsx`
- Implements admin control via new settings page using existing `AdminGuard` and Switch components

## Relevant Files

### Existing Files to Modify

- **Feature flag configuration**: `apps/web/config/feature-flags.config.ts`
  - Add `enableCourses` boolean flag with environment variable fallback
  - Implement database override logic to check `public.config.enable_courses`

- **Personal account navigation**: `apps/web/config/personal-account-navigation.config.tsx`
  - Add conditional rendering for Course and Assessment navigation items based on `featureFlagsConfig.enableCourses`

- **Course layout/page**: `apps/web/app/home/(user)/course/layout.tsx`
  - Add redirect logic to `/home` when flag is disabled

- **Assessment layout/page**: `apps/web/app/home/(user)/assessment/layout.tsx`
  - Add redirect logic to `/home` when flag is disabled

- **Marketing footer**: `apps/web/app/(marketing)/_components/site-footer.tsx`
  - Conditionally hide course link based on `featureFlagsConfig.enableCourses`

- **Admin sidebar**: `apps/web/app/admin/_components/admin-sidebar.tsx`
  - Add navigation item for Settings page

- **Environment example**: `apps/web/.env.example`
  - Add `NEXT_PUBLIC_ENABLE_COURSES=false` with comment explaining purpose

### New Files to Create

- **Admin settings page**: `apps/web/app/admin/settings/page.tsx`
  - Create page with Feature Flags section containing toggle switch
  - Protected with `AdminGuard` HOC

- **Update config server action**: `apps/web/app/admin/settings/_lib/server/update-config-server-actions.ts`
  - Server action to update `public.config.enable_courses` in database
  - Validates admin permissions via RLS

- **Config schema**: `apps/web/app/admin/settings/_lib/schemas/settings.schema.ts`
  - Zod schema for validating settings form input

- **Database migration**: `apps/web/supabase/migrations/[timestamp]-add-enable-courses-config.sql`
  - Add `enable_courses` column to `public.config` table
  - Add RLS policy for update operation (admin only if needed, or authenticated with specific role)
  - Note: Will be auto-generated via `pnpm --filter web supabase:db:diff`

- **Database schema update**: `apps/web/supabase/schemas/02-config.sql`
  - Add `enable_courses BOOLEAN` column definition

## Impact Analysis

### Dependencies Affected

- **Frontend Dependencies:**
  - `@kit/ui/switch` - Existing dependency, no new package needed
  - `react-hook-form` - Existing, used for form handling
  - `@kit/ui/form` - Existing, used for form layout

- **Backend Dependencies:**
  - Supabase PostgreSQL - Extended with new column
  - `@kit/supabase/server-client` - Used in server actions
  - `zod` - Existing, used for schema validation

- **Configuration Dependencies:**
  - `.env` environment variables - Add `NEXT_PUBLIC_ENABLE_COURSES`

**No new npm dependencies required** - uses existing packages and patterns.

### Risk Assessment

**Risk Level: Low**

**Rationale:**
- **Well-understood patterns**: Feature flags and conditional navigation already used throughout codebase
- **Isolated changes**: Primarily additive (new column, new page, new conditional checks)
- **Minimal integration**: No third-party APIs, no complex state management
- **Safe defaults**: Flag defaults to `false` (disabled) - safest for alpha testing
- **Easy rollback**: Can disable at any time via database or environment variable
- **No data loss**: Adding column to config table, no destructive operations

**Risk Mitigation:**
- Database migration tested locally before deployment
- Admin page protected with `AdminGuard` - only admins can change setting
- Environment variable provides fallback if database value is null
- Redirect behavior is friendly (to `/home`) not destructive (404)

### Backward Compatibility

- **No breaking changes**: Feature flag defaults to `false` (disabled), so existing behavior preserved
- **Existing pages unaffected**: Course/Assessment pages still exist, just hidden from navigation and redirecting if accessed
- **Can be enabled**: Setting can be toggled at runtime to gradually show courses without code changes
- **Deployment safe**: Can deploy code anytime, flag behavior controlled via environment variable until admin changes it in database

### Performance Impact

**Minimal Performance Impact:**

- **Client-side**: One additional boolean check in navigation rendering (negligible)
- **Database**: One additional column in single-row config table, minimal storage impact
- **API calls**: Admin toggle triggers one server action to update database (same as any form submission)
- **Bundle size**: No new dependencies, minimal code addition

**Caching Considerations:**
- Feature flag read from environment variable on server at build time initially
- Database override read on every request via server action (will use RLS caching naturally)
- Navigation components re-render only when flag value changes (no continuous checks)

### Security Considerations

**Authentication/Authorization:**
- Admin settings page protected by `AdminGuard` - only admins can access
- Update server action requires admin role (enforced by RLS or role check)
- Database read is public (everyone can see if courses enabled), but only admins can change

**Data Validation:**
- Zod schema validates boolean input before database update
- Server action validates against schema with `enhanceAction` wrapper
- Database column is simple boolean - minimal validation surface

**Potential Vulnerabilities:**
- **None identified** - boolean toggle is simple, well-protected with admin guard, uses existing security patterns

**Privacy/Compliance:**
- No user data stored in config
- No tracking of who toggles the flag (can add audit logging in v2 if needed)

## Pre-Feature Checklist

Before starting implementation:
- [x] Verified context documents are read (architecture, database patterns, server actions)
- [x] Reviewed existing similar features (feature flags, admin pages, navigation config)
- [x] Identified all integration points (config table, navigation, admin sidebar)
- [x] Defined success metrics (tester focus, admin control, zero course access during alpha)
- [x] Confirmed feature doesn't duplicate existing functionality (unique feature flag)
- [x] Verified all required dependencies available (Switch, AdminGuard, form components)
- [x] Planned feature flag strategy (environment variable + database override)

## Documentation Updates Required

### Technical Documentation

- **CLAUDE.md**: Add section documenting the `enable_courses` feature flag pattern for future maintainers
  - How to add new config fields following this pattern
  - Database override pattern explanation
  - When to use this pattern vs. other approaches

### Code Documentation

- **Feature flag comment**: Add comment in `feature-flags.config.ts` explaining database override logic
- **Server action comment**: Document `updateConfigAction` with explanation of admin-only nature
- **Settings page comment**: Explain relationship to `public.config` table

### User-Facing Documentation

- **Admin guide** (if exists): Note about Feature Flags section in admin settings
- **Deployment notes**: Mention `NEXT_PUBLIC_ENABLE_COURSES` environment variable and database column

## Rollback Plan

### How to Disable/Rollback

1. **Disable the feature flag immediately**:
   - Option A: Toggle in admin settings page (fastest)
   - Option B: Set `NEXT_PUBLIC_ENABLE_COURSES=false` in environment and redeploy
   - Option C: Set `enable_courses = NULL` in database to fall back to environment variable

2. **Database migration rollback** (if deployment fails):
   ```bash
   # Revert the migration file
   git revert [migration_commit]
   # Or manually remove the column:
   # ALTER TABLE public.config DROP COLUMN enable_courses;
   ```

3. **Code rollback** (if issues detected):
   ```bash
   # Revert to previous commit before course flag code
   git revert [feature_commit]
   ```

### What to Monitor

- **Admin settings page load time**: Should be <500ms
- **Navigation render time**: Should have no noticeable impact
- **Error logs**: Watch for database column not found errors (indicates migration didn't apply)
- **User feedback**: Any reports of missing/appearing navigation items unexpectedly

### Graceful Degradation

- If feature flag read fails, falls back to environment variable default
- If admin update fails, previous setting remains (no data loss)
- If database column is missing, gracefully falls back to `false` (safe default)

## Implementation Plan

### Phase 1: Foundation & Database

Establish the database schema and feature flag infrastructure:

1. Update database schema file to add `enable_courses` column
2. Generate and apply database migration
3. Generate TypeScript types from new schema
4. Update `feature-flags.config.ts` to include new flag with DB override logic

### Phase 2: Navigation & Route Protection

Hide course UI from navigation and protect routes:

5. Update `personal-account-navigation.config.tsx` to conditionally render course items
6. Create course layout redirect logic
7. Create assessment layout redirect logic
8. Update marketing footer to conditionally show course link

### Phase 3: Admin Control

Implement runtime control via admin interface:

9. Create settings schema for form validation
10. Create update config server action
11. Create admin settings page with toggle UI
12. Add Settings navigation item to admin sidebar
13. Add environment variable to `.env.example`

### Phase 4: Testing & Validation

Verify the feature works end-to-end:

14. Run type checking to ensure database types are available
15. Run E2E tests to verify navigation hiding works
16. Run E2E tests to verify course page redirects work
17. Run E2E tests to verify admin toggle updates database and reflects in UI
18. Run full build and integration tests

## Step by Step Tasks

### Task 1: Update Database Schema

- Edit `apps/web/supabase/schemas/02-config.sql`
- Add `enable_courses BOOLEAN DEFAULT FALSE NOT NULL` column after existing columns
- Add comment explaining the column's purpose
- Verify the schema file is syntactically correct

### Task 2: Generate and Apply Migration

- Run: `pnpm --filter web supabase:db:diff -f add-enable-courses-config`
- Verify migration file created in `apps/web/supabase/migrations/`
- Review migration for correctness (should add column with default)
- Run: `pnpm --filter web supabase migration up`
- Verify no errors from migration application

### Task 3: Generate Database Types

- Run: `pnpm supabase:web:typegen`
- Verify new column appears in `apps/web/lib/database.types.ts`
- Confirm type is `boolean`

### Task 4: Update Feature Flag Configuration

- Edit `apps/web/config/feature-flags.config.ts`
- Add new field: `enableCourses: z.boolean()` to schema
- Implement database override logic:
  - Create async function to fetch `enable_courses` from `public.config`
  - Read `NEXT_PUBLIC_ENABLE_COURSES` environment variable
  - Return database value if set, otherwise use environment variable
- Add helper function to check flag value
- Add JSDoc comments explaining database override pattern
- Export flag in config object

### Task 5: Update Personal Account Navigation

- Edit `apps/web/config/personal-account-navigation.config.tsx`
- Import `featureFlagsConfig` from feature-flags.config
- In the navigation items array, conditionally filter out Course item when `featureFlagsConfig.enableCourses === false`
- Conditionally filter out Assessment item when `featureFlagsConfig.enableCourses === false`
- Verify navigation structure with conditional items

### Task 6: Create Course Layout Redirect

- Edit or create `apps/web/app/home/(user)/course/layout.tsx`
- Add redirect logic at top of layout:
  - Check `featureFlagsConfig.enableCourses`
  - If false, redirect to `/home` using `redirect()` from Next.js
- Add JSDoc explaining the redirect behavior
- Set metadata for layout if needed

### Task 7: Create Assessment Layout Redirect

- Edit or create `apps/web/app/home/(user)/assessment/layout.tsx`
- Add same redirect logic as course layout
- Add JSDoc explaining the redirect behavior

### Task 8: Update Marketing Footer

- Edit `apps/web/app/(marketing)/_components/site-footer.tsx`
- Find the course link in footer
- Wrap with conditional: `{featureFlagsConfig.enableCourses && <CourseLink />}`
- Or use ternary to return null when flag is false
- Verify footer still renders properly with conditional

### Task 9: Create Settings Schema

- Create file: `apps/web/app/admin/settings/_lib/schemas/settings.schema.ts`
- Define Zod schema for settings form:
  ```typescript
  export const AdminSettingsSchema = z.object({
    enableCourses: z.boolean().describe('Show Course and Assessment features'),
  });
  ```
- Export type from schema using `z.infer<typeof AdminSettingsSchema>`

### Task 10: Create Update Config Server Action

- Create file: `apps/web/app/admin/settings/_lib/server/update-config-server-actions.ts`
- Add "use server" directive
- Create server action using `enhanceAction`:
  - Accept `enableCourses` boolean from settings form
  - Get Supabase server client
  - Update `public.config` table: `SET enable_courses = enableCourses`
  - Return success response with updated config
  - Handle errors gracefully with user-friendly messages
- Implement input validation with AdminSettingsSchema
- Add JSDoc comments

### Task 11: Create Admin Settings Page

- Create file: `apps/web/app/admin/settings/page.tsx`
- Structure:
  - Wrap with `AdminGuard` HOC
  - Use `PageHeader` and `PageBody` layout components
  - Add "Feature Flags" section heading
  - Create form with `react-hook-form` and `@kit/ui/form`
  - Add Switch component for `enableCourses` toggle
  - Add description text explaining what disabling courses does
  - Add submit button
  - Load current config value from database to populate form defaults
- Add JSDoc comments
- Export as default

### Task 12: Create Settings Loader Function

- Create file: `apps/web/app/admin/settings/_lib/server/settings.loader.ts`
- Add "import 'server-only'" at top
- Create async function `loadSettingsPageData`:
  - Get Supabase server client
  - Fetch current `enable_courses` value from `public.config`
  - Return config object
- Add JSDoc explaining the loader function

### Task 13: Add Settings to Admin Sidebar

- Edit `apps/web/app/admin/_components/admin-sidebar.tsx`
- Add Settings navigation item after existing items:
  - Icon: `Cog` or `Settings` from Lucide React
  - Label: "Settings"
  - Path: "/admin/settings"
- Verify sidebar structure and styling consistent with other items

### Task 14: Update Environment Example File

- Edit `apps/web/.env.example`
- Add new variable:
  ```
  # Feature Flags
  # Controls visibility of Course and Assessment features during alpha testing
  # Set to 'true' to show courses, 'false' to hide them (default: false)
  NEXT_PUBLIC_ENABLE_COURSES=false
  ```
- Add in appropriate section near other feature flags

### Task 15: Run Type Checking

- Execute: `pnpm typecheck`
- Verify zero type errors
- Ensure all database types are properly imported
- Check that `featureFlagsConfig.enableCourses` is typed correctly
- Verify all form schema types are exported and used correctly

### Task 16: Run Linting & Formatting

- Execute: `pnpm lint:fix`
- Execute: `pnpm format:fix`
- Address any linting issues
- Ensure code style is consistent with project

### Task 17: E2E Test - Navigation Hiding

- Create test: `apps/e2e/tests/features/course-flag.spec.ts`
- Test case: "Should hide Course link in navigation when flag is disabled"
  - Navigate to `/home`
  - Assert Course link is NOT visible in sidebar
  - Assert Assessment link is NOT visible in sidebar
- Test case: "Should show Course link in navigation when flag is enabled"
  - Set feature flag to true
  - Navigate to `/home`
  - Assert Course link IS visible in sidebar
  - Assert Assessment link IS visible in sidebar

### Task 18: E2E Test - Route Redirect

- Test case: "Should redirect to /home when accessing /home/course when flag disabled"
  - Ensure flag is disabled
  - Navigate to `/home/course`
  - Assert redirected to `/home`
  - Assert no 404 error
- Test case: "Should allow access to /home/course when flag enabled"
  - Enable feature flag
  - Navigate to `/home/course`
  - Assert on course page (not redirected)

### Task 19: E2E Test - Admin Toggle

- Test case: "Should update database and reflect in UI when admin toggles flag"
  - Login as admin user
  - Navigate to `/admin/settings`
  - Toggle the "Enable Courses" switch to ON
  - Assert database updated (verify with query or page check)
  - Navigate to `/home`
  - Assert Course link now visible in navigation
  - Go back to `/admin/settings`
  - Toggle to OFF
  - Assert Course link disappears from navigation

### Task 20: Manual Testing - Footer

- Test that course link in marketing footer:
  - Hidden when flag is false
  - Visible when flag is true
- Verify footer layout doesn't break with conditional link

### Task 21: Verify Admin Page Access Control

- Test that non-admin users cannot access `/admin/settings`
  - Login as regular user
  - Try to navigate to `/admin/settings`
  - Verify redirected or access denied (based on AdminGuard implementation)
- Test that admin users can access:
  - Login as admin
  - Navigate to `/admin/settings`
  - Verify page loads successfully

### Task 22: Run Full Build

- Execute: `pnpm build`
- Verify build completes successfully with zero errors
- Check build output for any warnings related to new code
- Ensure no unused imports or dead code

### Task 23: Run Full Test Suite

- Execute: `pnpm test:unit`
- Verify all unit tests pass
- Execute: `pnpm test:e2e`
- Verify all E2E tests pass including new course flag tests
- Execute: `pnpm test:coverage` (if applicable)
- Verify new code is covered by tests

### Task 24: Final Validation

- Execute: `pnpm typecheck` (again, to be sure)
- Execute: `pnpm lint` (verify no issues)
- Execute: `pnpm format` (verify formatting)
- Do manual smoke test:
  - Start dev server: `pnpm dev`
  - Login as admin user
  - Navigate to `/admin/settings`
  - Verify page loads and toggle is present
  - Toggle the switch
  - Verify courses appear/disappear from navigation in real-time
  - Verify redirect behavior by direct URL navigation
- Document any issues found and fix before completion

## Testing Strategy

### Unit Tests

**Feature Flag Tests** (`__tests__/feature-flags.config.test.ts`):
- Test `getBoolean()` helper function with various string inputs
- Test feature flag config loads from environment variable
- Test database override logic (when `enable_courses` is set, use that value)
- Test fallback to environment variable when database value is null
- Test default behavior when neither environment nor database value is set

**Server Action Tests** (`__tests__/update-config-server-actions.test.ts`):
- Test `updateConfigAction` validates schema correctly
- Test successful database update returns updated config
- Test invalid input is rejected with proper error
- Test authentication is enforced (admin-only)
- Test response includes updated flag value

**Settings Schema Tests** (`__tests__/settings.schema.test.ts`):
- Test schema accepts boolean values
- Test schema rejects non-boolean values
- Test schema can infer type correctly for TypeScript

### Integration Tests

**Navigation Integration** (`__tests__/integration/course-flag-navigation.test.ts`):
- Test that personal account navigation config respects feature flag
- Test conditional filtering of Course and Assessment items
- Test other navigation items are not affected
- Test navigation structure is valid after filtering

**Database Integration** (`__tests__/integration/config-table.test.ts`):
- Test updating `enable_courses` column succeeds
- Test reading `enable_courses` value works
- Test default value is applied correctly
- Test migration applied successfully

### E2E Tests

**User Navigation Flow** (`course-flag.spec.ts`):
- Test tester sees no course links when flag is disabled (primary testing scenario)
- Test tester can access admin settings if admin
- Test course page redirects to home when flag disabled
- Test tester can access course page when flag is enabled

**Admin Control Flow** (`admin-settings.spec.ts`):
- Test admin can navigate to settings page
- Test admin can toggle course feature flag
- Test toggle reflects immediately in navigation
- Test flag persists after page reload (database check)
- Test non-admin cannot access settings page

**Marketing Footer** (`marketing-footer.spec.ts`):
- Test course link hidden in footer when flag disabled
- Test course link visible in footer when flag enabled
- Test footer layout stable in both states

### Edge Cases

**Test edge case: Database null value**
- When `enable_courses` is NULL, should fall back to environment variable
- Test this by setting database to null and verifying environment variable is used

**Test edge case: Environment variable missing**
- When `NEXT_PUBLIC_ENABLE_COURSES` is not set, should default to false
- Test this by removing environment variable and verifying default behavior

**Test edge case: Rapid toggle changes**
- Admin toggles flag multiple times rapidly
- Verify database reflects final state correctly
- Verify UI doesn't get into inconsistent state

**Test edge case: Concurrent updates**
- Multiple admin tabs open, toggle in different tabs
- Verify database has correct final value
- Verify UI updates reflect database state

**Test edge case: Direct URL access with flag disabled**
- User bookmarks `/home/course` or `/home/assessment`
- When flag is disabled and user visits bookmark
- Verify redirect happens (not 404)
- Verify redirect is to `/home`

## Acceptance Criteria

1. ✅ Course and Assessment navigation items are hidden when `NEXT_PUBLIC_ENABLE_COURSES=false` or `public.config.enable_courses` is false
2. ✅ Direct URL access to `/home/course/*` or `/home/assessment/*` redirects to `/home` when flag is disabled (friendly redirect, not 404)
3. ✅ Course link in marketing footer is hidden when flag is disabled
4. ✅ Admin can navigate to `/admin/settings` page and see Feature Flags section
5. ✅ Admin can toggle the Course feature flag switch on the settings page
6. ✅ Toggling the switch updates the `public.config.enable_courses` database column
7. ✅ Database value takes precedence over environment variable (database override pattern)
8. ✅ Changes reflect immediately in navigation after toggle (no page refresh needed)
9. ✅ Feature flag defaults to `false` (disabled) for safe alpha testing
10. ✅ Non-admin users cannot access `/admin/settings` page
11. ✅ Settings page is properly integrated into admin sidebar with Settings navigation item
12. ✅ All type checks pass (`pnpm typecheck`)
13. ✅ All linting passes (`pnpm lint`)
14. ✅ All tests pass (`pnpm test:unit`, `pnpm test:e2e`)
15. ✅ Production build succeeds (`pnpm build`)
16. ✅ Zero regressions in existing functionality

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions:

- `pnpm typecheck` - Run type checking to validate all types are correct
- `pnpm lint` - Run linting to ensure code style compliance
- `pnpm format --check` - Verify code formatting is correct
- `pnpm test:unit` - Run unit tests to validate flag logic and server actions
- `pnpm test:e2e` - Run E2E tests to validate full user flows including navigation hiding, redirects, and admin toggle
- `pnpm build` - Run production build to validate feature builds successfully with zero errors
- **Manual smoke test**: `pnpm dev` then:
  - Login as admin → navigate to `/admin/settings` → toggle course flag → verify courses appear/disappear from `/home` navigation
  - Login as regular user → verify course links not visible → try direct URL to `/home/course` → verify redirected to `/home`

## Notes

### Future Considerations

1. **Separate flags**: In the future, separate `enable_assessment` flag could be added if course and assessment need independent control
2. **Custom "Coming Soon" page**: Instead of redirect, could show a coming-soon page for bookmarked links
3. **Audit logging**: Track who changes feature flags and when (could add audit table in v2)
4. **Feature flag management UI**: Expand admin settings with more granular flags and descriptions
5. **User-level overrides**: Could allow specific users to see courses even when flag disabled
6. **Analytics**: Track how often users try to access disabled features

### Implementation Notes

- **Database migration is auto-generated**: Use `pnpm --filter web supabase:db:diff -f add-enable-courses-config` to generate migration from schema file
- **Feature flag initialization**: The `public.config` table already exists and is initialized with one default row, so new column will get default value
- **No RLS policy needed for select**: Config is readable by authenticated users (exists already). Update policy depends on whether admins need RLS check or role check
- **Type safety guaranteed**: TypeScript types auto-generated from database schema, so no manual type definitions needed
- **Icon choice**: For Settings sidebar item, `Cog` or `Settings` icon from Lucide React are both appropriate

### Key Design Decisions

1. **Single flag vs. separate flags**: Using single `enable_courses` flag (not separate for assessment) because:
   - Simpler for alpha (course and assessment are related content)
   - Fewer database columns and config options
   - Can split later if needed

2. **Database override pattern**: Environment variable + database override chosen because:
   - Safe defaults (env var sets baseline)
   - Runtime flexibility (admins can change without deployment)
   - No redeployment needed for testing
   - Follows existing pattern in codebase for other config

3. **Redirect vs. 404**: Using friendly redirect to `/home` instead of 404 because:
   - Users who bookmark course pages won't get error message
   - Better UX for testers who accidentally try direct URL
   - Explicit redirect is clear intent vs. hidden page

4. **Admin-only toggle**: Settings page protected with AdminGuard because:
   - Feature flag isn't a user setting, it's a system-level configuration
   - Only admins should control what features are visible to all testers
   - Prevents accidental or malicious flag changes

### Related Patterns in Codebase

- **Feature flags**: See `apps/web/config/feature-flags.config.ts` for other flags like `enableThemeToggle`, `enableTeamDeletion`
- **Admin pages**: See `apps/web/app/admin/page.tsx` for page structure and AdminGuard usage
- **Navigation config**: See `apps/web/config/personal-account-navigation.config.tsx` for how navigation items are defined
- **Server actions**: See pattern in `development/server-actions.md` for how to structure update actions
- **Database patterns**: See pattern in `development/database-patterns.md` for RLS and migration workflows

