# Feature: Dashboard Page Shell

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I1 |
| **Feature ID** | S1918.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Create the dashboard page shell at `/home/(user)/page.tsx` with proper PageHeader, metadata generation, i18n integration, and a wrapper container for the dashboard content. This establishes the entry point and structural foundation for all dashboard widgets.

## User Story
**As a** SlideHeroes user
**I want to** see a properly titled and structured dashboard page when I navigate to /home
**So that** I have a consistent, professional experience with proper page metadata and navigation context

## Acceptance Criteria

### Must Have
- [ ] Page renders at `/home/(user)/page.tsx` with updated structure
- [ ] PageHeader displays "Dashboard" title with description
- [ ] `generateMetadata` returns proper page title for SEO/browser tab
- [ ] Page wrapped with `withI18n` for internationalization
- [ ] PageBody contains a container div ready for grid layout
- [ ] Dark mode compatible (inherits from existing theme)
- [ ] Navigation sidebar shows Dashboard link as active

### Nice to Have
- [ ] Breadcrumb showing "Home > Dashboard" pattern
- [ ] Welcome message with user's name (if available from context)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | PageHeader, PageBody, Trans | Existing |
| **Logic** | i18n setup, metadata generation | Existing patterns |
| **Data** | None (static page shell) | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Extend the existing minimal page.tsx by adding a container div inside PageBody. Follow the exact patterns from team dashboard (`app/home/[account]/page.tsx`) for consistency.

### Key Architectural Choices
1. Reuse existing `HomeLayoutPageHeader` component with updated props
2. Add a dashboard container div inside PageBody with proper spacing classes
3. Keep Server Component pattern (no client-side logic needed)

### Trade-offs Accepted
- No client-side user greeting initially (can be added in I6 polish phase)

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| None required | Static page shell | N/A |

> No external credentials required for this feature.

## Dependencies

### Blocks
- F2: Responsive Grid Layout (needs page container)
- F3: Widget Placeholder Slots (needs grid layout)

### Blocked By
- None (foundation feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add dashboard container structure
- `apps/web/app/home/(user)/_components/home-page-header.tsx` - Update title/description if needed
- `public/locales/en/common.json` - Add dashboard-related i18n keys if missing

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Update page metadata**: Modify generateMetadata to return "Dashboard" title
2. **Update PageHeader props**: Change title/description to dashboard-specific text
3. **Add dashboard container**: Create wrapper div inside PageBody with proper classes
4. **Add i18n keys**: Ensure common.json has dashboard route translations
5. **Verify navigation**: Check sidebar link active state works correctly

### Suggested Order
1. i18n keys (foundation for UI text)
2. Page metadata
3. PageHeader update
4. Dashboard container
5. Verification

## Validation Commands
```bash
# Verify page exists and has been updated
test -f apps/web/app/home/\(user\)/page.tsx && echo "Page exists"

# Check for dashboard container class
grep -q "dashboard" apps/web/app/home/\(user\)/page.tsx && echo "Dashboard container found"

# Type check
pnpm typecheck

# Lint check
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `apps/web/app/home/[account]/page.tsx` (team dashboard pattern)
