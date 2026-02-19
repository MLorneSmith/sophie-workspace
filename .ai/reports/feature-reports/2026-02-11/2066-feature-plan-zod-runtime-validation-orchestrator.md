# Feature: Zod Runtime Validation at Orchestrator I/O Boundaries

## Feature Description

Add Zod runtime validation schemas to all JSON I/O boundaries in the Alpha orchestrator. The orchestrator reads JSON data from multiple untrusted sources (E2B sandbox progress files, manifest files, overall progress files) that are written by external AI agents (Claude Code and GPT/Codex). TypeScript type annotations provide compile-time safety but zero runtime enforcement. This has caused 5+ crashes and deadlocks (#1927, #1937, #1952, #2048, #2065) when GPT agents wrote malformed JSON missing required fields.

This feature adds Zod schemas at the parse boundary so malformed data is caught immediately with clear error messages, and safe defaults are applied instead of propagating `undefined` values through the system.

## User Story

As a developer running the Alpha orchestrator
I want JSON from sandbox agents to be validated at parse time
So that malformed data from GPT/Codex agents causes clear warnings instead of cryptic crashes

## Problem Statement

The orchestrator has accumulated 20+ bugs in 3 weeks, with a recurring pattern: AI agents in sandboxes write JSON progress files that don't match the expected TypeScript interfaces. Since `JSON.parse()` returns `any` and TypeScript types are erased at runtime, malformed data propagates unchecked through the data pipeline until it causes a crash in the UI layer, a deadlock in the state machine, or an infinite retry loop. Each new GPT run surfaces a new non-compliance issue because there's no runtime validation.

## Solution Statement

Create Zod schemas that mirror the existing TypeScript interfaces (`SandboxProgressFile`, `ProgressFileData`, `SandboxProgress`, `OverallProgressFile`) and use `schema.safeParse()` at every `JSON.parse()` boundary. On validation failure, provide sensible defaults and log warnings. This gives the orchestrator a single "immune system" that catches all malformed data at the boundary, regardless of which agent wrote it.

## Relevant Files

Use these files to implement the feature:

**Core progress file reading (primary targets):**
- `.ai/alpha/scripts/lib/progress-file.ts` — `readProgressFile()` reads from sandbox via shell command, parses JSON. **Primary validation target.**
- `.ai/alpha/scripts/lib/progress.ts` — `startProgressPolling()` reads sandbox progress via `cat` and `JSON.parse()`. **Primary validation target.**
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` — `createFsProgressReader().readProgressFile()` and `readOverallProgress()` read local JSON files. **Primary validation target.**

**Type definitions (schema source of truth):**
- `.ai/alpha/scripts/ui/types.ts` — Defines `SandboxProgressFile` interface (UI poller variant, ~40 fields)
- `.ai/alpha/scripts/types/orchestrator.types.ts` — Defines `SandboxProgress` interface (orchestrator variant, ~15 fields)
- `.ai/alpha/scripts/lib/progress-file.ts` — Defines `ProgressFileData` interface (PTY recovery variant, ~10 fields)

**Secondary JSON.parse boundaries (lower priority):**
- `.ai/alpha/scripts/lib/manifest.ts:213` — reads `tasks.json`
- `.ai/alpha/scripts/lib/manifest.ts:860` — reads `spec-manifest.json`
- `.ai/alpha/scripts/lib/manifest.ts:950` — reads sandbox progress for sync
- `.ai/alpha/scripts/lib/health.ts:117` — parses health check output
- `.ai/alpha/scripts/lib/feature.ts:683` — parses progress result

**Existing tests (must remain passing):**
- `.ai/alpha/scripts/lib/__tests__/progress.spec.ts`
- `.ai/alpha/scripts/lib/__tests__/pty-wrapper.spec.ts`
- `.ai/alpha/scripts/lib/__tests__/work-loop.test.ts`
- `.ai/alpha/scripts/lib/__tests__/work-loop-promise-timeout.spec.ts`
- `.ai/alpha/scripts/ui/__tests__/SandboxColumn.spec.ts`
- `.ai/alpha/scripts/lib/__tests__/ui-progress-poller.spec.ts`

### New Files

- `.ai/alpha/scripts/lib/schemas/progress.schema.ts` — Zod schemas for all progress file variants
- `.ai/alpha/scripts/lib/schemas/index.ts` — Barrel export
- `.ai/alpha/scripts/lib/__tests__/progress-schema.spec.ts` — Schema validation tests

## Impact Analysis

### Dependencies Affected
- **New dependency**: `zod@^4.1.13` added to `.ai/alpha/scripts/package.json` (matches workspace standard)
- **Consuming modules**: `progress-file.ts`, `progress.ts`, `useProgressPoller.ts`, `manifest.ts`, `health.ts`, `feature.ts`
- **No downstream consumers affected** — schemas are internal to the orchestrator

### Risk Assessment
- **Low Risk**: Well-understood pattern (Zod is used in 5+ packages in this monorepo), isolated to orchestrator scripts, no changes to external APIs or database schemas. The schemas mirror existing TypeScript interfaces exactly.

### Backward Compatibility
- Fully backward compatible. Zod `safeParse()` with defaults means malformed data that previously caused crashes will now silently degrade to safe defaults.
- The existing `validateProgressStatus()` function in `progress-file.ts` already implements this pattern manually for the `status` field. This feature generalizes that pattern to all fields.
- No feature flags needed — validation is always-on with graceful degradation.

### Performance Impact
- **Negligible**: Zod schema parsing adds ~0.1ms per validation. Progress polling runs every 5-30 seconds. The total overhead is <0.01% of polling time.
- **Bundle size**: Zod adds ~13KB minified. The orchestrator is a Node.js CLI tool (not a browser bundle), so size is irrelevant.
- **No database impact**: This feature only validates in-memory JSON parsing.

### Security Considerations
- **Improves security posture**: Runtime validation is a defense-in-depth measure against malformed input from sandboxes.
- **No new attack surface**: Schemas only validate data shape, they don't execute sandbox content.
- **Existing credentials handling unchanged**: Environment variable parsing in `spec-orchestrator.ts` and `environment.ts` is out of scope.

## Pre-Feature Checklist
Before starting implementation:
- [ ] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/zod-orchestrator-validation`
- [ ] Review existing `validateProgressStatus()` pattern in `progress-file.ts`
- [ ] Review Zod v4 API (project uses `^4.1.13`)
- [ ] Identify all `JSON.parse()` call sites in orchestrator scripts
- [ ] Confirm existing tests pass before changes
- [ ] Verify `zod@^4.1.13` is the correct version for this workspace

## Documentation Updates Required
- Update `MEMORY.md` with schema location and pattern
- Add inline comments documenting the validation boundary pattern
- No external documentation needed (internal tooling)

## Rollback Plan
- Remove the `zod` dependency from `package.json` and revert to raw `JSON.parse()` with `as` casts
- The defensive defaults added in #2065 (the `truncate()` fix) remain as a secondary safety net
- No database changes to rollback

## Implementation Plan

### Phase 1: Foundation
1. Add `zod` dependency to `.ai/alpha/scripts/package.json`
2. Create Zod schemas in a new `schemas/` directory mirroring existing TypeScript interfaces
3. Create a `safeParseProgress()` utility that wraps `schema.safeParse()` with logging and defaults

### Phase 2: Core Implementation
4. Wire Zod validation into the 3 primary read boundaries:
   - `readProgressFile()` in `progress-file.ts` (sandbox → orchestrator)
   - `startProgressPolling()` in `progress.ts` (sandbox → orchestrator)
   - `createFsProgressReader()` in `useProgressPoller.ts` (disk → UI)
5. Wire Zod validation into 3 secondary boundaries:
   - `loadManifest()` in `manifest.ts`
   - `syncSandboxProgressToManifest()` in `manifest.ts`
   - Health check parsing in `health.ts`

### Phase 3: Integration
6. Write tests covering malformed input scenarios (missing fields, wrong types, extra fields)
7. Verify all existing tests pass
8. Remove the manual defensive defaults added in #2065 from `useProgressPoller.ts` (Zod handles this now)

## Step by Step Tasks

### Step 1: Add Zod dependency
- Run `pnpm --filter @slideheroes/alpha-scripts add zod@^4.1.13`
- Verify install succeeds and `pnpm typecheck` still passes

### Step 2: Create progress Zod schemas
- Create `.ai/alpha/scripts/lib/schemas/progress.schema.ts`
- Define `SandboxProgressSchema` mirroring `SandboxProgress` from `orchestrator.types.ts`
  - All fields optional with `.default()` providing safe fallbacks
  - `status` field uses `z.enum()` with the existing `VALID_PROGRESS_STATUSES` values
  - `current_task.name` defaults to `"Working..."`
  - `current_task.id` defaults to `"Unknown"`
  - `feature.title` defaults to `"Feature"`
  - `feature.issue_number` defaults to `"Unknown"`
- Define `ProgressFileDataSchema` mirroring `ProgressFileData` from `progress-file.ts`
- Define `SandboxProgressFileSchema` mirroring `SandboxProgressFile` from `ui/types.ts`
- Define `OverallProgressFileSchema` mirroring the `OverallProgressFile` interface
- Create barrel export at `.ai/alpha/scripts/lib/schemas/index.ts`

### Step 3: Create safeParseProgress utility
- In the same schemas file, create `safeParseProgress<T>(schema, raw, label)` that:
  - Calls `schema.safeParse(raw)`
  - On success: returns validated data
  - On failure: logs `[VALIDATION_WARN] <label>: <error details>` and returns `schema.parse({})` (defaults)
- This replaces raw `JSON.parse() as T` with `safeParseProgress(Schema, JSON.parse(raw), "progress-file")`

### Step 4: Integrate into progress-file.ts (sandbox reads)
- In `readProgressFile()`, replace `const data: ProgressFileData = { ...raw, status: validateProgressStatus(raw.status) }` with Zod-based validation
- Keep `validateProgressStatus()` as the status-specific validator (it handles remapping), but let Zod validate the rest
- Ensure `ProgressFileResult.data` is always well-formed when `success === true`

### Step 5: Integrate into progress.ts (polling reads)
- In `startProgressPolling()` around line 324, replace `const progress: SandboxProgress = { ...raw, status: raw.status ? validateProgressStatus(raw.status) : undefined }` with Zod parse
- Apply `SandboxProgressSchema` to validate the raw JSON
- Keep the existing `validateProgressStatus()` call for status remapping

### Step 6: Integrate into useProgressPoller.ts (UI reads)
- In `createFsProgressReader().readProgressFile()` around line 213, replace `JSON.parse(content) as SandboxProgressFile` with Zod parse
- In `createFsProgressReader().readOverallProgress()` around line 230, replace `JSON.parse(content) as OverallProgressFile` with Zod parse
- Remove the manual defensive defaults added in #2065 for `name`, `title`, `status` (Zod `.default()` handles this now)

### Step 7: Integrate into manifest.ts (secondary boundaries)
- In `loadManifest()` around line 860, add validation for `spec-manifest.json` reads (lower priority — this file is written by the orchestrator itself, not by agents)
- In `syncSandboxProgressToManifest()` around line 950, validate the sandbox progress JSON

### Step 8: Write schema validation tests
- Create `.ai/alpha/scripts/lib/__tests__/progress-schema.spec.ts`
- Test cases:
  - Valid complete progress file → passes validation
  - Missing `current_task.name` → defaults to "Working..."
  - Missing `current_task.id` → defaults to "Unknown"
  - Missing `feature.title` → defaults to "Feature"
  - Missing `status` → defaults appropriately
  - Empty object `{}` → returns valid object with all defaults
  - Null/undefined fields → handled gracefully
  - Extra unknown fields → stripped or passed through (depending on schema config)
  - Invalid types (number where string expected) → coerced or defaulted

### Step 9: Run existing tests and validation
- Run `pnpm --filter @slideheroes/alpha-scripts test` to verify all existing tests pass
- Run `npx tsc --noEmit --project .ai/alpha/scripts/tsconfig.json` for type checking
- Manually verify with a sample malformed progress JSON to confirm warnings are logged

## Testing Strategy

### Unit Tests
- Test each Zod schema independently with valid, partial, and invalid data
- Test `safeParseProgress()` returns defaults on failure and logs warnings
- Test that validated data matches the TypeScript interface shape
- Test the integration between `validateProgressStatus()` and Zod schemas

### Integration Tests
- Test `readProgressFile()` with mocked sandbox returning malformed JSON
- Test `createFsProgressReader()` with malformed JSON files on disk
- Test `startProgressPolling()` with various malformed sandbox outputs

### E2E Tests
- Not applicable — this is internal tooling that doesn't have E2E tests

### Edge Cases
- `JSON.parse()` throws on invalid JSON → existing error handling catches this before Zod runs
- Progress file is empty string → existing guard handles this before Zod runs
- Progress file has extra unknown fields (GPT agents often add commentary) → Zod should pass-through or strip
- `current_task` is an empty object `{}` → all fields get defaults
- `current_task` is a string instead of an object → Zod rejects, defaults applied
- `completed_tasks` is a number instead of an array → Zod rejects, defaults to `[]`
- Nested objects partially valid (e.g., `current_group.name` present but `tasks_total` missing) → partial defaults applied

## Acceptance Criteria
- [ ] All `JSON.parse()` calls in the 3 primary read paths use Zod validation
- [ ] Malformed progress files (missing `name`, `title`, `status`) produce `[VALIDATION_WARN]` log messages instead of crashes
- [ ] The orchestrator UI renders gracefully when GPT agents write incomplete progress data
- [ ] All existing tests pass without modification (or with minimal adaptation)
- [ ] New schema tests cover the 5 historical crash scenarios (#1927, #1937, #1952, #2048, #2065)
- [ ] `pnpm typecheck` passes in the scripts workspace
- [ ] Zod schema types are inferred and match existing TypeScript interfaces

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- `npx tsc --noEmit --project .ai/alpha/scripts/tsconfig.json` — Type checking for orchestrator scripts
- `pnpm --filter @slideheroes/alpha-scripts test` — Run all orchestrator unit tests
- `pnpm --filter @slideheroes/orchestrator-ui test` — Run UI component tests
- `pnpm typecheck` — Full workspace type check

## Notes
- The project uses Zod v4 (`^4.1.13`) in most packages. The `mcp-server` package uses v3 (`3.23.8`) but that's a separate concern.
- The `validateProgressStatus()` function in `progress-file.ts` is an excellent precedent — it already does manual runtime validation for the `status` field. Zod generalizes this pattern to all fields.
- Consider using `z.passthrough()` on the top-level schema so unknown fields from GPT agents aren't silently stripped (they might contain useful debug information in logs).
- The schemas should live in their own `schemas/` directory rather than inline in the consumer files, to allow reuse across the 3+ parsing locations.
- Long-term, these schemas could also be used to validate the `tasks.json` and `spec-manifest.json` files during task decomposition, preventing bad specs from reaching the orchestrator.
