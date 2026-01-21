# Feature: Skeleton Loading States

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I1 |
| **Feature ID** | S1692.I1.F4 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 4 |

## Description
Create a dedicated `loading.tsx` file that displays skeleton placeholders matching the dashboard grid layout exactly. The skeleton provides visual feedback during page transitions and data loading, preventing layout shift by maintaining the same grid structure as the loaded page.

## User Story
**As a** SlideHeroes user
**I want to** see a loading skeleton that matches the final dashboard layout
**So that** I have a smooth visual experience without jarring layout changes when the page loads

## Acceptance Criteria

### Must Have
- [ ] `loading.tsx` file created at `apps/web/app/home/(user)/loading.tsx`
- [ ] Skeleton grid matches page.tsx grid structure exactly (same responsive classes)
- [ ] Header skeleton area with appropriate dimensions
- [ ] 7 Card skeletons with Skeleton components inside
- [ ] Full-width skeleton for Quick Actions card
- [ ] Appropriate skeleton heights per widget type (Row 1: h-48, Row 2: h-64, Row 3: h-32)
- [ ] Uses Skeleton component from `@kit/ui/skeleton`
- [ ] TypeScript compiles without errors (`pnpm typecheck` passes)

### Nice to Have
- [ ] Skeleton title placeholders inside card headers
- [ ] Subtle pulse animation (default from Skeleton component)
- [ ] Content area skeleton with varied line widths for visual interest

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Skeleton, Card components | Existing |
| **Logic** | loading.tsx | New |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal - Replace GlobalLoader with custom skeleton
**Rationale**: Custom skeleton prevents layout shift by matching actual page structure. Uses existing Skeleton and Card components. Server Component (no client JS needed).

### Key Architectural Choices
1. Dedicated loading.tsx (Next.js file-based loading state)
2. Mirror exact grid structure from page.tsx
3. Use Card wrappers for consistent styling with loaded state
4. Inline WidgetSkeleton helper (local to file, not exported)

### Trade-offs Accepted
- Skeleton structure must be manually kept in sync with page.tsx - acceptable for small feature
- No dynamic skeleton based on data - all widgets show skeleton regardless of data availability

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Loading container | div with same classes as PageBody | Native | Matches page structure |
| Widget skeletons | Card + Skeleton | @kit/ui/card, @kit/ui/skeleton | Consistent with page |
| Title skeleton | Skeleton | @kit/ui/skeleton | Indicates title loading |

**Components to Install**: None - all components already exist

## Dependencies

### Blocks
- None (polish feature, nothing depends on it)

### Blocked By
- F3: Responsive Grid Layout (skeleton must match grid structure)

### Parallel With
- None

## Files to Create/Modify

### New Files
- None (loading.tsx exists but will be replaced)

### Modified Files
- `apps/web/app/home/(user)/loading.tsx` - Replace GlobalLoader with custom skeleton

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create container structure**: Match PageBody container classes
2. **Add header skeleton**: Skeleton for title and description area
3. **Create WidgetSkeleton helper**: Inline function for card skeleton
4. **Add Row 1 skeletons**: 3 Cards with h-48 content skeleton
5. **Add Row 2 skeletons**: 3 Cards with h-64 content skeleton
6. **Add Row 3 skeleton**: 1 full-width Card with h-32 content skeleton
7. **Test loading state**: Simulate slow network to verify skeleton displays
8. **Type check**: Run pnpm typecheck

### Suggested Order
1. Create container structure
2. Create WidgetSkeleton helper
3. Add header skeleton
4. Add Row 1 skeletons
5. Add Row 2 skeletons
6. Add Row 3 skeleton
7. Test loading state
8. Type check

## Skeleton Heights

| Row | Widgets | Content Height | Rationale |
|-----|---------|----------------|-----------|
| 1 | Progress, Activity, Tasks | h-48 (192px) | Smaller overview cards |
| 2 | Skills, Presentations, Coaching | h-64 (256px) | Medium data-rich cards |
| 3 | Quick Actions | h-32 (128px) | Compact action buttons |

## Skeleton Structure

```tsx
// Inline helper component
function WidgetSkeleton({ height, className }: { height: string; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-32" /> {/* Title placeholder */}
      </CardHeader>
      <CardContent>
        <Skeleton className={cn("w-full", height)} /> {/* Content placeholder */}
      </CardContent>
    </Card>
  );
}
```

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix && pnpm format:fix

# Test loading state
pnpm dev
# In Chrome DevTools:
# 1. Open Network tab
# 2. Set throttling to "Slow 3G"
# 3. Navigate to /home
# 4. Observe skeleton loading state
```

## Related Files
- Initiative: `../initiative.md`
- Grid reference: `./S1692.I1.F3-Feature-responsive-grid-layout/feature.md`
- Skeleton component: `packages/ui/src/shadcn/skeleton.tsx`
- Current loading.tsx: `apps/web/app/home/(user)/loading.tsx`
