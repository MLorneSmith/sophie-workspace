# Feature: Verification & Screenshots

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1881.I1 |
| **Feature ID** | S1881.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 3 |

## Description
Validate the "Soft Approachable" design system implementation through WCAG AA contrast checks and capture visual screenshots of key application pages.

## User Story
**As a** developer implementing the Soft Approachable design system
**I want to** verify accessibility and capture visual evidence
**So that** we can confirm the design system meets accessibility standards and provides a cohesive visual experience

## Acceptance Criteria

### Must Have
- [ ] Verify home page (`/`) renders with new design system tokens
- [ ] Verify UI showcase page (`/ui-showcase`) displays correctly
- [ ] Verify dashboard page (`/home/[account]`) applies new styles
- [ ] Run WCAG AA contrast verification on primary and accent colors
- [ ] Capture screenshots of all three pages (light and dark mode if possible)
- [ ] Verify font rendering (Manrope headings, Source Sans body)
- [ ] Verify border radius is 16px on rounded components
- [ ] Verify shadows are subtle and consistent
- [ ] `pnpm typecheck` passes
- [ ] Document accessibility pass/fail results

### Nice to Have
- [ ] Use automated contrast checker (axe-core or similar)
- [ ] Test on multiple viewport sizes (mobile, tablet, desktop)
- [ ] Verify dark mode contrast ratios

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Visual validation pages | Verify |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Manual visual verification and WCAG AA contrast checking using browser dev tools and screenshots

**Rationale**: Design system validation is inherently visual. While automated accessibility tools (axe-core) exist, the primary verification method is manual inspection of color contrast, font rendering, and overall visual cohesion. Screenshots serve as documentation and comparison artifacts for future design system iterations.

### Key Architectural Choices
1. Manual browser-based verification for accurate rendering assessment
2. WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
3. Screenshots capture both light mode and dark mode (if feasible)
4. Focus on three key pages: home, ui-showcase, and dashboard

### Trade-offs Accepted
- Manual verification is subjective but provides the most accurate assessment
- No automated testing added—this is a one-time validation, not ongoing regression testing

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required (verification is manual, no external services)

## Dependencies

### Blocks
- None

### Blocked By
- S1881.I1.F1 (Feature: CSS Token Configuration)
- S1881.I1.F2 (Feature: Font Configuration)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `.ai/reports/feature-reports/YYYY-MM-DD/S1881.I1.F3-verification-results.md` - Documentation of validation results

### Modified Files
- None (verification only, no code changes)

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Start Dev Server**: Launch `pnpm dev` to view changes
2. **Verify Home Page**: Navigate to `/` and check visual rendering
3. **Verify UI Showcase**: Navigate to `/ui-showcase` and check components
4. **Verify Dashboard**: Navigate to `/home/[account]` and check dashboard styles
5. **Check Font Rendering**: Confirm Manrope and Source Sans 3 are loading
6. **Verify Border Radius**: Inspect rounded elements (should be 16px)
7. **Verify Shadows**: Check shadow consistency and subtlety
8. **WCAG Contrast Check**: Use browser dev tools to verify contrast ratios
9. **Capture Screenshots**: Save visual documentation of each page
10. **Document Results**: Create verification report with pass/fail status

### Suggested Order
1. Start dev server
2. Verify each page in sequence (home → ui-showcase → dashboard)
3. Check each visual aspect (fonts, colors, radius, shadows)
4. Run contrast validation
5. Capture screenshots
6. Document findings

## Validation Commands
```bash
# Type checking (ensure no errors from previous features)
pnpm typecheck

# Start development server
pnpm dev

# Font loading verification
curl -s http://localhost:3000/ui-showcase | grep -i "manrope\|source sans"

# Visual verification (manual)
# Visit http://localhost:3000/
# Visit http://localhost:3000/ui-showcase
# Visit http://localhost:3000/home/[account]

# WCAG contrast check (manual)
# 1. Open browser DevTools
# 2. Use Color Picker to sample primary/accent against backgrounds
# 3. Verify ratio >= 4.5:1 (normal text) or 3:1 (large text)
# 4. Or use: https://webaim.org/resources/contrastchecker/
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../../spec.md`
- Reference Implementation: `.ai/alpha/specs/S1879-Spec-design-system-v1-modern-vibrant/S1879.I1-Initiative-design-token-application/S1879.I1.F3-Feature-verification-and-screenshots/feature.md`
