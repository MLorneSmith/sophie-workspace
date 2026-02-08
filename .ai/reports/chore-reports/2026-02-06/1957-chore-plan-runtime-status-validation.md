# Chore: Add runtime validation for progress file status values

## Chore Description

Add runtime validation for status values read from sandbox progress files (`.initiative-progress.json`) before they propagate into orchestrator feature state. This is the **P3** recommendation from the [comprehensive assessment](.ai/reports/research-reports/2026-02-06/alpha-orchestrator-comprehensive-assessment.md).

### The Problem

TypeScript union types (`"in_progress" | "completed" | "failed" | "blocked"`) are erased at runtime. When an external agent (Claude, GPT, etc.) writes an arbitrary string to the progress file's `status` field, `JSON.parse()` happily accepts it. The orchestrator then propagates this unchecked value into `feature.status`, corrupting the manifest state.

### The #1952 Bug

1. GPT agent wrote `{"status": "blocked"}` to `.initiative-progress.json`
2. `feature.ts:700-701` checked `parsed.status === "blocked"` and set `status = "blocked"`
3. `feature.ts:761` propagated it: `feature.status = "blocked"`
4. No recovery code handles `"blocked"` -- feature stuck permanently
5. Dependent features blocked, orchestrator deadlocked at 33% completion

### Where Validation Is Missing

There are **4 places** where progress file JSON is parsed from sandboxes with no runtime status validation:

| Location | Parser | Status Type | Validation |
|----------|--------|-------------|------------|
| `progress-file.ts:80` | `readProgressFile()` | `ProgressFileData.status` (union) | None -- `as ProgressFileData` cast |
| `feature.ts:692` | Direct `JSON.parse` | `parsed.status` (any) | Partial -- checks known values but propagates `"blocked"` |
| `health.ts:131` | Direct `JSON.parse` | `SandboxProgress.status` (string) | None |
| `progress.ts:339` | Direct `JSON.parse` | `SandboxProgress.status` (string) | None |

Additionally, `SandboxProgress.status` in `orchestrator.types.ts:281` is typed as `status?: string` -- it accepts any string value with no compile-time constraint.

## Relevant Files

### Files that parse progress file status (must be modified)

- `.ai/alpha/scripts/lib/progress-file.ts:80` - Primary progress file reader. `readProgressFile()` does `JSON.parse(result.stdout) as ProgressFileData` with no runtime check. This is the **single best place** to add validation since other code paths also read directly.
- `.ai/alpha/scripts/lib/feature.ts:692-708` - Direct `JSON.parse` of progress file output. Lines 698-708 check for `"completed"`, `"blocked"`, `"failed"` but propagate `"blocked"` directly to `feature.status`. The `"blocked"` check at line 700 must be changed to remap.
- `.ai/alpha/scripts/lib/health.ts:131` - `JSON.parse(result.stdout)` cast to `SandboxProgress`. Status is used indirectly for heartbeat checks.
- `.ai/alpha/scripts/lib/progress.ts:339` - `JSON.parse(result.stdout)` cast to `SandboxProgress`. Status flows to UI progress display.

### Type definition files (must be modified)

- `.ai/alpha/scripts/types/orchestrator.types.ts:281` - `SandboxProgress.status` typed as `string`. Should be narrowed to a union type.
- `.ai/alpha/scripts/lib/progress-file.ts:29` - `ProgressFileData.status` includes `"blocked"` in the union. Should be narrowed to only valid orchestrator-internal statuses.

### Test files (must be created/modified)

- `.ai/alpha/scripts/lib/__tests__/progress.spec.ts` - Existing progress tests. Add validation test cases.

### New Files

- No new files needed. All changes fit within existing modules.

## Impact Analysis

### Dependencies Affected

- `feature.ts` is the primary consumer of validated progress status -- it determines `feature.status` from the progress file.
- `health.ts` and `progress.ts` consume `SandboxProgress` for monitoring -- they don't write to `feature.status` but display/log the status.
- UI progress poller (`ui/hooks/useProgressPoller.ts`) reads `SandboxProgressFile` separately -- it is display-only and does not affect orchestrator state. Low priority for validation.

### Risk Assessment

**Low Risk** -- This is a defensive validation layer:
- No behavior change for valid status values (`"in_progress"`, `"completed"`, `"failed"`)
- `"blocked"` is remapped to `"failed"` (recoverable state) instead of propagated verbatim
- Unknown statuses default to `"in_progress"` (safe fallback -- will be detected by health checks)
- All changes are additive validation, not restructuring

### Backward Compatibility

- Fully backward compatible for valid statuses.
- `"blocked"` status will now be remapped to `"failed"` with a warning log. This is a deliberate behavior change that prevents the #1952 deadlock bug.
- Existing `spec-manifest.json` files with `"blocked"` features will not be affected (this validation is for incoming progress file data, not manifest data).

## Pre-Chore Checklist

- [ ] Create feature branch: `chore/runtime-status-validation`
- [ ] Verify all existing tests pass: `pnpm vitest run .ai/alpha/scripts/lib/__tests__/`
- [ ] Verify typecheck passes: `pnpm typecheck`

## Documentation Updates Required

- Code comments in `progress-file.ts` documenting the validation logic and remapping rules.
- No external documentation changes (internal orchestrator hardening).

## Rollback Plan

- **Git revert**: Single commit, trivially reversible.
- **No database or config changes**.
- **Monitoring**: If validation is too strict (rejects legitimate statuses), the warning logs will make it immediately visible. The fallback to `"in_progress"` is safe -- health checks will handle stuck features.

## Step by Step Tasks

### Step 1: Define valid progress status constants

- In `.ai/alpha/scripts/lib/progress-file.ts`, add a `VALID_PROGRESS_STATUSES` set and a `ValidProgressStatus` type:
  ```typescript
  /** Valid status values that the orchestrator recognizes from progress files. */
  export const VALID_PROGRESS_STATUSES = new Set([
    "in_progress",
    "completed",
    "failed",
  ] as const);

  export type ValidProgressStatus = "in_progress" | "completed" | "failed";
  ```
- Note: `"blocked"` is deliberately excluded from valid statuses. It will be remapped.

### Step 2: Create `validateProgressStatus()` function

- In `.ai/alpha/scripts/lib/progress-file.ts`, add a validation function:
  ```typescript
  /**
   * Validate and normalize a progress file status value.
   *
   * TypeScript unions are erased at runtime. External agents can write any
   * string to the progress file. This function ensures only valid statuses
   * propagate into the orchestrator.
   *
   * Remapping rules:
   * - "blocked" -> "failed" (Bug fix #1952: prevents unrecoverable state)
   * - Unknown values -> "in_progress" (safe fallback, health checks will catch stuck features)
   *
   * @param rawStatus - The raw status string from the progress file
   * @returns A valid orchestrator status value
   */
  export function validateProgressStatus(rawStatus: unknown): ValidProgressStatus {
    if (typeof rawStatus === "string" && VALID_PROGRESS_STATUSES.has(rawStatus as ValidProgressStatus)) {
      return rawStatus as ValidProgressStatus;
    }

    // Remap known-but-invalid statuses
    if (rawStatus === "blocked") {
      console.warn(
        `[STATUS_VALIDATION] Remapping "blocked" -> "failed" (agent wrote non-orchestrator status)`,
      );
      return "failed";
    }

    // Unknown status - default to in_progress (health checks will handle)
    console.warn(
      `[STATUS_VALIDATION] Unknown progress status "${String(rawStatus)}" -> defaulting to "in_progress"`,
    );
    return "in_progress";
  }
  ```

### Step 3: Apply validation in `readProgressFile()`

- In `progress-file.ts:80`, after `JSON.parse`, validate the status:
  ```typescript
  const raw = JSON.parse(result.stdout);
  const data: ProgressFileData = {
    ...raw,
    status: validateProgressStatus(raw.status),
  };
  return { success: true, data };
  ```
- Update `ProgressFileData.status` type from `"in_progress" | "completed" | "failed" | "blocked"` to `ValidProgressStatus` (remove `"blocked"`).

### Step 4: Fix the critical propagation in `feature.ts:698-708`

- Remove the explicit `"blocked"` check at lines 700-701. The validated status from `readProgressFile()` will never be `"blocked"`.
- However, `feature.ts:692` does its own `JSON.parse` (not via `readProgressFile()`). Apply validation here too:
  ```typescript
  const parsed = JSON.parse(progressResult.stdout || "{}");
  tasksCompleted = parsed.completed_tasks?.length || 0;
  const validatedStatus = validateProgressStatus(parsed.status);
  progressFileStatus = validatedStatus;

  if (validatedStatus === "completed") {
    status = "completed";
  } else if (validatedStatus === "failed" || result.exitCode !== 0) {
    status = "failed";
  } else {
    status = "pending";
  }
  ```
- Import `validateProgressStatus` from `./progress-file.js`.
- Remove the `else if (parsed.status === "blocked")` branch entirely (lines 700-701).

### Step 5: Narrow `SandboxProgress.status` type

- In `.ai/alpha/scripts/types/orchestrator.types.ts:281`, change:
  ```typescript
  // Before:
  status?: string;
  // After:
  status?: "in_progress" | "completed" | "failed";
  ```
- This provides compile-time safety for code that consumes `SandboxProgress`. The `health.ts:131` and `progress.ts:339` parsers cast to this type, so narrowing it adds a layer of documentation even though `JSON.parse` doesn't enforce it.

### Step 6: Add validation to `health.ts` progress parsing

- In `health.ts:131`, after `JSON.parse`, validate status:
  ```typescript
  const raw = JSON.parse(result.stdout);
  const progress: SandboxProgress = {
    ...raw,
    status: raw.status ? validateProgressStatus(raw.status) : undefined,
  };
  ```
- Import `validateProgressStatus` from `./progress-file.js`.

### Step 7: Add validation to `progress.ts` polling parser

- In `progress.ts:339`, after `JSON.parse`, validate status:
  ```typescript
  const raw = JSON.parse(result.stdout);
  const progress: SandboxProgress = {
    ...raw,
    status: raw.status ? validateProgressStatus(raw.status) : undefined,
  };
  ```
- Import `validateProgressStatus` from `./progress-file.js`.

### Step 8: Add unit tests

- In `.ai/alpha/scripts/lib/__tests__/progress.spec.ts` (or create `progress-file.spec.ts` if needed), add tests:
  ```typescript
  describe("validateProgressStatus", () => {
    it("passes through valid statuses unchanged", () => {
      expect(validateProgressStatus("in_progress")).toBe("in_progress");
      expect(validateProgressStatus("completed")).toBe("completed");
      expect(validateProgressStatus("failed")).toBe("failed");
    });

    it("remaps 'blocked' to 'failed'", () => {
      expect(validateProgressStatus("blocked")).toBe("failed");
    });

    it("defaults unknown strings to 'in_progress'", () => {
      expect(validateProgressStatus("unknown")).toBe("in_progress");
      expect(validateProgressStatus("running")).toBe("in_progress");
      expect(validateProgressStatus("")).toBe("in_progress");
    });

    it("handles non-string values", () => {
      expect(validateProgressStatus(undefined)).toBe("in_progress");
      expect(validateProgressStatus(null)).toBe("in_progress");
      expect(validateProgressStatus(42)).toBe("in_progress");
    });
  });
  ```

### Step 9: Run validation commands

- Run the full validation suite (see below).
- Verify the `"blocked"` propagation path in `feature.ts` is eliminated.

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

# 5. Verify "blocked" is no longer propagated to feature.status in feature.ts
# The line `status = "blocked"` should NOT exist in feature.ts
grep -n 'status = "blocked"' .ai/alpha/scripts/lib/feature.ts
# Expected: NO output

# 6. Verify validateProgressStatus is used at all 4 parse sites
grep -rn 'validateProgressStatus' .ai/alpha/scripts/lib/ --include='*.ts' | grep -v '__tests__'
# Expected: progress-file.ts (definition + use), feature.ts (use), health.ts (use), progress.ts (use)

# 7. Verify SandboxProgress.status is narrowed
grep -A1 'status?' .ai/alpha/scripts/types/orchestrator.types.ts | head -3
# Expected: status?: "in_progress" | "completed" | "failed"
```

## Notes

- **Relationship to #1955 (P1: Centralized state transitions)**: P3 is complementary to P1. P1 prevents invalid `feature.status` transitions; P3 prevents invalid values from entering the system in the first place. They can be implemented independently, but P3 is simpler and faster (1 hour vs 4-6 hours) so it's a good quick win.

- **Why remap `"blocked"` to `"failed"` instead of `"pending"`**: `"failed"` triggers the retry mechanism (deadlock handler will attempt recovery). `"pending"` would immediately re-queue the feature, which might hit the same blocker again without any diagnostic information. `"failed"` preserves the error context and increments `retry_count`.

- **Why default unknown statuses to `"in_progress"` instead of `"failed"`**: An unknown status might be a harmless variant (e.g., `"running"` instead of `"in_progress"`). Defaulting to `"in_progress"` is the safest option -- health checks will detect if the feature is actually stuck and escalate to failure. Defaulting to `"failed"` would cause unnecessary retries.

- **The `ProgressFileData` type change**: Removing `"blocked"` from the union makes `readProgressFile()` return only valid orchestrator statuses. Any code that previously checked `data.status === "blocked"` will get a TypeScript error, which is the desired behavior -- the compiler will flag all remaining propagation paths.

- **UI poller (`useProgressPoller.ts`)**: This uses a separate `SandboxProgressFile` type and is display-only. It does not affect orchestrator state. Adding validation there is optional and can be done later if needed.

- **Estimated effort**: 1 hour.
