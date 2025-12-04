# Chore: Refresh Expired Stripe CLI Keys

## Chore Description

The Stripe CLI keys configured on this development machine have expired. The keys expired on **2025-11-23** (10 days ago), which blocks local development and testing of billing features. This chore involves re-authenticating with Stripe via the CLI and updating the local environment files with fresh test mode credentials.

**Current State:**
- Stripe CLI version: 1.21.10 (installed and working)
- Linked account: "SlideHeroes (New)" (`acct_1PQf43S8mvjG8zYV`)
- Device name: SlideHeroesDen
- Key expiration: 2025-11-23 (EXPIRED)

**Required Environment Variables:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Public key for client-side Stripe.js
- `STRIPE_SECRET_KEY` - Server-side API key for Stripe operations
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification secret

## Relevant Files

Use these files to resolve the chore:

### Environment Files
- `apps/web/.env.local` - Primary location for local development secrets (gitignored). This is where `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` should be stored.
- `apps/web/.env.development` - Development-specific config. Contains placeholder for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- `apps/e2e/.env.local` - E2E test environment. May need Stripe publishable key for billing tests.

### Stripe Package Files
- `packages/billing/stripe/src/schema/stripe-server-env.schema.ts` - Zod validation schema for server-side Stripe env vars.
- `packages/billing/stripe/src/services/stripe-sdk.ts` - Stripe SDK initialization using env vars.
- `packages/billing/stripe/package.json` - Contains `start` script for webhook listener via Docker.

### CLI Configuration
- `~/.config/stripe/config.toml` - Stripe CLI configuration file (system-level, not in repo).

## Impact Analysis

This chore affects local development capability for all billing-related features.

### Dependencies Affected
- `@kit/stripe` package - Cannot make API calls without valid keys
- Billing integration tests - Cannot run without webhook listener
- Checkout flow development - Blocked until keys refreshed
- Subscription management features - Blocked until keys refreshed

### Risk Assessment
**Low Risk** - This is a straightforward credential refresh operation:
- No code changes required
- Only affects local development environment
- Keys are stored in gitignored files
- No database migrations or schema changes
- Easily reversible

### Backward Compatibility
No backward compatibility concerns. This chore only updates local environment credentials and does not change any code, APIs, or interfaces.

## Pre-Chore Checklist

Before starting implementation:
- [ ] Verify you have access to the SlideHeroes Stripe dashboard
- [ ] Confirm the correct Stripe account is selected (SlideHeroes (New))
- [ ] Ensure Docker is running (required for webhook listener)
- [ ] Have access to modify `apps/web/.env.local`

## Documentation Updates Required

No documentation updates required. This is a local environment refresh operation.

- [ ] Optionally update `CLAUDE.md` if any Stripe setup instructions need clarification

## Rollback Plan

If something goes wrong:
1. **Invalid keys**: Re-run `stripe login` to get fresh keys
2. **Wrong account**: Use `stripe config --list` to verify account, then `stripe login` again if needed
3. **Webhook issues**: Stop and restart the webhook listener with `pnpm stripe:listen`

No database migrations or code changes, so no complex rollback needed.

## Step by Step Tasks

### Step 1: Verify Current Stripe CLI Status

- Run `stripe --version` to confirm CLI is installed
- Run `stripe config --list` to see current configuration and confirm expiration

### Step 2: Re-authenticate with Stripe CLI

- Run `stripe login` to initiate re-authentication
- This will open a browser to the Stripe dashboard for authorization
- Confirm you're logging into the "SlideHeroes (New)" account
- Wait for CLI to confirm successful authentication

### Step 3: Verify New Keys

- Run `stripe config --list` to confirm new keys were generated
- Verify the new expiration date is in the future (should be ~90 days from now)
- Note the new `test_mode_api_key` and `test_mode_pub_key` values

### Step 4: Update Environment Files

- Open `apps/web/.env.local` for editing
- Add or update the following variables with the new test mode keys:
  ```bash
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # from stripe config --list
  STRIPE_SECRET_KEY=sk_test_... # from stripe config --list
  STRIPE_WEBHOOK_SECRET=whsec_... # will be generated in Step 5
  ```

### Step 5: Start Webhook Listener and Get Webhook Secret

- Run `pnpm stripe:listen` to start the webhook forwarder
- This runs via Docker and forwards webhooks to `localhost:3000/api/billing/webhook`
- Copy the webhook signing secret displayed in the output (starts with `whsec_`)
- Update `STRIPE_WEBHOOK_SECRET` in `apps/web/.env.local` with this value

### Step 6: Verify Integration

- Start the development server with `pnpm dev`
- Navigate to a page that loads Stripe (billing settings or checkout)
- Check browser console for any Stripe.js errors
- Verify no server-side errors related to Stripe in terminal output

### Step 7: Run Validation Commands

Execute the validation commands below to confirm everything is working.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Verify Stripe CLI authentication is valid
stripe config --list

# 2. Verify environment file has required variables (check they exist, don't expose values)
grep -E "^(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)=" apps/web/.env.local | wc -l
# Expected output: 3 (all three variables present)

# 3. Validate environment schema (if generator available)
pnpm env:validate

# 4. Run typecheck to ensure no type errors
pnpm typecheck

# 5. Test that web app starts without Stripe-related errors
timeout 30 pnpm --filter web dev 2>&1 | grep -i "stripe" || echo "No Stripe errors found"
```

## Notes

- **Key Expiration**: Stripe CLI keys typically expire after 90 days. Consider setting a calendar reminder to refresh before expiration.
- **Docker Requirement**: The webhook listener (`pnpm stripe:listen`) uses Docker. Ensure Docker Desktop is running before starting.
- **Multiple Stripe Accounts**: The CLI config confirmed only one account is linked ("SlideHeroes (New)"). No account switching needed.
- **Test vs Live Mode**: Only test mode keys should be used for local development. Never put live keys in local env files.
- **Webhook URL**: The webhook listener forwards to `http://host.docker.internal:3000/api/billing/webhook` - this is the Docker-compatible URL for localhost.
