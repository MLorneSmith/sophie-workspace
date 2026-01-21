# Feature: Responsive Grid Layout with Widget Placeholders

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I1 |
| **Feature ID** | S1692.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Implement a responsive 3-column grid layout inside the dashboard `PageBody` with 7 placeholder Card components representing each widget position. The grid uses Tailwind's responsive classes for a 3-3-1 layout pattern (3 cards in rows 1-2, 1 full-width card in row 3). Each card displays a title and empty content area, establishing the visual structure for future widget implementations.

## User Story
**As a** SlideHeroes user
**I want to** see a well-organized dashboard layout with clearly defined widget areas
**So that** I understand where different types of information will be displayed

## Acceptance Criteria

### Must Have
- [ ] Responsive grid inside PageBody with classes `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3`
- [ ] 7 Card components positioned correctly (6 regular + 1 full-width)
- [ ] Full-width card spans columns: `md:col-span-2 lg:col-span-3`
- [ ] Each card has CardHeader with CardTitle showing widget name
- [ ] Cards have CardContent area (empty placeholder)
- [ ] Grid displays correctly at mobile (1 col), tablet (2 col), desktop (3 col) breakpoints
- [ ] TypeScript compiles without errors (`pnpm typecheck` passes)

### Nice to Have
- [ ] Cards include icons indicating widget type (from lucide-react)
- [ ] Subtle entrance animation (`animate-in fade-in`)
- [ ] CardDescription with brief widget purpose

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Card, CardHeader, CardTitle, CardContent | Existing |
| **Logic** | Grid layout in page.tsx | New |
| **Data** | N/A (placeholders only) | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal - Inline grid with existing Card components
**Rationale**: Grid is a single div with Tailwind classes - no abstraction needed. Cards are composed from existing `@kit/ui/card` components. This follows patterns from kanban board and ai-usage dashboard.

### Key Architectural Choices
1. Inline grid in page.tsx (not a separate component) - only used once
2. Use existing Card component composition pattern
3. Tailwind responsive classes for breakpoints
4. Server Component (no client JavaScript needed for layout)

### Trade-offs Accepted
- Placeholder cards show empty content - acceptable for foundation
- No data display - will be added when widgets are implemented

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Grid container | div with Tailwind | Native | Simple, no abstraction needed |
| Widget cards | Card, CardHeader, CardTitle, CardContent | @kit/ui/card | Existing, matches codebase style |
| Widget icons | Various | lucide-react | Existing icon library |

**Components to Install**: None - all components already exist

## Dependencies

### Blocks
- F4: Skeleton Loading (needs grid structure to match)

### Blocked By
- F1: Dashboard Page Shell (grid goes inside PageBody)

### Parallel With
- F2: Types & Loader (independent, both depend on F1)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add grid layout with 7 Card placeholders inside PageBody

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add grid container**: Add responsive grid div inside PageBody
2. **Create Row 1 cards**: Add 3 Cards for Progress, Activity, Tasks
3. **Create Row 2 cards**: Add 3 Cards for Skills, Presentations, Coaching
4. **Create Row 3 card**: Add 1 full-width Card for Quick Actions
5. **Add card content structure**: CardHeader with CardTitle for each
6. **Add icons (optional)**: Import and add appropriate icons
7. **Test responsive behavior**: Verify at all breakpoints
8. **Type check**: Run pnpm typecheck

### Suggested Order
1. Add grid container
2. Create Row 1 cards
3. Create Row 2 cards
4. Create Row 3 card (full-width)
5. Add card content structure
6. Test responsive behavior
7. Type check

## Widget Positions

### Row 1 (3 smaller cards)
| Position | Widget | Icon Suggestion |
|----------|--------|-----------------|
| 1 | Course Progress | BookOpen |
| 2 | Recent Activity | Activity |
| 3 | Task Summary | CheckSquare |

### Row 2 (3 medium cards)
| Position | Widget | Icon Suggestion |
|----------|--------|-----------------|
| 4 | Skills Assessment | Target |
| 5 | My Presentations | Presentation |
| 6 | Upcoming Coaching | Calendar |

### Row 3 (1 full-width card)
| Position | Widget | Icon Suggestion |
|----------|--------|-----------------|
| 7 | Quick Actions | Zap |

## Grid Layout Specification

```
Desktop (lg: 1024px+):
┌─────────────┬─────────────┬─────────────┐
│  Progress   │  Activity   │   Tasks     │
├─────────────┼─────────────┼─────────────┤
│   Skills    │ Presentations│  Coaching  │
├─────────────┴─────────────┴─────────────┤
│            Quick Actions                 │
└─────────────────────────────────────────┘

Tablet (md: 768px):
┌─────────────┬─────────────┐
│  Progress   │  Activity   │
├─────────────┼─────────────┤
│   Tasks     │   Skills    │
├─────────────┼─────────────┤
│Presentations│  Coaching   │
├─────────────┴─────────────┤
│      Quick Actions        │
└───────────────────────────┘

Mobile (default):
┌─────────────┐
│  Progress   │
├─────────────┤
│  Activity   │
├─────────────┤
│   Tasks     │
├─────────────┤
│   Skills    │
├─────────────┤
│Presentations│
├─────────────┤
│  Coaching   │
├─────────────┤
│Quick Actions│
└─────────────┘
```

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix && pnpm format:fix

# Start dev server
pnpm dev
# Test responsive at:
# - Mobile: 375px width
# - Tablet: 768px width
# - Desktop: 1024px+ width
```

## Related Files
- Initiative: `../initiative.md`
- Reference grid: `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` (grid pattern)
- Reference grid: `apps/web/app/home/(user)/admin/ai-usage/_components/usage-dashboard.tsx`
- Card components: `packages/ui/src/shadcn/card.tsx`
