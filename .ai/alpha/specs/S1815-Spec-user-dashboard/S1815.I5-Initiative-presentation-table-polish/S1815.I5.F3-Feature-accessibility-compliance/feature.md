# Feature: Accessibility Compliance

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I5 |
| **Feature ID** | S1815.I5.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Ensure the user dashboard meets WCAG 2.1 AA accessibility standards. This includes keyboard navigation for all interactive elements, proper ARIA labels, focus management within widgets, color contrast compliance, and skip links for efficient navigation.

## User Story
**As a** user who relies on assistive technology
**I want to** navigate and interact with the dashboard using only my keyboard or screen reader
**So that** I can access all features regardless of my abilities

## Acceptance Criteria

### Must Have
- [ ] Keyboard navigation for all interactive elements (Tab, Enter, Space, Arrow keys)
- [ ] Screen reader support with ARIA labels on all interactive elements
- [ ] Focus management: visible focus indicators on all focusable elements
- [ ] Color contrast compliance: 4.5:1 for normal text, 3:1 for large text
- [ ] Skip link to bypass navigation and jump to dashboard content
- [ ] Proper heading hierarchy (h1-h6) for document outline
- [ ] aria-live regions for dynamic content updates (loading states, notifications)
- [ ] All dashboard widgets pass Lighthouse accessibility audit (90+ score)

### Nice to Have
- [ ] prefers-reduced-motion support for animations
- [ ] High contrast mode support
- [ ] Landmark roles for major dashboard sections

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | All dashboard widgets | Existing (modify) |
| **Logic** | Focus trap utilities, keyboard handlers | Existing (verify) |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Leverage existing accessibility infrastructure (Radix UI primitives, shadcn/ui components). Focus on verifying existing ARIA support and adding missing pieces (skip links, aria-live). The codebase has strong a11y foundations; this feature ensures dashboard-specific compliance.

### Key Architectural Choices
1. Use existing focus-visible ring patterns from shadcn/ui components
2. Add skip link component at layout level
3. Verify/add aria-label to icon-only buttons and interactive elements
4. Use sr-only class for screen reader text where visual labels aren't appropriate

### Trade-offs Accepted
- Manual keyboard testing in addition to automated (axe can't catch everything)
- No custom reduced-motion handling for v1 (rely on browser defaults)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Skip Link | Custom component | New | Standard a11y pattern |
| Focus Ring | Tailwind focus-visible | Existing | Consistent with shadcn |
| Screen Reader Text | sr-only class | Tailwind | Hidden text pattern |
| Live Regions | aria-live attributes | Native HTML | Dynamic content announcements |

**Components to Install**: None

## Required Credentials
> Environment variables required for this feature to function.

None required - UI accessibility feature.

## Dependencies

### Blocks
- F4: E2E Dashboard Tests (needs accessible components for test verification)

### Blocked By
- F1: Presentation Table Widget (table needs keyboard nav)
- F2: Empty States Polish (empty states need screen reader support)
- All dashboard widgets from I1-I4 must exist

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/skip-link.tsx` - Skip to content link
- `apps/web/app/home/(user)/_components/sr-only-status.tsx` - Screen reader status announcements (optional)

### Modified Files
- `apps/web/app/home/(user)/layout.tsx` - Add skip link, landmark roles
- `apps/web/app/home/(user)/page.tsx` - Add main landmark, heading hierarchy
- `apps/web/app/home/(user)/_components/course-progress-widget.tsx` - Add ARIA labels
- `apps/web/app/home/(user)/_components/spider-chart-widget.tsx` - Add ARIA labels
- `apps/web/app/home/(user)/_components/kanban-summary-widget.tsx` - Add ARIA labels
- `apps/web/app/home/(user)/_components/activity-feed-widget.tsx` - Add ARIA labels
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Add ARIA labels
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Add ARIA labels
- `apps/web/app/home/(user)/_components/presentations-table-widget.tsx` - Add ARIA labels

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create skip link component**: Implement skip-to-content link
2. **Add skip link to layout**: Integrate into user dashboard layout
3. **Verify heading hierarchy**: Ensure h1 → h2 → h3 flow in dashboard
4. **Add landmark roles**: main, navigation, region for dashboard sections
5. **Audit widget ARIA labels**: Check each widget for proper labeling
6. **Add aria-live regions**: For loading states and dynamic updates
7. **Verify color contrast**: Run contrast checker on all text/backgrounds
8. **Keyboard navigation audit**: Tab through all elements, verify focus order
9. **Run Lighthouse a11y audit**: Verify 90+ score
10. **Add data-testid attributes**: For accessibility E2E tests

### Suggested Order
1. Skip Link → 2. Layout integration → 3. Heading hierarchy → 4. Landmarks → 5. Widget audit → 6. aria-live → 7. Contrast → 8. Keyboard audit → 9. Lighthouse → 10. Test IDs

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Lighthouse accessibility audit
pnpm dev
# Run Lighthouse in Chrome DevTools → Accessibility
# Target: Score > 90

# Keyboard navigation test
# Tab through all interactive elements
# Verify focus visible and logical order
# Verify Enter/Space activates buttons/links

# Screen reader test (manual)
# NVDA/VoiceOver: verify all content is announced

# Axe audit in browser
# Install axe DevTools extension
# Run audit on /home page

# Lint and format
pnpm lint:fix
pnpm format:fix
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Documentation: `.ai/ai_docs/software-docs/ui/accessibility.md`
- Test Infrastructure: `apps/e2e/tests/accessibility/hybrid-a11y.ts`
- Reference: `apps/web/app/home/(user)/kanban/_components/task-card.tsx` (keyboard pattern)
