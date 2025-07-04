# Supabase Local Development Autoconfirm Issue

## Problem

The E2E tests are failing because:
1. Supabase local development has `GOTRUE_MAILER_AUTOCONFIRM=true` hardcoded
2. Tests expect confirmation emails to be sent to Inbucket/Mailpit
3. With autoconfirm enabled, no emails are sent - users are automatically confirmed

## Root Cause

When running `npx supabase start`, the auth container is configured with:
```
GOTRUE_MAILER_AUTOCONFIRM=true
```

This means:
- Sign-ups are automatically confirmed without sending emails
- Users are immediately logged in after registration
- No confirmation emails are sent to the local email testing service

## Solution Implemented

Updated the E2E tests to handle both scenarios:

1. **auth.spec.ts**: Modified to check if user is redirected to onboarding after signup
   - If redirected to `/onboarding` → autoconfirm is enabled
   - If stays on auth page → email confirmation required

2. **auth.po.ts**: Updated `visitConfirmEmailLink` to detect local environment
   - Checks if running against local Supabase (127.0.0.1:54321)
   - Skips email waiting if already redirected to onboarding

## How to Run Tests

```bash
# Start Supabase (if not already running)
npx supabase start

# Run E2E tests
cd apps/e2e
pnpm test:auth

# Or run with debug output
DEBUG=1 pnpm test tests/authentication/auth.spec.ts
```

## Alternative Solutions

1. **Custom Docker Compose**: Create a custom docker-compose.yml with `GOTRUE_MAILER_AUTOCONFIRM=false`
2. **Mock Email Service**: Implement a mock email service for tests
3. **Supabase Test Helpers**: Use Supabase's built-in test helpers to bypass email confirmation

## Status

- Tests now handle autoconfirm gracefully
- No longer wait for emails that won't arrive
- Compatible with both local (autoconfirm) and production (email) environments