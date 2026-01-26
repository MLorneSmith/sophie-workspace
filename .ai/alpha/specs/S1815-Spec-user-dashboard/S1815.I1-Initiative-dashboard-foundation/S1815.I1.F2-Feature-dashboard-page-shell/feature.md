# Feature: Dashboard Page Shell

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I1 |
| **Feature ID** | S1815.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 2 |

## Description
Create the main dashboard page at `/home/(user)/page.tsx` with proper Next.js patterns including metadata generation, i18n support, and integration with the data loader. The page currently exists but is empty - this feature transforms it into the dashboard entry point.

## User Story
**As a** SlideHeroes user
**I want to** see a personalized dashboard when I log in
**So that** I can quickly understand my learning progress and next actions

## Acceptance Criteria

### Must Have
- [ ] Page renders at `/home/(user)` route (modify existing page.tsx)
- [ ] Uses `generateMetadata()` for SEO with i18n title
- [ ] Uses `HomeLayoutPageHeader` with proper i18n keys
- [ ] Wraps content in `PageBody` component
- [ ] Calls `loadUserDashboard()` with authenticated user ID
- [ ] Uses `Suspense` boundary with skeleton fallback
- [ ] Exported with `withI18n()` HOC

### Nice to Have
- [ ] Add dashboard-specific i18n namespace

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `page.tsx` modifications | Modify |
| **Logic** | Import loader, Suspense boundary | New |
| **Data** | Use DashboardData from loader | Existing (F1) |
| **Database** | N/A (handled by loader) | N/A |

## Architecture Decision

**Approach**: Server Component with Suspense
**Rationale**: Follow existing page patterns (assessment/page.tsx). Server component for initial data fetch, Suspense for progressive rendering, minimal client JS.

### Key Architectural Choices
1. Async server component calls `requireUserInServerComponent()` for auth
2. Suspense boundary around `DashboardGrid` with `DashboardSkeleton` fallback
3. Use existing i18n keys where available (`common:routes.home`, `common:homeTabDescription`)

### Trade-offs Accepted
- Empty `DashboardGrid` initially renders placeholder cards - visual polish deferred to subsequent features

## Required Credentials
> None required - uses existing auth session

## Dependencies

### Blocks
- F3: Responsive Grid Layout (needs page to render grid)
- F4: Skeleton Loading (needs page Suspense boundary)

### Blocked By
- F1: Types & Data Loader (needs loader function and types)

### Parallel With
- None

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Replace empty page with dashboard implementation
- `apps/web/public/locales/en/common.json` - Add dashboard i18n keys if needed

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add generateMetadata function**: Implement metadata generation with i18n title
2. **Import and call loader**: Import loadUserDashboard, call with authenticated user ID
3. **Add Suspense boundary**: Wrap grid in Suspense with skeleton fallback
4. **Update page structure**: Add HomeLayoutPageHeader and PageBody wrapper
5. **Verify i18n keys exist**: Check common.json for routes.home and homeTabDescription

### Suggested Order
Sequential: T5 (verify i18n) -> T1 (metadata) -> T2 (loader) -> T4 (structure) -> T3 (Suspense)

## Validation Commands
```bash
# Verify page compiles
pnpm typecheck

# Start dev server and navigate to /home
pnpm dev
# Manually verify: Page loads without errors
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/assessment/page.tsx`
- Header: `apps/web/app/home/(user)/_components/home-page-header.tsx`
- Loader: `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` (from F1)
