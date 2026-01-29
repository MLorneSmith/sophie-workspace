# Feature: CSS Token Configuration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1879.I1 |
| **Feature ID** | S1879.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Update CSS custom properties in `apps/web/styles/shadcn-ui.css` with "Modern Vibrant" design system tokens: brand cyan primary, warm orange accent, elevated shadows, and 12px border radius.

## User Story
**As a** Design System User
**I want to** apply the "Modern Vibrant" color palette, shadows, and border radius tokens to the application
**So that** SlideHeroes has a distinctive, energetic visual identity

## Acceptance Criteria

### Must Have
- [ ] Update `--primary` to brand cyan HSL: `195 78% 51%` (light), `195 78% 55%` (dark)
- [ ] Update `--accent` to warm orange HSL: `38 92% 50%` (light), `38 92% 55%` (dark)
- [ ] Update all foreground colors for primary/accent in both modes
- [ ] Update `--radius` to `0.75rem` (12px)
- [ ] Apply elevated shadow scale (sm, md, lg) with higher opacity values
- [ ] Ensure all chart colors work with new palette
- [ ] Verify WCAG AA contrast (4.5:1 minimum) for all color combinations
- [ ] Dark mode `.dark` class updates work correctly

### Nice to Have
- [ ] Document shadow scale values for future reference

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CSS Variables | Modify |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal - Direct CSS variable updates
**Rationale**: This is a token-only change. No component modifications needed - updating the CSS variables in shadcn-ui.css immediately propagates to all shadcn components.

### Key Architectural Choices
1. Use HSL format for colors as specified in design system
2. Keep existing neutral system (background, foreground, muted, secondary)
3. Only override primary, accent, radius, and shadow tokens
4. Add shadow scale tokens if not present (shadow-sm, shadow-md, shadow-lg)

### Trade-offs Accepted
- Using HSL directly in CSS (not oklch) for consistency with existing pattern
- Keeping neutral palette unchanged reduces risk while testing new brand colors

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required.

## Dependencies

### Blocks
- S1879.I1.F3

### Blocked By
- None

### Parallel With
- S1879.I1.F2

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/styles/shadcn-ui.css` - Update primary, accent, radius, and shadow CSS variables for both light and dark modes

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Update Primary Colors**: Replace neutral primary with brand cyan in both :root and .dark
2. **Update Accent Colors**: Replace neutral accent with warm orange in both modes
3. **Update Border Radius**: Change from 0.5rem to 0.75rem
4. **Add Shadow Scale**: Add elevated shadow-sm, shadow-md, shadow-lg if not present
5. **Verify Chart Colors**: Ensure chart tokens use appropriate colors from new palette
6. **Contrast Verification**: Test all color pairs meet WCAG AA standards

### Suggested Order
1. Primary colors (light mode → dark mode)
2. Accent colors (light mode → dark mode)
3. Border radius update
4. Shadow scale additions
5. Chart color verification
6. Manual contrast verification

## Validation Commands
```bash
# Type check to ensure no TypeScript errors
pnpm typecheck

# Build to verify production readiness
pnpm build

# Start dev server for visual verification
pnpm dev

# Visit verification pages
# http://localhost:3001/
# http://localhost:3001/ui-showcase
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../spec.md`
