# Bug Diagnosis: Staging Deploy E2E Tests Failing Due to Missing Environment Variables

**ID**: ISSUE-1825
**Created**: 2026-01-26T18:50:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `Deploy to Staging` workflow E2E matrix tests are failing because the `test-shards` job is missing critical environment variables and configuration steps that are present in the working `E2E Tests (Sharded)` workflow. This causes authentication tests, Payload CMS tests, and other E2E tests to fail due to missing credentials, database configuration, and JWT key exports.

## Environment

- **Application Version**: dev branch (commit 681846f97)
- **Environment**: CI (GitHub Actions staging-deploy workflow)
- **Workflow Run**: 21368444612
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (workflow appears to have been failing consistently)

## Reproduction Steps

1. Trigger the `Deploy to Staging` workflow (push to staging branch or scheduled run)
2. Observe the E2E Shard jobs (1-6+) fail at "Run E2E tests for shard X" step
3. Compare configuration with the working `E2E Tests (Sharded)` workflow

## Expected Behavior

E2E tests should pass in the staging-deploy workflow, similar to how they pass in the e2e-sharded workflow.

## Actual Behavior

Multiple E2E shards (1, 2, 3, 4, 5, 6) fail at the "Run E2E tests for shard X" step. The workflow run shows all failed shards exiting with code 1.

## Diagnostic Data

### Console Output
```
JOBS
X E2E Shard 3 in 5m6s (ID 61507373573)
X E2E Shard 4 in 5m37s (ID 61507373588)
X E2E Shard 6 in 5m22s (ID 61507373591)
X E2E Shard 1 in 4m39s (ID 61507373594)
X E2E Shard 2 in 4m33s (ID 61507373620)
X E2E Shard 5 in 5m18s (ID 61507373645)

ANNOTATIONS
X Process completed with exit code 1.
```

### Configuration Comparison

**e2e-sharded workflow (WORKING):**
```yaml
env:
  SUPABASE_URL: 'http://127.0.0.1:54521'
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54521'
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:54522/postgres'
  DATABASE_URI: 'postgresql://postgres:postgres@localhost:54522/postgres'
  SUPABASE_DB_WEBHOOK_SECRET: 'test_webhook_secret'
  STRIPE_SECRET_KEY: 'sk_test_dummy'
  STRIPE_WEBHOOK_SECRET: 'whsec_test_dummy'
  NEXT_PUBLIC_BILLING_PROVIDER: 'stripe'
  PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3021'
  PAYLOAD_SECRET: 'test_payload_secret_for_e2e_testing'
  NODE_ENV: 'test'
  EMAIL_SENDER: 'noreply@slideheroes.com'
  E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
  E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
  E2E_OWNER_EMAIL: ${{ secrets.E2E_OWNER_EMAIL }}
  E2E_OWNER_PASSWORD: ${{ secrets.E2E_OWNER_PASSWORD }}
  E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
  E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
```

**staging-deploy workflow (FAILING):**
```yaml
env:
  NODE_ENV: 'test'
  NEXT_PUBLIC_SITE_URL: http://localhost:3001
  NEXT_PUBLIC_PRODUCT_NAME: SlideHeroes
  NEXT_PUBLIC_CI: true
  EMAIL_SENDER: noreply@slideheroes.com
  SUPABASE_DB_WEBHOOK_SECRET: ${{ secrets.SUPABASE_DB_WEBHOOK_SECRET }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
  STRIPE_WEBHOOK_SECRET: 'whsec_test_dummy'
  ENABLE_BILLING_TESTS: true
  DO_NOT_TRACK: 1
  PLAYWRIGHT_BASE_URL: http://localhost:3001
  # MISSING: SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, DATABASE_URL, DATABASE_URI
  # MISSING: E2E_TEST_USER_*, E2E_OWNER_*, E2E_ADMIN_* credentials
  # MISSING: NEXT_PUBLIC_BILLING_PROVIDER, PAYLOAD_PUBLIC_SERVER_URL, PAYLOAD_SECRET
```

### Missing Steps in staging-deploy

1. **Missing Payload CMS migrations step:**
   ```yaml
   # Present in e2e-sharded, missing in staging-deploy:
   - name: Run Payload CMS migrations
     run: |
       pnpm --filter payload payload migrate --forceAcceptWarning
     env:
       DATABASE_URI: postgresql://postgres:postgres@localhost:54522/postgres
       PAYLOAD_SECRET: test_payload_secret_for_e2e_testing
   ```

2. **Missing E2E_ prefixed environment variable exports:**
   ```yaml
   # Present in e2e-sharded, missing in staging-deploy:
   echo "E2E_SUPABASE_ANON_KEY=$ANON_KEY" >> $GITHUB_ENV
   echo "E2E_SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> $GITHUB_ENV
   echo "E2E_LOCAL_SUPABASE=true" >> $GITHUB_ENV
   ```

3. **Different Supabase key extraction method:**
   - e2e-sharded uses: `eval "$(supabase status -o env)"` (reliable)
   - staging-deploy uses: `npx supabase status | grep ... | awk ...` (fragile)

## Related Issues & Context

### Direct Predecessors
- Issue #1626 - E2E Sharded Workflow Environment Variable Naming Mismatch (E2E_ prefix requirement)
- Issue #1636/1637 - E2E test user credentials requirement
- Issue #1813/1814 - Payload CMS migrations requirement for E2E tests

### Infrastructure Issues
- Issue #1641/1642 - E2E Sharded Workflow Dual Failure Modes (RunsOn issues)
- Issue #1709/1710 - RunsOn labels caused matrix jobs to not be created

### Historical Context
The e2e-sharded workflow has had numerous fixes applied to it over time (evidenced by extensive comments referencing issues), but the staging-deploy workflow was not updated to include these fixes.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `staging-deploy` workflow's `test-shards` job is missing critical environment variables and configuration steps that are required for E2E tests to authenticate users and connect to databases.

**Detailed Explanation**:
The staging-deploy workflow was created or updated separately from the e2e-sharded workflow and does not include the numerous bug fixes that were applied to e2e-sharded over time. Specifically:

1. **Missing E2E test credentials**: Without `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_OWNER_*`, and `E2E_ADMIN_*` credentials, authentication tests cannot log in users.

2. **Missing E2E Supabase keys**: Without `E2E_SUPABASE_ANON_KEY`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, and `E2E_LOCAL_SUPABASE=true`, the test code falls back to hardcoded HS256 keys, but Supabase uses ES256 keys, causing JWT validation errors.

3. **Missing database configuration**: Without `DATABASE_URL` and `DATABASE_URI`, Payload CMS tests cannot connect to the database.

4. **Missing Payload migrations**: Without running Payload CMS migrations, tests fail with "relation payload.users does not exist".

5. **Fragile Supabase key extraction**: Using grep/awk parsing is less reliable than `eval "$(supabase status -o env)"`.

**Supporting Evidence**:
- Workflow comparison shows clear configuration gaps
- e2e-sharded workflow has extensive comments documenting why each variable is needed
- Referenced issues (#1626, #1636, #1637, #1813, #1814) document the failures that occur without these configs

### How This Causes the Observed Behavior

1. Test runs start successfully (Supabase starts, app starts)
2. Tests attempt to authenticate users using credentials from `E2E_*` environment variables
3. Variables are undefined, causing authentication failures
4. Tests attempt database operations but lack proper connection strings
5. All shards fail with exit code 1

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct comparison of working (e2e-sharded) vs failing (staging-deploy) workflows shows clear gaps
- The e2e-sharded workflow has extensive comments explaining why each configuration is needed
- The missing configurations match known issues that were previously fixed in e2e-sharded

## Fix Approach (High-Level)

Synchronize the `staging-deploy` workflow's `test-shards` job configuration with the `e2e-sharded` workflow by:

1. Add missing environment variables to the `test-shards` job env block:
   - `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`
   - `DATABASE_URL`, `DATABASE_URI`
   - `E2E_TEST_USER_*`, `E2E_OWNER_*`, `E2E_ADMIN_*` credentials from secrets
   - `NEXT_PUBLIC_BILLING_PROVIDER`, `PAYLOAD_PUBLIC_SERVER_URL`, `PAYLOAD_SECRET`

2. Add "Run Payload CMS migrations" step before E2E tests

3. Update "Export Supabase environment variables" step to:
   - Use `eval "$(supabase status -o env)"` method
   - Export `E2E_SUPABASE_ANON_KEY`, `E2E_SUPABASE_SERVICE_ROLE_KEY`
   - Set `E2E_LOCAL_SUPABASE=true`

## Diagnosis Determination

The root cause is clearly identified: the staging-deploy workflow's E2E test configuration is out of sync with the working e2e-sharded workflow. Multiple critical environment variables and steps are missing, preventing tests from authenticating users, connecting to databases, and running Payload CMS tests.

## Additional Context

The e2e-sharded workflow runs on `ubuntu-latest` while staging-deploy uses RunsOn self-hosted runners (`runs-on=${{ github.run_id }}-job-${{ strategy.job-index }}/runner=4cpu-linux-x64`). While this shouldn't affect the environment variable issues, it may introduce additional compatibility concerns that should be monitored.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Read, Bash, workflow comparison*
