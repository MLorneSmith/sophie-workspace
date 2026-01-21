# Feature: Empty States Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I5 |
| **Feature ID** | S1692.I5.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Audit all dashboard widgets for empty state completeness and consistency. Ensure every widget that can display no data has a proper EmptyState with heading, descriptive text, and actionable CTA. Standardize copy and visual treatment across the dashboard.

## User Story
**As a** new SlideHeroes user
**I want to** see helpful guidance when I have no data
**So that** I understand what actions to take to get started

## Acceptance Criteria

### Must Have
- [ ] Audit all dashboard widgets for EmptyState usage
- [ ] Each empty state has: heading, text, CTA button
- [ ] Empty states use consistent visual style (@kit/ui/empty-state)
- [ ] CTAs link to appropriate creation/onboarding flows
- [ ] Copy is helpful and action-oriented
- [ ] Document findings in audit report

### Nice to Have
- [ ] Illustrations or icons for visual interest
- [ ] Contextual help links in empty states
- [ ] A/B test different CTA copy

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | EmptyState components across widgets | Existing/Modified |
| **Content** | Empty state copy (heading, text, CTA) | New |
| **Documentation** | Audit report | New |

## Architecture Decision

**Approach**: Clean
**Rationale**: Empty states are a UX polish concern. Apply consistent patterns from @kit/ui/empty-state across all dashboard widgets. Document findings for future reference.

### Key Architectural Choices
1. Use standardized EmptyState component structure (EmptyState > EmptyStateHeading > EmptyStateText > EmptyStateButton)
2. Follow content guidelines: action-oriented language, benefit-focused CTAs
3. Ensure all empty states are keyboard accessible

### Trade-offs Accepted
- Manual audit process (no automated empty state detection)
- Some widgets may need design decisions for appropriate CTAs

## Dependencies

### Blocks
- F4: E2E Dashboard Tests (tests verify empty states render correctly)

### Blocked By
- F1: Presentation Table Widget (includes new empty state to audit)

### Parallel With
- F3: Accessibility Compliance (can run in parallel after F1)

## Files to Create/Modify

### New Files
- `.ai/reports/feature-reports/2026-01-21/empty-states-audit.md` - Audit findings report

### Modified Files
- Dashboard widgets (TBD based on audit findings):
  - Progress widget empty state
  - Assessment widget empty state
  - Activity feed empty state
  - Coaching panel empty state
  - Quick actions empty state

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Search for EmptyState usages**: Grep all @kit/ui/empty-state imports in dashboard
2. **Inventory dashboard widgets**: List all widgets that can show empty state
3. **Audit each widget**: Verify EmptyState structure (heading, text, CTA)
4. **Document findings**: Create audit report with screenshots
5. **Write missing empty states**: Add EmptyState to widgets without one
6. **Standardize copy**: Review and improve empty state text
7. **Verify visual consistency**: Ensure all empty states look consistent

### Suggested Order
1. Search → 2. Inventory → 3. Audit → 4. Document → 5. Write missing → 6. Standardize → 7. Verify

## Validation Commands
```bash
# Find all empty state usages
grep -r "@kit/ui/empty-state" apps/web/app/home/

# Type check
pnpm typecheck

# Visual verification
# Navigate to /home as new user (no data)
# Verify each widget shows appropriate empty state
```

## Related Files
- Initiative: `../initiative.md`
- EmptyState component: `packages/ui/src/makerkit/empty-state.tsx`
- EmptyState stories: `packages/ui/src/makerkit/empty-state-story.tsx`
