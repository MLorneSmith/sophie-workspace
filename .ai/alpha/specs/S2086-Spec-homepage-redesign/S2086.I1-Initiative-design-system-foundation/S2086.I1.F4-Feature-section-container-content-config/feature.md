# Feature: Section Container & Content Config

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I1 |
| **Feature ID** | S2086.I1.F4 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 4 |

## Description
Create a standardized SectionContainer component for consistent homepage section spacing, widths, and structure. Update the homepage content config with TypeScript interfaces and content data for 4 new sections (Statistics, How It Works, Comparison, Final CTA). These provide the structural skeleton and data contracts that section initiatives I2-I5 implement against.

## User Story
**As a** developer implementing individual homepage sections
**I want to** have a consistent section container component and pre-defined content configs with TypeScript interfaces for all new sections
**So that** I can focus on section-specific UI and animations without worrying about layout consistency or content structure

## Acceptance Criteria

### Must Have
- [ ] SectionContainer component with standardized vertical spacing (`py-16 md:py-24 lg:py-32`), max-width (`max-w-7xl`), horizontal padding (`px-4 sm:px-6 lg:px-8`), and `mx-auto`
- [ ] SectionContainer supports `id` prop for anchor navigation
- [ ] SectionContainer supports `className` prop for per-section overrides
- [ ] SectionContainer supports optional `background` prop ("default" | "surface" | "transparent") using design tokens
- [ ] TypeScript interface `StatisticItem` for statistics section (value, label, suffix, prefix)
- [ ] TypeScript interface `HowItWorksStep` for how-it-works section (stepNumber, title, description, iconName)
- [ ] TypeScript interface `ComparisonItem` for comparison section (text, included: boolean)
- [ ] TypeScript interface `FinalCtaConfig` for final CTA section (headline, subheadline, primaryCta, secondaryCta, trustBadges)
- [ ] Content data populated in `homepage-content.config.ts` for all 4 new sections with placeholder content
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes

### Nice to Have
- [ ] SectionContainer supports `as` prop for rendering as different HTML elements (section, div, article)
- [ ] SectionContainer integrates AnimateOnScroll from F2 as optional `animated` prop

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | SectionContainer | New |
| **Logic** | Content config interfaces | New |
| **Data** | Content config data | New / Existing (extend) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: SectionContainer standardizes the spacing/width pattern already used across existing homepage sections (observed `mx-auto px-4 sm:px-6 lg:px-8` pattern repeated in page.tsx). Content config extends the existing `homepage-content.config.ts` file with new interfaces and data, following the established pattern of centralized content management. Interfaces are defined in the same config file for colocation.

### Key Architectural Choices
1. SectionContainer is a server component by default (no animations built-in) — sections that need animation wrap content with AnimateOnScroll from F2
2. Content interfaces are colocated in `homepage-content.config.ts` alongside the data — follows existing pattern where `StickyContentItem`, `FeatureCard`, `BlogPost` interfaces live in the same file
3. Content data uses hardcoded placeholder values (per spec: "Hardcoded placeholder statistics") — no database dependency

### Trade-offs Accepted
- SectionContainer could use design tokens for background colors, but defaults to Tailwind classes for simplicity — design tokens are used by card components where dynamic theming matters more

## Required Credentials
None required — this feature is purely component and config work.

## Dependencies

### Blocks
- S2086.I2 (Hero & Product Preview) — uses SectionContainer
- S2086.I3 (Trust & Credibility) — uses SectionContainer + Statistics config
- S2086.I4 (Feature Showcase) — uses SectionContainer + HowItWorks config
- S2086.I5 (Social Proof & Conversion) — uses SectionContainer + Comparison/FinalCta config

### Blocked By
- F1: Dark-Mode Design Tokens (SectionContainer background variants use design tokens)

### Parallel With
- F3: Card Components (both blocked by F1, but F4 doesn't need F2)

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/section-container.tsx` — Standardized section wrapper with spacing, width, background variants

### Modified Files
- `apps/web/config/homepage-content.config.ts` — Add TypeScript interfaces and content data for Statistics, How It Works, Comparison, and Final CTA sections

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create SectionContainer component**: Server component with standardized spacing, max-width, padding, id, className, background variant props
2. **Define Statistics content interface and data**: `StatisticItem` interface + `statisticsContent` array with 4 stat items (2,000+ professionals, 50,000+ presentations, 4.9/5 rating, 85% time saved)
3. **Define How It Works content interface and data**: `HowItWorksStep` interface + `howItWorksSteps` array with 4 steps (Assemble, Outline, Storyboard, Produce)
4. **Define Comparison content interface and data**: `ComparisonItem` interface + `comparisonContent` object with "without" and "with" arrays
5. **Define Final CTA content interface and data**: `FinalCtaConfig` interface + `finalCtaContent` object with headline, CTAs, trust badges
6. **Verify content config types**: Ensure all new interfaces are exported and `pnpm typecheck` passes

### Suggested Order
1. SectionContainer (T1) — standalone component
2. Statistics config (T2) — simplest interface
3. How It Works config (T3) — slightly more complex
4. Comparison config (T4) — two-sided data structure
5. Final CTA config (T5) — nested object
6. Type verification (T6) — validates all exports

## Validation Commands
```bash
# Verify SectionContainer exists
ls apps/web/app/\(marketing\)/_components/section-container.tsx

# Verify content config has new sections
grep 'StatisticItem' apps/web/config/homepage-content.config.ts
grep 'HowItWorksStep' apps/web/config/homepage-content.config.ts
grep 'ComparisonItem' apps/web/config/homepage-content.config.ts
grep 'FinalCtaConfig' apps/web/config/homepage-content.config.ts

# Verify content data exists
grep 'statisticsContent' apps/web/config/homepage-content.config.ts
grep 'howItWorksSteps' apps/web/config/homepage-content.config.ts
grep 'comparisonContent' apps/web/config/homepage-content.config.ts
grep 'finalCtaContent' apps/web/config/homepage-content.config.ts

# Type checking passes
pnpm typecheck

# Lint passes
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Design Tokens: `../S2086.I1.F1-Feature-dark-mode-design-tokens/feature.md`
- Existing content config: `apps/web/config/homepage-content.config.ts`
- Existing homepage: `apps/web/app/(marketing)/page.tsx` (shows current section container patterns)
- Spec: `../../spec.md` (Section 5: Key Capabilities for content details)
