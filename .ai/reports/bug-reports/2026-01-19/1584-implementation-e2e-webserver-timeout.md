## ✅ Implementation Complete

### Summary
- Changed webServer config in all Playwright configs from `dev:test` to `start:test`
- Added `start:test` script to Payload package.json for production server testing
- Updated workflow comments to document production server usage
- Production server starts instantly (1-2s) vs dev server which was hanging with cached build artifacts

### Files Changed
```
.github/workflows/e2e-sharded.yml            |  4 ++++
apps/e2e/playwright.auth.config.ts           |  9 ++++++---
apps/e2e/playwright.billing.config.ts        |  9 ++++++---
apps/e2e/playwright.config.ts                | 12 ++++++++----
apps/e2e/playwright.smoke.config.ts          |  9 ++++++---
apps/payload/package.json                    |  1 +
```

### Commits
```
d25efcc25 fix(e2e): use production server instead of dev server in CI
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - passed
- `pnpm lint` - passed
- `pnpm format` - no issues

### Technical Details
The fix changes the webServer command from `pnpm --filter web dev:test` to `pnpm --filter web start:test` across all Playwright config files:
- `playwright.config.ts` (main config used by shards 3-9)
- `playwright.smoke.config.ts` (shard 1)
- `playwright.auth.config.ts` (shard 2)
- `playwright.billing.config.ts` (shards 10-11)

The production server (`next start`) uses the existing build from the Setup Test Server job, starting in 1-2 seconds. The dev server (`next dev`) was hanging because it couldn't properly initialize with incompatible cached production artifacts.

---
*Implementation completed by Claude*
