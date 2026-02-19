# Feature: Widget Empty States — Row 2 & Table

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I4 |
| **Feature ID** | S2045.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 3.5 |
| **Priority** | 2 |

## Description
Implement engaging empty states for the 4 remaining dashboard widgets: Activity Feed (subtle timeline skeleton with "Your activity will appear here"), Quick Actions (all 4 CTAs visible with most relevant highlighted), Coaching Sessions (booking prompt with "Book Session" CTA), and Presentations Table ("No presentations yet" with "Create Your First Presentation" CTA). Each empty state provides contextual guidance and clear next actions for new users.

## User Story
**As a** new SlideHeroes user with no data
**I want to** see helpful empty states in my Row 2 dashboard widgets and presentations table
**So that** I understand the purpose of each widget and can take immediate action

## Acceptance Criteria

### Must Have
- [ ] Activity Feed widget shows a subtle timeline skeleton (2-3 faded timeline items with placeholder lines) when `activity_events` has no records
- [ ] Activity Feed empty state displays "Your activity will appear here as you progress through the course" text
- [ ] Quick Actions widget shows all 4 CTA buttons when user has no data, with "Start Course" highlighted as primary action
- [ ] Quick Actions empty state highlights the most relevant next action based on user state (new user = "Start Course")
- [ ] Coaching Sessions widget shows a booking prompt with "Book a 1-on-1 session with our presentation coach" text and "Book Session" CTA
- [ ] Coaching empty state links to `/home/coaching` for full calendar view
- [ ] Presentations Table shows "You haven't created any presentations yet" with explanatory text and "Create Your First Presentation" CTA linking to `/home/ai/blocks`
- [ ] All empty states use semantic color classes for dark mode compatibility
- [ ] All CTA buttons are keyboard-focusable with appropriate ARIA labels

### Nice to Have
- [ ] Activity Feed timeline skeleton uses `animate-pulse` for subtle loading feel
- [ ] Quick Actions primary CTA uses `variant="default"` while others use `variant="outline"` for visual hierarchy

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `activity-feed-empty.tsx`, `quick-actions-empty.tsx`, `coaching-empty.tsx`, `presentations-table-empty.tsx` | New |
| **Logic** | Conditional rendering in each widget based on data presence | Modified (in widget components from I2/I3) |
| **Data** | Empty data detection in dashboard loader | Modified (loader from I1) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use `EmptyState` component for text-heavy empty states (Presentations Table, Activity Feed). For Quick Actions, render all CTAs directly since the "empty state" IS the full set of actions. For Coaching, show a compact prompt with CTA. Activity Feed uses a visual skeleton timeline pattern (faded items with muted colors) to preview what the feed will look like.

### Key Architectural Choices
1. Activity Feed empty state uses a custom visual timeline skeleton (not the generic EmptyState component) to preview the timeline layout
2. Quick Actions renders all 4 buttons regardless of data state — empty state just changes which button is primary
3. Coaching empty state uses `EmptyState` with a brief prompt and single CTA to booking page
4. Presentations Table uses the `DataTable` empty row pattern with `EmptyState` embedded

### Trade-offs Accepted
- Quick Actions doesn't have a traditional "empty state" — it always shows CTAs, just with different highlighting based on user progress

## Required Credentials
None required — this feature uses only existing UI components and no external services.

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Empty state container | EmptyState | @kit/ui/empty-state | Established pattern |
| CTA buttons | Button | @kit/ui/button | Primary + outline variants for hierarchy |
| Timeline skeleton | Skeleton | @kit/ui/skeleton | Pulse animation for faded timeline items |
| Table empty state | DataTable empty row | @kit/ui/data-table | Integrated with existing table component |
| Card wrapper | Card, CardHeader, CardContent | @kit/ui/card | Consistent dashboard card styling |

**Components to Install**: None — all components already in packages/ui.

## Dependencies

### Blocks
- F4: Responsive & Accessibility Polish (needs empty states to exist for polish pass)

### Blocked By
- S2045.I2: Visualization widgets must exist (Activity Feed component)
- S2045.I3: Interactive widgets must exist (Quick Actions, Coaching, Presentations Table components)

### Parallel With
- F1: Widget Empty States — Row 1
- F3: Loading Skeletons & Suspense

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/activity-feed-empty.tsx` - Activity Feed timeline skeleton empty state
- `apps/web/app/home/(user)/_components/dashboard/coaching-empty.tsx` - Coaching booking prompt empty state
- `apps/web/app/home/(user)/_components/dashboard/presentations-table-empty.tsx` - Presentations "no data" empty state

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard/activity-feed-widget.tsx` - Add empty data conditional rendering
- `apps/web/app/home/(user)/_components/dashboard/quick-actions-widget.tsx` - Adjust CTA highlighting for empty/new user state
- `apps/web/app/home/(user)/_components/dashboard/coaching-widget.tsx` - Add empty data conditional rendering
- `apps/web/app/home/(user)/_components/dashboard/presentations-table-widget.tsx` - Add empty data conditional rendering with DataTable

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Activity Feed empty state component**: Build a visual timeline skeleton with 3-4 faded timeline items using Skeleton component with pulse animation
2. **Create Coaching empty state component**: Use EmptyState with booking prompt text and "Book Session" CTA to `/home/coaching`
3. **Create Presentations Table empty state component**: Use EmptyState with "No presentations yet" and "Create Your First Presentation" CTA to `/home/ai/blocks`
4. **Update Quick Actions widget for new user state**: Ensure all 4 CTAs render for new users, highlight "Start Course" as primary variant
5. **Integrate empty states into widget components**: Add conditional rendering in each Row 2/Table widget
6. **Verify dark mode rendering for all 4 empty states**: Toggle dark mode, verify semantic color classes
7. **Add ARIA labels and keyboard navigation**: Ensure all CTAs are focusable and labeled

### Suggested Order
1. Activity Feed empty state (most complex — custom timeline skeleton)
2. Presentations Table empty state (standard EmptyState pattern)
3. Coaching empty state (simple prompt + CTA)
4. Quick Actions new user highlighting
5. Integration into widget components
6. Dark mode + a11y verification

## Validation Commands
```bash
pnpm typecheck
pnpm lint
# Visual: Navigate to /home with fresh user (no activity_events, no building_blocks_submissions, no coaching bookings)
# Verify: Activity Feed shows timeline skeleton with placeholder text
# Verify: Quick Actions shows all 4 CTAs with "Start Course" highlighted
# Verify: Coaching shows booking prompt with CTA
# Verify: Presentations Table shows empty state with "Create" CTA
# Verify: Dark mode toggle renders correctly
# Verify: Keyboard Tab navigates to all CTAs
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
- EmptyState component: `packages/ui/src/makerkit/empty-state.tsx`
- Skeleton component: `packages/ui/src/shadcn/skeleton.tsx`
- DataTable component: `packages/ui/src/shadcn/data-table.tsx`
- Empty states research: `../../research-library/perplexity-dashboard-empty-states-ux.md`
