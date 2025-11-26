# Bug Diagnosis: Test Infrastructure Port Mismatch - Old 54321 References

**ID**: ISSUE-708
**Created**: 2025-11-26T15:50:00Z
**Reporter**: Claude Debug Assistant
**Severity**: high
**Status**: new
**Type**: configuration

## Summary

E2E authentication tests are failing with 15-second timeout because the test infrastructure code still references the **old Supabase port 54321** while the actual Supabase instance runs on **port 54521**. This is a second wave of configuration drift from the port migration in issue #707, which updated application config but missed test infrastructure scripts.

## Environment

- **Application Version**: dev branch (commit 070277089)
- **Environment**: development
- **Node Version**: Node.js 20+
- **Database**: PostgreSQL via Supabase (port 54522)
- **Last Working**: Before port migration (54321 → 54521)

## Reproduction Steps

1. Start Supabase: `pnpm supabase:web:start` (runs on port 54521)
2. Start test server: `pnpm --filter web dev:test` (runs on port 3001)
3. Run E2E shard 2: `/test 2` or `pnpm test:e2e 2`
4. Observe auth-simple.spec.ts "user can sign in with valid credentials" fails
5. Check network logs - requests go to `host.docker.internal:54321` instead of `54521`

## Expected Behavior

E2E tests should connect to Supabase at `http://127.0.0.1:54521` (the correct, running port) and authenticate successfully.

## Actual Behavior

Tests timeout waiting for auth API response because:
1. Test infrastructure configures `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321`
2. No service is running on port 54321
3. Auth requests hang until timeout (15s)
4. Test fails with "Auth API timeout"

## Diagnostic Data

### Console Output
```
[Phase 1] Waiting for Supabase auth/v1/token API response (timeout: 15000ms)...
[Network] Request: POST http://host.docker.internal:54321/auth/v1/token?grant_type=password
[Phase 1] ❌ Auth API timeout after 15000ms
Current URL: http://localhost:3001/auth/sign-in
Credentials: test1@slideheroes.com
```

### Network Analysis
```
Captured Auth Requests:
  POST http://host.docker.internal:54321/auth/v1/token?grant_type=password

Captured Auth Responses:
  (none - request times out)
```

### Supabase Status
```bash
$ npx supabase status
API URL: http://127.0.0.1:54521  # <-- CORRECT port
Database URL: postgresql://postgres:postgres@127.0.0.1:54522/postgres
```

## Error Stack Traces
```
TimeoutError: locator.waitForResponse: Timeout 15000ms exceeded.
  at loginAsUser (/apps/e2e/tests/authentication/auth.po.ts:534)
  waiting for response matching auth/v1/token
```

## Related Code

### Affected Files (with old 54321 references)

1. **phase-coordinator.cjs:254**
   ```javascript
   const ports = [3000, 3020, 54321];  // Should be 54521
   ```

2. **phase-coordinator.cjs:342**
   ```javascript
   const ports = [3000, 3001, 3020, 54321, 54322];  // Should be 54521, 54522
   ```

3. **infrastructure-manager.cjs:241**
   ```javascript
   [54321, 54322, 54323],  // Should be 54521, 54522, 54523
   ```

4. **infrastructure-manager.cjs:747**
   ```javascript
   const supabaseUrl = supabaseConfig.API_URL || "http://localhost:54321";  // Fallback is wrong
   ```

5. **port-binding-verifier.cjs:28**
   ```javascript
   kong: 54321,  // Should be 54521
   ```

6. **supabase-config-loader.cjs:18**
   ```javascript
   API_URL: "http://127.0.0.1:54321",  // Should be 54521
   ```

7. **test-controller-monolith.cjs:60, 264, 350, 398, 531**
   - Multiple hardcoded references to 54321/54322

### Recently Fixed Files (for reference)
Issue #707 updated these files correctly:
- `apps/e2e/.env.example` ✅
- `apps/e2e/.env.test.locked` ✅
- `apps/web/.env.development` ✅
- `apps/web/.env.test.locked` ✅
- `docker-compose.test.yml` ✅

### Missed Files (require fix)
- `.ai/ai_scripts/testing/infrastructure/phase-coordinator.cjs`
- `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs`
- `.ai/ai_scripts/testing/infrastructure/port-binding-verifier.cjs`
- `.ai/ai_scripts/testing/infrastructure/supabase-config-loader.cjs`
- `.ai/ai_scripts/testing/infrastructure/test-controller-monolith.cjs`

## Related Issues & Context

### Direct Predecessors
- #707 (CLOSED): "Bug Fix: Supabase Port Configuration Drift" - Fixed app config but missed test infra
- #706 (CLOSED): "Bug Diagnosis: Supabase Port Configuration Drift" - Original diagnosis
- #668 (CLOSED): "Hyper-V Port Reservation" - Root cause of port change (54321 → 54521)

### Same Component
- #704 (CLOSED): "auth-simple.spec.ts sign-in test navigation timeout" - Related but different root cause

### Historical Context
The port migration from 54321 → 54521 was necessary due to Windows Hyper-V port reservations. Issue #707 systematically updated application configuration files but the test infrastructure scripts under `.ai/ai_scripts/testing/` were not part of that fix scope.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Test infrastructure scripts contain hardcoded Supabase port references (54321) that were not updated during the port migration fix in #707.

**Detailed Explanation**:
When Supabase ports were changed from 54321-54326 to 54521-54526 to avoid Hyper-V conflicts:
1. Issue #707 updated all application-level configuration files (.env files, docker-compose, CI/CD workflows)
2. However, the test infrastructure scripts in `.ai/ai_scripts/testing/` were not included in that update
3. These scripts contain hardcoded port references and fallback values
4. When running E2E tests, the infrastructure manager and config loader provide the wrong Supabase URL
5. The web app receives `host.docker.internal:54321` as its Supabase URL
6. Auth requests go to the wrong port and timeout

**Supporting Evidence**:
- Test log shows: `POST http://host.docker.internal:54321/auth/v1/token`
- Supabase status shows: `API URL: http://127.0.0.1:54521`
- Port mismatch: 54321 (requested) vs 54521 (running)
- Code search finds 6 files with old port references in `.ai/ai_scripts/testing/`

### How This Causes the Observed Behavior

1. Test controller starts up and loads config from test infrastructure scripts
2. `supabase-config-loader.cjs` provides fallback `API_URL: "http://127.0.0.1:54321"`
3. `infrastructure-manager.cjs` uses this URL when generating environment for dev server
4. Web dev server starts with `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321`
5. Browser makes auth request to port 54321
6. No service on 54321 → request hangs → timeout → test fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence: Test logs show wrong port in network requests
- Clear code path: Found exact files with hardcoded wrong ports
- Pattern match: Same issue as #706/#707 but in different file set
- Verified running services: Confirmed Supabase is on 54521

## Fix Approach (High-Level)

Update all test infrastructure files in `.ai/ai_scripts/testing/` to use the correct Supabase ports:

| Service | Old Port | New Port |
|---------|----------|----------|
| API Gateway | 54321 | 54521 |
| PostgreSQL | 54322 | 54522 |
| Studio | 54323 | 54523 |
| Inbucket Web | 54324 | 54524 |
| Inbucket SMTP | 54325 | 54525 |
| Inbucket POP3 | 54326 | 54526 |

Files to update:
1. `phase-coordinator.cjs` - 2 locations
2. `infrastructure-manager.cjs` - 2 locations
3. `port-binding-verifier.cjs` - 1 location
4. `supabase-config-loader.cjs` - 1 location
5. `test-controller-monolith.cjs` - 5 locations

## Diagnosis Determination

**Root cause confirmed**: Test infrastructure scripts have hardcoded Supabase port references that were not updated during the #707 port migration. This causes E2E tests to connect to the wrong port (54321 instead of 54521), resulting in auth timeout failures.

This is a straightforward configuration fix that follows the same pattern as #707 but targets a different set of files.

## Additional Context

The test infrastructure files are in the `.ai/ai_scripts/testing/` directory which is:
- Part of the AI tooling, not the main application
- Not covered by standard grep searches targeting `apps/` or `packages/`
- Requires manual updating since it's not auto-generated

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (grep, curl, supabase status), Read (env files, test infrastructure), GitHub CLI (issue lookup)*
