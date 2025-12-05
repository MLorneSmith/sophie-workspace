# Bug Diagnosis: E2E Tests Fail Due to Missing Email Configuration in Web App Test Environment

**ID**: ISSUE-721
**Created**: 2025-11-26T22:45:00Z
**Reporter**: user/test-execution
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

E2E tests that depend on email functionality (invitation flows, password reset, etc.) fail because the web application's test environment (`.env.test`) is missing required email configuration variables. The mailer requires `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`, and `MAILER_PROVIDER` to function, but only `EMAIL_HOST`, `EMAIL_PORT`, and `EMAIL_SENDER` are configured.

## Environment

- **Application Version**: dev branch (commit c529c025d)
- **Environment**: development (local Docker)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase)
- **Email Server**: Mailpit v1.22.3 (via Supabase Inbucket container)
- **Last Working**: Unknown (configuration issue)

## Reproduction Steps

1. Start local Supabase (`pnpm supabase:web:start`)
2. Start web app in test mode (`pnpm --filter web dev:test`)
3. Run E2E tests that send emails (`bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`)
4. Observe "Full Invitation Flow" test fails with "Email body was not found"

## Expected Behavior

When inviting a user to a team, the invitation email should be:
1. Sent via nodemailer to the local SMTP server (Mailpit on port 54525)
2. Stored in Mailpit's mailbox
3. Retrievable via Mailpit API (port 54524)

## Actual Behavior

- Emails are never sent
- Mailpit shows `Messages: 0` and `SMTPAccepted: 0`
- Tests timeout waiting for emails at `http://127.0.0.1:54524/api/v1/search`

## Diagnostic Data

### Email Infrastructure Status

```
Mailpit API: http://127.0.0.1:54524 - ONLINE
Mailpit SMTP: 127.0.0.1:54525 - ONLINE
Direct SMTP test: SUCCESS (email queued)

Mailpit Stats Before Tests:
- Messages: 0
- SMTPAccepted: 0

Mailpit Stats After Direct Test:
- Messages: 1
- SMTPAccepted: 1
```

### Environment Variable Comparison

**E2E `.env.local` (Complete):**
```
EMAIL_HOST=localhost
EMAIL_PORT=54525
EMAIL_USER=user
EMAIL_PASSWORD=password
EMAIL_TLS=false
EMAIL_SENDER=test@makerkit.dev
MAILER_PROVIDER=nodemailer
```

**Web App `.env.test` (Incomplete):**
```
EMAIL_HOST=127.0.0.1
EMAIL_PORT=54525
EMAIL_SENDER=test@slideheroes.com
# MISSING: EMAIL_USER, EMAIL_PASSWORD, EMAIL_TLS, MAILER_PROVIDER
```

### Test Output

```
Finding email to 1622691932214@slideheroes.com ...
Visiting mailbox 1622691932214@slideheroes.com ...
[... repeated 50+ times ...]
Error: Email body was not found
```

## Error Stack Traces

```
Error: Email body was not found

Call Log:
- Test timeout of 120000ms exceeded

   at authentication/auth.po.ts:283

  281 |
  282 |     expect(res).not.toBeNull();
> 283 |   }).toPass();
      |      ^
```

## Related Code

- **Affected Files**:
  - `apps/web/.env.test` - Missing email configuration
  - `packages/mailers/nodemailer/src/smtp-configuration.ts` - Requires EMAIL_USER, EMAIL_PASSWORD
  - `packages/mailers/shared/src/schema/smtp-config.schema.ts` - Defines required fields
  - `packages/features/team-accounts/src/server/services/account-invitations-dispatcher.service.ts` - Sends invitation emails

- **Suspected Functions**:
  - `getSMTPConfiguration()` in `smtp-configuration.ts:3-24`
  - `SmtpConfigSchema.parse()` in `smtp-config.schema.ts:5-19`

## Related Issues & Context

### Direct Predecessors
- #720 (CLOSED): "Bug Fix: E2E Shard 4 Tests Fail Due to Redundant Login Attempts" - Same shard, auth fix completed

### Same Component
- Tests in shard 4 (Admin & Invitations) that require email functionality

### Historical Context
The email configuration has been split between environment files. The E2E package has complete email config, but the web app's test environment only has partial config. This likely happened during test infrastructure setup or environment file refactoring.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The web app's `.env.test` file is missing required email environment variables (`EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`, `MAILER_PROVIDER`), causing the nodemailer service to either fail during initialization or not send emails.

**Detailed Explanation**:
The `SmtpConfigSchema` in `packages/mailers/shared/src/schema/smtp-config.schema.ts` requires these fields:
- `user` (from `EMAIL_USER`)
- `pass` (from `EMAIL_PASSWORD`)
- `host` (from `EMAIL_HOST`) - present
- `port` (from `EMAIL_PORT`) - present
- `secure` (from `EMAIL_TLS`)

When the web app runs in test mode, it loads `.env.test` which is missing `EMAIL_USER` and `EMAIL_PASSWORD`. The Zod schema validation either:
1. Fails silently, preventing the mailer from being configured
2. Throws an error that's caught somewhere, causing email sending to fail
3. Creates an invalid SMTP configuration that can't connect

Additionally, `MAILER_PROVIDER` may default to something other than `nodemailer` if not set.

**Supporting Evidence**:
- Direct SMTP test to port 54525 succeeded, proving the infrastructure works
- Mailpit shows 0 accepted SMTP connections during E2E tests
- E2E `.env.local` has complete config; web `.env.test` is incomplete
- `SmtpConfigSchema` has required `user` and `pass` fields with no defaults

### How This Causes the Observed Behavior

1. Web app starts with incomplete email config from `.env.test`
2. When invitation is created, `sendInvitationEmail()` is called
3. `getMailer()` returns a nodemailer instance
4. `getSMTPConfiguration()` parses environment variables
5. Zod schema fails validation due to missing `EMAIL_USER`/`EMAIL_PASSWORD`
6. Email is never sent to SMTP server
7. Mailpit receives no emails
8. Test polls mailbox API indefinitely
9. Test times out with "Email body was not found"

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Direct SMTP test proved the email infrastructure works
2. Env var comparison clearly shows missing required fields
3. Zod schema explicitly requires all fields with no defaults
4. The symptom (no emails in Mailpit) matches a configuration failure

## Fix Approach (High-Level)

Add the missing email configuration variables to `apps/web/.env.test`:

```
EMAIL_USER=user
EMAIL_PASSWORD=password
EMAIL_TLS=false
MAILER_PROVIDER=nodemailer
```

These are dummy values for local testing - Mailpit accepts any credentials. The fix ensures the web app's test environment has complete email configuration matching the E2E package's configuration.

## Diagnosis Determination

The root cause is definitively identified: **missing email environment variables in the web app's test environment**. The SMTP infrastructure is working (verified by direct test), but the web app cannot send emails because its nodemailer configuration is incomplete.

The fix is straightforward: add the missing `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`, and `MAILER_PROVIDER` variables to `apps/web/.env.test`.

## Additional Context

This issue blocks all E2E tests that depend on email functionality:
- Full Invitation Flow test (invitations.spec.ts)
- Password reset tests (if any)
- Email confirmation tests (if any)

The issue was discovered while investigating shard 4 test failures after fixing the auth timeout issue (#720).

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (curl, nc, grep, docker), Read (config files, source code), Grep (email patterns)*
