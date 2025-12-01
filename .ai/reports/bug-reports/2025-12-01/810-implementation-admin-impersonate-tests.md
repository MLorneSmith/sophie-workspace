## ✅ Implementation Complete

### Summary
- Updated unit tests for `impersonateUser` to match the new `verifyOtp` implementation
- Added `verifyOtp` mock to `client.auth` for testing the new OTP verification flow
- Updated `generateLink` mock to return `hashed_token` instead of `action_link`
- Replaced obsolete "location header not found" test with "hashed_token not found" test
- Replaced obsolete "tokens not found in URL" test with two new verifyOtp failure tests
- Removed global `fetch` mocking (no longer needed with verifyOtp approach)

### Files Changed
```
packages/features/admin/src/lib/server/services/admin-auth-user.service.test.ts | 96 ++++++++++++-------
1 file changed, 65 insertions(+), 31 deletions(-)
```

### Commits
```
83b281c56 fix(admin): update impersonateUser tests to match verifyOtp implementation
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm vitest run admin-auth-user.service.test.ts` - 27 tests passing
- `pnpm --filter @kit/admin typecheck` - No errors
- `pnpm --filter @kit/admin lint` - No issues

### Test Changes Summary
| Old Test | New Test | Reason |
|----------|----------|--------|
| "should impersonate a user successfully" (fetch-based) | Same name, verifyOtp-based | Implementation changed |
| "should throw error if location header not found" | "should throw error if hashed_token not found" | No longer using fetch |
| "should throw error if tokens not found in URL" | "should throw error if verifyOtp fails" + "should throw error if verifyOtp returns no session" | OTP verification errors |

---
*Implementation completed by Claude*
