## Implementation Complete

### Summary
- Updated "should create first user successfully" test to be idempotent - skips when admin user exists
- Added new "should handle pre-seeded admin user correctly" regression test
- Added `isFirstUserSetupNeeded()` helper method to PayloadLoginPage
- Used centralized TEST_USERS for consistent credentials across tests
- Improved error message selector coverage in PayloadLoginPage

### Files Changed
```
apps/e2e/tests/payload/pages/PayloadLoginPage.ts | 13 ++++-
apps/e2e/tests/payload/payload-auth.spec.ts      | 51 +++++++++++++++-----
2 files changed, 52 insertions(+), 12 deletions(-)
```

### Commits
```
5a162b8d0 fix(e2e): make Payload first-user test idempotent
```

### Validation Results
All validation commands passed successfully:
- `pnpm typecheck` - 37/37 packages passed
- `pnpm lint` - No errors
- `pnpm format:fix` - Fixed 1 file
- Payload auth tests run:
  - `should create first user successfully` - Correctly skipped (admin exists)
  - `should handle pre-seeded admin user correctly` - Passed

### Follow-up Items
- None - this was a targeted test fix

---
*Implementation completed by Claude*
