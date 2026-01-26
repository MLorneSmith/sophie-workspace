# Implementation Report: Bug Fix #1781

## Summary

Fixed port mismatch in staging E2E tests by updating `.github/workflows/staging-deploy.yml` to use port 3001 consistently, matching the `start:test` script.

## Changes Made

- Updated `NEXT_PUBLIC_SITE_URL` from `http://localhost:3000` to `http://localhost:3001` (line 200)
- Updated `PLAYWRIGHT_BASE_URL` from `http://localhost:3000` to `http://localhost:3001` (line 210)
- Updated Stripe CLI webhook forwarding from port 3000 to 3001 (line 280)
- Updated `wait-on` command from port 3000 to 3001 (line 287)

## Files Changed

```
.github/workflows/staging-deploy.yml | 8 ++++----
1 file changed, 4 insertions(+), 4 deletions(-)
```

## Commits

```
f459ab0d8 fix(ci): align staging E2E test ports with start:test (3001)
```

## Validation Results

- YAML syntax validation passed
- All 4 port references in test-shards job updated to :3001
- No other :3000 references remain in test-shards job (line 132 is in test-setup build job, no server running)

## Follow-up Items

- Monitor next staging deployment to verify E2E tests run successfully
- Tests should now connect successfully instead of timing out after 60s

---
*Implementation completed by Claude on 2026-01-23*
