# Chore: Extract shared createLogger to lib/logger.ts

## Chore Description

Extract the `createLogger(uiEnabled)` function that is copy-pasted across 9 files in the Alpha orchestrator into a single shared `lib/logger.ts` module. This is the **P2** recommendation from the [comprehensive assessment](.ai/reports/research-reports/2026-02-06/alpha-orchestrator-comprehensive-assessment.md).

The function creates a conditional logger that suppresses `console.log` output when the Ink-based UI dashboard is active. Currently, 9 files each define their own private copy of this function with **3 slightly different variants**:

| Variant | Methods | Files |
|---------|---------|-------|
| Basic | `{ log }` | `deadlock-handler.ts`, `feature.ts`, `sandbox.ts`, `progress.ts`, `health.ts` (5 files) |
| With error | `{ log, error }` | `orchestrator.ts`, `lock.ts`, `work-queue.ts` (3 files) |
| Full | `{ log, warn, error }` | `database.ts` (1 file) |

The shared module should provide the superset (`log`, `warn`, `error`) so all consumers get a consistent API. Call sites that only destructure `{ log }` will continue to work unchanged.

**Note**: The dead code removal portion of the original P2 recommendation (deleting `heartbeat-monitor.ts`, `recovery-manager.ts`, `state-machine.ts`) was already absorbed into #1955 (P1: Centralized state transitions).

## Relevant Files

### Files with `createLogger` duplicates (must be modified)

- `.ai/alpha/scripts/lib/deadlock-handler.ts:44` - Basic variant `{ log }`. Used at line 269.
- `.ai/alpha/scripts/lib/orchestrator.ts:84` - Error variant `{ log, error }`. Used at line 265.
- `.ai/alpha/scripts/lib/feature.ts:73` - Basic variant `{ log }`. Used at line 168.
- `.ai/alpha/scripts/lib/sandbox.ts:365` - Basic variant `{ log }`. Used at lines 424, 513, 588, 856, 1287, 1381 (6 call sites).
- `.ai/alpha/scripts/lib/progress.ts:38` - Basic variant `{ log }`. Used at line 68.
- `.ai/alpha/scripts/lib/lock.ts:40` - Error variant `{ log, error }`. Used at lines 143, 287, 380.
- `.ai/alpha/scripts/lib/database.ts:34` - Full variant `{ log, warn, error }`. Used at lines 63, 148, 297, 472, 592, 658, 700 (7 call sites).
- `.ai/alpha/scripts/lib/health.ts:37` - Basic variant `{ log }`. Used at lines 86, 205, 274.
- `.ai/alpha/scripts/lib/work-queue.ts:22` - Error variant `{ log, error }`. Used at lines 70, 219, 294.

### Barrel export file (must be modified)

- `.ai/alpha/scripts/lib/index.ts` - Add export for the new shared logger module.

### New Files

- `.ai/alpha/scripts/lib/logger.ts` - New shared module exporting `createLogger(uiEnabled)`.

## Impact Analysis

### Dependencies Affected

- All 9 files listed above import from the new `logger.ts` module instead of defining their own copy.
- No external packages or scripts depend on `createLogger` -- it is a private function in each file.
- The `work-loop.ts` file does NOT have its own `createLogger` (it uses the `WorkLoop` class constructor to pass `uiEnabled` directly). No change needed.

### Risk Assessment

**Low Risk** - This is a purely mechanical extraction:
- No behavior change -- the function body is identical across all copies (with additive methods in some variants).
- The shared version returns the superset of all methods, so existing destructuring patterns continue to work.
- TypeScript will catch any import errors at compile time.

### Backward Compatibility

- Fully backward compatible. No behavior changes.
- All existing call sites use the same function signature: `createLogger(uiEnabled: boolean)`.
- Consumers that destructure only `{ log }` are unaffected by the shared version also exporting `warn` and `error`.

## Pre-Chore Checklist

- [ ] Create feature branch: `chore/extract-shared-logger`
- [ ] Verify all existing tests pass: `pnpm vitest run .ai/alpha/scripts/lib/__tests__/`
- [ ] Verify typecheck passes: `pnpm typecheck`
- [ ] Confirm no other files outside `lib/` define `createLogger`

## Documentation Updates Required

- No documentation updates needed -- this is an internal refactoring of private utility functions.
- Code comments in the new `logger.ts` file documenting the purpose and usage pattern.

## Rollback Plan

- **Git revert**: Single commit, trivially reversible.
- **No database or config changes**.
- **Zero behavioral change** means rollback is only needed if a typo or import error is introduced.

## Step by Step Tasks

### Step 1: Create `lib/logger.ts` with the shared `createLogger` function

- Create `.ai/alpha/scripts/lib/logger.ts`
- Implement the superset version that includes all three methods (`log`, `warn`, `error`):
  ```typescript
  /**
   * Create a conditional logger that only outputs when UI is disabled.
   * When UI is enabled, console output is suppressed to avoid interfering
   * with the Ink-based dashboard. Errors are always logged regardless.
   */
  export function createLogger(uiEnabled: boolean) {
    return {
      log: (...args: unknown[]) => {
        if (!uiEnabled) console.log(...args);
      },
      warn: (...args: unknown[]) => {
        if (!uiEnabled) console.warn(...args);
      },
      error: (...args: unknown[]) => {
        // Always log errors, even in UI mode
        console.error(...args);
      },
    };
  }
  ```
- This matches the `database.ts` full variant exactly, which is the superset of all 3 variants.

### Step 2: Update `index.ts` barrel exports

- Add `export { createLogger } from "./logger.js";` to `.ai/alpha/scripts/lib/index.ts`

### Step 3: Update `deadlock-handler.ts`

- Add import: `import { createLogger } from "./logger.js";`
- Remove the local `createLogger` function definition (lines ~41-50, including the JSDoc comment and section header)
- No changes to call sites -- `const { log } = createLogger(uiEnabled)` at line 269 remains unchanged.

### Step 4: Update `orchestrator.ts`

- Add import: `import { createLogger } from "./logger.js";`
- Remove the local `createLogger` function definition (lines ~78-92, including JSDoc and section header)
- No changes to call sites -- `const { log } = createLogger(options.ui)` at line 265 remains unchanged.

### Step 5: Update `feature.ts`

- Add import: `import { createLogger } from "./logger.js";`
- Remove the local `createLogger` function definition (lines ~69-79, including JSDoc and section header)
- No changes to call sites.

### Step 6: Update `sandbox.ts`

- Add import: `import { createLogger } from "./logger.js";`
- Remove the local `createLogger` function definition (lines ~361-371, including JSDoc and section header)
- No changes to call sites (6 call sites, all unchanged).

### Step 7: Update `progress.ts`

- Add import: `import { createLogger } from "./logger.js";`
- Remove the local `createLogger` function definition (lines ~33-44, including JSDoc and section header)
- No changes to call sites.

### Step 8: Update `lock.ts`

- Add import: `import { createLogger } from "./logger.js";`
- Remove the local `createLogger` function definition (lines ~35-48, including JSDoc and section header)
- No changes to call sites.

### Step 9: Update `database.ts`

- Add import: `import { createLogger } from "./logger.js";`
- Remove the local `createLogger` function definition (lines ~28-44, including JSDoc and section header)
- No changes to call sites -- this file already uses the full variant that matches the shared version exactly.

### Step 10: Update `health.ts`

- Add import: `import { createLogger } from "./logger.js";`
- Remove the local `createLogger` function definition (lines ~32-43, including JSDoc and section header)
- No changes to call sites.

### Step 11: Update `work-queue.ts`

- Add import: `import { createLogger } from "./logger.js";`
- Remove the local `createLogger` function definition (lines ~17-30, including JSDoc and section header)
- No changes to call sites.

### Step 12: Run validation commands

- Run the full validation suite (see Validation Commands below).
- Verify zero local `createLogger` definitions remain outside of `logger.ts`.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Type safety
pnpm typecheck

# 2. Linting
pnpm lint:fix

# 3. Formatting
pnpm format:fix

# 4. Run orchestrator-specific tests
pnpm vitest run .ai/alpha/scripts/lib/__tests__/

# 5. Verify no local createLogger definitions remain outside logger.ts
# Should return ONLY logger.ts
grep -rn 'function createLogger' .ai/alpha/scripts/lib/ --include='*.ts' | grep -v '__tests__' | grep -v 'logger.ts'
# Expected: NO output (all definitions removed from consumer files)

# 6. Verify all 9 files import from the shared module
grep -rn "from.*[./]logger" .ai/alpha/scripts/lib/ --include='*.ts' | grep -v '__tests__' | grep -v 'index.ts' | wc -l
# Expected: 9 (one import per consumer file)

# 7. Verify the shared module exists and exports createLogger
grep -q 'export function createLogger' .ai/alpha/scripts/lib/logger.ts && echo "PASS: shared logger exists"
```

## Notes

- **Ordering with #1955 (P1)**: This chore is independent of #1955. It can be implemented before, after, or in parallel with the centralized state transitions chore. However, if implemented first, it slightly reduces the diff for #1955 since some files will have cleaner imports.

- **The 3 variant difference is intentional in the shared version**: The `database.ts` variant is the superset (log + warn + error). Using this as the shared implementation means all consumers get `warn` and `error` for free, even if they only destructure `{ log }`. This is a minor improvement -- some files that previously only had `log` can now use `warn` or `error` if needed in the future, without adding a new import.

- **`error` always logs regardless of `uiEnabled`**: This is an intentional design decision present in 4 of the 9 copies. Errors should always be visible, even when the Ink UI is active. The shared version preserves this behavior.

- **Estimated effort**: 30 minutes. This is a textbook extract-and-share refactoring with zero behavioral changes.
