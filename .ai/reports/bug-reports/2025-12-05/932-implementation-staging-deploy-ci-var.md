## ✅ Implementation Complete

### Summary
- Added `NEXT_PUBLIC_CI: true` to the test-full job environment block in `.github/workflows/staging-deploy.yml`
- This signals to the application that it's running in CI and bypasses HTTPS URL validation for test builds
- Follows the established pattern used in `next.config.mjs` and `billing-gateway-provider-factory.ts`

### Files Changed
```
.github/workflows/staging-deploy.yml | 1 +
1 file changed, 1 insertion(+)
```

### Commits
```
af6e46d81 fix(ci): add missing env vars to staging deploy test-full job
```

### Validation Results
✅ All validation commands passed successfully:
- YAML syntax validation passed
- Pre-commit hooks passed (TruffleHog, yamllint)

### Related Issues
- Diagnosis: #931
- Bug Plan: #932

---
*Implementation completed by Claude*
