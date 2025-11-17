# Email Testing Strategy

## Problem

The CI/CD pipeline was failing because tests were attempting to fetch confirmation emails from a local
email service (Inbucket at 127.0.0.1:54324) when testing against the deployed dev environment
(dev.slideheroes.com). This is a fundamental incompatibility - the deployed environment doesn't have
access to a local email service.

## Industry Best Practices

Based on research from Auth0, Supabase, Firebase, and industry experts:

1. **NEVER test real email flows in CI/CD pipelines against deployed environments**
2. **Use mocked/sandboxed email services for testing**
3. **Real email testing should only happen locally or in controlled environments**

## Solution Implemented

### 1. Modified auth.po.ts

The `visitConfirmEmailLink` method now:

- Detects when running in CI against deployed environments
- Automatically skips email verification when `SKIP_EMAIL_VERIFICATION=true` or when CI + deployed URL detected
- Falls back gracefully without breaking tests
- Provides clear warnings about what's happening

### 2. Updated GitHub Workflow

The `dev-integration-tests.yml` workflow now:

- Sets `SKIP_EMAIL_VERIFICATION=true` environment variable
- Logs that email verification is being skipped
- Tests continue without attempting to fetch emails

### 3. Environment Detection Logic

```typescript
// Skip email verification when:
const shouldSkip = 
  process.env.SKIP_EMAIL_VERIFICATION === 'true' ||
  (process.env.CI === 'true' && isDeployedEnvironment);
```

## Testing Strategies by Environment

| Environment | Email Strategy | Implementation |
|------------|---------------|----------------|
| **Local Development** | Real (Inbucket) | Local Supabase includes Inbucket email service |
| **CI + Local** | Real (Inbucket) | Tests run against local Supabase |
| **CI + Deployed** | Skip | Email verification bypassed |
| **Manual Testing** | Real | Use actual email service |

## How to Test Different Scenarios

### Local Testing with Real Email

```bash
# Start local Supabase (includes Inbucket)
npx supabase start

# Run tests
pnpm --filter web-e2e test
```

### CI Testing (Email Skipped)

```bash
# Set environment variables
export CI=true
export SKIP_EMAIL_VERIFICATION=true
export BASE_URL=https://dev.slideheroes.com

# Run tests
pnpm --filter web-e2e test:integration
```

### Force Real Email Testing

```bash
# Only works with local environment
export FORCE_REAL_EMAIL=true
pnpm --filter web-e2e test
```

## Alternative Approaches (Not Implemented)

### Option 1: Mock Email Service (MailHog)

```yaml
services:
  mailhog:
    image: mailhog/mailhog:v1.0.1
    ports:
      - 1025:1025  # SMTP
      - 8025:8025  # Web UI
```

### Option 2: Test Email API (Mailosaur, MailSlurp)

- Requires paid service
- Adds external dependency
- More complex setup

### Option 3: Pre-confirmed Test Accounts

- Create test accounts with pre-confirmed emails
- Store credentials securely
- Reuse across test runs

## Recommendations

1. **For Most Projects**: Skip email verification in CI/CD tests
2. **For Email-Critical Apps**: Use dedicated email testing in separate workflow
3. **For Local Development**: Continue using Inbucket with Supabase

## Migration Guide

If you have tests that require email verification:

1. **Option A**: Skip them in CI

```typescript
test.skip(process.env.CI === 'true', 'Skipped in CI', async () => {
  // email-dependent test
});
```

1. **Option B**: Use pre-confirmed accounts

```typescript
const testAccount = {
  email: 'pre-confirmed@test.com',
  password: process.env.TEST_PASSWORD
};
```

1. **Option C**: Mock the email flow

```typescript
if (process.env.CI === 'true') {
  // Mock the confirmation
  await page.goto('/onboarding');
} else {
  // Real email flow
  await auth.visitConfirmEmailLink(email);
}
```

## Troubleshooting

### Tests Still Failing?

1. Ensure `SKIP_EMAIL_VERIFICATION=true` is set
2. Check that `CI=true` is set in workflow
3. Verify BASE_URL points to deployed environment

### Need Real Email Testing?

1. Run tests locally with Supabase
2. Or set up separate workflow with MailHog
3. Or use test email service (costs money)

## References

- [Auth0 Testing Best Practices](https://auth0.com/docs/best-practices/testing)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [MailHog Documentation](https://github.com/mailhog/MailHog)
- Industry research on email testing patterns
