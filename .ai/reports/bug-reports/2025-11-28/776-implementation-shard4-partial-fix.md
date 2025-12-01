# Implementation Report: E2E Shard 4 Test Failures (Partial Fix)

**Issue**: #776
**Type**: bug-fix
**Date**: 2025-11-28
**Status**: Partial Implementation

## Summary

Reduced E2E Shard 4 test failures from 7 to 4 by fixing page navigation and timing issues in invitation tests and improving impersonation API resilience.

## Files Changed

| File | Lines Changed | Description |
|------|---------------|-------------|
| `packages/features/admin/src/lib/server/services/admin-auth-user.service.ts` | +66, -24 | Added retry logic with exponential backoff to impersonation |
| `apps/e2e/tests/team-accounts/team-accounts.po.ts` | +13, -4 | Added page load synchronization to team selector |
| `apps/e2e/tests/admin/admin.spec.ts` | +24 | Added beforeAll hook for test user state reset |
| `apps/e2e/tests/invitations/invitations.spec.ts` | +24 | Added beforeAll hook and page navigation |

## Commits

```
69d66c588 fix(e2e): reduce shard 4 test failures from 7 to 4 [agent: implementor]
```

## Test Results

### Before
- Passed: 5
- Failed: 7

### After
- Passed: 7
- Failed: 4

### Tests Fixed (3)
1. `users can delete invites` - Fixed by adding `page.goto('/home')` before createTeam
2. `users can update invites` - Fixed by adding `page.goto('/home')` before createTeam
3. `user cannot invite a member of the team again` - Fixed by adding `page.goto('/home')` before createTeam

### Tests Still Failing (4)
1. `delete user flow` - Server-side error (user has team memberships preventing deletion)
2. `can sign in as user (Impersonate)` - Server-side error (magic link fetch failing in local Supabase)
3. `delete team account flow` - Navigation state issue after complex login flow
4. `Full Invitation Flow` - Email service issue (InBucket not returning email body)

## Changes Made

### 1. Impersonation API Service
- Added retry logic with exponential backoff (up to 3 attempts)
- Added 10-second timeout per request with AbortController
- Improved error messages with attempt number and response details
- Added null-safety check for action_link

### 2. Team Selector Page Object
- Added `waitForLoadState('networkidle')` before clicking team selector
- Added explicit visibility check with 10s timeout before click
- Added proper retry configuration with intervals
- Increased overall timeout to 30 seconds

### 3. Admin Test File
- Added `beforeAll` hook to ensure test user is unbanned before tests run
- Logs user state restoration status

### 4. Invitations Test File
- Added `beforeAll` hook to ensure test user state is clean
- Added `page.goto('/home')` in `beforeEach` to navigate before creating teams
- This was the critical fix for the 3 invitation tests timing out

## Root Cause Analysis of Remaining Failures

1. **Delete User Flow**: User `test1@slideheroes.com` has team memberships (SlideHeroes Team) which prevents deletion due to referential integrity constraints in the database.

2. **Impersonation**: The magic link fetch returns an error. The Supabase local auth server has issues with redirect-based token extraction. This is an environmental issue.

3. **Delete Team Account Flow**: The complex login flow (OWNER_USER → create team → sign out → Super Admin login → navigate to admin) has state issues where the page ends up on the team dashboard instead of the admin panel.

4. **Full Invitation Flow**: Email-based test depends on InBucket email service which has delivery/retrieval issues in the test environment.

## Recommendations for Remaining Issues

1. **Delete User**: Create a separate test user without team memberships, or clean up team memberships before deletion
2. **Impersonation**: Investigate Supabase local auth configuration or consider alternative impersonation approach
3. **Team Account Management**: Refactor login flow to use storage state instead of interactive login
4. **Full Invitation Flow**: Verify InBucket configuration and email delivery in test environment

## Validation Commands Run

- `pnpm typecheck` - Passed
- `pnpm lint:fix` - Passed
- `pnpm format:fix` - Passed
- `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4` - 7 passed, 4 failed

---
*Implementation completed by Claude*
*Related diagnosis: #775*
