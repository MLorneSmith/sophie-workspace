# Feature: Verification & Screenshots

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1882.I1 |
| **Feature ID** | S1882.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 1-2 |
| **Priority** | 3 |

## Description
Capture visual validation screenshots of key application pages after CSS tokens and fonts are applied. Verify WCAG AA contrast compliance, dark mode functionality, and overall visual quality of the Bold Geometric design system.

## User Story
**As a** product owner / stakeholder
**I want to** see screenshots of the application with the new Bold Geometric design system
**So that** I can evaluate this variation against other design system options

## Acceptance Criteria

### Must Have
- [ ] Launch development server successfully (`pnpm dev` or `pnpm --filter web dev`)
- [ ] Navigate to home page (`/`) and capture light mode screenshot
- [ ] Navigate to team dashboard (`/home/[account]`) and capture light mode screenshot
- [ ] Toggle to dark mode and capture home page screenshot
- [ ] Toggle to dark mode and capture team dashboard screenshot
- [ ] Verify Plus Jakarta Sans is applied to headings (check DevTools)
- [ ] Verify DM Sans is applied to body text (check DevTools)
- [ ] Verify brand cyan (#24a9e0) appears as primary color
- [ ] Verify warm amber (#d97706) appears as accent color
- [ ] Verify 4px border radius is applied (sharp corners)
- [ ] Verify compact spacing is in effect
- [ ] Verify dark mode colors are properly inverted and readable
- [ ] Check WCAG AA contrast for primary and accent combinations
- [ ] Verify no visual regressions (no broken layouts or components)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes

### Nice to Have
- [ ] Capture additional pages for comprehensive evaluation
- [ ] Create a comparison document with before/after screenshots

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | All pages | Existing (verification only) |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |
| **Testing** | Manual verification | New |

## Architecture Decision

**Approach**: Manual visual validation with browser DevTools and contrast checking

**Rationale**:
- Design system changes are best verified visually
- No automated test exists for visual regression
- Browser DevTools provide reliable font/color verification
- WCAG AA verification ensures accessibility compliance
- Screenshots enable stakeholder evaluation and A/B testing

### Key Architectural Choices
1. **Use dev server**: Full application context with all styles applied
2. **DevTools verification**: Use Computed Styles panel to confirm CSS variables
3. **Contrast checking**: Use WCAG contrast checker or online tool
4. **Dark mode testing**: Toggle theme via theme switcher in UI
5. **Screenshot capture**: Save to `.ai/alpha/specs/S1882-Spec-design-system-v4-bold-geometric/S1882.I1-Initiative-design-token-application/screenshots/`

### Trade-offs Accepted
- Manual verification process (no automated tests)
- Screenshot storage location may change based on project conventions
- Contrast verification may require external tool

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | No external services needed for verification | N/A |

## Dependencies

### Blocks
- None

### Blocked By
- S1882.I1.F1: CSS Token Configuration
- S1882.I1.F2: Font Configuration

### Parallel With
- None

## Files to Create/Modify

### New Files
- `screenshots/home-light.png` - Home page light mode
- `screenshots/home-dark.png` - Home page dark mode
- `screenshots/dashboard-light.png` - Dashboard light mode
- `screenshots/dashboard-dark.png` - Dashboard dark mode

### Modified Files
- None (verification only)

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Start dev server**: Ensure application runs with new tokens and fonts
2. **Verify fonts**: Use DevTools to confirm Plus Jakarta Sans and DM Sans are loaded
3. **Verify colors**: Check computed styles for primary (#24a9e0) and accent (#d97706) colors
4. **Verify radius**: Confirm 4px border radius is applied
5. **Verify spacing**: Confirm compact spacing (0.85 density) is in effect
6. **Test dark mode**: Toggle theme and verify all colors work correctly
7. **Check contrast**: Verify WCAG AA compliance for all color combinations
8. **Capture screenshots**: Save 4 screenshots (2 pages × 2 themes)
9. **Run quality checks**: typecheck and lint

### Suggested Order
1. Start dev server
2. Verify fonts via DevTools (Computed Styles)
3. Verify colors via DevTools
4. Verify radius and spacing
5. Test dark mode toggle
6. Check contrast compliance
7. Capture all 4 screenshots
8. Run typecheck and lint
9. Document any issues found

## Validation Commands
```bash
# Verify design tokens applied
grep -E "(primary.*195.*78|accent.*38.*92)" apps/web/styles/shadcn-ui.css

# Verify fonts configured
grep -E "(Plus_Jakarta_Sans|DM_Sans)" apps/web/lib/fonts.ts

# Typecheck
pnpm typecheck

# Lint
pnpm lint:fix

# Verify screenshots exist
ls -lh screenshots/*.png 2>/dev/null && echo "Screenshots captured" || echo "No screenshots directory"
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../../spec.md`
- CSS Tokens: `apps/web/styles/shadcn-ui.css`
- Font Config: `apps/web/lib/fonts.ts`
