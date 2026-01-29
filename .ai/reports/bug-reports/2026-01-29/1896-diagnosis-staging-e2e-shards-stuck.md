# Bug Diagnosis: Staging Deploy E2E Shards Stuck in Queued State with JWT Errors

**ID**: ISSUE-pending
**Created**: 2026-01-29T17:25:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The `Deploy to Staging` workflow's E2E test shards are experiencing two critical failures:
1. Multiple shards (9, 10, 11, 12) are stuck in "queued" state indefinitely
2. Completed shards (2, 3, 4, 5, 6, 7, 8) all fail with JWT validation errors: "No suitable key was found to decode the JWT" (PGRST301)

This is a regression - the same E2E tests pass successfully in the `E2E Tests (Sharded)` workflow which runs on PRs.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions)
- **Workflow**: `staging-deploy.yml`
- **Node Version**: 20.10.0
- **Supabase CLI**: latest
- **Last Working**: E2E Tests (Sharded) workflow runs pass on PR branches

## Reproduction Steps

1. Push a commit to the `staging` branch (or merge a dev-to-staging promotion PR)
2. The `Deploy to Staging` workflow triggers
3. The `test-shards` matrix job starts with 12 shards
4. Observe that shards 9, 10, 11, 12 remain stuck in "queued" status
5. Observe that shards 2-8 fail with JWT validation errors

## Expected Behavior

All 12 E2E test shards should:
1. Start running on available runners
2. Successfully connect to the local Supabase instance
3. Execute E2E tests and report pass/fail results

## Actual Behavior

1. **Queued Shards**: Shards 9, 10, 11, 12 never start - they remain in "queued" state indefinitely
2. **Failed Shards**: Shards 2-8 fail during Playwright pre-flight validation with:
   ```
   ❌ Supabase: Supabase connection failed: No suitable key or wrong key type
   Error: ❌ Pre-flight validation failed. Please ensure Supabase is running and environment variables are configured correctly.
   ```
3. **Only Shard 1 passes**: The first shard succeeds but remaining shards fail

## Diagnostic Data

### Console Output
```
[WebServer] {"timestamp":"2026-01-29T15:51:08.976Z","level":"error","service":"AI-GATEWAY","environment":"production","message":"Supabase admin client connection test failed:","error":{"code":"PGRST301","details":"No suitable key was found to decode the JWT","hint":null,"message":"No suitable key or wrong key type"},"errorMessage":"No suitable key or wrong key type","errorCode":"PGRST301","details":"No suitable key was found to decode the JWT"}

❌ Supabase: Supabase connection failed: No suitable key or wrong key type
❌ Some validations failed
  - Supabase connection failed: No suitable key or wrong key type
    Details: {"url":"http://127.0.0.1:54521","error":"No suitable key or wrong key type"}
```

### Network Analysis
The error `PGRST301` indicates PostgREST cannot validate the JWT token provided by the application. This is a cryptographic key mismatch.

### Runner Configuration Analysis
```yaml
# staging-deploy.yml (BROKEN - uses RunsOn with job-index)
runs-on: "runs-on=${{ github.run_id }}-job-${{ strategy.job-index }}/runner=4cpu-linux-x64"

# e2e-sharded.yml (WORKING - uses ubuntu-latest)
runs-on: ubuntu-latest
```

The staging workflow uses RunsOn self-hosted runners with dynamic job-index labels, which has known issues with matrix job creation.

## Error Stack Traces
```
E2E Shard 4: Error: Process from config.webServer was not able to start. Exit code: 1
E2E Shard 2: Error: ❌ Pre-flight validation failed. See details above. Please ensure Supabase is running and environment variables are configured correctly.
```

## Related Code
- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 189-385)
  - `.github/workflows/e2e-sharded.yml` (working reference)
- **Recent Changes**: Issue #1826 previously fixed similar issues but regression occurred
- **Suspected Functions**: RunsOn runner configuration and Supabase JWT key extraction

## Related Issues & Context

### Direct Predecessors
- #1826 (CLOSED): "Bug Fix: Staging Deploy E2E Tests Failing Due to Missing Environment Variables" - Same problem, previously fixed
- #1825 (CLOSED): Related diagnosis for #1826

### Infrastructure Issues
- #961 (CLOSED): "Bug Fix: E2E Shard 10 Stuck Due to RunsOn/GitHub Actions Race Condition"
- #952 (CLOSED): "Bug Fix: Staging Workflow E2E Shard 10 Stuck Due to Ephemeral RunsOn Label Mismatch"
- #959 (CLOSED): "Bug Diagnosis: E2E Shard 10 Stuck Due to RunsOn/GitHub Actions Race Condition"
- #951 (CLOSED): "Bug Diagnosis: Staging Workflow E2E Shard 10 Stuck in Queued State"

### Same Component
- #1595 (CLOSED): "Bug Fix: E2E Sharded Workflow Supabase Health Check and Startup"
- #1569 (CLOSED): "Bug Diagnosis: E2E Sharded Tests Fail - No Web Server Running"
- #1626 (documented in workflow): "E2E Sharded Workflow Environment Variable Naming Mismatch"

### Historical Context
This is a **recurring regression pattern**. The staging-deploy workflow has repeatedly fallen out of sync with the e2e-sharded workflow due to:
1. RunsOn runner configuration differences causing matrix job scheduling failures
2. Environment variable mismatches between workflows
3. JWT key extraction method differences (grep/awk vs `supabase status -o env`)

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `staging-deploy.yml` workflow uses RunsOn self-hosted runners with dynamic job-index labels which causes matrix job creation failures, combined with JWT key extraction that doesn't properly propagate to all shards.

**Detailed Explanation**:

**Issue 1: RunsOn Runner Label Mismatch**
The staging workflow uses:
```yaml
runs-on: "runs-on=${{ github.run_id }}-job-${{ strategy.job-index }}/runner=4cpu-linux-x64"
```

This causes a known issue documented in Issues #951, #952, #959, #961 where:
- Matrix jobs with dynamic `job-index` labels create ephemeral runner requests
- RunsOn provisions runners but GitHub Actions may not match them correctly
- Result: Some shards (typically higher numbers like 9-12) never get assigned a runner

**Issue 2: JWT Key Mismatch Across Shards**
Each shard starts its own local Supabase instance, generating fresh ES256 JWT keys. However:
- The JWT keys are extracted correctly in some shards
- But the application's AI-GATEWAY service fails to validate JWTs with error `PGRST301`
- The working `e2e-sharded.yml` workflow on `ubuntu-latest` doesn't have this issue

The root difference is that `e2e-sharded.yml` uses GitHub-hosted `ubuntu-latest` runners which:
1. Have consistent Docker networking
2. Don't have RunsOn's ephemeral label matching issues
3. Properly isolate each shard's Supabase instance

**Supporting Evidence**:
- E2E Tests (Sharded) workflow passes: `gh run list --workflow="E2E Tests (Sharded)"` shows recent successes
- Staging-deploy fails consistently: All recent staging deployments show the same pattern
- Issue #1826 fixed this before but the fix regressed or was incomplete
- Comment in e2e-sharded.yml (lines 13-20) explicitly documents why `ubuntu-latest` was chosen over RunsOn

### How This Causes the Observed Behavior

1. Workflow triggers on push to staging
2. Matrix job creates 12 shard jobs with dynamic RunsOn labels
3. RunsOn provisions runners but label matching fails for some shards → shards 9-12 stuck queued
4. Shards that do run start local Supabase with ES256 keys
5. Application starts and AI-GATEWAY tries to validate JWT with potentially mismatched keys
6. PostgREST rejects the JWT → PGRST301 error
7. Playwright pre-flight validation fails → shard marked as failed

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The same tests pass in `e2e-sharded.yml` which uses `ubuntu-latest`
2. Multiple historical issues (#951, #952, #959, #961) document the exact RunsOn label matching problem
3. Issue #1826 fixed this previously, confirming the diagnosis pattern
4. The workflow comments explicitly document the RunsOn vs ubuntu-latest decision

## Fix Approach (High-Level)

The fix should align `staging-deploy.yml` with the working `e2e-sharded.yml` configuration:

1. **Switch runners**: Change test-shards job from RunsOn dynamic labels to `ubuntu-latest`:
   ```yaml
   # FROM:
   runs-on: "runs-on=${{ github.run_id }}-job-${{ strategy.job-index }}/runner=4cpu-linux-x64"
   # TO:
   runs-on: ubuntu-latest
   ```

2. **Verify environment variables**: Ensure all E2E_ prefixed variables and Supabase keys are consistent with e2e-sharded.yml

3. **Consider extracting shared workflow**: Long-term, create a reusable action for E2E shard setup to prevent future drift

## Diagnosis Determination

The root cause is confirmed: **RunsOn self-hosted runner configuration in staging-deploy.yml causes matrix job scheduling failures and environment isolation issues**.

The fix is straightforward - switch to `ubuntu-latest` like the working e2e-sharded workflow does. This has been proven to work and is explicitly documented in the e2e-sharded.yml comments as the solution to this exact problem.

## Additional Context

The `Deploy to Staging` workflow is critical for the staging-to-production promotion pipeline. Until fixed:
- Staging deployments will fail E2E validation
- Production promotions will be blocked
- The workaround is to skip E2E tests (not recommended) or fix the runner configuration

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (run view, run list, issue list, issue view), Grep, Read, file exploration*
