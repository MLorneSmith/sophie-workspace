# Feature: Dashboard Page Shell & Grid Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I1 |
| **Feature ID** | S2045.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 1 |

## Description
Replace the empty `/home/(user)/page.tsx` with a responsive dashboard page component featuring a 3-3-1 grid layout, page header with welcome message, loading skeleton, and `force-dynamic` export. This creates the page shell that all 7 widgets will render into.

## User Story
**As a** SlideHeroes user
**I want to** see a well-structured dashboard layout when I visit `/home`
**So that** I have a clear visual framework showing where my progress, tasks, and actions will appear

## Acceptance Criteria

### Must Have
- [ ] `/home/(user)/page.tsx` renders a dashboard with `HomeLayoutPageHeader` showing "Dashboard" title and welcome description
- [ ] Responsive 3-3-1 grid: 3 cols desktop (xl+), 2 cols tablet (md), 1 col mobile
- [ ] Bottom row spans full width (for presentation outlines table)
- [ ] `export const dynamic = "force-dynamic"` for user-specific data
- [ ] Page exports via `withI18n` HOC with `generateMetadata`
- [ ] Loading skeleton component matches 3-3-1 grid with `Skeleton` placeholders
- [ ] i18n keys added for dashboard title and description
- [ ] 7 placeholder card slots in grid (Card components with "Coming soon" or skeleton)

### Nice to Have
- [ ] Subtle entry animation on cards (fade-in)
- [ ] `data-testid` attributes on grid container and card slots

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Dashboard page component, grid layout, loading skeleton | New |
| **Logic** | Page metadata generation, i18n integration | New (minimal) |
| **Data** | N/A (placeholder cards, no data fetching yet) | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow the exact same page structure as existing personal account pages (billing, settings). Use Tailwind CSS grid utilities matching the `dashboard-demo-charts.tsx` pattern. No custom layout components needed.

### Key Architectural Choices
1. Use `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4` for the main grid, with `xl:col-span-3 md:col-span-2` for the full-width bottom row
2. Create loading skeleton as a separate component in `_components/dashboard-skeleton.tsx` for clean Suspense integration

### Trade-offs Accepted
- Placeholder cards will show "Coming soon" text rather than real empty states (empty states are in I4)
- Grid breakpoints may need fine-tuning after widgets are built (I2/I3)

## Required Credentials
> None required. This feature is purely a UI page shell with no external service dependencies.

## Dependencies

### Blocks
- F2: Activity Events Database (no dependency, runs in parallel)
- F3: Dashboard Data Loader (needs the page structure to integrate with)

### Blocked By
- None (this is a root feature)

### Parallel With
- F2: Activity Events Database (completely independent)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-skeleton.tsx` - Loading skeleton for 3-3-1 grid
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` - Grid layout container component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Replace empty page with dashboard shell
- `apps/web/public/locales/en/common.json` - Add dashboard i18n keys
- `apps/web/public/locales/nl/common.json` - Add dashboard i18n keys (if NL locale exists)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create dashboard grid component**: Build `dashboard-grid.tsx` with responsive 3-3-1 Tailwind grid, accepting children for 7 card slots
2. **Create dashboard skeleton**: Build `dashboard-skeleton.tsx` with 7 Skeleton placeholders in same grid layout
3. **Update page component**: Replace empty `page.tsx` content with `HomeLayoutPageHeader` + Suspense boundary + dashboard grid with placeholder Card components
4. **Add i18n keys**: Add `dashboard` and `dashboardDescription` keys to common.json locale files
5. **Add page metadata**: Export `generateMetadata` with i18n title

### Suggested Order
T1 (i18n keys) → T2 (grid component) → T3 (skeleton) → T4 (page component + metadata) → T5 (verify with typecheck)

## Validation Commands
```bash
pnpm typecheck
pnpm lint
grep -c "dashboard" apps/web/public/locales/en/common.json
grep -c "force-dynamic" apps/web/app/home/\(user\)/page.tsx
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Existing page: `apps/web/app/home/(user)/page.tsx`
- Grid pattern: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
- Page header: `apps/web/app/home/(user)/_components/home-page-header.tsx`
