# Bug Diagnosis: Staging E2E Tests Fail Due to Port Mismatch (3001 vs 3000)

**ID**: ISSUE-pending
**Created**: 2026-01-23T19:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The staging deployment workflow (`deploy-staging.yml`) is failing because all E2E test shards timeout at the "Start Stripe CLI and application" step. The `wait-on` command waits for port 3000 but the application starts on port 3001.

## Environment

- **Application Version**: 0.1.0
- **Environment**: staging (GitHub Actions)
- **Node Version**: v20.10.0
- **Workflow**: `.github/workflows/staging-deploy.yml`
- **Last Working**: Before commit `4637ce72e` (Jan 19, 2026)

## Reproduction Steps

1. Push changes to the `staging` branch
2. Observe the "Deploy to Staging" workflow
3. E2E shard jobs start but fail at "Start Stripe CLI and application" step
4. All shards report: `Error: Timed out waiting for: http://localhost:3000`

## Expected Behavior

The application should start and the wait-on command should successfully detect it, allowing E2E tests to run.

## Actual Behavior

The application starts on port 3001 but wait-on waits for port 3000, causing a 60-second timeout and job failure. Error:

```
Error: Timed out waiting for: http://localhost:3000
```

## Diagnostic Data

### Console Output

```
> web@0.1.0 start:test /home/runner/_work/2025slideheroes/2025slideheroes/apps/web
> NODE_ENV=test next start -p 3001

   ▲ Next.js 16.0.10
   - Local:         http://localhost:3001
   - Network:       http://10.1.39.99:3001

 ✓ Starting...
 ✓ Ready in 267ms
...
Error: Timed out waiting for: http://localhost:3000
```

### Configuration Analysis

**apps/web/package.json** (line 17):
```json
"start:test": "NODE_ENV=test next start -p 3001"
```

**.github/workflows/staging-deploy.yml** (lines 200, 210, 280, 287):
```yaml
env:
  NEXT_PUBLIC_SITE_URL: http://localhost:3000   # Line 200
  PLAYWRIGHT_BASE_URL: http://localhost:3000    # Line 210

# Start Stripe CLI and application step:
docker run ... --forward-to http://host.docker.internal:3000/api/billing/webhook  # Line 280
npx wait-on http://localhost:3000 -t 60000       # Line 287
```

**Playwright Defaults** (`apps/e2e/global-setup.ts:507`):
```typescript
const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3001";
```

## Error Stack Traces

```
Error: Timed out waiting for: http://localhost:3000
    at /home/runner/.npm/_npx/04d57496964ca6d1/node_modules/wait-on/lib/wait-on.js:131:31
    at doInnerSub (/home/runner/.npm/_npx/04d57496964ca6d1/node_modules/rxjs/dist/cjs/internal/operators/mergeInternals.js:22:31)
```

## Related Code

- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 200, 210, 280, 287)
  - `apps/web/package.json` (line 17 - `start:test` script)
- **Recent Changes**: Commit `4637ce72e` on Jan 19, 2026 changed `start:test` to use port 3001
- **Suspected Functions**: The workflow was not updated to match the port change

## Related Issues & Context

### Direct Predecessors

- #947 (CLOSED): "Bug Diagnosis: Staging E2E Shards Fail - Port Mismatch (3001 vs 3000)" - Same root cause
- #948 (CLOSED): "Bug Fix: Staging E2E Shards Port Mismatch (3001 vs 3000)" - Previous fix that added `PLAYWRIGHT_BASE_URL`

### Historical Context

This is a **regression** of issue #947/#948. The original fix (#948) added `PLAYWRIGHT_BASE_URL: http://localhost:3000` to the workflow, which assumed the app would run on port 3000. However, commit `4637ce72e` changed `start:test` to explicitly use port 3001 because "Playwright configs expect port 3001". This created a mismatch that was not caught because the workflow wasn't updated.

The commit message for `4637ce72e` stated:
> The start:test script was missing the -p 3001 flag, causing the production server to start on the default port 3000 instead of port 3001 that Playwright configs expect.

This is contradictory to the workflow configuration, indicating two different people/sessions had different assumptions about which port should be used.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The staging workflow expects the app on port 3000 but `start:test` starts it on port 3001 due to a recent commit that wasn't coordinated with the workflow.

**Detailed Explanation**:
Commit `4637ce72e` (Jan 19, 2026) changed `apps/web/package.json` to add `-p 3001` to the `start:test` script, believing this would align with Playwright defaults. However, the staging workflow (`staging-deploy.yml`) was already configured to use port 3000 everywhere:
- `NEXT_PUBLIC_SITE_URL: http://localhost:3000`
- `PLAYWRIGHT_BASE_URL: http://localhost:3000`
- `wait-on http://localhost:3000`
- Stripe webhook forwarding to port 3000

These two changes are in conflict. Either:
1. The workflow should use port 3001, OR
2. The `start:test` script should use port 3000

**Supporting Evidence**:
- Log shows: `next start -p 3001` → `Local: http://localhost:3001`
- Log shows: `Error: Timed out waiting for: http://localhost:3000`
- Playwright defaults to 3001 (`global-setup.ts:507`)
- Workflow hardcodes 3000 in 4 places

### How This Causes the Observed Behavior

1. Workflow runs `pnpm --filter web start:test &` which starts Next.js on port **3001**
2. Workflow then runs `npx wait-on http://localhost:3000` which waits for port **3000**
3. Nothing is listening on port 3000, so wait-on times out after 60 seconds
4. The step fails with exit code 1, marking the job as failed
5. E2E tests never run because the step before them failed

### Confidence Level

**Confidence**: High

**Reasoning**: The logs explicitly show the app starting on 3001 and wait-on timing out on 3000. The code in `package.json` and `staging-deploy.yml` confirms the mismatch. This is a deterministic configuration error, not a timing or flakiness issue.

## Fix Approach (High-Level)

Update `.github/workflows/staging-deploy.yml` to use port 3001 consistently:

1. Change `NEXT_PUBLIC_SITE_URL` to `http://localhost:3001`
2. Change `PLAYWRIGHT_BASE_URL` to `http://localhost:3001`
3. Change Stripe CLI webhook forwarding to `http://host.docker.internal:3001/api/billing/webhook`
4. Change wait-on command to `npx wait-on http://localhost:3001 -t 60000`

Alternatively, change `start:test` back to port 3000, but this risks breaking local E2E testing which expects 3001.

## Diagnosis Determination

The root cause is a **port configuration mismatch** introduced by commit `4637ce72e` which changed the `start:test` script to use port 3001 without updating the staging workflow that expected port 3000.

This is a regression of the issue fixed in #948, but with the opposite problem: #948 fixed the workflow to use port 3000, but then `4637ce72e` changed the app to use port 3001 without realizing the workflow depended on port 3000.

## Additional Context

The failed workflow runs:
- Run ID: 21297080377 (current, in progress with failures)
- Run ID: 21296572546 (previous, completed with failure)

Both show the same root cause: all E2E shards fail at "Start Stripe CLI and application" step due to the port mismatch.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view, gh api, git log, Read, Grep*
