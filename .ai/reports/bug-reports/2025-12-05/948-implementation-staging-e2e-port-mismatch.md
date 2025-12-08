## ✅ Implementation Complete

### Summary
- Added `PLAYWRIGHT_BASE_URL: http://localhost:3000` environment variable to the test-shards job
- Added explanatory comment for clarity: `# Required: Tell Playwright which port the app is running on`
- This aligns the Playwright base URL with the app startup port (3000), fixing `net::ERR_CONNECTION_REFUSED` errors

### Files Changed
```
.github/workflows/staging-deploy.yml | 2 +
1 file changed, 2 insertions(+)
```

### Commits
```
52b6fcdb2 fix(ci): add PLAYWRIGHT_BASE_URL to staging E2E test shards
```

### Validation Results
✅ All validation commands passed successfully:
- YAML syntax validated (yamllint passed in pre-commit hook)
- Indentation matches surrounding environment variables
- Playwright config files confirm they check `PLAYWRIGHT_BASE_URL` before defaulting to port 3001
- Commit passed all pre-commit hooks (TruffleHog, yamllint, commitlint)

### Root Cause Explanation
The test-shards job starts the Next.js application on port 3000 (`wait-on http://localhost:3000`) but Playwright defaults to port 3001 when `PLAYWRIGHT_BASE_URL` is not set. This mismatch caused all E2E tests to fail with connection refused errors.

### Follow-up Items
- [ ] Verify fix by pushing to staging and watching the next workflow run
- [ ] Confirm all test-shards jobs connect successfully (no `net::ERR_CONNECTION_REFUSED` errors)

---
*Implementation completed by Claude*
