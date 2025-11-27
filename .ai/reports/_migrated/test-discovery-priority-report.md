# Test Coverage Priority Report

Generated: 2025-01-06

## Executive Summary

**Critical Finding**: Major security and business-critical packages have **zero test coverage**.

### Test Coverage Snapshot

- **Total Test Files**: 37 (19 Vitest, 18 Playwright)
- **Total Test Cases**: 597 individual tests
- **Total Test Suites**: 139 describe blocks
- **Critical Gaps**: 144 source files in P1 packages with 0% coverage
- **Overall Coverage**: ~7.4% of source files have tests

## 🔴 P1 - Critical Security Gaps (Immediate Action Required)

### 1. **Admin Package** - Risk Score: 95/100

- **Location**: `packages/features/admin`
- **Status**: ❌ 25 source files, **0 tests**
- **Recent Changes**: Modified today (2025-01-06)
- **Critical Files**:
  - `admin-server-actions.ts` - User management actions (create, ban, delete, impersonate)
  - `admin-action.ts` - Security wrapper for admin operations
  - `is-super-admin.ts` - Core authorization checks
- **Security Risk**: Unvalidated admin operations could lead to privilege escalation
- **Recommended Action**:

  ```bash
  /unit-test-writer --file=packages/features/admin/src/lib/server/admin-server-actions.ts
  ```

### 2. **Auth Package** - Risk Score: 90/100

- **Location**: `packages/features/auth`
- **Status**: ❌ 38 source files, **0 tests**
- **Critical Components**:
  - Sign-in/Sign-up flows
  - MFA verification
  - Password reset
  - Session management
- **Business Impact**: Authentication failures affect 100% of users
- **Recommended Action**:

  ```bash
  /integration-test-writer --package=auth --priority=signin,mfa
  ```

## 🟠 P2 - Important Gaps (Schedule This Sprint)

### 3. **Team Accounts** - Risk Score: 75/100

- **Location**: `packages/features/team-accounts`
- **Status**: ❌ 51 source files, **0 tests**
- **Business Impact**: Team collaboration features
- **Recommended Tests**: Invitation flow, permissions, team member management

### 4. **Accounts** - Risk Score: 70/100

- **Location**: `packages/features/accounts`
- **Status**: ❌ 30 source files, **0 tests**
- **Business Impact**: User account management
- **Recommended Tests**: Profile updates, settings, account deletion

### 5. **High-Churn Components** - Risk Score: 65/100

Files changed frequently without tests:

- `onboarding-form.tsx` (13 changes) - User onboarding flow
- `SurveyComponent.tsx` (9 changes) - User feedback collection
- `personal-account-dropdown.tsx` (8 changes) - UI navigation

## 🟡 P3 - Technical Debt (Backlog)

### Lower Priority Gaps

- AI Gateway utilities (8 changes, partial coverage)
- Marketing pages (low business impact)
- Dev tools and configuration files

## Test Distribution Analysis

### Current State

```text
Type          Files    Tests    Avg Tests/File
----------------------------------------------
Vitest        19       434      22.8
Playwright    18       163      9.1
TOTAL         37       597      16.1
```

### Target State (Recommended)

```text
Type          Current  Target   Gap
------------------------------------
Unit Tests    19       150      +131 files needed
Integration   0        30       +30 files needed
E2E Tests     18       25       +7 files needed
```

## Actionable Recommendations

### Week 1: Security Critical (40 hours)

1. **Day 1-2**: Admin package unit tests

   ```bash
   /unit-test-writer --package=admin --all
   ```

2. **Day 3-4**: Auth integration tests

   ```bash
   /integration-test-writer --package=auth --critical
   ```

3. **Day 5**: Review and gap analysis

### Week 2: Business Critical (40 hours)

1. **Day 1-2**: Account management tests
2. **Day 3-4**: Team accounts integration
3. **Day 5**: High-churn component tests

### Quick Wins (Can start immediately)

```bash
# Test the most critical admin functions
/unit-test-writer --file=packages/features/admin/src/lib/server/utils/is-super-admin.ts

# Test authentication flows
/e2e-test-writer --feature=authentication --priority=signin,mfa

# Test recently changed files
/test-discovery --recent --write-tests
```

## Success Metrics

### 30-Day Goals

- ✅ 100% coverage for P1 security functions
- ✅ 80% coverage for authentication flows
- ✅ Integration tests for all admin operations
- ✅ Reduce untested packages from 144 to <50

### 90-Day Goals

- ✅ 60% overall test coverage
- ✅ All P1 and P2 packages have tests
- ✅ Automated test generation for new files
- ✅ CI/CD blocks merges without tests

## Test Writing Priority Matrix

| Package | Priority | Risk | Effort | ROI | Start With |
|---------|----------|------|--------|-----|------------|
| Admin | P1 | 95 | 2 days | Very High | `admin-server-actions.ts` |
| Auth | P1 | 90 | 3 days | Very High | Sign-in flow |
| Accounts | P2 | 70 | 2 days | High | Account settings |
| Team Accounts | P2 | 75 | 3 days | High | Invitation flow |
| AI Canvas | P2 | 60 | 2 days | Medium | Already has 17 tests |

## Next Steps

1. **Immediate**: Run `/unit-test-writer --file=packages/features/admin/src/lib/server/admin-server-actions.ts`
2. **Today**: Create tests for all admin security functions
3. **This Week**: Achieve 100% coverage for P1 packages
4. **This Sprint**: Implement integration tests for auth flows

## Database Location

Test coverage database saved at: `.claude/data/test-coverage-db.json`

Use `/test-discovery --update` to refresh this analysis.
