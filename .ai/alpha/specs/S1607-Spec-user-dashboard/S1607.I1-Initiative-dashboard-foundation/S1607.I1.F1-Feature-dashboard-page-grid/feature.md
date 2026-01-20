# Feature: Dashboard Page & Grid Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I1 |
| **Feature ID** | S1607.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 1 |

## Description
Create the user dashboard page structure with a responsive 3-3-1 grid layout. This includes the page.tsx Server Component, responsive grid component, and loading skeleton states. The grid renders 7 widget positions: 3 cards in row 1, 3 cards in row 2, and 1 full-width card in row 3.

## User Story
**As a** SlideHeroes user
**I want to** see my dashboard with a clean, organized layout
**So that** I can quickly access my key information at a glance

## Acceptance Criteria

### Must Have
- [ ] Page renders at `/home` route with HomeLayoutPageHeader
- [ ] 3-3-1 responsive grid displays correctly at all breakpoints
- [ ] Mobile (< 768px): 1 column stacked layout
- [ ] Tablet (768px - 1279px): 2 columns
- [ ] Desktop (≥ 1280px): 3 columns with full-width bottom row
- [ ] Loading skeleton displays during data fetch with Suspense boundary
- [ ] i18n keys added for dashboard title and description

### Nice to Have
- [ ] Smooth transition animation from skeleton to content
- [ ] Accessible grid structure with ARIA landmarks

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `dashboard-grid.tsx`, `dashboard-skeleton.tsx` | New |
| **Logic** | Page Suspense boundary | New |
| **Data** | Placeholder for loader integration | Prepared |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Leverage existing Page/PageBody patterns from (user) route. Use Tailwind responsive grid classes for layout. Server Component with Suspense for streaming support.

### Key Architectural Choices
1. Server Component pattern for automatic RLS and no client hydration
2. Suspense boundary at page level for progressive rendering
3. Tailwind grid with responsive breakpoints (md, xl)

### Trade-offs Accepted
- Grid layout is fixed (3-3-1) rather than configurable - simpler implementation

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Grid container | Custom Tailwind | Local | Specific 3-3-1 layout needs |
| Card containers | `Card` | @kit/ui/card | Existing semantic card component |
| Loading skeleton | `Skeleton` | @kit/ui/skeleton | Matches card structure |
| Page layout | `PageBody`, `PageHeader` | @kit/ui/page | Existing page patterns |

**Components to Install**: None - all components already available

## Dependencies

### Blocks
- F2: Widget Card Shells (provides rendering slots)
- F3: Unified Data Loader (provides data interface)

### Blocked By
- None (root feature)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` - Responsive 3-3-1 grid component
- `apps/web/app/home/(user)/_components/dashboard-skeleton.tsx` - Loading skeleton matching grid

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Integrate grid and Suspense
- `apps/web/public/locales/en/common.json` - Add dashboard i18n keys

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create dashboard-grid.tsx**: Server component with 3-3-1 responsive Tailwind grid
2. **Create dashboard-skeleton.tsx**: Skeleton structure matching grid layout
3. **Update page.tsx**: Add Suspense boundary and integrate grid component
4. **Add i18n keys**: Dashboard title, description, and widget placeholder labels

### Suggested Order
1. dashboard-skeleton.tsx (simpler, defines structure)
2. dashboard-grid.tsx (imports skeleton, defines layout)
3. page.tsx (integrates both with Suspense)
4. i18n keys (final touch)

## Validation Commands
```bash
# Verify page renders without errors
curl -s http://localhost:3000/home | grep -i "dashboard"

# Verify TypeScript compiles
pnpm --filter web typecheck

# Verify responsive grid classes exist
grep -r "grid-cols-1" apps/web/app/home/\(user\)/_components/

# Verify skeleton component exists
ls apps/web/app/home/\(user\)/_components/dashboard-skeleton.tsx
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
