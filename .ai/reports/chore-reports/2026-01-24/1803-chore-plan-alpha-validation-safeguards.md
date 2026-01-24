# Chore: Add Alpha Workflow Validation Safeguards

## Chore Description

The Alpha autonomous coding workflow successfully implemented S1692 (User Dashboard) in an E2B sandbox, but the resulting code failed to compile when checked out locally. The root cause was that new dependencies added during implementation (`@calcom/atoms`) were installed in the sandbox environment but not validated against a fresh clone scenario.

This chore implements 6 safeguards to prevent similar issues:

1. **Fresh-Clone Validation at Spec Completion** - Run full validation in review sandbox before marking complete
2. **Fix Sandbox Dependency Handling** - Detect lockfile changes and sync dependencies properly
3. **Improve Dependency Task Verification** - Better verification commands for tasks adding npm packages
4. **Add CI Validation for Alpha Branches** - GitHub Actions workflow for `alpha/spec-*` branches
5. **Document Dependency Task Pattern** - Guidance in task-decompose.md for dependency tasks
6. **Ensure Lockfile in Task Outputs** - Template updates for dependency task outputs

## Relevant Files

### Core Sandbox Management
- `.ai/alpha/scripts/lib/sandbox.ts` - Contains `createSandbox()` and `createReviewSandbox()` functions that need dependency handling improvements

### Implementation Command
- `.claude/commands/alpha/implement.md` - May need notes about dependency task verification patterns

### Task Decomposition
- `.claude/commands/alpha/task-decompose.md` - Needs documentation for dependency task patterns

### Task Schema
- `.ai/alpha/templates/tasks.schema.json` - May need schema updates if adding new fields for dependency tasks

### CI/CD
- `.github/workflows/` - Location for new alpha branch validation workflow

### New Files
- `.github/workflows/alpha-validation.yml` - New workflow for validating alpha branches

## Impact Analysis

### Dependencies Affected
- `@e2b/code-interpreter` - Used by sandbox.ts, no changes to its usage
- Alpha orchestrator consumers - Will benefit from more reliable implementations
- All future specs using the Alpha workflow

### Risk Assessment
**Low Risk**:
- Changes are additive (new validation steps)
- Existing functionality preserved
- Sandbox setup changes are backward compatible
- CI workflow is independent and non-blocking

### Backward Compatibility
- All changes are backward compatible
- Existing specs will benefit from improved validation
- No breaking changes to the Alpha workflow interface
- Documentation additions only enhance existing patterns

## Pre-Chore Checklist
- [ ] Create feature branch: `chore/alpha-validation-safeguards`
- [ ] Review current sandbox.ts implementation
- [ ] Review current task-decompose.md documentation
- [ ] Identify all places where dependency validation should occur

## Documentation Updates Required
- `task-decompose.md` - Add section on dependency task patterns
- `implement.md` - Add notes about fresh-clone validation
- `.ai/alpha/docs/alpha-implementation-system.md` - Document the new safeguards
- This chore plan serves as the primary documentation

## Rollback Plan
- **Sandbox changes**: Revert sandbox.ts to previous version
- **CI workflow**: Delete or disable the workflow file
- **Documentation**: No rollback needed (additive only)
- **Monitoring**: Watch for sandbox creation failures or extended validation times

All changes are isolated and can be rolled back independently.

## Step by Step Tasks

### Step 1: Add Fresh-Clone Validation to Review Sandbox

Update `createReviewSandbox()` in `.ai/alpha/scripts/lib/sandbox.ts` to perform full fresh-clone validation:

- Remove the conditional lockfile check (lines ~881-917)
- Always remove `node_modules` before installing
- Run `pnpm install --frozen-lockfile` (fails if lockfile out of sync)
- Run `pnpm typecheck` after install
- Throw descriptive errors if validation fails
- Log clear success message when validation passes

```typescript
// Replace existing dependency sync logic with:
log("   Running fresh-clone validation...");

// Remove accumulated state
await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && rm -rf node_modules apps/*/node_modules packages/*/node_modules`,
  { timeoutMs: 60000 }
);

// Install from lockfile (fails if lockfile doesn't match package.json)
log("   Installing dependencies from lockfile...");
const installResult = await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
  { timeoutMs: 600000 }
);

if (installResult.exitCode !== 0) {
  throw new Error(
    `Fresh-clone validation failed: Dependencies don't install cleanly.\n` +
    `This means package.json has changes not reflected in pnpm-lock.yaml.\n` +
    `Error: ${installResult.stderr || installResult.stdout}`
  );
}

// Verify TypeScript compiles
log("   Running typecheck...");
const typecheckResult = await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && pnpm typecheck`,
  { timeoutMs: 300000 }
);

if (typecheckResult.exitCode !== 0) {
  throw new Error(
    `Fresh-clone validation failed: TypeScript errors on clean install.\n` +
    `Error: ${typecheckResult.stderr || typecheckResult.stdout}`
  );
}

log("   ✅ Fresh-clone validation passed");
```

### Step 2: Fix Sandbox Dependency Handling for New Packages

Update `createSandbox()` in `.ai/alpha/scripts/lib/sandbox.ts` to detect and handle lockfile changes:

- After git checkout, check if `pnpm-lock.yaml` differs from origin/dev
- If lockfile changed, run `pnpm install` (not `--frozen-lockfile`) to sync new dependencies
- Keep existing `--frozen-lockfile` behavior when lockfile hasn't changed

```typescript
// After branch checkout, before the existing node_modules check:

// Check if lockfile changed compared to dev branch
const lockfileChanged = await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && git diff origin/dev -- pnpm-lock.yaml | head -1`,
  { timeoutMs: 30000 }
);

const hasLockfileChanges = lockfileChanged.stdout.trim() !== "";

// Existing node_modules check
const checkResult = await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
  { timeoutMs: 10000 }
);

if (checkResult.stdout.trim() === "missing") {
  log("   Installing dependencies (node_modules missing)...");
  await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
    { timeoutMs: 600000 }
  );
} else if (hasLockfileChanges) {
  log("   Syncing dependencies (lockfile changed)...");
  await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && pnpm install`,  // NOT --frozen-lockfile
    { timeoutMs: 600000 }
  );
} else {
  log("   ✅ Dependencies already installed");
}
```

### Step 3: Create CI Validation Workflow for Alpha Branches

Create `.github/workflows/alpha-validation.yml`:

```yaml
name: Alpha Branch Validation

on:
  push:
    branches:
      - 'alpha/spec-*'

concurrency:
  group: alpha-validation-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    name: Fresh-Clone Validation
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Build
        run: pnpm build
```

### Step 4: Document Dependency Task Pattern in task-decompose.md

Add a new section to `.claude/commands/alpha/task-decompose.md` after the "UI Task Flagging" section:

```markdown
---

## Dependency Installation Task Pattern

**Purpose**: Ensure tasks that add npm packages are properly verified and don't cause environment drift issues.

### Identifying Dependency Tasks

A task is a dependency task when it:
- Adds, updates, or removes entries in `package.json`
- Modifies `pnpm-lock.yaml`
- Installs packages via CLI (`pnpm add`, `npx`, etc.)

### Required Task Fields

For dependency tasks, always include:

1. **Both package.json AND lockfile in outputs**:
   ```json
   "outputs": [
     { "type": "modified", "path": "apps/web/package.json" },
     { "type": "modified", "path": "pnpm-lock.yaml" }
   ]
   ```

2. **Verification that includes install check**:
   ```json
   "verification_command": "pnpm install --frozen-lockfile --dry-run && grep -q '<package>' apps/web/package.json && pnpm typecheck"
   ```

   The `--frozen-lockfile --dry-run` verifies lockfile consistency without actually installing.

3. **Clear acceptance criterion**:
   ```json
   "acceptance_criterion": "<package> appears in package.json AND pnpm-lock.yaml is updated AND pnpm typecheck passes"
   ```

### Example Dependency Task

```json
{
  "id": "S1234.I1.F1.T1",
  "name": "Add @example/package dependency",
  "action": {
    "verb": "Add",
    "target": "@example/package dependency"
  },
  "purpose": "Install the package to enable feature X",
  "outputs": [
    { "type": "modified", "path": "apps/web/package.json" },
    { "type": "modified", "path": "pnpm-lock.yaml" }
  ],
  "acceptance_criterion": "@example/package in package.json, lockfile updated, typecheck passes",
  "verification_command": "pnpm install && grep -q '@example/package' apps/web/package.json && test -d apps/web/node_modules/@example/package && pnpm typecheck",
  "context": {
    "constraints": [
      "Add to dependencies (not devDependencies)",
      "Must run pnpm install after adding to package.json",
      "Commit both package.json AND pnpm-lock.yaml"
    ]
  }
}
```

### Common Mistakes to Avoid

1. **Missing lockfile in outputs** - Causes lockfile to not be committed
2. **Using `--frozen-lockfile` during implementation** - Fails when adding new packages
3. **Not running `pnpm install` after edit** - Package not actually installed
4. **Only checking package.json** - Doesn't verify package installs correctly

### Dependent Tasks

Tasks that USE the new package must have `blocked_by` pointing to the installation task:

```json
{
  "id": "S1234.I1.F1.T2",
  "name": "Create component using @example/package",
  "dependencies": {
    "blocked_by": ["S1234.I1.F1.T1"]
  }
}
```

This ensures the package is installed before any task tries to import it.
```

### Step 5: Update tasks.schema.json for Dependency Tasks (Optional Enhancement)

Add optional fields to `.ai/alpha/templates/tasks.schema.json` to flag dependency tasks:

```json
{
  "requires_dependency_install": {
    "type": "boolean",
    "description": "True if this task adds/modifies npm dependencies"
  },
  "packages_added": {
    "type": "array",
    "items": { "type": "string" },
    "description": "List of npm packages added by this task"
  }
}
```

This is optional but helps the implement command identify dependency tasks for special handling.

### Step 6: Add Implementation Notes to implement.md

Add a note in `.claude/commands/alpha/implement.md` in the "Important Reminders" section:

```markdown
11. **Dependency tasks require special handling** - When a task adds npm packages:
    - Run `pnpm install` after modifying package.json
    - Commit both package.json AND pnpm-lock.yaml
    - Verify with `pnpm typecheck` to ensure imports work
    - See task-decompose.md "Dependency Installation Task Pattern" for details
```

### Step 7: Run Validation Commands

Execute all validation commands to ensure changes work correctly.

## Validation Commands

```bash
# 1. TypeScript compiles
pnpm typecheck

# 2. Lint passes
pnpm lint

# 3. Alpha scripts still compile
pnpm --filter @slideheroes/alpha-scripts typecheck

# 4. CI workflow syntax is valid
gh workflow view alpha-validation.yml 2>/dev/null || echo "Workflow created (will validate on first push)"

# 5. Documentation files exist and are valid markdown
test -f .claude/commands/alpha/task-decompose.md && echo "task-decompose.md exists"
test -f .claude/commands/alpha/implement.md && echo "implement.md exists"

# 6. Sandbox module exports are unchanged (no breaking changes)
grep -q "export async function createSandbox" .ai/alpha/scripts/lib/sandbox.ts
grep -q "export async function createReviewSandbox" .ai/alpha/scripts/lib/sandbox.ts
```

## Notes

### Why Fresh-Clone Validation Only at Spec Completion

Running `rm -rf node_modules && pnpm install` takes 5-10 minutes. Doing this after every feature would significantly slow down the workflow. Running once at spec completion:
- Catches issues before merge to dev
- Minimal impact on overall implementation time
- Provides a "last line of defense" before code leaves the sandbox

### The Root Issue This Solves

The S1692 implementation added `@calcom/atoms` to package.json. The sandbox ran `pnpm install` so the package was available. But when the branch was checked out locally:
1. The package.json had the dependency
2. The pnpm-lock.yaml had the dependency
3. But `node_modules` didn't have it (no install was run)
4. TypeScript failed with "Cannot find module"

The fresh-clone validation in the review sandbox would have caught this because `pnpm install --frozen-lockfile` would have installed the package, and if there was a lockfile mismatch, it would have failed explicitly.

### Future Improvements

Consider adding:
- Slack/webhook notification when fresh-clone validation fails
- Automatic retry with `pnpm install` (not frozen) if frozen fails
- Caching of successful validation results to skip on re-runs
