# Feature: Font Configuration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1880.I1 |
| **Feature ID** | S1880.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 0.1 |
| **Priority** | 2 |

## Description
Verify that the Inter font configuration in `apps/web/lib/fonts.ts` meets the Clean Professional design system requirements. The current implementation uses `SansFont` (which is the local Next.js font wrapper for Inter) with optimal preloading, proper subsets, and appropriate weight coverage.

## User Story
**As a** developer
**I want to** verify the Inter font configuration is properly optimized
**So that** users experience fast, professional typography with no flash of unstyled text

## Acceptance Criteria

### Must Have
- [ ] Verify font configuration uses `SansFont` with Inter subsets
- [ ] Confirm preload is enabled (`preload: true`)
- [ ] Verify appropriate weight array (`["300", "400", "500", "600", "700"]`)
- [ ] Confirm proper fallback chain is defined
- [ ] Verify font variable is applied in layout.tsx

### Nice to Have
- [ ] Consider adding `display: 'optional'` for faster first paint
- [ ] Document font loading strategy if any changes made

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | fonts.ts configuration | Verify existing |
| **Logic** | layout.tsx font application | Verify existing |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Verification-only, minimal changes
**Rationale**: The current `SansFont` configuration is well-optimized with preloading enabled, proper Latin subsets, and appropriate weight coverage. No changes are required for the Clean Professional design system—this is a verification task.

### Key Architectural Choices
1. Keep existing `SansFont` wrapper (this is the project's Inter implementation)
2. No changes to font weights or subsets
3. Keep current fallback chain: `["system-ui", "Helvetica Neue", "Helvetica", "Arial"]`
4. Maintain `preload: true` setting

### Trade-offs Accepted
- No optimization changes needed - current configuration is production-ready
- Potential `display: 'optional'` optimization not applied (optional enhancement)

## Required Credentials
> Environment variables required for this feature to function.

None required - this is a verification task.

## Dependencies

### Blocks
- None

### Blocked By
- None

### Parallel With
- F3: Visual Verification (can run in parallel after CSS tokens from F1 are applied)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/lib/fonts.ts` - Verify (no changes expected)
- `apps/web/app/layout.tsx` - Verify font application (no changes expected)

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Verify font configuration exists**: Check fonts.ts has SansFont with proper settings
2. **Verify preload is enabled**: Confirm `preload: true` is set
3. **Verify weight array**: Confirm weights cover Light (300), Regular (400), Medium (500), Semibold (600), Bold (700)
4. **Verify fallback chain**: Confirm system-ui, Helvetica Neue, Helvetica, Arial fallbacks
5. **Verify layout application**: Check layout.tsx applies font className
6. **Optional: Consider display mode**: Evaluate if `display: 'optional'` improves first paint

### Suggested Order
1. Verify fonts.ts configuration
2. Verify layout.tsx application
3. Optional: Consider display mode optimization
4. Document findings (no action needed if already optimal)

## Validation Commands
```bash
# Verify font configuration
cat apps/web/lib/fonts.ts | grep -A 5 "const sans"

# Verify font application in layout
cat apps/web/app/layout.tsx | grep -A 3 "getFontsClassName"

# Run typecheck to ensure no regressions
pnpm typecheck

# Run linter
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../spec.md`
- Font Config: `apps/web/lib/fonts.ts`
- Layout: `apps/web/app/layout.tsx`
