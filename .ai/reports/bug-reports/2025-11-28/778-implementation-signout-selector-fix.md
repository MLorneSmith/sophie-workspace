## Implementation Complete

### Summary
- Updated account dropdown selector from `account-dropdown-trigger` to `account-dropdown` in 4 files
- This aligns with commit 93bb87a32 which changed the component's data-testid
- Fixed selector mismatch causing "sign out clears session" test to fail

### Files Changed
```
apps/e2e/AGENTS.md                            | 2 +-
apps/e2e/CLAUDE.md                            | 2 +-
apps/e2e/tests/account/account-simple.spec.ts | 2 +-
apps/e2e/tests/authentication/auth.po.ts      | 2 +-
4 files changed, 4 insertions(+), 4 deletions(-)
```

### Commits
```
3874e503b fix(e2e): update account dropdown selector from -trigger to -dropdown
```

### Validation Results
All validation commands passed successfully:
- `pnpm --filter web-e2e test:shard2 -- auth-simple` - 10 passed, 11 skipped (13.7s)

### Follow-up Items
- None required - this is a complete fix

---
*Implementation completed by Claude*
