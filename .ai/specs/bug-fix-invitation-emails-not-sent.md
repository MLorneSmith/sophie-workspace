# Bug Fix: Invitation Emails Not Sent

**Related Diagnosis**: #725 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Invitation email webhook handler was disabled in Makerkit v2.18.0 refactor without completing the migration to server actions
- **Fix Approach**: Add email dispatch to the `createInvitationsAction` server action using the existing `createAccountInvitationsDispatchService`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Team invitation emails are never sent to invited users. When a team owner invites someone to join their team, the invitation is stored in the database but no email notification is sent. This completely breaks the team invitation flow.

The root cause is that the invitation email webhook handler was disabled during a refactor (commit `2e20d3e76`) with the intention of moving email dispatch "directly into server actions". However, this migration was incomplete—the email dispatch was never added to the server action.

For full details, see diagnosis issue #725.

### Solution Approaches Considered

#### Option 1: Add email dispatch to server action ⭐ RECOMMENDED

**Description**: Call the existing `createAccountInvitationsDispatchService.sendInvitationEmail()` within the `createInvitationsAction` server action after successfully storing invitations in the database.

**Pros**:
- Aligns with the original refactor intent (move email to server actions)
- Uses existing, fully functional dispatcher service
- Minimal code changes (2-3 lines of code)
- No new dependencies required
- Maintains separation of concerns: server action handles request, service handles email dispatch
- Low risk—only affects invitation email flow

**Cons**:
- Email is now synchronous with the action (if dispatcher is slow, action is slow)
- No built-in retry mechanism if email dispatch fails

**Risk Assessment**: low - The dispatcher service exists and is production-ready. Only adding a single function call to an existing server action.

**Complexity**: simple - Straightforward function call integration.

#### Option 2: Re-enable the webhook handler

**Description**: Uncomment the webhook handler for invitations in `database-webhook-router.service.ts` and restore the original webhook flow.

**Pros**:
- Returns to original design pattern
- Email dispatch is async (decoupled from user action)
- Original retry mechanisms may be available

**Cons**:
- Contradicts the refactor intent (which explicitly moved away from webhooks)
- Requires restoring webhook infrastructure that was deliberately disabled
- More complex to understand the webhook flow
- May conflict with existing webhook patterns for other features

**Why Not Chosen**: The Makerkit v2.18.0 refactor explicitly moved away from webhooks for a reason. Re-enabling contradicts this architecture decision. The recommended approach is cleaner and more aligned with current patterns.

#### Option 3: Implement async email dispatch with queue

**Description**: Create a background job queue (Bull, RabbitMQ, or similar) to handle email dispatch asynchronously.

**Why Not Chosen**: Over-engineered for this use case. The immediate fix is straightforward—add a function call. A queue system can be added later if performance becomes a concern with high-volume invitations.

### Selected Solution: Add email dispatch to server action

**Justification**: This approach directly completes the incomplete migration from webhooks to server actions. It's minimal, uses existing infrastructure, and aligns with the platform's current architecture. The risk is extremely low because we're only adding a function call to an existing service.

**Technical Approach**:
- Call `createAccountInvitationsDispatchService` after successful invitation creation
- Pass the created invitations to `sendInvitationEmail()`
- Handle any errors in email dispatch (log and continue, or throw to user)
- No schema or database changes needed

**Architecture Changes**: None. This is an internal implementation detail within the server action layer.

**Migration Strategy**: Not needed—this is a pure bug fix with no data migration.

## Implementation Plan

### Affected Files

- `packages/features/team-accounts/src/server/actions/team-invitations-server-actions.ts` - Add email dispatch after storing invitations
- No other files need modification

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Understand the invitation flow

Verify the current state:
- Read `team-invitations-server-actions.ts` to understand the `createInvitationsAction` implementation
- Read `account-invitations.service.ts` to understand the dispatcher service
- Verify `createAccountInvitationsDispatchService` exists and is properly exported

**Why this step first**: Understanding the code flow ensures we make correct changes without breaking existing logic.

#### Step 2: Add email dispatch to the server action

Modify `createInvitationsAction` in `team-invitations-server-actions.ts`:

- After successfully creating invitations in the database, call `createAccountInvitationsDispatchService(client).sendInvitationEmail(invitations)`
- Handle errors from email dispatch:
  - Option A: Log error and continue (invitations created, email failed)
  - Option B: Throw error to user (invitations created, but user can retry)
- Use the same Supabase client instance passed to the action

**Specific subtasks**:
1. Import `createAccountInvitationsDispatchService` from the services module
2. After the `createInvitationsService().createInvitations()` call succeeds, instantiate the dispatcher
3. Call `sendInvitationEmail()` with the created invitations
4. Add error handling (logging recommended)

#### Step 3: Verify the dispatcher service

Ensure the dispatcher service:
- Takes invitations as input
- Sends emails for each invitation
- Handles errors gracefully
- Returns success/failure status

If the service needs fixes, address them first before integrating.

#### Step 4: Add/update tests

Create comprehensive tests to ensure the fix works:

- Add unit test to verify `sendInvitationEmail()` is called when invitations are created
- Add unit test to verify emails are sent with correct data (email address, etc.)
- Add E2E test to verify the full invitation flow sends emails
- Verify no regressions in existing invitation tests

**Specific scenarios**:
- Single invitation creates and sends email
- Multiple invitations create and send emails
- Invalid email addresses are handled gracefully
- Email dispatch errors don't prevent invitations from being created
- Original bug (no email sent) is resolved

#### Step 5: Validation

Run all validation commands (see Validation Commands section) to ensure:
- Code passes type checking
- Code passes linting
- All tests pass
- No regressions
- The bug is fixed (E2E test should now pass)

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `createInvitationsAction` calls `sendInvitationEmail()` after creating invitations
- ✅ Email service receives correct invitation data (email address, invite link, etc.)
- ✅ Invitations are created even if email dispatch fails (resilience test)
- ✅ Email dispatch errors are logged appropriately
- ✅ Regression test: Original bug should not reoccur (invitations create AND email is sent)

**Test files**:
- `packages/features/team-accounts/src/server/actions/__tests__/team-invitations-server-actions.spec.ts` - Unit tests for the server action
- `packages/features/team-accounts/src/server/services/__tests__/account-invitations.service.spec.ts` - Unit tests for the dispatcher service (if not already present)

### Integration Tests

- ✅ Create invitation via server action and verify email is queued/sent in the email service
- ✅ Mock Supabase database and dispatcher service to test the full flow

**Test files**:
- `packages/features/team-accounts/src/server/actions/__tests__/team-invitations-integration.spec.ts` - Integration tests

### E2E Tests

This is the critical test that was failing:

- ✅ "Full Invitation Flow" test in `apps/e2e/tests/features/team-invitations.spec.ts`
  - Log in as team owner
  - Navigate to members page
  - Invite a user
  - Verify invitation is created in database
  - **Verify email is received in Mailpit**
  - Accept invitation and verify member is added

**Test files**:
- `apps/e2e/tests/features/team-invitations.spec.ts` - E2E tests (shard 4)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start local development environment with Mailpit
- [ ] Log in as a team owner
- [ ] Navigate to team members page (`/home/[account]/members`)
- [ ] Click "Invite Members" and add a valid email address
- [ ] Submit the invitation form
- [ ] **CHECK MAILPIT INBOX** - verify invitation email is received with:
  - Correct recipient email
  - Invitation link that works
  - Proper formatting and content
- [ ] Click the invitation link and verify the acceptance flow works
- [ ] Verify the invited user is now a team member
- [ ] Test edge case: invite with invalid email (should fail gracefully)
- [ ] Test edge case: invite existing member (should be prevented or handled)
- [ ] Check browser console for no new errors
- [ ] Verify no unrelated features are broken (test other team features)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Email dispatch may fail silently**: If `sendInvitationEmail()` throws an error, invitations are created but users don't know email wasn't sent.
   - **Likelihood**: low (service is well-tested)
   - **Impact**: medium (users won't receive invitations)
   - **Mitigation**: Add proper error handling (log errors, consider surfacing to user via toast/message)

2. **Performance degradation**: If email dispatch is slow, the server action will be slow.
   - **Likelihood**: low (email dispatch should be quick)
   - **Impact**: low (adds latency to a non-critical operation)
   - **Mitigation**: Monitor action performance; if needed, switch to async queue in future

3. **Email service dependency**: If email service is down, invitations fail.
   - **Likelihood**: low (service has uptime SLAs)
   - **Impact**: high (invitations blocked)
   - **Mitigation**: Error handling allows invitations to be created; user can retry or use alternate communication

4. **Double emails**: If email dispatch is called multiple times, users might receive duplicate emails.
   - **Likelihood**: very low (only one call per action execution)
   - **Impact**: low (annoying but not breaking)
   - **Mitigation**: Ensure service is idempotent; test thoroughly

**Rollback Plan**:

If this fix causes issues in production:

1. Revert the commit that added email dispatch to the server action
2. Emails will stop being sent (back to current state)
3. Invitations will continue to be created (no data loss)
4. Investigate the error and redeploy with fix

**Monitoring** (if needed):

- Monitor email dispatch error rate for first 24 hours post-deployment
- Watch for user complaints about missing invitation emails
- Check Mailpit (dev) and email service logs for failures

## Performance Impact

**Expected Impact**: minimal

The fix adds a single function call to send emails. Email dispatch is fast (typically <1s). No database queries are added. No new dependencies are introduced.

**Performance Testing**:

- Measure action execution time before and after fix
- Benchmark email dispatch latency
- Ensure invitations can still be created at scale

## Security Considerations

**Security Impact**: none

This fix doesn't change authentication, authorization, or data handling. It only restores the intended behavior (sending emails when invitations are created).

- No new user input is processed
- No new database queries are made
- No new API calls are made (email service already exists)
- RLS policies are not changed
- No security review needed

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the failing E2E test
pnpm --filter @kit/e2e test:shard 4 -- team-invitations

# Expected Result: Test times out waiting for email in Mailpit
```

**Expected Result**: The "Full Invitation Flow" test will timeout because no email is sent.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix
pnpm format:fix

# Unit tests for team invitations
pnpm --filter team-accounts test -- team-invitations-server-actions

# Integration tests
pnpm --filter team-accounts test -- team-invitations-integration

# E2E tests (shard 4 specifically)
pnpm --filter @kit/e2e test:shard 4 -- team-invitations

# Full test suite (to ensure no regressions)
pnpm test

# Build
pnpm build
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions.

### Regression Prevention

```bash
# Run full E2E test suite to ensure no regressions
pnpm --filter @kit/e2e test

# Run full team-accounts tests
pnpm --filter team-accounts test

# Run all unit tests
pnpm test:unit

# Type checking across all packages
pnpm typecheck
```

## Dependencies

### New Dependencies

**No new dependencies required**

The `createAccountInvitationsDispatchService` already exists in the codebase and is fully functional. No npm packages need to be added.

### Existing Dependencies Used

- Supabase client (already in use)
- Logger from `@kit/shared/logger` (for error logging)

## Database Changes

**No database changes required**

This is purely a code fix. No schema changes, migrations, or data updates are needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required.

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained. This fix restores the intended behavior without changing any APIs or data structures.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (E2E test passes)
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] Email is sent when invitations are created
- [ ] Manual testing checklist is complete
- [ ] Performance is acceptable (no noticeable slowdown)

## Notes

**Related Issues**: #722, #723 (blocked by this fix)

**Context**: The Makerkit v2.18.0 refactor (commit `2e20d3e76`) moved away from webhook-based email dispatch to server-action-based dispatch. However, the email dispatch was never added to the server actions, leaving the feature broken.

**Service Location**: `createAccountInvitationsDispatchService` is located in `packages/features/team-accounts/src/server/services/account-invitations.service.ts`

**Server Action Location**: `createInvitationsAction` is located in `packages/features/team-accounts/src/server/actions/team-invitations-server-actions.ts`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #725*
