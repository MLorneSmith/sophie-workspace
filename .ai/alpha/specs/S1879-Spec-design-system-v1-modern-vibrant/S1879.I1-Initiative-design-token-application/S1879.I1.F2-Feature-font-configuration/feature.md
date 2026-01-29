# Feature: Font Configuration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1879.I1 |
| **Feature ID** | S1879.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 0.5 |
| **Priority** | 2 |

## Description
Configure Google Fonts for Outfit (headings) and Nunito Sans (body) in `apps/web/lib/fonts.ts` following existing next/font patterns.

## User Story
**As a** Design System User
**I want to** load Outfit for headings and Nunito Sans for body text
**So that** SlideHeroes has a contemporary, approachable typography

## Acceptance Criteria

### Must Have
- [ ] Add Outfit font import from `next/font/google`
- [ ] Add Nunito_Sans font import from `next/font/google`
- [ ] Configure `sans` constant with Nunito_Sans (weights 400, 500, 700)
- [ ] Configure `heading` constant with Outfit (weights 500, 600, 700)
- [ ] Enable `preload: true` for both fonts
- [ ] Set appropriate fallback fonts for each
- [ ] Export both constants
- [ ] Update `getFontsClassName` to use both font variables

### Nice to Have
- [ ] Add font display strategy comments for future reference

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Font Variables | Modify |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal - Follow existing Inter font pattern
**Rationale**: The existing fonts.ts already follows next/font best practices (preload, fallback, variable CSS). Swapping fonts while keeping the same pattern minimizes risk.

### Key Architectural Choices
1. Use `next/font/google` for optimized loading
2. Keep separate variables for `--font-sans` and `--font-heading`
3. Preload fonts for performance (no LCP regression)
4. Use standard system-ui fallbacks

### Trade-offs Accepted
- Google Fonts CDN dependency (standard for Next.js apps)
- No local font self-hosting (adds complexity without clear benefit)

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required.

## Dependencies

### Blocks
- S1879.I1.F3

### Blocked By
- None

### Parallel With
- S1879.I1.F1

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/lib/fonts.ts` - Replace Inter imports with Outfit and Nunito Sans, update font configuration

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Update Imports**: Replace `Inter as SansFont` with `Outfit` and `Nunito_Sans` imports
2. **Configure Body Font**: Update `sans` constant to use Nunito_Sans with weights 400, 500, 700
3. **Configure Heading Font**: Create `heading` constant with Outfit weights 500, 600, 700
4. **Update Exports**: Ensure both `sans` and `heading` are exported
5. **Verify getFontsClassName**: Ensure both font variables are returned

### Suggested Order
1. Update imports
2. Configure heading font (Outfit)
3. Configure body font (Nunito Sans)
4. Update exports
5. Verify className function

## Validation Commands
```bash
# Type check to ensure no TypeScript errors
pnpm typecheck

# Build to verify production readiness
pnpm build

# Start dev server for visual verification
pnpm dev

# Visit verification pages to see fonts render
# http://localhost:3001/
# Check browser DevTools → Network → Fonts to verify preload
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../spec.md`
