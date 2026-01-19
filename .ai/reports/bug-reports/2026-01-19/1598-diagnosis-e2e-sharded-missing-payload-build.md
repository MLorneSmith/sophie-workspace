# Bug Diagnosis: E2E Sharded Workflow Missing Payload Production Build

## Quick Reference

- **Severity**: high
- **Bug Type**: configuration
- **Environment**: CI (GitHub Actions)
- **Reproducibility**: 100%
- **Root Cause**: Missing `apps/payload/.next` in e2e-build cache

## Problem Statement

The e2e-sharded workflow fails with "Could not find a production build in the '.next' directory" error on shards that use the default `playwright.config.ts` (shards 3-10 that don't specify a custom config), while shards using other configs (shard 1, 2) succeed.

## Reproduction Steps

1. Trigger the e2e-sharded workflow (via PR or manual dispatch)
2. Wait for Setup Test Server job to complete
3. Observe shard execution:
   - **Shard 1** (smoke tests, `playwright.smoke.config.ts`): PASSES
   - **Shard 2** (auth tests, `playwright.auth.config.ts`): Test failures (unrelated)
   - **Shard 3+** (default config): FAILS with WebServer error

## Investigation Summary

### Timeline of Events (Workflow Run 21146290115)

| Time | Event | Status |
|------|-------|--------|
| 17:27:28 | Payload build starts | ✓ |
| 17:27:28 | "Creating an optimized production build..." | ✓ |
| 17:27:29 | Cache paths configured | ✓ |
| 17:27:31 | Cache saved (52 MB) | ✓ |
| 17:30:00 | Shard 3 cache restored (52 MB) | ✓ |
| 17:33:13 | Shard 3 WebServer error | ✗ |

### Key Observations

1. **Shard 1 Success**:
   - Uses `playwright.smoke.config.ts`
   - Single webServer for `web` only
   - `next start -p 3001` succeeds: "✓ Ready in 526ms"

2. **Shard 3 Failure**:
   - Uses default `playwright.config.ts`
   - **TWO webServers**: web (port 3001) + payload (port 3021)
   - Web server likely succeeds, Payload server fails
   - Error: "Could not find a production build in the '.next' directory"

### Configuration Analysis

**Playwright configs and their webServer setup:**

| Config | WebServer | Affected Shards |
|--------|-----------|-----------------|
| `playwright.smoke.config.ts` | web only | 1 |
| `playwright.auth.config.ts` | web only | 2 |
| `playwright.config.ts` (default) | web + payload | 3, 4, 5, 6 |
| `playwright.billing.config.ts` | web only | 10, 11 |
| `--project=payload` | web + payload | 7, 8, 9 |

**E2E Build Cache Configuration:**

```yaml
# Current (.github/workflows/e2e-sharded.yml lines 94-103)
path: |
  apps/web/.next        # ✓ Web's Next.js build
  apps/payload/dist     # ✗ Not the Next.js build!
  packages/*/dist
  .turbo
  apps/web/supabase/.tmp
```

**Missing:**
```yaml
  apps/payload/.next    # ✗ Payload's Next.js build is NOT cached!
```

### Root Cause Analysis

The Payload CMS application is a **Next.js app** that requires a `.next` directory for `next start` to work. The workflow:

1. **Setup Test Server** job runs `pnpm build` which builds both web and payload
2. Payload build creates `apps/payload/.next` directory
3. Cache action saves `apps/web/.next` but **NOT** `apps/payload/.next`
4. Shards restore cache - `apps/payload/.next` is empty
5. Playwright tries to start Payload server with `next start`
6. **FAIL**: No production build found

### Evidence

**Shard 1 - Success (web server only):**
```
[WebServer] > NODE_ENV=test next start -p 3001
[WebServer] ✓ Ready in 526ms
```

**Shard 3 - Failure (web + payload servers):**
```
[WebServer] Error: Could not find a production build in the '.next' directory.
Try building your app with 'next build' before starting the production server.
```

**Cache Warning in Setup Test Server:**
```
[warning]Path Validation Error: Path(s) specified in the action for caching
do(es) not exist, hence no cache is being saved.
```

## Affected Files

| File | Issue |
|------|-------|
| `.github/workflows/e2e-sharded.yml` | Missing `apps/payload/.next` in cache paths |
| `apps/e2e/playwright.config.ts` | Uses both web and payload webServers |

## Solution

Add `apps/payload/.next` to the cache paths in the e2e-sharded workflow:

```yaml
# Setup Test Server job - Cache build and server state
path: |
  apps/web/.next
  apps/payload/.next    # ADD THIS
  apps/payload/dist
  packages/*/dist
  .turbo
  apps/web/supabase/.tmp
```

```yaml
# e2e-shards job - Restore build and server state
path: |
  apps/web/.next
  apps/payload/.next    # ADD THIS
  apps/payload/dist
  packages/*/dist
  .turbo
  apps/web/supabase/.tmp
```

## Impact Assessment

- **Affected**: All e2e shards using default playwright.config.ts or payload project
- **Not Affected**: Shards 1, 2 (use configs with single webServer)
- **Severity**: High - CI pipeline is effectively broken for most tests

## Related Issues

- Issue #1595 - Supabase health check improvements (recently fixed, working correctly)
- Issue #1583 - Production server vs dev server (references in workflow comments)
- Issue #1584 - Related fix documentation

## Verification Commands

After fix, verify:

```bash
# Trigger workflow
gh workflow run e2e-sharded.yml --ref dev

# Check shard 3 passes
gh run view <run-id> --json jobs --jq '.jobs[] | select(.name | contains("Shard 3")) | .conclusion'
```

---
*Diagnosed: 2026-01-19*
*Workflow Run: 21146290115*
