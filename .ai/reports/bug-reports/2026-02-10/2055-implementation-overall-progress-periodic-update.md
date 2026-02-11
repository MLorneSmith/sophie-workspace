## Implementation Complete

### Summary
- Added `writeOverallProgress(this.manifest)` call to `WorkLoop.mainLoop()` after `assignWorkToIdleSandboxes()`
- This ensures overall progress updates every ~30 seconds during steady-state execution, not just on state transitions
- `writeOverallProgress()` internally calls `syncSandboxProgressToManifest()` (#2050) which reads real-time task counts from sandbox progress files
- Updated test mocks in both test files to include `writeOverallProgress` in the manifest mock

### Files Changed
```
.ai/alpha/scripts/lib/work-loop.ts                          | 9 ++++++++-
.ai/alpha/scripts/lib/__tests__/work-loop.test.ts           | 1 +
.ai/alpha/scripts/lib/__tests__/work-loop-promise-timeout.spec.ts | 1 +
```

### Commits
```
a68c3a229 fix(tooling): add periodic writeOverallProgress call to work loop [agent: implementor]
```

### Validation Results
- `pnpm typecheck` — 39/39 tasks passed (all cached)
- `vitest` work-loop tests — 16/16 tests passed
- All pre-commit hooks passed (TruffleHog, Biome, type-check)

### Follow-up Items
- None — this is a minimal, self-contained fix
