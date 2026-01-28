## ✅ Implementation Complete

### Summary
- Added `.first()` to the `createNewButton` locator in `PayloadCollectionsPage.ts` to resolve Playwright strict mode violations
- The fix handles cases where Payload CMS 3.72.0 UI renders multiple "Create New" elements

### Files Changed
```
apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts | 7 ++++---
```

### Commits
```
93419e296 fix(e2e): resolve strict mode violation in Payload createNewButton locator
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm --filter web-e2e test:shard8` - 21 passed, 1 skipped
- `pnpm --filter web-e2e test:shard9` - 12 passed

### Code Change
```typescript
// Before
this.createNewButton = page.locator(
  'a:has-text("Create New"), button:has-text("Create New")',
);

// After
this.createNewButton = page
  .locator('a:has-text("Create New"), button:has-text("Create New")')
  .first();
```

---
*Implementation completed by Claude*
