# Feature: Progress Data Layer & Types

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I2 |
| **Feature ID** | S1607.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Create the TypeScript types and server-side loader function that fetches course progress and survey response data for the dashboard visualization widgets. This feature provides the data foundation that the radial progress widget and spider diagram consume.

## User Story
**As a** developer implementing dashboard widgets
**I want to** have typed data loaders for course progress and assessment scores
**So that** widgets can display accurate, type-safe user progress data

## Acceptance Criteria

### Must Have
- [ ] TypeScript interfaces for course progress data (completion_percentage, current_lesson_id)
- [ ] TypeScript interfaces for assessment category scores (Record<string, number>)
- [ ] Server-side loader function using parallel Promise.all() fetching
- [ ] Empty data handling (returns null/undefined for users without progress)
- [ ] Integration with existing dashboard page loader pattern

### Nice to Have
- [ ] Shared types exported from a central location for reuse

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (data layer only) | N/A |
| **Logic** | Type definitions | New |
| **Data** | Loader function | New |
| **Database** | course_progress, survey_responses queries | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow existing loader patterns (e.g., `load-user-workspace.ts`) with minimal abstraction. Create focused types that match the exact data shape needed by widgets.

### Key Architectural Choices
1. Use parallel fetching with `Promise.all()` for course_progress and survey_responses queries
2. Create explicit TypeScript interfaces rather than inferring from database types
3. Place loader in `_lib/server/` following established convention

### Trade-offs Accepted
- Types are duplicated from generated database types for clarity (could use utility types instead)

## Dependencies

### Blocks
- F2: Course Progress Radial Widget (needs data from this loader)
- F3: Spider Diagram Widget (needs data from this loader)

### Blocked By
- S1607.I1: Dashboard Foundation (provides page structure where loader is called)

### Parallel With
- None (this is the foundation)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/dashboard-progress.loader.ts` - Loader function
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - TypeScript interfaces

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and call new loader (integration point)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create TypeScript interfaces**: Define CourseProgressData, AssessmentScoresData types
2. **Create loader function**: Implement loadDashboardProgressData with parallel fetches
3. **Handle empty states**: Return appropriate values for users without data
4. **Integration test**: Verify loader returns expected data structure

### Suggested Order
1. Types first (defines contract)
2. Loader implementation
3. Empty state handling
4. Integration verification

## Validation Commands
```bash
# TypeScript validation
pnpm --filter web typecheck

# Verify loader returns correct types (manual or unit test)
# Test with user who has course progress
# Test with user who has no course progress
```

## Related Files
- Initiative: `../initiative.md`
- Existing loader pattern: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- Database types: `packages/supabase/src/database.types.ts`
- Research: `../../research-library/context7-recharts-radial.md`
