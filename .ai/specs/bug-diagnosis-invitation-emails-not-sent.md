# Bug Diagnosis: Invitation Emails Not Sent - Webhook Handler Disabled

**ID**: ISSUE-725
**Created**: 2025-11-27T14:15:00Z
**Reporter**: system (discovered during issue #723 verification)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Team invitation emails are never sent to invited users. When a team owner invites someone to join their team, the invitation is stored in the database but no email notification is sent. This completely breaks the invitation flow for teams since invited users have no way to know they've been invited.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development/test
- **Node Version**: v22.16.0
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Before upstream Makerkit v2.18.0 merge (commit 2e20d3e76)

## Reproduction Steps

1. Log in as a user who owns a team
2. Navigate to team members page (`/home/[account]/members`)
3. Click "Invite Members" and add an email address
4. Submit the invitation form
5. Check Mailpit inbox (`http://127.0.0.1:54524`)
6. Observe: No email is received

## Expected Behavior

When a team invitation is created:
1. Invitation is stored in the database
2. Invitation email is sent to the invited user's email address
3. Email contains a link to accept the invitation

## Actual Behavior

When a team invitation is created:
1. Invitation is stored in the database ✅
2. No email is sent ❌
3. Invited user has no way to accept the invitation

## Diagnostic Data

### Code Analysis

The invitation webhook handler is commented out in the database webhook router:

**File**: `packages/database-webhooks/src/server/services/database-webhook-router.service.ts:26-31`

```typescript
// NOTE: Upstream removed webhook handlers for invitations and accounts
// These cases are commented out until the functionality is reimplemented
// case "invitations": {
// 	const payload = body as RecordChange<typeof body.table>;
// 	return this.handleInvitationsWebhook(payload);
// }
```

### Git History Analysis

The webhook was disabled in commit `2e20d3e76`:

```
commit 2e20d3e76f7afd922bb1d542f60994fbb8f87ee6
Author: Giancarlo Buomprisco <giancarlopsk@gmail.com>
Date:   Sun Oct 5 17:54:16 2025 +0800

    2.18.0: New Invitation flow, refactored Database Webhooks, new ShadCN UI Components (#384)

    * Streamlined invitations flow
    * Removed web hooks in favor of handling logic directly in server actions
    * Added new Shadcn UI Components
```

### E2E Test Failure

E2E shard 4 "Full Invitation Flow" test fails because it waits for an invitation email that never arrives:

```
Finding email to 7342046071616@slideheroes.com ...
Visiting mailbox 7342046071616@slideheroes.com ...
Visiting mailbox 7342046071616@slideheroes.com ...
[...repeats indefinitely until timeout...]
```

## Error Stack Traces

No explicit errors - the code silently doesn't send emails because the webhook handler is disabled.

## Related Code

- **Affected Files**:
  - `packages/database-webhooks/src/server/services/database-webhook-router.service.ts` - Webhook routing (disabled)
  - `packages/features/team-accounts/src/server/services/account-invitations.service.ts` - Creates invitations but doesn't send emails
  - `packages/features/team-accounts/src/server/services/account-invitations-dispatcher.service.ts` - Email dispatch service (exists but never called)
  - `packages/features/team-accounts/src/server/actions/team-invitations-server-actions.ts` - Server action that should trigger emails

- **Recent Changes**:
  - Commit `2e20d3e76` intentionally removed webhook-based email sending
  - The commit message claims email logic was moved to server actions, but this was never implemented

- **Suspected Functions**:
  - `sendInvitations()` in `account-invitations.service.ts:132-209` - stores invitation but never calls dispatcher
  - `createInvitationsAction` in `team-invitations-server-actions.ts:22-45` - calls sendInvitations but doesn't send email

## Related Issues & Context

### Direct Predecessors
- #723 (CLOSED): "Bug Fix: Missing Email Configuration in Web App Test Environment" - Addressed email config, but discovered this deeper issue

### Same Component
- #722: Bug diagnosis for missing email configuration (led to discovery of this issue)

### Historical Context
The upstream Makerkit v2.18.0 release claims to have "removed web hooks in favor of handling logic directly in server actions", but the email dispatch logic was never actually added to the server action. This appears to be an incomplete migration from webhook-based to action-based email sending.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The invitation email dispatch logic was disabled when the webhook handler was commented out, but was never re-implemented in the server action as intended.

**Detailed Explanation**:

In the Makerkit v2.18.0 refactor (commit 2e20d3e76), the database webhook handler for invitations was disabled with the intention of moving email dispatch logic "directly into server actions". However, this migration was incomplete:

1. **Before**: Database INSERT trigger → Webhook endpoint → `handleInvitationsWebhook()` → `sendInvitationEmail()`
2. **After**: Server action → `sendInvitations()` → stores in database → **NO EMAIL SENT**

The `AccountInvitationsDispatchService` class still exists and is fully functional (`account-invitations-dispatcher.service.ts`), but it is never instantiated or called anywhere in the codebase.

**Supporting Evidence**:
- Webhook case statement is commented out at `database-webhook-router.service.ts:26-31`
- Comment explicitly states "Upstream removed webhook handlers for invitations and accounts"
- `sendInvitations()` method only calls `add_invitations_to_account` RPC, not the dispatcher
- `createAccountInvitationsDispatchService` has zero usages in the codebase
- E2E tests confirm no emails reach Mailpit inbox

### How This Causes the Observed Behavior

1. User submits invitation form
2. `createInvitationsAction` server action is triggered
3. Server action calls `sendInvitations()` on `AccountInvitationsService`
4. `sendInvitations()` validates and stores invitation in database via RPC
5. Database INSERT triggers webhook to `/api/db/webhook`
6. Webhook router receives event but `case "invitations"` is commented out
7. Webhook does nothing and returns
8. **No email is ever sent**

### Confidence Level

**Confidence**: High

**Reasoning**:
- Code path is clearly traceable
- Comments explicitly document the intentional disabling
- Git history shows the exact commit that disabled it
- E2E test failure confirms the symptom
- Dispatcher service exists but has no callers

## Fix Approach (High-Level)

Two options to fix this:

**Option A: Re-enable webhook handler** (Quick fix)
- Uncomment the `case "invitations"` in `database-webhook-router.service.ts`
- Verify or re-create the `@kit/team-accounts/webhooks` module if missing

**Option B: Add email dispatch to server action** (Aligned with original refactor intent)
- Modify `createInvitationsAction` to call `createAccountInvitationsDispatchService` after storing invitations
- The dispatcher service already exists and is fully functional
- This completes the migration that was started but never finished

Option B is recommended as it aligns with the original refactor intent and avoids the complexity of database triggers/webhooks.

## Diagnosis Determination

The root cause has been conclusively identified: The invitation email webhook handler was intentionally disabled during the Makerkit v2.18.0 refactor, but the replacement server-action-based email dispatch was never implemented. The dispatcher service exists and is functional, but no code calls it.

## Additional Context

- Email configuration (EMAIL_USER, EMAIL_PASSWORD, EMAIL_TLS, MAILER_PROVIDER) was fixed in issue #723 and is correct
- SMTP connectivity is working (verified via port 54525 connection test)
- Mailpit is running and accessible at port 54524
- The only missing piece is calling the dispatcher service when invitations are created

---
*Generated by Claude Debug Assistant*
*Tools Used: Git log, grep, file read, GitHub CLI issue search*
