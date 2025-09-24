# Debug Tests Directory

This directory contains debug, experimental, and workaround tests that are excluded from the main test suite execution.

## Files in this directory

- **auth-debug.spec.ts** - Debug test for authentication page selectors
- **account-debug.spec.ts** - Debug test for account functionality
- **admin-mfa-fix.spec.ts** - Temporary MFA workaround test
- **admin-workaround.spec.ts** - Admin access workaround test
- **test-admin-simple.spec.ts** - Simplified admin test for debugging

## Running debug tests

These tests are not included in CI/CD shards but can be run manually:

```bash
# Run a specific debug test
npx playwright test tests/debug/auth-debug.spec.ts

# Run all debug tests
npx playwright test tests/debug/
```

## Note

These tests should NOT be included in production test runs as they may:

- Use hardcoded values
- Skip proper authentication flows
- Be incomplete or experimental
- Serve debugging purposes only
