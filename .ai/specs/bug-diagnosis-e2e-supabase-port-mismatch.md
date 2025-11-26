# Bug Diagnosis: E2E Test Failures Due to Supabase Port/Key Mismatch

## Summary

E2E tests are failing en masse due to a configuration mismatch between the hardcoded Supabase settings in the test infrastructure and the actual running Supabase instance.

## Root Cause

**The test infrastructure uses hardcoded default Supabase settings (port 54321, demo keys) while the actual Supabase instance runs on port 54521 with unique generated keys.**

### Evidence

1. **Supabase actual configuration** (from `npx supabase status`):
   ```
   API URL: http://127.0.0.1:54521
   Database URL: postgresql://postgres:postgres@127.0.0.1:54522/postgres
   Publishable key: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
   Secret key: sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
   ```

2. **Test infrastructure hardcoded values** (from `infrastructure-manager.cjs:743-745`):
   ```javascript
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  // WRONG - should be 54521
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...demo key...  // WRONG - doesn't match
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...demo key...  // WRONG - doesn't match
   ```

3. **Direct verification**:
   - Health endpoint reports: `{"services":{"database":false}}`
   - Direct psql query to port 54522 succeeds with data
   - REST API query with actual keys succeeds: returns account data
   - REST API query with demo keys fails: `{"code":"PGRST301","message":"No suitable key or wrong key type"}`

### Affected Files

1. **`.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs`** (lines 743-745)
   - Creates default `.env.test` with wrong Supabase URL and demo keys

2. **`apps/e2e/tests/utils/e2e-validation.ts`** (line 23, 26)
   - Hardcodes fallback URL `http://127.0.0.1:54321` and demo anon key

3. **`apps/e2e/src/infrastructure/port-binding-verifier.ts`** (line 34)
   - References port 54321 as expected kong port

## Impact

- **6 of 10 E2E test shards failing**
- Health check endpoint reports database as unhealthy
- All tests requiring database access time out waiting for responses
- Browser crashes occur due to cascading test timeouts (120s × 3 retries)

## Failed Tests (Partial List)

- `healthcheck.spec.ts` - API healthcheck
- `team-billing.spec.ts` - Team billing with account selector
- `user-billing.spec.ts` - User billing verification
- `auth-simple.spec.ts` - Authentication flow
- `payload-connectivity.spec.ts` - Payload CMS connectivity

## Recommended Fix

### Option A: Dynamic Port/Key Detection (Recommended)

Update the infrastructure manager to dynamically fetch Supabase configuration:

```javascript
async function getSupabaseConfig() {
  const { execSync } = require('child_process');
  const status = execSync('cd apps/web && npx supabase status --output json', { encoding: 'utf-8' });
  const config = JSON.parse(status);
  return {
    url: config.API_URL,
    anonKey: config.ANON_KEY,
    serviceRoleKey: config.SERVICE_ROLE_KEY,
    databaseUrl: config.DB_URL
  };
}
```

### Option B: Use Consistent Port Configuration

Ensure `supabase/config.toml` specifies the expected port 54321 explicitly:

```toml
[api]
port = 54321
```

### Files to Update

1. `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs`
2. `apps/e2e/tests/utils/e2e-validation.ts`
3. `apps/e2e/src/infrastructure/port-binding-verifier.ts`
4. Any `.env.test` or `.env.test.locked` files with hardcoded values

## Verification Steps

After fix:
1. `curl http://localhost:3001/api/health` should return `{"services":{"database":true}}`
2. `pnpm test:shard1` should pass authentication tests
3. All 10 E2E shards should complete without timeout failures

## Related Commits

- `fae2efd14` - Recent change from auth.users to accounts table for health check
- `d6dfa1465` - Port alignment change for Payload CMS (3021)

## Priority

**HIGH** - All E2E tests are effectively blocked until this is resolved.

## Diagnosis Date

2025-11-25
