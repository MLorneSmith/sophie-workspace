# Refactoring Analysis: spec-orchestrator.ts

**Generated**: 2026-01-09
**Target**: `.ai/alpha/scripts/spec-orchestrator.ts`
**Analyst**: Claude Refactoring Specialist

## Executive Summary

The `spec-orchestrator.ts` file is a **2663-line monolithic script** that orchestrates E2B sandboxes for parallel feature implementation. While functional, the file significantly exceeds complexity thresholds and would benefit from modular extraction into focused modules. The file contains **44 functions** covering 8 distinct concerns: environment, locking, database, manifest, work queue, sandbox management, health monitoring, and CLI.

**Risk Level**: HIGH (>800 lines, multiple responsibilities, no test coverage)

### Key Findings

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total Lines | 2663 | <400 | ❌ CRITICAL (6.6x over) |
| Function Count | 44 | - | ⚠️ High |
| Largest Function | 335 lines (`orchestrate`) | <50 | ❌ CRITICAL |
| Dependencies | Complex (E2B, Node.js, fs) | - | ⚠️ |
| Test Coverage | 0% | >80% | ❌ CRITICAL |
| Cyclomatic Complexity | HIGH | <10 | ❌ |

## Target Overview

- **Path**: `.ai/alpha/scripts/spec-orchestrator.ts`
- **Lines**: 2663
- **Type**: CLI orchestration script (tooling)
- **Risk Level**: HIGH
- **No tests exist**: Critical gap

## Architecture Analysis

### Current Structure (Monolithic)

```
spec-orchestrator.ts (2663 lines)
├── Constants (lines 46-73) - 28 lines
├── Types (lines 74-206) - 133 lines
├── Environment (lines 208-367) - 160 lines
├── Lock Management (lines 369-479) - 111 lines
├── Database Management (lines 481-685) - 205 lines
├── Manifest Management (lines 687-758) - 72 lines
├── Work Queue (lines 760-893) - 134 lines
├── Sandbox Management (lines 895-1077) - 183 lines
├── Progress Polling (lines 1079-1424) - 346 lines
├── Health Monitoring (lines 1426-1672) - 247 lines
├── Feature Implementation (lines 1674-1937) - 264 lines
├── Main Orchestration (lines 1939-2273) - 335 lines
├── Dev Server & URLs (lines 2375-2398) - 24 lines
├── Output Formatting (lines 2400-2524) - 125 lines
├── Utilities (lines 2526-2532) - 7 lines
└── CLI Parsing (lines 2534-2663) - 130 lines
```

### Concern Mapping

| Concern | Functions | Lines | Extraction Priority |
|---------|-----------|-------|---------------------|
| Environment | 4 | 160 | HIGH |
| Lock Management | 6 | 111 | HIGH |
| Database Management | 5 | 205 | HIGH |
| Manifest Management | 4 | 72 | MEDIUM |
| Work Queue | 3 | 134 | MEDIUM |
| Sandbox Management | 2 | 183 | HIGH |
| Progress/UI | 8 | 346 | HIGH |
| Health Monitoring | 4 | 247 | HIGH |
| Feature Implementation | 1 | 264 | HIGH |
| Main Orchestration | 2 | 335 | MEDIUM |
| Output | 3 | 125 | LOW |
| CLI | 3 | 130 | MEDIUM |

## Complexity Analysis

### Function-Level Metrics

| Function | Lines | Complexity | Risk | Recommendation |
|----------|-------|------------|------|----------------|
| `orchestrate` | 335 | HIGH | ❌ CRITICAL | Split into phases |
| `runFeatureImplementation` | 257 | HIGH | ❌ CRITICAL | Extract sub-functions |
| `createSandbox` | 152 | MEDIUM | ⚠️ HIGH | Extract setup steps |
| `runWorkLoop` | 95 | MEDIUM | ⚠️ | Simplify |
| `startProgressPolling` | 73 | MEDIUM | ⚠️ | Extract callbacks |
| `checkSandboxHealth` | 93 | MEDIUM | ⚠️ | Simplify conditionals |
| `runHealthChecks` | 76 | MEDIUM | ⚠️ | Inline callbacks |
| `cleanupStaleState` | 56 | MEDIUM | ⚠️ | Split by entity |
| `getAllEnvVars` | 108 | HIGH | ⚠️ | Group by category |
| `printSummary` | 69 | LOW | ✅ | Keep |
| `seedSandboxDatabase` | 66 | MEDIUM | ⚠️ | Extract steps |
| `parseArgs` | 49 | LOW | ✅ | Consider yargs |
| `showHelp` | 58 | LOW | ✅ | Keep |

### Critical Functions (>50 lines)

```
orchestrate()              - 335 lines ❌
runFeatureImplementation() - 257 lines ❌
createSandbox()           - 152 lines ❌
getAllEnvVars()           - 108 lines ⚠️
runWorkLoop()              - 95 lines ⚠️
checkSandboxHealth()       - 93 lines ⚠️
runHealthChecks()          - 76 lines ⚠️
startProgressPolling()     - 73 lines ⚠️
printSummary()             - 69 lines ⚠️
seedSandboxDatabase()      - 66 lines ⚠️
resetSandboxDatabase()     - 58 lines ⚠️
showHelp()                 - 58 lines ⚠️
cleanupStaleState()        - 56 lines ⚠️
```

## Pattern Compliance Analysis

### SlideHeroes Pattern Compliance

This is a **tooling script**, not a web application component, so standard SlideHeroes patterns (enhanceAction, service layer, RLS) don't apply directly. However, code organization principles still apply.

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript strict mode | ✅ | Uses proper types |
| Interface definitions | ✅ | Well-defined interfaces |
| Error handling | ⚠️ | Inconsistent patterns |
| Logging | ⚠️ | Uses console.log directly |
| Configuration | ⚠️ | Uses env vars directly |
| Modularity | ❌ | Single monolithic file |
| Testability | ❌ | No test coverage |

### Anti-Patterns Detected

| Anti-Pattern | Location | Impact | Recommendation |
|--------------|----------|--------|----------------|
| God file | Entire file | HIGH | Split into modules |
| Mixed concerns | Throughout | HIGH | Separate by domain |
| Deep nesting | `orchestrate`, `runFeatureImplementation` | MEDIUM | Extract functions |
| Magic numbers | Lines 54-72 | LOW | Move to config |
| Console logging | Throughout | LOW | Add structured logger |
| Duplicate logic | `findProjectRoot` vs `getProjectRoot` | LOW | Consolidate |
| Long parameter lists | `startProgressPolling` (8 params) | MEDIUM | Use options object |

### Duplicate Functions

Found two nearly identical functions:
- `getProjectRoot()` (line 375) - cached version
- `findProjectRoot()` (line 691) - uncached version

**Recommendation**: Remove `findProjectRoot()` and use only `getProjectRoot()`.

## Test Coverage

### Current Coverage

| Component | Test File | Status |
|-----------|-----------|--------|
| spec-orchestrator | None | ❌ NOT COVERED |

### Missing Tests

Critical test gaps:

- [ ] Unit tests for `parseArgs()`
- [ ] Unit tests for `acquireLock()` / `releaseLock()`
- [ ] Unit tests for `getNextAvailableFeature()`
- [ ] Unit tests for `cleanupStaleState()`
- [ ] Unit tests for `checkForStall()`
- [ ] Integration tests for `createSandbox()`
- [ ] Integration tests for `runFeatureImplementation()`
- [ ] Integration tests for `orchestrate()` (with mocks)

### Test Strategy Recommendations

1. **Extract pure functions** first (no I/O) for easy unit testing
2. **Use dependency injection** for E2B Sandbox to enable mocking
3. **Create test fixtures** for manifest data
4. **Mock file system** operations with memfs or similar

## Refactoring Plan

### Phase 1: Extract Type Definitions (LOW RISK)

**Priority**: HIGH
**Risk**: LOW

#### Tasks:
1. Create `types/orchestrator.types.ts` with all interfaces
2. Create `types/index.ts` barrel export
3. Update imports in main file

**Files to create**:
```
.ai/alpha/scripts/
├── types/
│   ├── index.ts
│   └── orchestrator.types.ts  (interfaces: FeatureEntry, InitiativeEntry, etc.)
```

#### Validation:
- [ ] TypeScript compiles: `pnpm --filter scripts typecheck`
- [ ] Script runs: `tsx spec-orchestrator.ts --help`

---

### Phase 2: Extract Constants & Configuration (LOW RISK)

**Priority**: HIGH
**Risk**: LOW

#### Tasks:
1. Create `config/constants.ts` with all constants
2. Create `config/index.ts` barrel export
3. Update imports

**Files to create**:
```
.ai/alpha/scripts/
├── config/
│   ├── index.ts
│   └── constants.ts  (TEMPLATE_ALIAS, timeouts, etc.)
```

---

### Phase 3: Extract Environment Module (MEDIUM RISK)

**Priority**: HIGH
**Risk**: MEDIUM

#### Tasks:
1. Create `lib/environment.ts`:
   - `getClaudeOAuthToken()`
   - `getCachedOAuthToken()`
   - `checkEnvironment()`
   - `getAllEnvVars()`
2. Add unit tests for env var handling
3. Update imports

**Extraction target**: ~160 lines

---

### Phase 4: Extract Lock Management (LOW RISK)

**Priority**: HIGH
**Risk**: LOW

#### Tasks:
1. Create `lib/lock.ts`:
   - `readLock()`
   - `writeLock()`
   - `acquireLock()`
   - `releaseLock()`
   - `updateLockResetState()`
2. Add unit tests for lock operations
3. Update imports

**Extraction target**: ~111 lines

---

### Phase 5: Extract Database Management (MEDIUM RISK)

**Priority**: HIGH
**Risk**: MEDIUM

#### Tasks:
1. Create `lib/database.ts`:
   - `checkDatabaseCapacity()`
   - `resetSandboxDatabase()`
   - `seedSandboxDatabase()`
   - `isDatabaseSeeded()`
2. Add integration tests with database mocks
3. Update imports

**Extraction target**: ~205 lines

---

### Phase 6: Extract Manifest Management (LOW RISK)

**Priority**: MEDIUM
**Risk**: LOW

#### Tasks:
1. Create `lib/manifest.ts`:
   - `findSpecDir()`
   - `loadManifest()`
   - `saveManifest()`
2. Add unit tests for manifest operations
3. Update imports

**Extraction target**: ~72 lines

---

### Phase 7: Extract Work Queue (LOW RISK)

**Priority**: MEDIUM
**Risk**: LOW

#### Tasks:
1. Create `lib/work-queue.ts`:
   - `getNextAvailableFeature()`
   - `updateNextFeatureId()`
   - `cleanupStaleState()`
2. Add unit tests with fixture data
3. Update imports

**Extraction target**: ~134 lines

---

### Phase 8: Extract Sandbox Management (HIGH RISK)

**Priority**: HIGH
**Risk**: HIGH

#### Tasks:
1. Create `lib/sandbox.ts`:
   - `setupGitCredentials()`
   - `createSandbox()`
2. Create sandbox factory with dependency injection
3. Add integration tests with E2B mocks
4. Update imports

**Extraction target**: ~183 lines

---

### Phase 9: Extract Progress/UI Module (MEDIUM RISK)

**Priority**: HIGH
**Risk**: MEDIUM

#### Tasks:
1. Create `lib/progress.ts`:
   - `displayProgressUpdate()`
   - `ensureUIProgressDir()`
   - `writeUIProgress()`
   - `clearUIProgress()`
   - `writeOverallProgress()`
   - `startProgressPolling()`
   - `checkForStall()`
2. Add unit tests for display logic
3. Update imports

**Extraction target**: ~346 lines

---

### Phase 10: Extract Health Monitoring (MEDIUM RISK)

**Priority**: HIGH
**Risk**: MEDIUM

#### Tasks:
1. Create `lib/health.ts`:
   - `checkSandboxHealth()`
   - `killClaudeProcess()`
   - `runHealthChecks()`
2. Add unit tests for health check logic
3. Update imports

**Extraction target**: ~247 lines

---

### Phase 11: Refactor Feature Implementation (HIGH RISK)

**Priority**: HIGH
**Risk**: HIGH

#### Tasks:
1. Create `lib/feature.ts` with `runFeatureImplementation()`
2. Break down into sub-functions:
   - `prepareForFeature()` - git pull, progress reset
   - `executeClaudeSession()` - run Claude with polling
   - `processFeatureResult()` - update manifest, push
3. Add integration tests
4. Update imports

**Extraction target**: ~264 lines

---

### Phase 12: Refactor Main Orchestration (HIGH RISK)

**Priority**: MEDIUM
**Risk**: HIGH

#### Tasks:
1. Create `lib/orchestrator.ts` with `Orchestrator` class
2. Break `orchestrate()` into phases:
   - `initialize()` - load manifest, acquire lock
   - `setupSandboxes()` - create sandboxes, seed DB
   - `executeWorkLoop()` - main implementation loop
   - `finalize()` - push, cleanup, report
3. Use dependency injection for testability
4. Add integration tests

**Extraction target**: ~335 lines

---

### Phase 13: Extract CLI Module (LOW RISK)

**Priority**: LOW
**Risk**: LOW

#### Tasks:
1. Create `cli/index.ts`:
   - `parseArgs()`
   - `showHelp()`
2. Consider using `yargs` or `commander` for better UX
3. Add unit tests for argument parsing
4. Update main entry point

**Extraction target**: ~130 lines

---

### Phase 14: Add Structured Logging (LOW RISK)

**Priority**: LOW
**Risk**: LOW

#### Tasks:
1. Create `lib/logger.ts` with structured logging
2. Replace `console.log` calls with logger
3. Add log levels (debug, info, warn, error)
4. Optional: Add JSON output mode for CI

---

## Target Architecture

After refactoring, the module structure should be:

```
.ai/alpha/scripts/
├── spec-orchestrator.ts      # Entry point only (~50 lines)
├── types/
│   ├── index.ts
│   └── orchestrator.types.ts
├── config/
│   ├── index.ts
│   └── constants.ts
├── lib/
│   ├── index.ts
│   ├── environment.ts        # Environment/auth handling
│   ├── lock.ts              # Orchestrator lock management
│   ├── database.ts          # Sandbox database operations
│   ├── manifest.ts          # Manifest CRUD
│   ├── work-queue.ts        # Feature queue logic
│   ├── sandbox.ts           # Sandbox lifecycle
│   ├── progress.ts          # Progress tracking/UI
│   ├── health.ts            # Health monitoring
│   ├── feature.ts           # Feature implementation
│   ├── orchestrator.ts      # Main orchestration logic
│   └── logger.ts            # Structured logging
├── cli/
│   ├── index.ts
│   └── help.ts
└── __tests__/
    ├── environment.test.ts
    ├── lock.test.ts
    ├── work-queue.test.ts
    ├── manifest.test.ts
    └── health.test.ts
```

**Estimated final main file**: ~50 lines (import + CLI bootstrap)

## Implementation Checklist

```json
[
  {"content": "Create types/ directory with interfaces", "priority": "high"},
  {"content": "Create config/ directory with constants", "priority": "high"},
  {"content": "Extract lib/environment.ts", "priority": "high"},
  {"content": "Extract lib/lock.ts", "priority": "high"},
  {"content": "Extract lib/database.ts", "priority": "high"},
  {"content": "Extract lib/manifest.ts", "priority": "medium"},
  {"content": "Extract lib/work-queue.ts", "priority": "medium"},
  {"content": "Extract lib/sandbox.ts", "priority": "high"},
  {"content": "Extract lib/progress.ts", "priority": "high"},
  {"content": "Extract lib/health.ts", "priority": "high"},
  {"content": "Refactor lib/feature.ts", "priority": "high"},
  {"content": "Refactor lib/orchestrator.ts", "priority": "medium"},
  {"content": "Extract cli/ module", "priority": "low"},
  {"content": "Add structured logger", "priority": "low"},
  {"content": "Add unit tests for pure functions", "priority": "high"},
  {"content": "Add integration tests with mocks", "priority": "medium"},
  {"content": "Remove duplicate findProjectRoot", "priority": "low"},
  {"content": "Update documentation", "priority": "low"}
]
```

## Validation Commands

```bash
# After each extraction phase:
pnpm --filter @slideheroes/alpha-scripts typecheck
pnpm --filter @slideheroes/alpha-scripts lint:fix

# Verify script still works:
tsx .ai/alpha/scripts/spec-orchestrator.ts --help
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run

# Run tests (after adding):
pnpm --filter @slideheroes/alpha-scripts test
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes | Create backup branch before starting |
| Runtime errors | Run `--dry-run` after each phase |
| Import issues | Use barrel exports consistently |
| Type errors | Run typecheck after each extraction |
| Feature regression | Test with real spec ID after each phase |

## Notes

### Technical Debt Addressed

1. **Monolithic structure**: Single 2663-line file is unmaintainable
2. **No test coverage**: Critical for tooling that manages production workflows
3. **Duplicate code**: Two `findProjectRoot` variants
4. **Mixed concerns**: 8+ domains in one file
5. **Console logging**: No structured logging for debugging

### Future Considerations

1. **Consider TypeScript project references** for better build performance
2. **Add OpenTelemetry** for production observability
3. **Create shared utilities package** if patterns repeat across scripts
4. **Consider class-based architecture** for Orchestrator for better encapsulation

### Execution Order Recommendation

For lowest risk, execute phases in this order:
1. Types (Phase 1) - no behavior change
2. Config (Phase 2) - no behavior change
3. Lock (Phase 4) - isolated, easy to test
4. Manifest (Phase 6) - isolated, easy to test
5. Work Queue (Phase 7) - pure logic, easy to test
6. Environment (Phase 3) - some I/O
7. Progress (Phase 9) - display logic
8. Health (Phase 10) - monitoring logic
9. Database (Phase 5) - I/O heavy
10. Sandbox (Phase 8) - external dependencies
11. Feature (Phase 11) - complex logic
12. Orchestrator (Phase 12) - main coordination
13. CLI (Phase 13) - entry point
14. Logger (Phase 14) - optional enhancement

---
*Generated by Claude Refactoring Analyst*
