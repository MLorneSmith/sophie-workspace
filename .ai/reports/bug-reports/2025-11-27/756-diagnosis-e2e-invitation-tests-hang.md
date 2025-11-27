# Bug Diagnosis: E2E Invitation Tests Hang Due to Missing Email Config and Infinite Retry Loop

**ID**: ISSUE-756
**Created**: 2025-11-27T19:15:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E shard 4 invitation tests hang indefinitely because: (1) the Docker test container is missing required email environment variables, preventing invitation emails from being sent to Mailpit, and (2) the `visitConfirmEmailLink` method has no timeout on its `toPass()` assertion, causing infinite retries when emails aren't found.

## Environment

- **Application Version**: dev branch (commit 0c8170449)
- **Environment**: development/test
- **Node Version**: 22
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown

## Reproduction Steps

1. Start Supabase and the test Docker containers
2. Run E2E shard 4: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
3. Observe the "Full Invitation Flow" test in `invitations.spec.ts`
4. Test hangs with repeated "Visiting mailbox {email}..." messages

## Expected Behavior

- Invitation emails should be sent to Mailpit via SMTP
- Email should be found in Mailpit within a reasonable timeout
- Test should fail with a clear error if email isn't found after timeout

## Actual Behavior

- No invitation emails are sent to Mailpit (0 messages in mailbox)
- Test loops infinitely printing "Visiting mailbox..." with no timeout
- Test must be manually killed

## Diagnostic Data

### Console Output
```
Running 13 tests using 3 workers
····×F××°°°·±°°°°×FInviting 4950739222726@slideheroes.com with role member...
Finding email to 4950739222726@slideheroes.com ...
Visiting mailbox 4950739222726@slideheroes.com ...
Visiting mailbox 4950739222726@slideheroes.com ...
[repeats indefinitely]
```

### Mailpit Status
```bash
$ curl -s "http://127.0.0.1:54524/api/v1/messages"
{"total":0,"unread":0,"count":0,"messages_count":0,"start":0,"tags":[],"messages":[]}
# Zero emails - nothing being delivered
```

### SMTP Connectivity Test
```bash
$ echo -e "EHLO test\nQUIT" | nc 127.0.0.1 54525
220 723741a0376a Mailpit ESMTP Service ready
# SMTP is working - the issue is emails aren't being sent
```

### Docker Container Email Config
```yaml
# docker-compose.test.yml (lines 45-48)
# Email configuration (override for Docker networking)
- EMAIL_HOST=host.docker.internal
- EMAIL_PORT=54525
# MISSING: EMAIL_SENDER, EMAIL_USER, EMAIL_PASSWORD, EMAIL_TLS, MAILER_PROVIDER
```

### Required vs Actual Environment Variables

| Variable | Required by | In docker-compose.test.yml |
|----------|-------------|---------------------------|
| EMAIL_HOST | nodemailer | ✅ Yes |
| EMAIL_PORT | nodemailer | ✅ Yes |
| EMAIL_SENDER | Zod validation | ❌ **MISSING** |
| EMAIL_USER | nodemailer auth | ❌ **MISSING** |
| EMAIL_PASSWORD | nodemailer auth | ❌ **MISSING** |
| EMAIL_TLS | nodemailer | ❌ **MISSING** |
| MAILER_PROVIDER | mailer registry | ❌ **MISSING** |

## Error Stack Traces

The invitation service fails silently due to Zod validation error when `EMAIL_SENDER` is missing:

```typescript
// packages/features/team-accounts/src/server/services/account-invitations-dispatcher.service.ts:15-31
const env = z
  .object({
    emailSender: z.string().min(1, { message: "EMAIL_SENDER is required" }),
    // ...
  })
  .parse({
    emailSender,  // undefined when env var is missing
    // ...
  });
```

## Related Code

- **Affected Files**:
  - `docker-compose.test.yml:45-48` - Missing environment variables
  - `apps/e2e/tests/authentication/auth.po.ts:279-283` - No timeout on toPass()
  - `apps/e2e/tests/utils/mailbox.ts:54-100` - visitMailbox method
  - `packages/features/team-accounts/src/server/services/account-invitations-dispatcher.service.ts` - Email sender validation

- **Recent Changes**:
  - `0c8170449` fix(e2e): correct test user and selector for admin tests
  - Docker compose was modified for port changes but email vars weren't added

- **Suspected Functions**:
  - `visitConfirmEmailLink()` - missing timeout
  - `sendInvitationEmail()` - fails silently when EMAIL_SENDER missing

## Related Issues & Context

### Direct Predecessors
- #749 (CLOSED): "Bug Fix: E2E Shard 4 Test Failures - Selector Mismatch and Ban User Error" - Same shard, different issue
- #747 (CLOSED): "Bug Diagnosis: E2E Shard 4 Remaining Failures" - Related diagnosis

### Similar Symptoms
- #739 (CLOSED): "Bug Fix: E2E Shard 4 Tests Timeout During Fresh Authentication" - Also timeout-related

### Historical Context
Multiple shard 4 issues have been addressed recently, but this invitation email issue appears to be a new discovery. The email configuration was likely never properly set up in the Docker container.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two compounding issues - missing email environment variables in Docker container AND missing timeout on email polling.

**Detailed Explanation**:

1. **Missing Docker Environment Variables**: The `docker-compose.test.yml` file only sets `EMAIL_HOST` and `EMAIL_PORT`, but the invitation email service requires `EMAIL_SENDER` (validated by Zod). When `EMAIL_SENDER` is missing, the Zod parse fails and emails are never sent.

2. **Infinite Retry Loop**: The `visitConfirmEmailLink` method in `auth.po.ts:279-283` uses `expect().toPass()` with no timeout:
   ```typescript
   return expect(async () => {
     const res = await this.mailbox.visitMailbox(email, params);
     expect(res).not.toBeNull();
   }).toPass();  // NO TIMEOUT - retries forever!
   ```

**Supporting Evidence**:
- Stack trace shows Zod validation requires `EMAIL_SENDER`
- Docker container inspection shows missing env vars
- Mailpit has 0 messages despite SMTP being accessible
- Test output shows infinite "Visiting mailbox..." loop

### How This Causes the Observed Behavior

1. Test invites a user via the UI form
2. Server action calls `sendInvitationEmail()`
3. Email service fails Zod validation (missing `EMAIL_SENDER`)
4. No email is sent to Mailpit
5. Test calls `visitConfirmEmailLink()`
6. `visitMailbox()` queries Mailpit API, finds no messages
7. Throws "Email body was not found" error
8. `toPass()` catches error and retries (no timeout)
9. Steps 6-8 repeat infinitely

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from Docker container environment inspection
- Mailpit API confirms zero emails delivered
- Code analysis shows exact missing timeout
- Zod schema explicitly requires `EMAIL_SENDER`

## Fix Approach (High-Level)

**Fix 1**: Add missing email environment variables to `docker-compose.test.yml`:
```yaml
- EMAIL_SENDER=test@slideheroes.com
- EMAIL_USER=user
- EMAIL_PASSWORD=password
- EMAIL_TLS=false
- MAILER_PROVIDER=nodemailer
```

**Fix 2**: Add timeout to `visitConfirmEmailLink` in `auth.po.ts`:
```typescript
return expect(async () => {
  const res = await this.mailbox.visitMailbox(email, params);
  expect(res).not.toBeNull();
}).toPass({
  timeout: 60000,  // 60 second timeout
  intervals: [1000, 2000, 5000, 10000, 15000]  // Backoff intervals
});
```

## Diagnosis Determination

The root causes are definitively identified:

1. **Missing Docker environment variables** - `EMAIL_SENDER`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`, and `MAILER_PROVIDER` must be added to `docker-compose.test.yml`

2. **Missing timeout on toPass()** - `visitConfirmEmailLink` needs a timeout to prevent infinite loops

Both fixes are required - the first enables email delivery, the second provides graceful failure handling.

## Additional Context

- Mailpit is correctly running and accepting SMTP connections on port 54525
- The `.env.test` file has all required variables, but Docker doesn't inherit them
- This issue affects all invitation-related E2E tests in shard 4

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (docker inspect, curl, nc), Read (docker-compose.test.yml, auth.po.ts, mailbox.ts), Grep, Task (context7-expert)*
