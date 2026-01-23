# Feature: Dashboard Page Shell

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I1 |
| **Feature ID** | S1692.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Create the foundational dashboard page at `/home/(user)/` for personal accounts. This establishes the page route, metadata, i18n configuration, and basic page structure using existing `HomeLayoutPageHeader` and `PageBody` components. The page serves as the container that all subsequent dashboard features (grid, widgets, loader) will integrate with.

## User Story
**As a** SlideHeroes user with a personal account
**I want to** have a dedicated dashboard home page
**So that** I can see an overview of my learning progress and presentations when I log in

## Acceptance Criteria

### Must Have
- [ ] Page route exists at `/home` for personal accounts (apps/web/app/home/(user)/page.tsx)
- [ ] Page uses `generateMetadata` with i18n for proper SEO title
- [ ] Page exports with `withI18n()` wrapper
- [ ] Page header displays localized title and description via `HomeLayoutPageHeader`
- [ ] Page content wrapped in `PageBody` component
- [ ] TypeScript compiles without errors (`pnpm typecheck` passes)

### Nice to Have
- [ ] Page transitions smoothly when navigating from other routes
- [ ] Breadcrumb shows current location

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | HomeLayoutPageHeader, PageBody | Existing |
| **Logic** | page.tsx async server component | New |
| **Data** | N/A (shell only, no data fetching) | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal - Enhance existing page.tsx
**Rationale**: The personal dashboard page already exists with header structure. This feature validates it follows patterns correctly and adds any missing elements. No new components needed - just verify and potentially enhance the existing structure.

### Key Architectural Choices
1. Server Component pattern - async function for future data fetching support
2. Existing `HomeLayoutPageHeader` component for consistent styling with other personal account pages

### Trade-offs Accepted
- No dashboard-specific header (reuses existing HomeLayoutPageHeader) - acceptable for foundation phase

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Page container | PageBody | @kit/ui/page | Existing, matches all pages |
| Page header | HomeLayoutPageHeader | Local _components | Existing, provides consistency |
| Title/Description | Trans | @kit/ui/trans | Existing i18n pattern |

**Components to Install**: None - all components already exist

## Dependencies

### Blocks
- F2: Types & Loader (needs page to integrate with)
- F3: Grid Layout (needs PageBody to render inside)

### Blocked By
- None (foundation feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- None (page.tsx already exists)

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Verify structure, ensure pattern compliance
- `public/locales/en/common.json` - Ensure i18n keys exist for dashboard

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Verify page structure**: Confirm existing page.tsx follows patterns from [account]/page.tsx
2. **Add/verify i18n keys**: Ensure common.json has routes.home and homeTabDescription keys
3. **Validate metadata**: Ensure generateMetadata returns proper SEO title
4. **Type check**: Run pnpm typecheck to verify no errors
5. **Manual test**: Navigate to /home and verify page renders correctly

### Suggested Order
1. Verify page structure
2. Add/verify i18n keys
3. Validate metadata
4. Type check
5. Manual test

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix && pnpm format:fix

# Verify page exists
ls apps/web/app/home/\(user\)/page.tsx

# Start dev server and test
pnpm dev
# Then navigate to http://localhost:3000/home
```

## Related Files
- Initiative: `../initiative.md`
- Reference pattern: `apps/web/app/home/[account]/page.tsx`
- Existing header: `apps/web/app/home/(user)/_components/home-page-header.tsx`
- i18n config: `public/locales/en/common.json`
