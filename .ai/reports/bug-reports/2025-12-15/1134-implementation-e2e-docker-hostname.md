## ✅ Implementation Complete

### Summary
- Created `apps/e2e/tests/utils/base-test.ts` - custom Playwright test fixture with route interception
- Updated all 31 spec files to import from `base-test.ts` instead of `@playwright/test`
- Updated `auth.po.ts` to use `base-test.ts` for consistent `test.use()` behavior
- Route interception uses regex pattern to match all `host.docker.internal` URLs
- Browser requests are transparently rewritten to `127.0.0.1`

### How It Works
The fixture intercepts browser requests matching `host.docker.internal` and rewrites them to `127.0.0.1`:
```typescript
await page.route(/host\.docker\.internal/, async (route) => {
  const rewrittenUrl = route.request().url().replace(
    /host\.docker\.internal/g,
    '127.0.0.1'
  );
  await route.continue({ url: rewrittenUrl });
});
```

### Verification Results
- ✅ Route interception working - debug logs show requests being rewritten
- ✅ Auth-simple tests: 10/10 passed (authentication working with route rewrite)
- ✅ Smoke tests: 7/9 passed (2 failures unrelated to Docker hostname issue)
- ✅ TypeScript compilation: No errors
- ✅ Lint: No errors

### Example Debug Output
```
[DEBUG_E2E_DOCKER:route:rewrite] {
  "original": "http://host.docker.internal:54521/rest/v1/roles?select=name",
  "rewritten": "http://127.0.0.1:54521/rest/v1/roles?select=name",
  "method": "GET",
  "resourceType": "fetch"
}
```

### Files Changed
- **New**: `apps/e2e/tests/utils/base-test.ts` (97 lines)
- **Modified**: 31 spec files (import path changes)
- **Modified**: `apps/e2e/tests/authentication/auth.po.ts` (import path change)

### Commits
```
8c8df4052 fix(e2e): add route interception for Docker hostname resolution
```

### Notes
- Some invitation tests still fail due to a separate RLS issue with the `roles` table (not related to Docker hostname)
- The route interception fix correctly addresses the browser-side hostname resolution issue
- Zero production code changes required

---
*Implementation completed by Claude*
