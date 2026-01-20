# Feature: Coaching Widget Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I5 |
| **Feature ID** | S1607.I5.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Create the foundational UI structure for the Coaching Sessions widget on the user dashboard. This includes the card container, loading skeleton states, empty state CTA design, and TypeScript types for coaching session data. The widget will be populated with actual data in subsequent features.

## User Story
**As a** SlideHeroes user
**I want to** see a dedicated coaching section on my dashboard
**So that** I have a clear space to view and manage my coaching sessions

## Acceptance Criteria

### Must Have
- [ ] Coaching Sessions card renders on the dashboard with header and content area
- [ ] Loading skeleton displays while data is being fetched
- [ ] Empty state shows when no sessions exist with clear messaging
- [ ] TypeScript types defined for coaching session data structure
- [ ] Card integrates into the dashboard grid layout

### Nice to Have
- [ ] Subtle animation on card load
- [ ] Responsive design adjusts card layout on mobile

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CoachingSessionsCard component | New |
| **UI** | CoachingSessionsSkeleton component | New |
| **UI** | CoachingSessionsEmptyState component | New |
| **Logic** | Coaching session types | New |
| **Data** | Loader skeleton integration | New |
| **Database** | N/A (this feature) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow existing dashboard widget patterns from the team dashboard demo. Use standard shadcn Card components with MakerKit EmptyState. Types prepared for Cal.com API response structure.

### Key Architectural Choices
1. Use `@kit/ui/card` for container consistency with other dashboard widgets
2. Define types matching Cal.com API v2 booking response structure (from research)
3. Use `@kit/ui/skeleton` for loading states
4. Use `@kit/ui/empty-state` for empty state with booking CTA placeholder

### Trade-offs Accepted
- Empty state CTA will be a placeholder button until F2 implements actual booking integration
- Types defined ahead of API integration to establish contract

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card container | Card, CardHeader, CardContent | @kit/ui/card | Consistent with dashboard patterns |
| Loading skeleton | Skeleton | @kit/ui/skeleton | Standard loading pattern |
| Empty state | EmptyState components | @kit/ui/empty-state | MakerKit pattern for empty states |
| Icons | Calendar, Clock icons | lucide-react | Consistent iconography |

**Components to Install**: None - all required components exist in packages/ui

## Dependencies

### Blocks
- F2: Session Booking CTA (provides widget container)
- F3: Upcoming Sessions Display (provides widget container and types)

### Blocked By
- S1607.I1: Dashboard Foundation (provides dashboard page and grid layout)

### Parallel With
- None (first feature in initiative)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/coaching-sessions-card.tsx` - Main card component
- `apps/web/app/home/(user)/_components/coaching-sessions-skeleton.tsx` - Loading skeleton
- `apps/web/app/home/(user)/_components/coaching-sessions-empty-state.tsx` - Empty state
- `apps/web/app/home/(user)/_lib/schemas/coaching.schema.ts` - Zod schemas and types
- `apps/web/app/home/(user)/_lib/types/coaching.types.ts` - TypeScript types for Cal.com data

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add CoachingSessionsCard to dashboard grid
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Add placeholder for coaching data

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define TypeScript types**: Create coaching session types matching Cal.com API response
2. **Create Zod schemas**: Validation schemas for coaching data
3. **Build CoachingSessionsSkeleton**: Loading state component with calendar item shapes
4. **Build CoachingSessionsEmptyState**: Empty state with icon and CTA placeholder
5. **Build CoachingSessionsCard**: Container component with loading/empty/content states
6. **Integrate into dashboard**: Add card to dashboard page grid
7. **Write unit tests**: Test component rendering and states

### Suggested Order
1. Types → 2. Schemas → 3. Skeleton → 4. Empty State → 5. Card → 6. Integration → 7. Tests

## Validation Commands
```bash
# TypeScript validation
pnpm --filter web typecheck

# Verify component renders
# Manual: Navigate to /home, verify coaching card placeholder appears

# Verify loading state
# Manual: Add delay to loader, verify skeleton shows

# Verify empty state
# Manual: Return empty array from loader, verify empty state shows

# Run unit tests
pnpm --filter web test:unit -- --grep "CoachingSessionsCard"
```

## Related Files
- Initiative: `../initiative.md`
- Cal.com API Research: `../../research-library/context7-calcom-api.md` (from S1606)
- Dashboard patterns: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
- Existing loader: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
