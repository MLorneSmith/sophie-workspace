# Feature: Error Boundaries

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I6 |
| **Feature ID** | S1918.I6.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Implement error boundaries around dashboard widgets with friendly error UI and retry functionality. Each widget should gracefully handle failures without crashing the entire dashboard, providing users with clear messaging and recovery options.

## User Story
**As a** dashboard user
**I want to** see friendly error messages when a widget fails to load
**So that** I can retry the action or continue using other dashboard features

## Acceptance Criteria

### Must Have
- [ ] Create reusable `WidgetErrorBoundary` React component
- [ ] Error state includes icon, message, and "Try Again" button
- [ ] Each of the 7 widgets wrapped in error boundary
- [ ] Retry button re-fetches widget data
- [ ] Error logging to console in development mode
- [ ] Error state doesn't crash adjacent widgets
- [ ] Error UI matches dashboard design system (Card, Alert patterns)

### Nice to Have
- [ ] Error capture integration with monitoring service (`useCaptureException`)
- [ ] Different error messages based on error type (network vs. server)
- [ ] Collapse error state to minimize space

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | WidgetErrorBoundary, WidgetErrorFallback | New |
| **Logic** | Error boundary class component | New |
| **Data** | Retry callback integration | Modify |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Single reusable error boundary with customizable fallback
**Rationale**: All widgets need the same error handling pattern. One error boundary component with props for customization reduces duplication while allowing widget-specific messages.

### Key Architectural Choices
1. Class component for error boundary (React requirement)
2. Functional component for error fallback UI (flexibility)
3. Accept `onRetry` callback prop for widget-specific refetch
4. Use existing Alert component with destructive variant

### Trade-offs Accepted
- Class component required (can't use hooks in error boundary)
- Must wrap each widget individually (no automatic boundary detection)

## Required Credentials
> None required

## Dependencies

### Blocks
- None

### Blocked By
- S1918.I3.F1, S1918.I3.F2, S1918.I4.F1-F4, S1918.I5.F2: Widgets must exist to wrap

### Parallel With
- F1: Loading Skeletons (independent)
- F3: Accessibility Compliance (independent)
- F4: E2E Test Suite (independent)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/widget-error-boundary.tsx`
- `apps/web/app/home/(user)/_components/widget-error-fallback.tsx`

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Wrap each widget with error boundary
- Widget components may need `onRetry` props added

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create WidgetErrorBoundary class component**: React Error Boundary with state management
2. **Create WidgetErrorFallback UI component**: Alert with icon, message, retry button
3. **Integrate error boundary with progress widgets**: Wrap Course Progress and Skills Spider
4. **Integrate error boundary with activity widgets**: Wrap Quick Actions, Kanban, Activity Feed
5. **Integrate error boundary with table and coaching widgets**: Wrap Presentations Table, Coaching Sessions
6. **Add error capture hook integration**: Optional monitoring integration
7. **Test error handling**: Verify boundaries catch errors and retry works

### Suggested Order
1. Error boundary class component (T1)
2. Error fallback UI component (T2)
3. Widget integrations (T3-T5 - parallel)
4. Error capture integration (T6 - optional)
5. Testing (T7)

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Manual testing
# 1. Throw test error in a widget
# 2. Verify error UI appears
# 3. Click "Try Again" and verify retry
# 4. Verify other widgets still work
```

## Related Files
- Initiative: `../initiative.md`
- Pattern: `apps/web/app/home/(user)/ai/canvas/_components/error-boundary.tsx`
- Pattern: `apps/web/app/error.tsx` (root error page)
- Pattern: `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` (inline error state)
