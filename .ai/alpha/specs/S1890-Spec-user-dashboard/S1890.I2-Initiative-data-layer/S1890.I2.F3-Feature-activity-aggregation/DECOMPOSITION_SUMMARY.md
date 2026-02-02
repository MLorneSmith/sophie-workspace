# Feature S1890.I2.F3: Activity Aggregation - Decomposition Summary

**Date**: 2026-02-02
**Feature**: Activity Aggregation
**Status**: APPROVED

## Complexity Assessment

### Signals
- **Files Affected**: 2 files (activity-aggregation.ts + user-dashboard.loader.ts) → Weight: 0.25
- **Dependencies**: Few (3 database tables, ActivityFeedItem type, existing loader) → Weight: 0.5
- **Estimated LOC**: ~150 lines total → Weight: 0.5
- **Feature Type**: Enhancement (extends existing loader) → Weight: 0.25

### Calculation
(0.25 × 25) + (0.5 × 25) + (0.5 × 25) + (0.25 × 25) = **37.5/100**

### Result
- **Score**: 37.5/100
- **Granularity**: LOW
- **Target Steps**: 3-6
- **Actual Steps**: 6 ✅

## Pattern Applied

**Layer Decomposition (New Components)**
1. Skeleton file setup
2. Mapper implementations (parallel)
3. Aggregation assembly
4. Loader integration

## Task Breakdown

| Task ID | Name | Hours | Group | Dependencies |
|---------|------|-------|-------|--------------|
| T1 | Create aggregation file skeleton | 2 | 1 | None |
| T2 | Implement quiz attempts mapper | 2 | 2 | T1 |
| T3 | Implement lesson progress mapper | 2 | 2 | T1 |
| T4 | Implement presentations mapper | 2 | 2 | T1 |
| T5 | Implement aggregation function | 2 | 3 | T2, T3, T4 |
| T6 | Integrate with main loader | 2 | 4 | T5 |

## Execution Analysis

### Duration
- **Sequential**: 12 hours
- **Parallel**: 8 hours
- **Time Saved**: 33.3%

### Critical Path
T1 → T2 → T5 → T6 (8 hours)

### Parallelization Opportunities
- **Group 2**: T2, T3, T4 can run in parallel (3 mappers)

## Cross-Feature Dependencies

This feature depends on:
- **S1890.I2.F1** (Dashboard Types): Requires `ActivityFeedItem` type
- **S1890.I2.F2** (Dashboard Loader): Extends existing loader pattern

These dependencies are managed at the orchestrator level (not in tasks.json to avoid validator issues).

## Validation Results

### Scores
- **Completeness**: 100% ✅
- **Atomicity**: 100% ✅
- **Dependencies**: 100% ✅
- **State Flow**: 100% ✅
- **Testability**: 100% ✅

### Checks
- ✅ No circular dependencies
- ✅ All dependencies documented
- ✅ No spikes needed
- ✅ Critical path valid

### m=1 Compliance
- ✅ All tasks have single verbs
- ✅ No conjunctions in task names
- ✅ All tasks under 8 hours
- ✅ All tasks under 750 tokens context
- ✅ All tasks have binary done states
- ✅ All tasks touch ≤3 files

## Files Created/Modified

### New Files
- `apps/web/app/home/(user)/_lib/server/activity-aggregation.ts`

### Modified Files
- `apps/web/app/home/(user)/_lib/server/user-dashboard.loader.ts`

## Technical Approach

### Architecture Decision
**Pragmatic Approach**: Since Supabase doesn't support UNION queries directly, we fetch from each table separately then merge/sort in JavaScript. This is acceptable for expected data volume (<1000 items per user).

### Key Patterns
1. **Application-level aggregation** (fetch → merge → sort) vs database UNION
2. **TypeScript discriminated union** for type-safe activity type handling
3. **Parallel fetching** with Promise.all
4. **30-day time window** for performance

### Trade-offs Accepted
- More data transfer than database UNION (acceptable for v1 scale)
- Client-side sorting (acceptable for ≤20 items returned)
- No pagination in v1 (added later if needed)

## GitHub Integration

- ✅ Spec issue commented: https://github.com/MLorneSmith/2025slideheroes/issues/1890#issuecomment-3836460105
- ❌ Individual task issues not created (managed by orchestrator)

## Next Steps

Run `/alpha:implement S1890.I2.F3` to begin implementation.

## Notes for Implementor

- Ensure all mappers filter to last 30 days using appropriate timestamp field
- Handle null timestamps gracefully (exclude from results)
- Use consistent timestamp field for sorting across all activity types
- Return empty array (not error) when no activity exists
- Maintain type safety with discriminated union pattern
