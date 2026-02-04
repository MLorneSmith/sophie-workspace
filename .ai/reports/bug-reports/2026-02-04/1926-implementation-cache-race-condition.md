## ✅ Implementation Complete

### Summary
- Removed redundant "Cache Next.js build" step from `.github/actions/setup-deps/action.yml` (lines 80-89)
- Added "Verify production build exists" step to `.github/workflows/staging-deploy.yml` after cache restoration
- The verification step checks for `.next/BUILD_ID` and triggers rebuild if missing

### Files Changed
```
.github/actions/setup-deps/action.yml  | 13 +----  (removed cache step)
.github/workflows/staging-deploy.yml   | 17 ++++++  (added verification step)
```

### Commits
```
ea16dd596 fix(ci): resolve staging E2E shards cache race condition
```

### Validation Results
✅ All validation commands passed successfully:
- `grep -c "Cache Next.js build" .github/actions/setup-deps/action.yml` → 0 (step removed)
- `grep -n "Verify production build" .github/workflows/staging-deploy.yml` → 284 (step added)
- `pnpm typecheck` → 39 packages passed
- `pnpm lint` → No errors
- `pnpm format` → No fixes needed
- YAML validation → Both files valid

### Root Cause Fix
The race condition was caused by two cache restoration steps both touching the `.next` directory:
1. `setup-deps/action.yml` restored partial `.next/cache` (~63KB)
2. `staging-deploy.yml` restored full `apps/web/.next` (~49MB)

When running concurrently on shards 3-5+, the partial cache could interfere with full restoration.

### Solution Applied
1. **Primary fix**: Removed the redundant `.next/cache` caching from setup-deps (eliminates race condition at source)
2. **Safety net**: Added BUILD_ID verification after cache restore (catches edge cases, triggers rebuild if needed)

### Follow-up Items
- Monitor next staging deployment for all shards passing (especially shards 3-5)
- Verify logs show "✅ Production build verified (.next/BUILD_ID exists)"
- Confirm no unexpected rebuilds are triggered

---
*Implementation completed by Claude*
