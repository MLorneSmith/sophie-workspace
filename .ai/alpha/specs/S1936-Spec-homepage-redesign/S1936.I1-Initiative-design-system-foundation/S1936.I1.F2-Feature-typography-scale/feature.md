# Feature: Typography Scale

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I1 |
| **Feature ID** | S1936.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description
Extend the existing typography system with homepage-specific display sizes, letter-spacing, and line-height values optimized for the marketing page redesign. This includes clamp-based fluid typography for responsive scaling and text effect utilities for gradient text and highlighted keywords.

## User Story
**As a** developer building homepage sections
**I want to** access a comprehensive typography scale with marketing-specific sizes
**So that** I can create visually impactful headlines and readable body text that scales beautifully across all viewports

## Acceptance Criteria

### Must Have
- [ ] Display headline tokens with fluid sizing using `clamp()` (`--homepage-text-display-xl`, `--homepage-text-display-lg`, `--homepage-text-display-md`)
- [ ] Heading tokens with appropriate letter-spacing (`--homepage-text-h1` through `--homepage-text-h4`)
- [ ] Body text tokens with optimal line-height (`--homepage-text-body-lg`, `--homepage-text-body`, `--homepage-text-body-sm`)
- [ ] Utility text tokens for captions and overlines (`--homepage-text-caption`, `--homepage-text-overline`)
- [ ] Text gradient utility class (`.text-gradient-homepage`) using accent colors from F1
- [ ] Text highlight utility class (`.text-highlight-homepage`) for keyword underlines

### Nice to Have
- [ ] Responsive heading component styles that auto-apply appropriate sizes

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (CSS only) | N/A |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Extend the existing marketing typography scale in `theme.css` rather than replacing it. The existing `--text-display` and `--text-h2` tokens are already used; we'll add homepage-specific variants with the `--homepage-` prefix for the redesign's distinct aesthetic requirements (tighter letter-spacing, larger display sizes).

### Key Architectural Choices
1. Use `clamp()` for fluid typography that scales without media queries
2. Include line-height and letter-spacing as part of token definitions (Tailwind CSS 4 pattern)
3. Create utility classes for text effects (gradient, highlight) using existing accent colors

### Trade-offs Accepted
- Duplicates some sizing information that exists in the current scale, but allows for independent tuning for the homepage aesthetic

## Required Credentials
None required - this is a CSS-only feature.

## Dependencies

### Blocks
- All downstream initiatives (I2-I6) will use these typography tokens for section headings and content

### Blocked By
- F1: Color Token System (gradient text uses accent colors)

### Parallel With
- F3: Spacing & Layout Tokens (independent, can run in parallel after F1)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/styles/theme.css` - Add typography tokens in `@theme inline` block
- `apps/web/styles/globals.css` - Add utility classes for text effects

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add display headline tokens**: Define 3 display sizes with clamp(), letter-spacing, line-height
2. **Add heading tokens**: Define h1-h4 with letter-spacing and line-height
3. **Add body text tokens**: Define body-lg, body, body-sm with line-height
4. **Add utility text tokens**: Define caption and overline with text-transform
5. **Create text gradient utility**: Add `.text-gradient-homepage` class using accent gradient
6. **Create text highlight utility**: Add `.text-highlight-homepage` class with animated underline

### Suggested Order
1. Display headlines → 2. Headings → 3. Body text → 4. Utility text → 5. Gradient class → 6. Highlight class

## Validation Commands
```bash
# Verify tokens are defined
grep -c "homepage-text-display" apps/web/styles/theme.css
grep -c "homepage-text-h" apps/web/styles/theme.css
grep -c "homepage-text-body" apps/web/styles/theme.css

# Verify utility classes
grep -c "text-gradient-homepage" apps/web/styles/globals.css
grep -c "text-highlight-homepage" apps/web/styles/globals.css

# Typecheck
pnpm typecheck

# Visual validation
pnpm dev
```

## Related Files
- Initiative: `../initiative.md`
- Design Reference: `.ai/reports/brainstorming/2026-02-04-homepage-redesign-design-system.md` (Section B: Typography Scale)
- Existing CSS: `apps/web/styles/theme.css` (existing `--text-display` tokens)
