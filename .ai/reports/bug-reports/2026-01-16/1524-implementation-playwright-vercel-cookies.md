## ✅ Implementation Complete

### Summary
- Changed Vercel preview cookie configuration from `sameSite: "Lax"` to `sameSite: "None"` for cross-site compatibility
- Updated `getCookieDomainConfig()` function to return `sameSite: "None"` for `*.vercel.app` URLs
- Removed dead code for url-based cookie creation (domain is now always set explicitly since #1494)
- Updated comments to reflect current cookie domain strategy
- Local/Docker tests remain unchanged with `sameSite: "Lax"`

### Files Changed
```
apps/e2e/global-setup.ts | 55 +++++++++++++++++-------------------------------
1 file changed, 19 insertions(+), 36 deletions(-)
```

### Commits
```
1eff86ef3 fix(e2e): use sameSite=None for Vercel preview cookies
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - Passed (39 successful tasks)
- `pnpm lint` - Passed (no errors)
- `pnpm format` - Passed after auto-fix
- `pnpm test:unit` - Passed (725 tests across 28 files)
- `pnpm build` - Passed (FULL TURBO)

### Technical Details
The root cause was that Playwright cookies for Vercel preview deployments were using `sameSite: "Lax"` which restricts cross-site cookie transmission. In CI environments, this caused authentication failures because cookies weren't being sent with requests to the Vercel preview URL.

The fix changes to `sameSite: "None"` (with `secure: true` which is already set for HTTPS) which allows cookies to be sent in cross-site contexts, matching Playwright best practices for deployed environments.

### Follow-up Items
- None - this is a targeted fix with no technical debt
- CI integration tests should now pass for team-accounts tests

---
*Implementation completed by Claude*
