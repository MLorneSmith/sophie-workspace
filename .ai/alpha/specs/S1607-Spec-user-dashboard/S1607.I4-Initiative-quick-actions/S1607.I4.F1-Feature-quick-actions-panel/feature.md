# Feature: Quick Actions Panel

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I4 |
| **Feature ID** | S1607.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 1 |

## Description
Implement the Quick Actions Panel widget for the user dashboard that displays contextual CTAs based on user state. The panel intelligently surfaces 3-4 action buttons (Continue Course, New Presentation, Complete Assessment, Review Storyboard) based on user progress and activity.

## User Story
**As a** SlideHeroes user
**I want to** see personalized quick actions on my dashboard
**So that** I can immediately continue my most relevant task without navigating through menus

## Acceptance Criteria

### Must Have
- [ ] Panel renders with Card wrapper and "Quick Actions" title
- [ ] "Continue Course" CTA appears when user has in-progress course (0% < completion < 100%)
- [ ] "New Presentation" CTA always appears
- [ ] "Complete Assessment" CTA appears when user has incomplete assessment
- [ ] "Review Storyboard" CTA appears when user has draft building blocks
- [ ] All CTAs navigate to correct routes on click
- [ ] Empty state displays when no actions available
- [ ] Loading skeleton displays during data fetch

### Nice to Have
- [ ] CTA icons with visual hierarchy
- [ ] Hover states with subtle animations

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | QuickActionsPanel, QuickActionsSkeleton | New |
| **Logic** | Conditional CTA rendering logic | New |
| **Data** | loadQuickActionsUserState loader | New |
| **Database** | course_progress, building_blocks_submissions | Existing |

## Architecture Decision

**Approach**: Pragmatic - Server Component with Conditional Rendering
**Rationale**: All CTAs are navigation links (no client-side state needed). Server component fetches aggregated state, renders CardButton links based on boolean flags. Simple, fast, follows existing patterns.

### Key Architectural Choices
1. Pure server component for QuickActionsPanel (no 'use client' needed)
2. Single loader function aggregates all state queries in parallel
3. CardButton from @kit/ui for consistent CTA styling
4. Next.js Link for navigation (no client router needed)

### Trade-offs Accepted
- Re-fetches on each page load (acceptable for dashboard entry point)
- No real-time updates (would require client component + subscriptions)

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Panel wrapper | Card, CardHeader, CardContent | @kit/ui/card | Consistent dashboard styling |
| CTA buttons | CardButton | @kit/ui/card-button | Clickable card pattern |
| Icons | PlayCircle, Plus, CheckCircle, FileText | lucide-react | Semantic action icons |
| Loading | Skeleton | @kit/ui/skeleton | Standard skeleton pattern |

## Dependencies

### Blocks
- None

### Blocked By
- S1607.I1: Dashboard Foundation (provides page structure and grid)

### Parallel With
- F2: Presentation Outlines Table

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/quick-actions.loader.ts` - State aggregation loader
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Panel component
- `apps/web/app/home/(user)/_components/quick-actions-skeleton.tsx` - Loading skeleton

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Integrate into dashboard grid with Suspense

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create TypeScript types**: Define QuickActionsUserState interface
2. **Create loader function**: Implement loadQuickActionsUserState with parallel queries
3. **Create skeleton component**: QuickActionsSkeleton with 4 placeholder cards
4. **Create panel component**: QuickActionsPanel with conditional CTA rendering
5. **Integrate into page**: Update page.tsx with Promise.all and Suspense
6. **Add empty state**: Handle case when no actions available

### Suggested Order
1. TypeScript types (foundation)
2. Loader function (data layer)
3. Skeleton component (loading state)
4. Panel component (main UI)
5. Page integration (wire everything)
6. Empty state handling (polish)

## Validation Commands
```bash
# TypeScript validation
pnpm --filter web typecheck

# Lint and format
pnpm lint:fix && pnpm format:fix

# Manual testing
# 1. New user: Should see "New Presentation" only
# 2. User with in-progress course: Should see "Continue Course"
# 3. User with incomplete assessment: Should see "Complete Assessment"
# 4. User with drafts: Should see "Review Storyboard"
# 5. Click each CTA: Verify navigation works
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `packages/ui/src/makerkit/card-button.tsx`
- Reference: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
