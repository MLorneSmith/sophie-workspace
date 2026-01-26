# Feature: Dashboard Page Shell

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I1 |
| **Feature ID** | S1823.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description
Create the main dashboard page server component at `/home/(user)/page.tsx` with proper metadata, `HomeLayoutPageHeader`, `PageBody` container, and integration with `UserWorkspaceContextProvider`. This establishes the page structure that hosts all dashboard widgets.

## User Story
**As a** logged-in user
**I want to** see my personalized dashboard when I navigate to `/home`
**So that** I can quickly access my learning progress and upcoming tasks

## Acceptance Criteria

### Must Have
- [ ] Page renders at `/home/(user)/page.tsx` route
- [ ] Page uses `HomeLayoutPageHeader` with "Dashboard" title and description
- [ ] Page uses `PageBody` component as content container
- [ ] Page calls `loadDashboardData()` loader for data
- [ ] Page has proper metadata via `generateMetadata()`
- [ ] Page exports with `withI18n` HOC
- [ ] Page integrates with existing `UserWorkspaceContextProvider` from layout

### Nice to Have
- [ ] Welcome message using user's name from context
- [ ] Last login timestamp display

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Page component with header | New |
| **Logic** | Data loader integration | New |
| **Data** | Uses dashboard loader | Depends on F1 |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow exact patterns from existing user pages like `course/page.tsx` and `ai/page.tsx`. Use server component for initial data fetch, pass data to grid layout component.

### Key Architectural Choices
1. Server component for optimal data fetching
2. Follow existing `HomeLayoutPageHeader` + `PageBody` pattern
3. Data passed as props to child components (no prop drilling via context)

### Trade-offs Accepted
- Page replaces existing minimal `/home` page (intentional upgrade)

## Required Credentials

None required.

## Dependencies

### Blocks
- F3: Responsive Grid Layout (needs page container to render inside)
- F4: Skeleton Loading (needs page structure for loading boundaries)

### Blocked By
- F1: Types and Loader (needs `loadDashboardData()` function)

### Parallel With
- None

## Files to Create/Modify

### New Files
- None (modifying existing file)

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Replace minimal page with full dashboard page

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add generateMetadata**: Create metadata export with i18n title
2. **Update page component**: Replace minimal content with dashboard structure
3. **Add HomeLayoutPageHeader**: Include title, description, optional actions
4. **Integrate data loader**: Call `loadDashboardData()` with Supabase client
5. **Add PageBody container**: Wrap content in PageBody component
6. **Export with withI18n**: Ensure proper HOC wrapping

### Suggested Order
1. Metadata (T1)
2. Page structure with header and PageBody (T2-T4)
3. Data loader integration (T5)
4. Final export (T6)

## Validation Commands
```bash
# Verify page compiles
pnpm --filter web typecheck

# Verify page renders (requires dev server)
curl -s http://localhost:3000/home | grep -q "Dashboard"

# Check page structure
grep -A 20 "function.*Page" apps/web/app/home/\(user\)/page.tsx
```

## Related Files
- Initiative: `../initiative.md`
- Existing page patterns: `apps/web/app/home/(user)/course/page.tsx`
- Header component: `apps/web/app/home/(user)/_components/home-page-header.tsx`
- Layout with context: `apps/web/app/home/(user)/layout.tsx`
