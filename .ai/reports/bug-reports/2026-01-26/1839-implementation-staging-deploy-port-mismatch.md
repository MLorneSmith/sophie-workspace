## Implementation Complete

### Summary
- Fixed `NEXT_PUBLIC_SITE_URL` port mismatch in staging-deploy.yml test-setup job
- Changed port from 3000 to 3001 to match E2E test runtime environment
- Aligned build-time environment variable with documented test architecture

### Files Changed
```
.github/workflows/staging-deploy.yml | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

### Change Details
- **File**: `.github/workflows/staging-deploy.yml`
- **Line**: 132
- **Before**: `NEXT_PUBLIC_SITE_URL: http://localhost:3000`
- **After**: `NEXT_PUBLIC_SITE_URL: http://localhost:3001`

### Commits
```
9e6ece8eb fix(ci): correct NEXT_PUBLIC_SITE_URL port in staging-deploy test-setup job
```

### Validation Results
All validation commands passed successfully:
- `grep "NEXT_PUBLIC_SITE_URL" staging-deploy.yml` - Shows port 3001 in both test-setup (line 132) and test-shards (line 211) jobs
- `grep "localhost:3000" staging-deploy.yml` - No remaining port 3000 references in test contexts
- `.env.test` consistency verified - Contains `NEXT_PUBLIC_SITE_URL=http://localhost:3001`
- `PLAYWRIGHT_BASE_URL` consistency verified - Shows port 3001 in test-shards job

### Root Cause
The `test-setup` job in staging-deploy.yml was building the application with `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, but E2E tests run the application on port 3001. Since `NEXT_PUBLIC_*` environment variables are baked into the client bundle at build time, auth components had the wrong URL embedded, causing form elements to fail to render properly.

### Solution
Changed the `NEXT_PUBLIC_SITE_URL` environment variable in the test-setup job from `http://localhost:3000` to `http://localhost:3001`. This aligns the build-time configuration with:
- The test runtime environment (port 3001)
- The `.env.test` configuration
- The documented E2E testing architecture
- The working `e2e-sharded.yml` pattern

### Follow-up Items
- Monitor staging-deploy workflow runs for the next 3-5 executions to confirm E2E tests pass
- Verify shards 1, 2, and 3 (which were previously failing) now complete successfully
- Close diagnosis issue #1838 after validation

---
*Implementation completed by Claude*
*Issue: #1839*
*Related Diagnosis: #1838*
