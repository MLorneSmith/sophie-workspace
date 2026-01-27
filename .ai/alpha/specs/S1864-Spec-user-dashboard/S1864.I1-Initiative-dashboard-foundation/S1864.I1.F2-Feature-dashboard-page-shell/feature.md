# Feature: Dashboard Page Shell

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I1 |
| **Feature ID** | S1864.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description
Implement the dashboard page shell at `/home/(user)/page.tsx` with PageHeader integration, Suspense boundaries for loading states, and proper data loading from the dashboard loader. This transforms the existing minimal page into a dashboard-ready container.

## User Story
**As a** user navigating to my home page
**I want to** see a properly structured dashboard page with loading feedback
**So that** I know content is loading and can access my dashboard quickly

## Acceptance Criteria

### Must Have
- [ ] Page uses `HomeLayoutPageHeader` with translated title and description
- [ ] Page wraps content in `PageBody` component
- [ ] Suspense boundary wraps dashboard content with skeleton fallback
- [ ] Data loaded via `loadDashboardPageData()` from loader
- [ ] `withI18n` wrapper for internationalization
- [ ] `generateMetadata` function for page title
- [ ] Page renders without errors at `/home` route

### Nice to Have
- [ ] Translation keys added for dashboard-specific strings

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `page.tsx` shell | Modified |
| **Logic** | Suspense boundary | New |
| **Data** | `loadDashboardPageData()` call | New |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow existing page patterns from `/home/[account]/page.tsx`. Use Server Component for data loading, Suspense for loading states.

### Key Architectural Choices
1. Keep page as Server Component (no 'use client')
2. Single Suspense boundary wrapping all dashboard content
3. Async component pattern with direct loader call

### Trade-offs Accepted
- Single Suspense boundary (simpler) vs per-widget boundaries (more granular loading)

## Required Credentials
> None required - this feature only modifies the page structure

## Dependencies

### Blocks
- F3: Responsive Grid Layout (needs page shell to render in)
- F4: Skeleton Loading (used as Suspense fallback)

### Blocked By
- F1: Types and Data Loader (needs loadDashboardPageData function)

### Parallel With
- None

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add data loading, Suspense boundary, and grid import

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add imports**: Import loader, Suspense, and component references
2. **Modify page component**: Convert to async and call loader
3. **Add Suspense boundary**: Wrap content with skeleton fallback
4. **Update metadata**: Ensure generateMetadata is correct
5. **Test rendering**: Verify page loads at /home route

### Suggested Order
1. Add imports
2. Modify page component structure
3. Add Suspense boundary
4. Test in browser

## Validation Commands
```bash
# Verify page compiles
pnpm typecheck

# Check Suspense is used
grep -r "Suspense" apps/web/app/home/\(user\)/page.tsx

# Start dev server and visit /home
pnpm dev
# Then visit http://localhost:3000/home
```

## Related Files
- Initiative: `../initiative.md`
- Pattern reference: `apps/web/app/home/[account]/page.tsx`
- Existing page: `apps/web/app/home/(user)/page.tsx`
