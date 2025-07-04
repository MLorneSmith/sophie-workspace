# E2E Tests

## Quick Start

```bash
# 1. Start Supabase (if not already running)
cd ../.. # Go to project root
npx supabase start

# 2. Run tests
cd apps/e2e
pnpm test:auth  # Run auth tests with setup
```

## Important: Email Delivery Fix

**The web app MUST load test environment variables for emails to work!**

The playwright config now automatically starts the web app with `pnpm dev:test` which loads `.env.test`. This ensures:

- Emails are sent to local Supabase (<http://127.0.0.1:54321>)
- Tests can access emails via Inbucket/Mailpit

### Manual Testing

If running the web app manually for debugging:

```bash
cd apps/web
pnpm dev:test  # NOT just 'pnpm dev'!
```

## Test Scripts

- `pnpm test` - Run all tests with retries
- `pnpm test:auth` - Run authentication tests with setup
- `pnpm test:quick` - Fail fast on first error
- `pnpm test:ui` - Open Playwright UI mode

## Troubleshooting

### Emails Not Arriving

1. Check web app is using test env:

   ```bash
   # Should show NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   curl http://localhost:3000/api/health
   ```

2. Check Inbucket for emails:

   ```bash
   # Count emails
   curl -s http://127.0.0.1:54324/api/v1/messages | jq '.messages | length'

   # View Inbucket UI
   open http://127.0.0.1:54324
   ```

3. Verify Supabase is running:

   ```bash
   npx supabase status
   ```

### OTP Expired Errors

The tests include retry logic for expired OTPs. If issues persist:

1. Check system time synchronization
2. Increase OTP timeout in Supabase dashboard (for local dev)

### Session Persistence Issues

The onboarding form now includes cache-busting to force middleware re-evaluation:

- Uses `window.location.href` with timestamp parameter
- Forces fresh session check on redirect

## Architecture

- **Page Objects**: `tests/authentication/auth.po.ts`
- **Mailbox Utility**: `tests/utils/mailbox.ts`
- **Config**: `playwright.config.ts`
- **Environment**: `.env.test` (loaded by `pnpm dev:test`)
