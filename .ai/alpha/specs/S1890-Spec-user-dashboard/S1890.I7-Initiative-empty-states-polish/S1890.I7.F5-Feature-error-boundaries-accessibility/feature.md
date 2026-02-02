# Feature: Error Boundaries & Accessibility

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I7 |
| **Feature ID** | S1890.I7.F5 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 5 |

## Description
Implement error boundary wrappers for all dashboard widgets and conduct accessibility audit to ensure WCAG 2.1 AA compliance. Error boundaries prevent widget failures from crashing the entire dashboard and provide user-friendly retry options. Accessibility polish ensures all empty states, skeletons, and interactive elements are properly labeled and keyboard-navigable.

## User Story
**As a** user encountering a widget error
**I want to** see a helpful error message with retry option
**So that** one broken widget doesn't prevent me from using the rest of the dashboard

**As a** user relying on assistive technology
**I want to** navigate the dashboard with proper ARIA labels and focus management
**So that** I can access all features regardless of how I interact with the interface

## Acceptance Criteria

### Must Have
- [ ] Dashboard-level error boundary wraps all widgets
- [ ] Individual widget error boundaries with retry capability
- [ ] Error UI displays friendly message (not technical error)
- [ ] Error UI includes "Try Again" button that re-renders the widget
- [ ] All empty state headings use proper heading hierarchy (h2/h3)
- [ ] All CTAs in empty states are keyboard accessible
- [ ] Focus management returns to widget after retry
- [ ] Color contrast meets WCAG AA standards (4.5:1 for text)
- [ ] All interactive elements have visible focus indicators

### Nice to Have
- [ ] Error reporting to logging service
- [ ] Automatic retry after timeout
- [ ] Screen reader announcements for state changes
- [ ] Reduced motion support for skeleton animations

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | WidgetErrorBoundary component + error UI | New |
| **Logic** | Error state management with retry | New |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Single reusable error boundary component with widget-specific error messages
**Rationale**: Using existing ErrorBoundary from @kit/ui as base, wrap each widget with custom fallback UI. A single WidgetErrorBoundary component with configurable messages reduces code duplication.

### Key Architectural Choices
1. Create `WidgetErrorBoundary` wrapper component that extends @kit/ui/error-boundary
2. Each widget wrapped in individual error boundary (isolation)
3. Page-level error boundary as final fallback
4. Accessibility improvements integrated into existing empty state components

### Trade-offs Accepted
- Each widget having its own error boundary increases bundle slightly
- Retry mechanism is simple re-render (not data refetch)

## Required Credentials
> None required - error handling and accessibility are purely client-side concerns.

## Dependencies

### Blocks
- None (final polish feature)

### Blocked By
- F1: Loading Skeletons (error boundaries wrap skeleton-containing widgets)
- F2: Progress Empty States (accessibility audit covers these)
- F3: Task/Activity Empty States (accessibility audit covers these)
- F4: Action/Coaching Empty States (accessibility audit covers these)
- All I3-I6 features (widgets must exist to wrap with error boundaries)

### Parallel With
- None (final sequential feature after all other empty states)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/widget-error-boundary.tsx` - Reusable error boundary
- `apps/web/app/home/(user)/_components/widget-error-fallback.tsx` - Error UI with retry

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Wrap widgets with error boundaries
- `apps/web/app/home/(user)/_components/empty-states/*.tsx` - Add ARIA attributes
- All empty state components - Ensure proper heading hierarchy and focus management

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Widget Error Boundary**: Create reusable boundary component
2. **Widget Error Fallback UI**: Create error display with retry button
3. **Dashboard Integration**: Wrap all widgets with boundaries
4. **Accessibility Audit**: Review all empty states for a11y compliance
5. **Accessibility Fixes**: Apply fixes for heading hierarchy, focus, ARIA
6. **Dark Mode Verification**: Final verification of all states

### Suggested Order
1. Widget Error Boundary component (T1)
2. Widget Error Fallback UI (T2)
3. Dashboard integration (T3)
4. Accessibility audit (T4)
5. Accessibility fixes (T5)
6. Dark mode and final verification (T6)

## Validation Commands
```bash
# Verify error boundary component
test -f apps/web/app/home/\(user\)/_components/widget-error-boundary.tsx && echo "✓ Error boundary exists"
test -f apps/web/app/home/\(user\)/_components/widget-error-fallback.tsx && echo "✓ Error fallback exists"

# Check for error boundary usage in page
grep -q "WidgetErrorBoundary\|ErrorBoundary" apps/web/app/home/\(user\)/page.tsx && echo "✓ Error boundaries in page"

# Accessibility checks
pnpm --filter web-e2e test:local -- -g "dashboard accessibility"

# Check heading hierarchy (no h1 inside widgets, use h2/h3)
grep -rn "<h1" apps/web/app/home/\(user\)/_components/empty-states/ && echo "⚠ Warning: h1 found in empty states" || echo "✓ No h1 in empty states"

# Typecheck and lint
pnpm typecheck && pnpm lint

# Visual verification
# Test error scenarios by temporarily breaking widget data fetching
# Toggle dark mode and verify all states render correctly
```

## Error Boundary Design Details

### Error Fallback UI
| Element | Value |
|---------|-------|
| **Container** | Card with centered content, matches widget styling |
| **Icon** | Alert triangle or error icon (muted color) |
| **Heading** | "Unable to load [widget name]" |
| **Description** | "Something went wrong. Please try again." |
| **CTA** | "Try Again" button with onClick retry |
| **Styling** | Muted/subtle to not alarm users |

### Widget-Specific Error Messages
| Widget | Error Heading |
|--------|--------------|
| Course Progress | "Unable to load course progress" |
| Skills Spider | "Unable to load skills assessment" |
| Kanban Summary | "Unable to load tasks" |
| Activity Feed | "Unable to load activity" |
| Quick Actions | "Unable to load actions" |
| Coaching Sessions | "Unable to load coaching sessions" |
| Presentation Table | "Unable to load presentations" |

## Accessibility Checklist

### Heading Hierarchy
- [ ] Page title is h1 (in PageHeader)
- [ ] Widget titles are h2 (CardTitle)
- [ ] Empty state headings are h3 (EmptyStateHeading or aria-level)

### Keyboard Navigation
- [ ] All CTAs focusable via Tab
- [ ] Focus order follows visual order
- [ ] Focus visible on all interactive elements
- [ ] Escape key behavior defined for modals (Cal.com embed)

### ARIA Attributes
- [ ] Empty state containers have role="status" or aria-live for dynamic content
- [ ] Loading skeletons have aria-busy="true"
- [ ] Error states have role="alert"
- [ ] CTAs have descriptive aria-labels where text is insufficient

### Color Contrast
- [ ] Empty state text meets 4.5:1 contrast ratio
- [ ] Muted text meets 3:1 contrast (large text) or 4.5:1 (small text)
- [ ] CTAs meet 4.5:1 contrast
- [ ] Focus indicators have 3:1 contrast against adjacent colors

### Motion & Animation
- [ ] Skeleton pulse animation respects prefers-reduced-motion
- [ ] No auto-playing animations that can't be paused

## Related Files
- Initiative: `../initiative.md`
- ErrorBoundary: `packages/ui/src/makerkit/error-boundary.tsx`
- Alert component: `packages/ui/src/shadcn/alert.tsx`
- Research: `../../../research-library/perplexity-dashboard-empty-states.md`
- Tasks: `./tasks.json` (created in next phase)
