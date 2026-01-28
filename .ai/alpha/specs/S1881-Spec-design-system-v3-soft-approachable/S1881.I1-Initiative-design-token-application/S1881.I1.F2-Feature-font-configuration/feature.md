# Feature: Font Configuration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1881.I1 |
| **Feature ID** | S1881.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 2 |

## Description
Configure Manrope (500, 600, 700) as the display/heading font and Source Sans Pro (400, 600, 700) as the body font via `next/font/google`.

## User Story
**As a** developer implementing the Soft Approachable design system
**I want to** configure Manrope and Source Sans Pro fonts
**So that** the application typography reflects the warm, readable character of this design system variation

## Acceptance Criteria

### Must Have
- [ ] Import `Manrope` from `next/font/google` with weights 500, 600, 700
- [ ] Import `Source_Sans_3` (modern Source Sans Pro variant) with weights 400, 600, 700
- [ ] Configure Manrope with `variable: "--font-heading"`, `subsets: ["latin"]`, `preload: true`
- [ ] Configure Source Sans 3 with `variable: "--font-sans"`, `subsets: ["latin"]`, `preload: true`
- [ ] Include fallback font stacks for both fonts
- [ ] Export both `sans` and `heading` font objects
- [ ] `pnpm typecheck` passes after changes

### Nice to Have
- [ ] Add font-display strategy (`display: "swap"`) for FOUT prevention
- [ ] Include `latin-ext` subset if international character support is needed

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Font loading via CSS variables | Modify |
| **Logic** | Next.js font configuration | Modify |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Update `apps/web/lib/fonts.ts` to load Manrope and Source Sans 3 via `next/font/google`, following the existing Inter font pattern

**Rationale**: The existing `fonts.ts` file already demonstrates the correct pattern for Google Fonts integration. We replace Inter with the two-font system (Manrope for headings, Source Sans 3 for body) specified in the spec. No changes to `layout.tsx` are needed—fonts are applied automatically via CSS variables.

### Key Architectural Choices
1. Use `Source_Sans_3` from Google Fonts (modern variant of Source Sans Pro)
2. Separate font objects: `heading` (Manrope) and `sans` (Source Sans 3)
3. Use CSS variable mapping: `--font-heading` and `--font-sans`
4. Maintain existing fallback font stack pattern
5. Explicit weight specification to optimize bundle size (only load needed weights)

### Trade-offs Accepted
- `Source_Sans_3` is a Google Fonts modern variant that may have slight character differences from the original Source Sans Pro
- Loading two fonts increases initial bundle size but provides improved typography hierarchy

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required (Google Fonts are loaded via CDN, no API keys needed)

## Dependencies

### Blocks
- S1881.I1.F3 (Feature: Verification & Screenshots)

### Blocked By
- None

### Parallel With
- S1881.I1.F1 (Feature: CSS Token Configuration)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/lib/fonts.ts` - Add Manrope and Source Sans 3 font configurations

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Import Manrope Font**: Add import and configuration for heading/display font
2. **Import Source Sans 3**: Add import and configuration for body font
3. **Configure Font Variables**: Set CSS variable names (`--font-heading`, `--font-sans`)
4. **Set Font Weights**: Configure specific weights (500-700 for Manrope, 400-700 for Source Sans 3)
5. **Add Fallback Stacks**: Include system font fallbacks
6. **Export Font Objects**: Export both `heading` and `sans` for layout consumption
7. **Validate with Type Check**: Run `pnpm typecheck` to ensure no errors

### Suggested Order
1. Import Manrope with configuration
2. Import Source Sans 3 with configuration
3. Set CSS variable names
4. Configure weights and subsets
5. Add fallback fonts
6. Export font objects
7. Run typecheck validation

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Build verification
pnpm --filter web build

# Visual verification (after F1 completes)
pnpm dev
# Visit http://localhost:3000/ui-showcase and verify fonts are applied:
# curl -s http://localhost:3000/ui-showcase | grep -i "manrope\|source sans"
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../../spec.md`
- Reference Implementation: `.ai/alpha/specs/S1879-Spec-design-system-v1-modern-vibrant/S1879.I1-Initiative-design-token-application/S1879.I1.F2-Feature-font-configuration/feature.md`
