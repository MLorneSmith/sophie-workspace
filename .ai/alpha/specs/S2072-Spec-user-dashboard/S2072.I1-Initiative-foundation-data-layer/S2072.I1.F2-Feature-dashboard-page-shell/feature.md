# Feature: Dashboard Page Shell

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I1 |
| **Feature ID** | S2072.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description

Create the dashboard page at the `/home` route with proper page shell, header, and metadata. This feature establishes the route structure and provides the container that the grid layout will render into.

## User Story

**As a** user
**I want to** navigate to `/home` and see a personalized dashboard page
**So that** I have a central location to view my learning progress and take actions

## Acceptance Criteria

### Must Have
- [ ] Dashboard page renders at `/home` route (replacing current placeholder)
- [ ] Page uses HomeLayoutPageHeader component with i18n title/description
- [ ] Page uses PageBody component for content area
- [ ] Page wrapped with withI18n HOC
- [ ] Page metadata (title) set via generateMetadata
- [ ] Loading state defined in loading.tsx with skeleton

### Nice to Have
- [ ] Error boundary for graceful error handling

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | DashboardPage (page.tsx) | New |
| **Logic** | generateMetadata, withI18n | Existing |
| **Data** | None (placeholder content) | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Server Component with Minimal Shell
**Rationale**: Follow existing page patterns in codebase. Server components provide better SEO and initial load performance. The page shell is simple - just header and body container.

### Key Architectural Choices

1. **Replace existing page.tsx**: The current `/home` page is minimal - replace it with dashboard structure
2. **Server Component**: No "use client" directive - data loading will be added in F4
3. **Loading state**: Create loading.tsx with skeleton for perceived performance

### Trade-offs Accepted

- Page won't show real data until F4 (Data Loader) is implemented - acceptable for incremental development

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Page header | HomeLayoutPageHeader | Existing | Matches other user pages |
| Page body | PageBody from @kit/ui/page | Existing | Standard page container |
| Loading skeleton | Skeleton from @kit/ui/skeleton | Existing | Loading state pattern |

**Components to Install**: None (all components exist)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|

> None required - this feature only creates the page shell

## Dependencies

### Blocks
- S2072.I1.F3 (Responsive Grid Layout) - needs page shell to render into

### Blocked By
- S2072.I1.F1 (Dashboard Types) - needs types for future data props

### Parallel With
- S2072.I1.F4 (Dashboard Data Loader) - can be developed in parallel

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/loading.tsx` - Loading skeleton for dashboard

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Replace with dashboard page structure

## Task Hints

### Candidate Tasks
1. **Create loading state**: Create loading.tsx with skeleton components
2. **Update page metadata**: Add generateMetadata function with dashboard title
3. **Create page shell**: Update page.tsx with header and PageBody
4. **Add i18n keys**: Ensure dashboard title/description keys exist or add them
5. **Add placeholder content**: Temporary placeholder text until grid layout is added

### Suggested Order
1. Create loading.tsx with skeleton
2. Update page.tsx with proper shell structure
3. Add/verify i18n keys
4. Test page renders at /home

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Start dev server and verify page
pnpm dev
# Navigate to http://localhost:3000/home

# Verify metadata
curl -s http://localhost:3000/home | grep "<title>"
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/course/page.tsx`
- Reference: `apps/web/app/home/(user)/_components/home-page-header.tsx`
- Types: `../S2072.I1.F1-Feature-dashboard-types/feature.md`
