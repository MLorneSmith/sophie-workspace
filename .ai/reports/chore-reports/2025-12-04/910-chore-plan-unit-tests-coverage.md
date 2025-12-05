# Chore: Add Unit Tests for Critical Packages

## Chore Description

Create comprehensive unit tests for four critical areas of the codebase that currently lack test coverage:

1. **packages/next** - Server actions and route handler utilities (enhanceAction, enhanceRouteHandler)
2. **packages/supabase** - Core Supabase client utilities and authentication functions
3. **@kit/auth** - Improve branch coverage from 46% to 80%+
4. **apps/payload collections** - Collection configurations and seeding system

These packages are core infrastructure used throughout the application. Their lack of test coverage creates significant risk and makes refactoring difficult.

## Relevant Files

### Core Packages to Test

- `packages/next/src/actions/index.ts` - enhanceAction factory function
- `packages/next/src/routes/index.ts` - enhanceRouteHandler factory function
- `packages/supabase/src/clients/server-client.ts` - Supabase server client creation
- `packages/supabase/src/clients/server-admin-client.ts` - Admin client creation
- `packages/supabase/src/clients/browser-client.ts` - Browser/client-side client
- `packages/supabase/src/auth.ts` - Authentication utilities
- `packages/supabase/src/require-user.ts` - User requirement checking
- `packages/supabase/src/check-requires-mfa.ts` - MFA checking
- `packages/supabase/src/hooks/*.ts` - React hooks (25+ files)

### Payload Collections to Test

- `apps/payload/src/collections/Users.ts` (100% coverage already exists - reference)
- `apps/payload/src/collections/Courses.ts` (currently 66%)
- `apps/payload/src/collections/CourseLessons.ts` (currently 66%)
- `apps/payload/src/collections/CourseQuizzes.ts` (currently 50%)
- `apps/payload/src/collections/Documentation.ts` (currently 50%)
- `apps/payload/src/collections/Downloads.ts` (currently 13%)
- `apps/payload/src/collections/Media.ts` (currently 20%)
- `apps/payload/src/collections/Posts.ts` (currently 28%)
- `apps/payload/src/collections/Private.ts` (currently 28%)
- `apps/payload/src/collections/QuizQuestions.ts` (currently 20%)
- `apps/payload/src/collections/SurveyQuestions.ts` (currently 16%)
- `apps/payload/src/collections/Surveys.ts` (currently 20%)

### Test Infrastructure Files

- `packages/features/auth/src/test/setup.ts` - Existing test setup pattern
- `packages/features/auth/vitest.config.mts` - Existing vitest configuration pattern
- `packages/features/auth/src/schemas/*.test.ts` - Existing unit test patterns (5 files)
- `vitest.config.mts` (root) - Root vitest configuration with monorepo support

### New Files to Create

**packages/next configuration:**
- `packages/next/vitest.config.mts` - Vitest configuration for packages/next
- `packages/next/src/test/setup.ts` - Test setup and mocks

**packages/next test files:**
- `packages/next/src/actions/index.test.ts` - enhanceAction tests
- `packages/next/src/routes/index.test.ts` - enhanceRouteHandler tests

**packages/supabase configuration:**
- `packages/supabase/vitest.config.mts` - Vitest configuration for packages/supabase
- `packages/supabase/src/test/setup.ts` - Test setup and mocks
- `packages/supabase/src/test/__mocks__/server-only.ts` - Server-only mock

**packages/supabase test files:**
- `packages/supabase/src/clients/__tests__/server-client.test.ts`
- `packages/supabase/src/clients/__tests__/server-admin-client.test.ts`
- `packages/supabase/src/clients/__tests__/browser-client.test.ts`
- `packages/supabase/src/auth.test.ts`
- `packages/supabase/src/require-user.test.ts`
- `packages/supabase/src/check-requires-mfa.test.ts`
- `packages/supabase/src/hooks/__tests__/use-supabase.test.ts`
- `packages/supabase/src/hooks/__tests__/use-user.test.ts`

**@kit/auth branch coverage improvements:**
- `packages/features/auth/src/server/**/*.test.ts` - Server action tests
- `packages/features/auth/src/components/**/*.test.ts` - Component tests (if any)

**Payload collections tests:**
- `apps/payload/src/collections/__tests__/Courses.test.ts`
- `apps/payload/src/collections/__tests__/CourseLessons.test.ts`
- `apps/payload/src/collections/__tests__/CourseQuizzes.test.ts`
- `apps/payload/src/collections/__tests__/Documentation.test.ts`
- `apps/payload/src/collections/__tests__/Downloads.test.ts`
- `apps/payload/src/collections/__tests__/Media.test.ts`
- `apps/payload/src/collections/__tests__/Posts.test.ts`
- `apps/payload/src/collections/__tests__/Private.test.ts`
- `apps/payload/src/collections/__tests__/QuizQuestions.test.ts`
- `apps/payload/src/collections/__tests__/SurveyQuestions.test.ts`
- `apps/payload/src/collections/__tests__/Surveys.test.ts`

## Impact Analysis

### Scope

This chore touches four distinct areas:
- **packages/next** - 2 core utility modules
- **packages/supabase** - 6 client files + 25+ hook files
- **@kit/auth** - Improvements to existing tests
- **apps/payload** - 11 collection configuration files

### Dependencies Affected

**Direct consumers of packages/next:**
- All server actions throughout the application
- All API route handlers
- Form submission handlers
- Mutation endpoints

**Direct consumers of packages/supabase:**
- All data fetching operations
- Authentication system
- Database operations
- Storage interactions
- Every app that uses auth or database

**Direct consumers of @kit/auth:**
- Authentication pages and forms
- Login/signup flows
- Password reset flows
- Multi-factor authentication

**Direct consumers of Payload collections:**
- Content management system
- Seeding system
- Content relationships
- Admin interface

### Risk Assessment

**Risk Level: MEDIUM**

**Why Medium, not High:**
- Tests are read-only validation - they don't change functionality
- No schema or database changes required
- New tests are isolated to test files only
- Existing functionality remains untouched
- Tests only run during `pnpm test:unit` or `pnpm test:coverage`
- No production impact if tests have gaps

**Why Medium, not Low:**
- packages/next and packages/supabase are critical infrastructure
- Missing tests could mask real bugs during refactoring
- Branch coverage gaps (46% in auth) suggest untested edge cases
- Payload collections touch content management (not critical but important)

### Backward Compatibility

**Fully compatible** - No breaking changes:
- All tests are additive (no modification of existing code)
- No API changes
- No schema changes
- No behavior changes
- Existing tests continue to pass unchanged

### Version Constraints

- **Vitest**: ^2.1.0 (already in use across the project)
- **@supabase/ssr**: ^0.4.0 (already in use)
- **Zod**: ^4.0.0 (already in use)
- **React**: 19.2.x (for client hooks testing)

## Pre-Chore Checklist

Before starting implementation:

- [ ] Create feature branch: `chore/add-unit-tests-core-packages`
- [ ] Review existing test patterns in `packages/features/auth/src/test/`
- [ ] Review existing Vitest configurations
- [ ] Check root vitest.config.mts for monorepo setup
- [ ] Understand mocking requirements (server-only, next/navigation, etc.)
- [ ] Review Payload collection structure
- [ ] Check what's already in Users.ts collection (reference for pattern)

## Documentation Updates Required

- **CLAUDE.md** - Add testing guidelines for new test packages
- **packages/next/CLAUDE.md** - Existing, verify test patterns align
- **packages/supabase/CLAUDE.md** - Existing, verify test patterns align
- **Root README.md** - Consider test coverage summary in overview
- **No CHANGELOG.md changes** - This is internal testing, not a user-facing feature

## Rollback Plan

If issues arise during testing:

1. **Revert commits** - Tests can be cleanly reverted without affecting code
2. **No database impact** - All tests are in-memory or mocked
3. **No data loss risk** - Tests only read/verify, don't persist
4. **Quick recovery** - If test suite breaks build, delete test files and retry

To rollback completely:
```bash
git revert <commit-hash>
```

## Step by Step Tasks

### Task 1: Set Up Test Infrastructure for packages/next

1. Create `packages/next/vitest.config.mts` with node environment
2. Create `packages/next/src/test/setup.ts` with standard mocks
3. Create `packages/next/src/test/__mocks__/server-only.ts` mock file
4. Update root `vitest.config.mts` to include packages/next
5. Add test scripts to `packages/next/package.json`

**Rationale:** Must establish test infrastructure before writing tests. Follows same pattern as packages/features/auth.

### Task 2: Create Unit Tests for packages/next

1. **enhanceAction tests** (`src/actions/index.test.ts`):
   - Test valid schema validation passes data correctly
   - Test invalid schema throws validation error
   - Test auth requirement enforces user authentication
   - Test auth optional allows unauthenticated calls
   - Test captcha verification when enabled
   - Test captcha skipped when disabled
   - Test redirect handling during auth verification
   - Test error propagation from wrapped function
   - Test undefined user param when auth: false
   - Test user data populated when auth: true

2. **enhanceRouteHandler tests** (`src/routes/index.test.ts`):
   - Test valid body passes validation
   - Test invalid body returns 400 error
   - Test auth requirement enforces authentication
   - Test auth optional allows unauthenticated requests
   - Test user context populated correctly
   - Test request object accessible in handler
   - Test response formatting (NextResponse)
   - Test error handling and proper HTTP status codes
   - Test GET requests without body validation
   - Test different HTTP methods (POST, PUT, DELETE, etc.)

**Rationale:** These are critical utilities used by every server action and API route. Tests ensure validation, auth, and error handling work correctly.

### Task 3: Set Up Test Infrastructure for packages/supabase

1. Create `packages/supabase/vitest.config.mts` with node environment
2. Create `packages/supabase/src/test/setup.ts` with standard mocks
3. Create `packages/supabase/src/test/__mocks__/server-only.ts` mock file
4. Create `packages/supabase/src/test/__mocks__/@supabase/ssr.ts` Supabase mock
5. Update root `vitest.config.mts` to include packages/supabase
6. Add test scripts to `packages/supabase/package.json`

**Rationale:** Supabase client creation requires complex mocking. Centralized setup prevents duplication.

### Task 4: Create Unit Tests for Supabase Clients

1. **getSupabaseServerClient tests** (`clients/__tests__/server-client.test.ts`):
   - Test client is created with correct URL
   - Test client is created with correct public key
   - Test cookie handling is configured correctly
   - Test getAll() method calls cookies API
   - Test setAll() method calls cookies API
   - Test error handling in cookie operations
   - Test client is a valid Supabase instance
   - Test environment variables are loaded correctly
   - Test client reuses connection (singleton or stateless)

2. **getSupabaseServerAdminClient tests** (`clients/__tests__/server-admin-client.test.ts`):
   - Test admin client created with service role key
   - Test admin client uses correct URL and keys
   - Test RLS bypass warning/documentation
   - Test client is valid Supabase instance
   - Test error handling when keys missing

3. **getSupabaseBrowserClient tests** (`clients/__tests__/browser-client.test.ts`):
   - Test browser client created with correct keys
   - Test browser client uses jsdom environment
   - Test realtime subscription setup
   - Test auth state persistence
   - Test local storage integration

**Rationale:** Client creation is critical path. Tests verify configuration, environment variable handling, and error cases.

### Task 5: Create Unit Tests for Supabase Auth Functions

1. **requireUser tests** (`require-user.test.ts`):
   - Test returns user when authenticated
   - Test returns redirect URL when not authenticated
   - Test MFA verification when enabled
   - Test MFA skipped when disabled
   - Test handles Supabase errors gracefully
   - Test returns correct redirect destination

2. **checkRequiresMFA tests** (`check-requires-mfa.test.ts`):
   - Test returns true when MFA required
   - Test returns false when MFA not required
   - Test handles missing user gracefully
   - Test handles Supabase errors

3. **auth.ts tests** (`auth.test.ts`):
   - Test all auth utilities for type safety
   - Test auth callback handling
   - Test session creation
   - Test token refresh logic
   - Test error handling

**Rationale:** Auth is security-sensitive. Tests verify correct behavior and prevent regression.

### Task 6: Create Unit Tests for Supabase Hooks

Focus on critical hooks first (create 3-5 core hook tests):

1. **useSupabase hook tests** (`hooks/__tests__/use-supabase.test.ts`):
   - Test returns Supabase client
   - Test throws error outside context provider
   - Test client is usable for queries

2. **useUser hook tests** (`hooks/__tests__/use-user.test.ts`):
   - Test returns user data when authenticated
   - Test returns null when not authenticated
   - Test handles loading state
   - Test handles error state

3. **Additional high-impact hooks** (select 3-5 more):
   - useSignInWithEmailPassword
   - useSignUpWithEmailPassword
   - useSignOut
   - useSignInWithProvider
   - useRequestResetPassword

**Rationale:** Hooks are used extensively in the app. Tests verify they work correctly with Supabase.

### Task 7: Improve @kit/auth Branch Coverage

1. Review current test files to identify untested branches:
   - Run coverage locally: `pnpm --filter @kit/auth test:coverage`
   - Identify branch gaps (currently 46%)

2. Add branch-specific tests for:
   - Password validation edge cases (minimum length, special chars, etc.)
   - Email validation edge cases (various formats)
   - Schema parsing errors and error messages
   - Optional field handling
   - Custom error messages

3. Focus on server actions:
   - Test error scenarios
   - Test success paths
   - Test authentication flow
   - Test validation failures

4. Target: Achieve 75-80% branch coverage

**Rationale:** Branch coverage (46%) is significantly lower than line coverage (79%). Gap indicates untested edge cases in authentication logic.

### Task 8: Create Collection Tests for Payload

**Collection Test Pattern** (follow Users.ts which has 100% coverage as reference):

For each collection (starting with high-impact ones):

1. **Courses collection** (`collections/__tests__/Courses.test.ts`):
   - Test collection is properly configured
   - Test all field definitions exist
   - Test RLS policies are enforced
   - Test admin access restrictions
   - Test slug field generation
   - Test relationship to other collections
   - Test validation rules

2. **CourseLessons collection** (`collections/__tests__/CourseLessons.test.ts`):
   - Test parent-child relationship to Courses
   - Test lesson ordering
   - Test content field structure
   - Test status field validation
   - Test RLS policies

3. **QuizQuestions collection** (`collections/__tests__/QuizQuestions.test.ts`):
   - Test relationship to CourseQuizzes
   - Test answer options structure
   - Test correct answer marking
   - Test validation

4. **Remaining collections** (similar pattern for each):
   - CourseQuizzes, Documentation, Downloads, Media, Posts, Private, SurveyQuestions, Surveys
   - Focus on field types, relationships, and validation rules

**High-Impact Priority Order:**
1. Courses (foundational, 11% coverage gap)
2. CourseLessons (foundational, 34% coverage gap)
3. CourseQuizzes (foundational, 50% coverage gap)
4. Downloads, Media, Posts, Private (content collections)
5. Documentation, Surveys, SurveyQuestions (supplementary)

**Rationale:** Collections define the content structure. Tests verify configuration correctness and prevent schema drift.

### Task 9: Add Tests to Root vitest.config.mts

1. Update vitest.config.mts projects array to include:
   - `packages/next`
   - `packages/supabase`
   - Both need project configuration with node environment

2. Verify all projects are discoverable by Turbo

3. Test that `pnpm test:unit` discovers and runs all new tests

**Rationale:** Monorepo requires explicit project configuration for Vitest to discover tests.

### Task 10: Validation and Coverage Verification

1. Run full test suite:
   ```bash
   pnpm test:unit
   ```
   Verify all tests pass (should be 1300+ tests now)

2. Run coverage:
   ```bash
   pnpm test:coverage
   ```
   Verify coverage reports generated for all packages

3. Check coverage thresholds:
   - packages/next: Target 80%+ across all metrics
   - packages/supabase: Target 75%+ (complex mocking required)
   - @kit/auth: Target 75%+ branch coverage (up from 46%)
   - apps/payload: Individual collections should be 80%+

4. Verify no regressions:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm format:check
   ```

5. Run E2E tests to ensure integration still works:
   ```bash
   pnpm test:e2e
   ```

**Rationale:** Comprehensive validation ensures tests are correct and don't break existing functionality.

## Validation Commands

Execute every command in order to validate the chore is complete with zero regressions:

```bash
# 1. Type checking
pnpm typecheck

# 2. Lint and format
pnpm lint
pnpm format:check

# 3. Run all unit tests
pnpm test:unit

# 4. Generate and verify coverage reports
pnpm test:coverage

# 5. Verify specific package tests
pnpm --filter @kit/next test:coverage
pnpm --filter @kit/supabase test:coverage
pnpm --filter @kit/auth test:coverage
pnpm --filter payload test:coverage

# 6. Run E2E tests to verify integration
pnpm test:e2e

# 7. Build the entire project
pnpm build
```

**Success Criteria:**
- All unit tests pass (1300+ tests)
- No type errors from `pnpm typecheck`
- No lint errors from `pnpm lint`
- Coverage reports generated for all packages
- @kit/auth branch coverage: 75%+ (up from 46%)
- packages/next: 80%+ coverage
- packages/supabase: 75%+ coverage
- apps/payload collections: 80%+ coverage
- E2E tests pass (no integration breakage)
- Project builds successfully

## Notes

### Test Strategy

This chore uses a **targeted coverage approach**:

1. **packages/next** - Critical infrastructure, test all utility functions
2. **packages/supabase** - Complex mocking required, mock Supabase and environment
3. **@kit/auth** - Already has tests, improve branch coverage gaps
4. **Payload collections** - Schema and configuration validation tests

### Mocking Strategy

**packages/next tests:**
- Mock `server-only` (Next.js convention)
- Mock `next/navigation` for redirects
- Mock Supabase client for auth checks
- Mock captcha verification
- Use vi.mock() for all external dependencies

**packages/supabase tests:**
- Mock @supabase/ssr for client creation
- Mock next/cookies for cookie handling
- Mock environment variables
- Use dependency injection for testing
- Create test fixtures for common responses

**@kit/auth tests:**
- Reuse existing test patterns
- Focus on edge cases in validation
- Test error messages
- Mock Zod for complex scenarios

**Payload collections tests:**
- Use Payload test utilities if available
- Mock database operations
- Test collection configuration only
- Don't test Payload framework (already tested)

### Test File Organization

- Tests colocated with source (`__tests__` subdirectory)
- Naming convention: `{source-file}.test.ts`
- Setup files in `src/test/setup.ts`
- Mocks in `src/test/__mocks__/`
- Reuse test utilities across packages

### Coverage Targets

- **Line Coverage**: 80%+ for all packages
- **Branch Coverage**: 75%+ for all packages (currently 46% for auth)
- **Function Coverage**: 85%+ for all packages
- **Statement Coverage**: 80%+ for all packages

### Timeline Estimate

**No timeline provided** - See project principles: focus on what needs doing, not how long it takes.

Based on complexity, implementation might span multiple development cycles:
- Infrastructure setup (vitest config): Quick
- packages/next tests: 2-3 hours (2 utility modules)
- packages/supabase tests: 4-6 hours (complex mocking, 30+ modules)
- @kit/auth improvements: 2-3 hours (targeted branch gaps)
- Payload collections: 3-5 hours (11 collections)
- Validation: 1-2 hours (running full suite, verifying coverage)

**Total estimate: 12-20 hours of focused work** (can be parallelized across team)

### Implementation Notes

1. **Start with packages/next** - Simplest, cleanest setup
2. **Then packages/supabase** - More complex but patterns transfer from packages/next
3. **Then @kit/auth** - Reuses auth patterns, improves existing tests
4. **Then Payload collections** - Last because it touches fewer critical paths

This ordering ensures core infrastructure is tested before peripheral areas.

### Success Indicators

After completing this chore, you should be able to:
- Refactor packages/next with confidence (tests will catch regressions)
- Refactor authentication with confidence (auth tests prevent breakage)
- Onboard new team members with confidence (clear test examples)
- Deploy with confidence (core infrastructure is validated)
- Debug faster (failing tests pinpoint issues quickly)

### Known Challenges

1. **Mocking Supabase** - Complex because of cookie handling and SSR context
   - Solution: Create reusable mock factories
   - Reference: packages/features/auth test setup

2. **Payload collection testing** - Payload framework complexity
   - Solution: Focus on configuration, not framework functionality
   - Don't test Payload internals, only collection definitions

3. **Branch coverage gaps in auth** - May require refactoring to test all paths
   - Solution: Add edge case tests incrementally
   - Some branches may be unreachable or error-only

4. **Next.js mocking** - Requires careful setup for server-only code
   - Solution: Use established patterns from packages/features/auth
   - Mock at module level, not function level
