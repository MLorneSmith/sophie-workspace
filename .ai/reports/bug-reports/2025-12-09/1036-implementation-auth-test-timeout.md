## Implementation Complete

### Summary
- Imported `testConfig` from `../utils/test-config` in auth-simple.spec.ts
- Changed hardcoded `timeout: 30000` to `timeout: testConfig.getTimeout("medium")`
- This aligns test timeout with auth retry mechanism (CI: 60s, Local: 45s)

### Files Changed
```
apps/e2e/tests/authentication/auth-simple.spec.ts | 6 +-
1 file changed, 5 insertions(+), 1 deletion(-)
```

### Commits
```
3912d4266 fix(e2e): align auth-simple.spec.ts timeout with testConfig
```

### Validation Results
All validation commands passed successfully:
- `pnpm --filter web-e2e typecheck` - passed
- `pnpm lint:fix` - passed
- `pnpm format:fix` - passed

### Technical Details
- **Before**: Test timeout was hardcoded to 30s, but `loginAsUser()` internally uses `testConfig.getTimeout("medium")` which is 60s in CI
- **After**: Test timeout now uses the same `testConfig.getTimeout("medium")` call, ensuring alignment
- CI timeout: 60s
- Local timeout: 45s

---
*Implementation completed by Claude*
