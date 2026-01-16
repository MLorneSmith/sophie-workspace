# Chore: Renumber Test Shards to Use Only Numeric IDs

## Chore Description

The current E2E test shard configuration uses a mix of numeric and alphanumeric identifiers (e.g., `6a`, `6b`). This causes issues with the test-controller's argument parsing which only recognizes numeric shard IDs in the range 1-12. When a user runs `/test 6a`, the argument is not recognized as a valid shard, causing the full test suite to run instead.

This chore will:
1. Renumber all shards to use sequential numeric IDs (1-15)
2. Update the `apps/e2e/package.json` shard scripts
3. Update the `e2e-test-runner.cjs` shard configuration
4. Update the `/test` command documentation
5. Update the context documentation for E2E testing

## Relevant Files

Files to modify:

- **`apps/e2e/package.json`** - Contains the `test:shard*` scripts that need renaming from `test:shard6a`/`test:shard6b` to `test:shard6`/`test:shard7` (and shift subsequent shards)
- **`.ai/ai_scripts/testing/runners/e2e-test-runner.cjs`** - Contains the `loadTestGroups()` function with shard definitions that use alphanumeric IDs like `"6a"` and `"6b"`
- **`.ai/ai_scripts/testing/infrastructure/test-controller.cjs`** - Contains argument parsing logic that validates shard numbers (currently validates 1-12, needs to validate 1-15)
- **`.claude/commands/test.md`** - Contains the help documentation listing all shards with their numbers
- **`.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`** - Contains shard documentation that references the current numbering scheme

## Impact Analysis

### Dependencies Affected

- **Test orchestration scripts** - All scripts that reference shard numbers by ID
- **CI/CD workflows** - Any GitHub Actions or CI configs that reference specific shard numbers (need to verify)
- **Developer workflows** - Developers who have memorized the current shard numbers

### Risk Assessment

**Low Risk** - This is a renaming operation that doesn't change test functionality:
- No test logic changes
- No test file changes
- Simple string/number replacements
- Easy to verify with test runs

### Backward Compatibility

- Old shard numbers will no longer work after the change
- No deprecation period needed since this is internal tooling
- Documentation updates will inform users of new numbering

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/renumber-test-shards`
- [ ] Verify no CI workflows reference specific shard numbers
- [ ] Document current shard mapping for reference during migration

## Documentation Updates Required

- **`.claude/commands/test.md`** - Update help table with new shard numbers
- **`.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`** - Update shard documentation
- **`CLAUDE.md`** - No update needed (doesn't reference specific shard numbers)

## Rollback Plan

- Git revert the commit if issues are discovered
- No database migrations or persistent state changes
- Simple file-based changes that are fully reversible

## Step by Step Tasks

### Step 1: Create the New Shard Mapping

Define the new sequential numbering:

| Old ID | New ID | Name | Tests |
|--------|--------|------|-------|
| 1 | 1 | Smoke Tests | `tests/smoke/smoke.spec.ts` |
| 2 | 2 | Authentication | `tests/authentication/*.spec.ts` |
| 3 | 3 | Personal Accounts | `tests/account/*.spec.ts` |
| 4 | 4 | Admin & Invitations | `tests/admin/*.spec.ts`, `tests/invitations/*.spec.ts` |
| 5 | 5 | Accessibility | `tests/accessibility/*.spec.ts` |
| **6a** | **6** | Healthcheck | `tests/healthcheck.spec.ts` |
| **6b** | **7** | Payload Auth | `tests/payload/payload-auth.spec.ts` |
| 7 | **8** | Payload Collections | `tests/payload/payload-collections.spec.ts` |
| 8 | **9** | Payload Database | `tests/payload/payload-database.spec.ts` |
| 9 | **10** | User Billing | `tests/user-billing/user-billing.spec.ts` |
| 10 | **11** | Team Billing | `tests/team-billing/team-billing.spec.ts` |
| 11 | **12** | Config Verification | `tests/test-configuration-verification.spec.ts` |
| 12 | **13** | Team Accounts | `tests/team-accounts/*.spec.ts` |
| 13 | **14** | Payload Seeding | `tests/payload/seeding.spec.ts` |
| 14 | **15** | Payload Seeding Perf | `tests/payload/seeding-performance.spec.ts` |

### Step 2: Update `apps/e2e/package.json`

Rename the shard scripts:

- `test:shard6a` → `test:shard6`
- `test:shard6b` → `test:shard7`
- `test:shard7` → `test:shard8`
- `test:shard8` → `test:shard9`
- `test:shard9` → `test:shard10`
- `test:shard10` → `test:shard11`
- `test:shard11` → `test:shard12`
- `test:shard12` → `test:shard13`
- `test:shard13` → `test:shard14`
- `test:shard14` → `test:shard15`

### Step 3: Update `e2e-test-runner.cjs` Shard Definitions

In the `loadTestGroups()` function, update the shard array:

- Change `id: "6a"` to `id: 6`
- Change `id: "6b"` to `id: 7`
- Change all subsequent numeric IDs (7→8, 8→9, etc.)
- Update `shardCommand` references to match new script names

### Step 4: Update Argument Parsing in `test-controller.cjs`

Update the validation range from 1-12 to 1-15:

```javascript
// Current (line ~189-196):
if (/^\d+$/.test(arg)) {
    const shardNum = parseInt(arg, 10);
    if (shardNum >= 1 && shardNum <= 12) {  // ← Change to 15
```

Also update the `--shard` argument handler similarly.

### Step 5: Update `/test` Command Documentation

Update `.claude/commands/test.md` with new shard table:

| Shard | Name | Tests | Notes |
|-------|------|-------|-------|
| 1 | Smoke Tests | 9 | |
| 2 | Authentication | 21 | |
| 3 | Personal Accounts | 12 | |
| 4 | Admin & Invitations | 13 | |
| 5 | Accessibility | 21 | |
| 6 | Healthcheck | 1 | |
| 7 | Payload Auth | 9 | Auto-starts Payload on port 3021 |
| 8 | Payload Collections | 22 | Auto-starts Payload on port 3021 |
| 9 | Payload Database | 12 | Auto-starts Payload on port 3021 |
| 10 | User Billing | varies | Auto-starts Stripe webhook forwarder |
| 11 | Team Billing | varies | Auto-starts Stripe webhook forwarder |
| 12 | Config Verification | varies | |
| 13 | Team Accounts | 8 | |
| 14 | Payload Seeding | 12 | Auto-starts Payload on port 3021 |
| 15 | Payload Seeding Perf | 14 | Auto-starts Payload on port 3021 |

### Step 6: Update E2E Testing Context Documentation

Update `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`:
- Update the shard table in the "Parallel Test Execution (Sharding)" section
- Update the JSON scripts example
- Update the "Shard Groups for Logical Execution" table

### Step 7: Update Billing Shard Detection

In `e2e-test-runner.cjs`, update the `isBillingTestsRequested()` method:

```javascript
// Current:
const billingShards = [9, 10];

// New:
const billingShards = [10, 11];  // User Billing and Team Billing
```

### Step 8: Update Payload Shard Detection

Search for any hardcoded references to Payload shards (7, 8, 13, 14) and update them to the new numbers (7, 8, 9, 14, 15).

### Step 9: Run Validation Commands

Execute all validation commands to ensure zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions:

```bash
# 1. Verify package.json scripts are valid JSON
pnpm --filter e2e test:shard1 --help

# 2. Run quick smoke test to verify infrastructure
/test 1

# 3. Test the previously problematic shard (old 6a, new 6)
/test 6

# 4. Test a higher numbered shard to verify renumbering worked
/test 13

# 5. Run typecheck to ensure no TypeScript errors
pnpm typecheck

# 6. Run lint to ensure code quality
pnpm lint
```

## Notes

- The test-controller argument parser uses `/^\d+$/` regex which only matches pure numeric strings, explaining why "6a" was not recognized
- The current implementation has 15 shards total (1-5, 6a, 6b, 7-14), so the new numbering will be 1-15
- Payload-related shards (7-9, 14-15 in new numbering) require the Payload server to be running
- Billing shards (10-11 in new numbering) require the Stripe webhook container
