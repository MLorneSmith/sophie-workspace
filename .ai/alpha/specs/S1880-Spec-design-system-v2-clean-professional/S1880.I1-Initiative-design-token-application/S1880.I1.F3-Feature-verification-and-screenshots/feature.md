# Feature: Visual Verification and Screenshots

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1880.I1 |
| **Feature ID** | S1880.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 0.4 |
| **Priority** | 3 |

## Description
Verify the Clean Professional design system variation is correctly applied across the application by testing key pages and capturing evaluation screenshots. This provides visual proof of the brand cyan and cool purple accent implementation for A/B comparison with other design variations.

## User Story
**As a** product owner
**I want to** see visual verification and screenshots of the Clean Professional design system
**So that** I can evaluate the implementation and compare with other design variations

## Acceptance Criteria

### Must Have
- [ ] Visit home page (`/`) and verify brand cyan primary color displays
- [ ] Visit dashboard (`/home/[account]`) and verify styling is consistent
- [ ] Verify cool purple accent color appears on interactive elements
- [ ] Verify 8px border radius is applied to rounded elements
- [ ] Verify shadows are visible and appropriately balanced
- [ ] Test dark mode toggle and verify colors adapt correctly
- [ ] Capture screenshot of home page in light mode
- [ ] Capture screenshot of home page in dark mode
- [ ] Capture screenshot of dashboard in light mode
- [ ] Capture screenshot of dashboard in dark mode
- [ ] Verify Inter font renders correctly

### Nice to Have
- [ ] Capture additional screenshots of key components (buttons, cards, inputs)
- [ ] Use debug-colors page to verify all tokens render correctly
- [ ] Run basic accessibility contrast check (WCAG AA)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Verification pages | Existing (debug-colors, home, dashboard) |
| **Logic** | Manual verification | Existing (developer verification) |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Manual verification with screenshot capture
**Rationale**: The codebase has no automated visual regression testing. Manual verification with screenshot capture provides the necessary proof for A/B comparison while leveraging existing debug-colors page for token validation.

### Key Architectural Choices
1. Use existing `/debug-colors` page for token-level verification
2. Use actual application pages (`/`, `/home/[account]`) for end-to-end verification
3. Manual screenshot capture (no automated comparison tools available)
4. No Playwright tests for visual regression (out of scope for this small feature)

### Trade-offs Accepted
- Manual verification instead of automated - accepted due to no visual regression tooling
- No E2E test for design system - acceptable given scope (1-2 day initiative)

## Required Credentials
> Environment variables required for this feature to function.

None required - this is a manual verification task.

## Dependencies

### Blocks
- None

### Blocked By
- F1: CSS Token Configuration (tokens must exist before verification is meaningful)

### Parallel With
- F2: Font Verification (can run in parallel after CSS tokens from F1 are applied)

## Files to Create/Modify

### New Files
- `.ai/screenshots/S1880/CleanProfessional-home-light.png` - Home page light mode screenshot
- `.ai/screenshots/S1880/CleanProfessional-home-dark.png` - Home page dark mode screenshot
- `.ai/screenshots/S1880/CleanProfessional-dashboard-light.png` - Dashboard light mode screenshot
- `.ai/screenshots/S1880/CleanProfessional-dashboard-dark.png` - Dashboard dark mode screenshot

### Modified Files
- None (verification only)

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Start dev server**: Run `pnpm dev` to launch the application
2. **Verify home page light mode**: Visit `/` and check brand cyan colors render
3. **Verify home page dark mode**: Toggle dark mode and verify dark tokens work
4. **Verify dashboard light mode**: Visit `/home/[account]` and check consistency
5. **Verify dashboard dark mode**: Toggle dark mode on dashboard
6. **Check debug-colors page**: Visit `/debug-colors` to verify all CSS variables
7. **Capture screenshots**: Save screenshots to `.ai/screenshots/S1880/` directory
8. **Document findings**: Note any visual issues or inconsistencies

### Suggested Order
1. Start dev server
2. Verify all pages in light mode
3. Verify all pages in dark mode
4. Check debug-colors page for token-level verification
5. Capture screenshots
6. Document findings

## Validation Commands
```bash
# Start dev server (if not running)
pnpm dev

# Verify CSS tokens are applied
cat apps/web/styles/shadcn-ui.css | grep -E "(--primary|--accent|--radius)"
cat apps/web/styles/theme.css | grep -E "(--shadow)"

# Run typecheck to ensure no regressions
pnpm typecheck

# Run linter
pnpm lint

# Create screenshots directory
mkdir -p .ai/screenshots/S1880
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../spec.md`
- Verification Page: `apps/web/app/debug-colors/page.tsx`
- Home Page: `apps/web/app/page.tsx`
- Dashboard: `apps/web/app/home/[account]/page.tsx`
