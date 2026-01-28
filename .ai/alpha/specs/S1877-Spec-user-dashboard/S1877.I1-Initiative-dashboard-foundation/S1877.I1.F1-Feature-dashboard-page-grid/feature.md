# Feature: Dashboard Page & Grid Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I1 |
| **Feature ID** | S1877.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description

Creates the main dashboard page component with responsive 3-3-1 grid layout, PageHeader integration, and SEO metadata. This provides the foundational UI structure that all subsequent dashboard widgets will be rendered into.

## User Story

**As a** Learning Lauren (active user seeking presentation skills)
**I want to** see a consolidated dashboard with widgets organized in a responsive grid
**So that** I can quickly understand my progress and find what to work on next without navigating to multiple pages

## Acceptance Criteria

### Must Have
- [ ] Dashboard page renders at `/home/(user)/page.tsx` with proper metadata (title, description)
- [ ] Responsive 3-3-1 grid layout implemented (mobile: 1 col, tablet: 2 col, desktop: 3 col)
- [ ] PageHeader integrated with user context and translatable content
- [ ] PageBody wrapper used for consistent spacing
- [ ] 6 widget placeholder cards rendered in correct positions
- [ ] Grid layout matches spec mockup (Row 1: 3 cards, Row 2: 2 cards, Row 3: 1 full-width)
- [ ] Animation class (`animate-in fade-in`) applied for smooth page load

### Nice to Have
- [ ] Grid gap and spacing optimized for visual clarity
- [ ] Empty widget containers with consistent dimensions

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `<PageBody>`, `<PageHeader>`, `<Card>` widgets | Existing / New composite |
| **Logic** | Page component with grid layout | New |
| **Data** | None (data layer in F2) | N/A |
| **Database** | None (no DB changes) | N/A |

## Architecture Decision

**Approach**: Pragmatic - Reuse existing patterns, minimal new code
**Rationale**: Codebase has well-established dashboard patterns in `dashboard-demo-charts.tsx` that can be adapted. Grid layout patterns and responsive breakpoints are standard Tailwind utilities. No need for complex state management or new libraries.

### Key Architectural Choices

1. **Server Component Pattern**: Page remains a server component following Next.js 15 patterns
2. **Responsive Grid with Tailwind**: Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for 3-3-1 layout
3. **PageBody Wrapper**: Use existing `PageBody` from `@kit/ui/page` for consistent spacing
4. **Widget Placeholders**: Render 6 `<Card>` components with `<CardContent>` as placeholders for widgets
5. **Animation**: Use `animate-in fade-in duration-500` pattern from existing dashboards

### Trade-offs Accepted

- Widgets initially rendered as empty cards (full widget implementations in subsequent initiatives)
- No client-side state in page component (all state handled by widget children)

## Required Credentials

> Environment variables required for this feature to function. Extracted from research files.

None required - this feature uses only internal components and Supabase client.

## Dependencies

### Blocks
- S1877.I2 - Progress Widgets (requires grid container and page structure)
- S1877.I3 - Activity & Task Widgets (requires grid container and page structure)
- S1877.I4 - Presentation Table & Polish (requires grid container and page structure)
- S1877.I1.F2 - Dashboard Data Loader (needs page structure to wire data)
- S1877.I1.F3 - Skeleton & Empty States (needs widget containers from grid)

### Blocked By
- None (foundation feature)

### Parallel With
- None (this feature must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/user-dashboard-page-header.tsx` - Page header for dashboard

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Replace minimal page with dashboard grid layout
- `apps/web/lib/i18n/i18n.settings.ts` - Add `user-dashboard` namespace if needed
- `apps/web/config/personal-account-navigation.config.tsx` - Ensure dashboard route is properly configured

## Task Hints

> Guidance for the next decomposition phase

### Candidate Tasks

1. **Create dashboard page header component**: Extend `PageHeader` with user-specific welcome message and description
2. **Implement dashboard page component**: Create `apps/web/app/home/(user)/page.tsx` with grid layout
3. **Add page metadata**: Implement `generateMetadata` function for SEO
4. **Create widget placeholder components**: 6 card components with placeholder content
5. **Apply responsive grid classes**: Ensure mobile/tablet/desktop breakpoints work correctly

### Suggested Order

1. Create page header component
2. Implement dashboard page with grid and widget placeholders
3. Add metadata and ensure navigation config is correct
4. Test responsive behavior at different breakpoints
5. Verify page renders without data (placeholder state)

## Validation Commands

```bash
# Verify page renders
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "dashboard\|grid"

# Typecheck
pnpm typecheck

# Verify responsive breakpoints (manual browser testing)
# Mobile: 375px - should see single column
# Tablet: 768px - should see 2 columns
# Desktop: 1280px - should see 3 columns
```

## Related Files

- Initiative: `../initiative.md`
- Spec: `../../spec.md`
- Tasks: `./S1877.I1.F1.T*-<slug>.md` (created in next phase)
