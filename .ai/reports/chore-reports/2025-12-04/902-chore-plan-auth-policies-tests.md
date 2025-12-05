# Chore: Add Unit Tests for Authentication, Team Policies, and Account Operations

## Chore Description

The authentication, team account policies, and personal account operations represent critical security-sensitive code with zero unit test coverage. These areas handle:

- **User authentication**: Sign-in, sign-up, password reset, MFA flows
- **Team account policies**: Access control decisions for invitations, permissions
- **Personal account operations**: Account deletion, profile updates

This chore adds comprehensive unit tests following the established patterns from `packages/features/admin/` (which has 29.6% coverage as the best-tested feature package). Tests will use Vitest with proper mocking of Supabase client and external dependencies.

**Target Coverage:**
- Authentication schemas: 100% (4 schemas)
- Authentication flows: 80%+ (core sign-in, sign-up, password-reset)
- Team account policies: 100% (4 policy files)
- Personal account services: 100% (1 service)
- Team account services: 80%+ (6 services)

**Total New Test Files: 12-15**
**Estimated Tests: 80-120 test cases**

## Relevant Files

### Source Files to Test

**Authentication (`packages/features/auth/src/`):**
- `schemas/password-sign-in.schema.ts` - Sign-in validation schema
- `schemas/password-sign-up.schema.ts` - Sign-up validation schema
- `schemas/password-reset.schema.ts` - Password reset validation schema
- `schemas/password.schema.ts` - Base password validation schema
- `hooks/use-sign-up-flow.ts` - Sign-up flow hook
- `hooks/use-last-auth-method.ts` - Last auth method persistence hook
- `utils/last-auth-method.ts` - Auth method storage utilities
- `captcha/server/index.ts` - Server-side captcha verification

**Team Account Policies (`packages/features/team-accounts/src/server/policies/`):**
- `policies.ts` - Policy registry and core policies (subscription, paddle billing)
- `invitation-policies.ts` - Invitation policy evaluator
- `invitation-context-builder.ts` - Context builder for policy evaluation
- `feature-policy-invitation-context.ts` - Type definitions for policy context

**Team Account Services (`packages/features/team-accounts/src/server/services/`):**
- `create-team-account.service.ts` - Team creation service
- `delete-team-account.service.ts` - Team deletion service
- `leave-team-account.service.ts` - Leave team service
- `account-members.service.ts` - Member management service
- `account-invitations.service.ts` - Invitation management service
- `account-per-seat-billing.service.ts` - Per-seat billing operations

**Personal Account (`packages/features/accounts/src/server/`):**
- `services/delete-personal-account.service.ts` - Account deletion service
- `personal-accounts-server-actions.ts` - Server actions for account operations

### Reference Test Files (Patterns to Follow)
- `packages/features/admin/src/lib/server/services/admin-accounts.service.test.ts` - Service testing pattern
- `packages/features/admin/src/lib/server/utils/is-super-admin.test.ts` - Utility testing pattern
- `packages/features/admin/src/lib/server/admin-server-actions.test.ts` - Server action testing pattern

### New Files to Create

**Authentication Tests:**
- `packages/features/auth/src/schemas/password-sign-in.schema.test.ts`
- `packages/features/auth/src/schemas/password-sign-up.schema.test.ts`
- `packages/features/auth/src/schemas/password-reset.schema.test.ts`
- `packages/features/auth/src/schemas/password.schema.test.ts`
- `packages/features/auth/src/hooks/use-sign-up-flow.test.ts`
- `packages/features/auth/src/utils/last-auth-method.test.ts`

**Team Policies Tests:**
- `packages/features/team-accounts/src/server/policies/policies.test.ts`
- `packages/features/team-accounts/src/server/policies/invitation-policies.test.ts`
- `packages/features/team-accounts/src/server/policies/invitation-context-builder.test.ts`

**Team Services Tests:**
- `packages/features/team-accounts/src/server/services/create-team-account.service.test.ts`
- `packages/features/team-accounts/src/server/services/delete-team-account.service.test.ts`
- `packages/features/team-accounts/src/server/services/leave-team-account.service.test.ts`
- `packages/features/team-accounts/src/server/services/account-members.service.test.ts`
- `packages/features/team-accounts/src/server/services/account-invitations.service.test.ts`

**Personal Account Tests:**
- `packages/features/accounts/src/server/services/delete-personal-account.service.test.ts`

## Impact Analysis

### Scope & Impact
- **High value**: Tests critical security paths (authentication, authorization, account lifecycle)
- **No application changes**: Only adds test files, no source code modifications
- **Establishes patterns**: Creates reusable test utilities for Supabase mocking
- **CI integration**: Tests will run in existing Vitest test suite
- **Developer confidence**: Enables safer refactoring of auth/policy code

### Dependencies Affected
- **Vitest test framework** - Uses existing configuration
- **@kit/policies** - Policy evaluation library (will be mocked)
- **@kit/supabase** - Supabase client types (will be mocked)
- **@kit/shared/logger** - Logger (will be mocked)

No runtime dependencies added. Test utilities may be shared across packages.

### Risk Assessment
**Low Risk** — Purely additive test files:
- No source code changes
- No database migrations
- No API changes
- Tests are isolated and don't affect production
- Can be incrementally added and validated

### Backward Compatibility
- Fully backward compatible
- No breaking changes
- No deprecation warnings needed
- Existing tests unaffected

## Pre-Chore Checklist
Before starting implementation:
- [ ] Create feature branch: `chore/auth-policies-unit-tests`
- [ ] Review existing admin test patterns for consistency
- [ ] Identify shared mock utilities that can be extracted
- [ ] Verify Vitest configuration supports new test locations
- [ ] Confirm test naming conventions match existing patterns

## Documentation Updates Required
- Add inline comments in test files explaining test purposes
- Update `apps/e2e/CLAUDE.md` or create test documentation for feature packages
- Document mock utility patterns for future test development
- No user-facing documentation needed (internal tests only)

## Rollback Plan
If tests cause issues:
1. **Immediate rollback**: Delete new test files
2. **No database changes**: Nothing to rollback
3. **No dependencies**: No packages to remove
4. **CI fix**: Remove test files from any failing CI jobs

Rollback command:
```bash
git checkout main -- packages/features/auth/src/**/*.test.ts
git checkout main -- packages/features/team-accounts/src/**/*.test.ts
git checkout main -- packages/features/accounts/src/**/*.test.ts
```

## Step by Step Tasks

### 1. Set Up Test Infrastructure
- [ ] Create shared mock utilities file: `packages/features/shared-test-utils/supabase-mocks.ts`
- [ ] Extract `createMockSupabaseClient` helper from admin tests
- [ ] Create `createMockLogger` helper for consistent logger mocking
- [ ] Create `createMockPolicyRegistry` helper for policy testing
- [ ] Verify Vitest config includes new test paths

### 2. Create Authentication Schema Tests
- [ ] Create `password.schema.test.ts`:
  - Test minimum length validation (8 characters)
  - Test maximum length validation
  - Test empty password rejection
  - Test whitespace-only rejection
  - Test valid password acceptance

- [ ] Create `password-sign-in.schema.test.ts`:
  - Test valid email and password
  - Test invalid email formats
  - Test missing email
  - Test missing password
  - Test edge cases (unicode, special characters)

- [ ] Create `password-sign-up.schema.test.ts`:
  - Test valid sign-up data
  - Test password confirmation match (if applicable)
  - Test email validation
  - Test name field validation (if present)

- [ ] Create `password-reset.schema.test.ts`:
  - Test valid email
  - Test invalid email formats
  - Test empty email rejection

### 3. Create Authentication Utility Tests
- [ ] Create `last-auth-method.test.ts`:
  - Test storing last auth method
  - Test retrieving last auth method
  - Test clearing auth method
  - Test localStorage fallback handling
  - Test SSR safety (no window)

### 4. Create Authentication Hook Tests
- [ ] Create `use-sign-up-flow.test.ts`:
  - Test initial state
  - Test state transitions
  - Test error handling
  - Test success flow
  - Use React Testing Library for hook testing

### 5. Create Team Policy Tests
- [ ] Create `policies.test.ts`:
  - Test `subscriptionRequiredInvitationsPolicy`:
    - Allow when subscription active
    - Deny when no subscription
    - Deny when subscription inactive
    - Return correct error codes/messages
  - Test `paddleBillingInvitationsPolicy`:
    - Allow when no subscription
    - Allow when not Paddle provider
    - Allow when not trialing
    - Deny when Paddle + trialing + per-seat items
    - Return correct error codes/messages
  - Test `invitationPolicyRegistry`:
    - Verify policy registration
    - Verify policy retrieval

- [ ] Create `invitation-policies.test.ts`:
  - Test `createInvitationsPolicyEvaluator`:
    - Factory creates evaluator correctly
    - `hasPoliciesForStage` returns correct values
    - `canInvite` evaluates policies correctly
    - Test preliminary stage evaluation
    - Test submission stage evaluation
    - Test ALL evaluation mode
    - Test error handling

- [ ] Create `invitation-context-builder.test.ts`:
  - Test context building with valid inputs
  - Test context building with missing subscription
  - Test context building with various subscription states
  - Test error handling for invalid inputs

### 6. Create Team Service Tests
- [ ] Create `create-team-account.service.test.ts`:
  - Test successful team creation
  - Test error handling from RPC
  - Test parameter validation
  - Test logger calls
  - Test different account name formats
  - Follow admin-accounts.service.test.ts pattern

- [ ] Create `delete-team-account.service.test.ts`:
  - Test successful team deletion
  - Test permission errors
  - Test not found errors
  - Test foreign key violations
  - Test logger calls

- [ ] Create `leave-team-account.service.test.ts`:
  - Test successful leave operation
  - Test owner cannot leave
  - Test member removal
  - Test error handling

- [ ] Create `account-members.service.test.ts`:
  - Test member listing
  - Test member role updates
  - Test member removal
  - Test permission checks
  - Test error handling

- [ ] Create `account-invitations.service.test.ts`:
  - Test invitation creation
  - Test invitation acceptance
  - Test invitation rejection
  - Test invitation expiration
  - Test duplicate invitation handling
  - Test role assignment

### 7. Create Personal Account Service Tests
- [ ] Create `delete-personal-account.service.test.ts`:
  - Test successful deletion in production environment
  - Test successful deletion in test environment
  - Test manual cleanup in test environment
  - Test auth.admin.deleteUser success
  - Test auth.admin.deleteUser failure
  - Test timeout error handling
  - Test foreign key violation error handling
  - Test logger calls at each step
  - Test error message formatting
  - Follow existing service test patterns

### 8. Create Test Coverage Report
- [ ] Run coverage report for auth package
- [ ] Run coverage report for team-accounts package
- [ ] Run coverage report for accounts package
- [ ] Document coverage improvements
- [ ] Identify any remaining gaps

### 9. Execute Validation Commands
Execute all validation commands to verify implementation:
- [ ] Run all new tests: `pnpm test:unit`
- [ ] Run with coverage: `pnpm test:coverage`
- [ ] Verify TypeScript compilation: `pnpm typecheck`
- [ ] Run linter: `pnpm lint`
- [ ] Verify no regressions in existing tests

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

```bash
# Run all unit tests
pnpm test:unit

# Run tests with coverage report
pnpm test:coverage

# Run specific package tests
pnpm --filter @kit/auth test
pnpm --filter @kit/team-accounts test
pnpm --filter @kit/accounts test

# Run only new auth tests
pnpm vitest run packages/features/auth/src/**/*.test.ts

# Run only new team-accounts tests
pnpm vitest run packages/features/team-accounts/src/**/*.test.ts

# Run only new accounts tests
pnpm vitest run packages/features/accounts/src/**/*.test.ts

# Verify TypeScript compilation
pnpm typecheck

# Run linter
pnpm lint

# Count total tests added
echo "Auth tests: $(grep -r "it\|test(" packages/features/auth/src/**/*.test.ts 2>/dev/null | wc -l)"
echo "Team tests: $(grep -r "it\|test(" packages/features/team-accounts/src/**/*.test.ts 2>/dev/null | wc -l)"
echo "Account tests: $(grep -r "it\|test(" packages/features/accounts/src/**/*.test.ts 2>/dev/null | wc -l)"

# Verify no test.only left
grep -r "it.only\|test.only\|describe.only" packages/features/auth packages/features/team-accounts packages/features/accounts || echo "✓ No .only found"

# Run full test suite to verify no regressions
pnpm test
```

## Notes

### Testing Patterns to Follow

Based on analysis of `admin-accounts.service.test.ts`:

1. **Mock Creation**: Create helper functions for mock Supabase clients
   ```typescript
   function createMockSupabaseClient(config?: { error?: any }) {
     return {
       from: vi.fn().mockReturnValue({ ... }),
       auth: { admin: { ... } },
       rpc: vi.fn(),
     } as unknown as SupabaseClient<Database>;
   }
   ```

2. **Test Organization**: Use nested `describe` blocks
   - Factory Function tests
   - Success cases
   - Error Handling
   - Edge Cases
   - Multiple Operations

3. **Logger Mocking**: Mock `@kit/shared/logger`
   ```typescript
   vi.mock('@kit/shared/logger', () => ({
     getLogger: vi.fn().mockResolvedValue({
       info: vi.fn(),
       error: vi.fn(),
       warn: vi.fn(),
     }),
   }));
   ```

4. **Arrange-Act-Assert**: Follow AAA pattern consistently

### Policy Testing Specifics

For policy tests, use the `@kit/policies` helpers:
```typescript
import { allow, deny } from '@kit/policies';

// Test that policy returns allow() for valid context
expect(result.allowed).toBe(true);

// Test that policy returns deny() with correct code
expect(result.allowed).toBe(false);
expect(result.code).toBe('SUBSCRIPTION_REQUIRED');
```

### Schema Testing

Use Zod's built-in parsing for schema tests:
```typescript
import { PasswordSignInSchema } from './password-sign-in.schema';

// Valid input
expect(() => PasswordSignInSchema.parse(validInput)).not.toThrow();

// Invalid input
expect(() => PasswordSignInSchema.parse(invalidInput)).toThrow();

// Check specific error messages
const result = PasswordSignInSchema.safeParse(invalidInput);
expect(result.success).toBe(false);
expect(result.error?.issues[0].message).toContain('expected message');
```

### Environment-Specific Tests

The `delete-personal-account.service.ts` has environment-specific behavior:
- Test both production and test environment paths
- Mock `process.env` appropriately for each scenario
- Verify manual cleanup runs only in test environments

### Coverage Targets

| Package | Current | Target |
|---------|---------|--------|
| auth | 0% | 80%+ |
| team-accounts | 0% | 70%+ |
| accounts | 0% | 80%+ |

### Estimated Time

- Schema tests: 2-3 hours
- Policy tests: 3-4 hours
- Service tests: 6-8 hours
- Hook/utility tests: 2-3 hours
- Integration and validation: 2-3 hours

**Total: 15-20 hours**
