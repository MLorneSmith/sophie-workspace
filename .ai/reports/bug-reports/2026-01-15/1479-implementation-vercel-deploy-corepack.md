## ✅ Implementation Complete

### Summary
- Removed `corepack enable && ` from `apps/web/vercel.json` installCommand
- Removed `corepack enable && ` from `apps/payload/vercel.json` installCommand
- Both files now use `pnpm install --frozen-lockfile` (matching root vercel.json pattern)
- No deviations from the original plan

### Files Changed
```
apps/payload/vercel.json | 2 +-
apps/web/vercel.json     | 2 +-
2 files changed, 2 insertions(+), 2 deletions(-)
```

### Commits
```
b07068f36 fix(deploy): remove corepack from Vercel install commands
```

### Validation Results
✅ All validation commands passed successfully:
- `jq empty apps/web/vercel.json` - Valid JSON
- `jq empty apps/payload/vercel.json` - Valid JSON
- `pnpm typecheck` - 39 packages passed
- `pnpm lint` - Passed (8 existing warnings, no errors)
- `pnpm format:fix` - Applied (fixed 4 pre-existing issues)

### Changes Made

**Before:**
```json
"installCommand": "corepack enable && pnpm install"
```

**After:**
```json
"installCommand": "pnpm install --frozen-lockfile"
```

### Why This Works
- Vercel auto-detects pnpm 10.14.0 from `packageManager` field in root package.json
- Root `vercel.json` already uses this pattern successfully
- Removes dependency on experimental `ENABLE_EXPERIMENTAL_COREPACK=1` variable
- All three vercel.json files now use consistent install pattern

### Follow-up Items
- Monitor first deployment to dev to confirm fix resolves the issue
- No technical debt created

---
*Implementation completed by Claude*
