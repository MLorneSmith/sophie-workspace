---
description: Generate 4 design system variation specs for A/B comparison. Reads DesignSystem.md and creates implementation-ready specs for visual evaluation.
argument-hint: [optional: variation-count (default: 4)]
model: opus
allowed-tools: [Read, Write, Grep, Glob, Bash, Task, AskUserQuestion]
---

# Alpha: Design System Variations

Generate multiple design system variation specs for visual A/B comparison. This command reads the DesignSystem.md experiment candidates and creates coherent variation combinations ready for Alpha implementation.

## Context

This is a specialized version of `/alpha:ui-variations` focused on **design token experiments**:
- Color palettes (primary brand color)
- Typography (font pairings)
- Shadow intensity
- Border radius

## Workflow Position

```
/alpha:design-system-variations (this)
    ↓
/alpha:initiative-decompose (×4)
    ↓
/alpha:feature-decompose (×4)
    ↓
/alpha:task-decompose (×4)
    ↓
tsx spec-orchestrator.ts (×4, can run in parallel)
    ↓
Visual Evaluation → Select Winner → Merge
```

## Arguments

$ARGUMENTS

Default: 4 variations

---

## Phase 0: Load Design System

### 0.1 Read DesignSystem.md

Read the design system document to extract experiment candidates:

```
Read tool: .ai/ai_docs/context-docs/development/design/DesignSystem.md
```

Extract these experiment dimensions:

| Dimension | Section | Options |
|-----------|---------|---------|
| Primary Color | 1.2 Primary Brand Scale | **FIXED: #24a9e0 (brand cyan)** |
| Accent Color | 1.2 Accent/Secondary | Warm Orange, Cool Purple, Coral, Amber |
| Typography | 2.1 Font Stack | Plus Jakarta/DM Sans, Inter/Inter, Manrope/Source Sans, Outfit/Nunito |
| Shadow Intensity | 4.1 Shadow Scale | Subtle, Balanced, Elevated |
| Border Radius | 5.1 Radius Scale | Sharp (4px), Balanced (8px), Rounded (12px), Soft (16px) |
| Spacing Density | 3.3 Semantic Spacing | Compact, Standard, Spacious |

### 0.2 Verify Current Implementation

Check the current design token implementation:

```bash
# Check current CSS variables
head -100 apps/web/styles/shadcn-ui.css

# Check current Tailwind config
head -50 apps/web/tailwind.config.ts
```

---

## Phase 1: Define Variation Combinations

### 1.1 Pre-Defined Variations

All variations use the **SlideHeroes brand color `#24a9e0`** (cyan) as primary. Variations differ across 5 dimensions: Typography, Shadow, Radius, Spacing, and Accent Color.

#### Variation 1: Modern Vibrant

| Dimension | Value | Rationale |
|-----------|-------|-----------|
| **Primary** | `#24a9e0` (brand cyan) | Fixed brand color |
| **Typography** | Outfit (headings) / Nunito Sans (body) | Contemporary, warm personality |
| **Shadow** | Elevated | Pronounced depth, dynamic feel |
| **Radius** | Rounded (12px) | Soft, approachable shapes |
| **Spacing** | Spacious | Airy, breathing room |
| **Accent** | Warm Orange `#f59e0b` | Energetic complement to cyan |
| **Personality** | Bold, contemporary, energetic |

#### Variation 2: Clean Professional

| Dimension | Value | Rationale |
|-----------|-------|-----------|
| **Primary** | `#24a9e0` (brand cyan) | Fixed brand color |
| **Typography** | Inter (headings) / Inter (body) | Clean, versatile, familiar |
| **Shadow** | Balanced | Moderate depth, professional |
| **Radius** | Balanced (8px) | Standard, widely accepted |
| **Spacing** | Standard | Conventional density |
| **Accent** | Cool Purple `#8b5cf6` | Sophisticated complement |
| **Personality** | Classic SaaS, reliable, trustworthy |

#### Variation 3: Soft Approachable

| Dimension | Value | Rationale |
|-----------|-------|-----------|
| **Primary** | `#24a9e0` (brand cyan) | Fixed brand color |
| **Typography** | Manrope (headings) / Source Sans Pro (body) | Rounded, friendly letterforms |
| **Shadow** | Subtle | Almost flat, minimal depth |
| **Radius** | Soft (16px) | Very rounded, gentle feel |
| **Spacing** | Spacious | Open, welcoming |
| **Accent** | Coral `#f97316` | Warm, inviting highlight |
| **Personality** | Friendly, warm, accessible |

#### Variation 4: Bold Geometric

| Dimension | Value | Rationale |
|-----------|-------|-----------|
| **Primary** | `#24a9e0` (brand cyan) | Fixed brand color |
| **Typography** | Plus Jakarta Sans (headings) / DM Sans (body) | Modern, geometric precision |
| **Shadow** | Elevated | Strong depth, authoritative |
| **Radius** | Sharp (4px) | Precise, technical feel |
| **Spacing** | Compact | Dense, efficient, power-user |
| **Accent** | Warm Amber `#d97706` | Contrasting energy |
| **Personality** | Modern, precise, professional |

### 1.2 Confirm or Customize Variations

Use AskUserQuestion to confirm:

```
AskUserQuestion:
question: "Should I proceed with these 4 pre-defined variations, or would you like to customize them?"
header: "Variations"
options:
  - label: "Use pre-defined variations (Recommended)"
    description: "Modern Vibrant, Clean Professional, Soft Approachable, Bold Geometric"
  - label: "Let me customize"
    description: "I'll modify the combinations before proceeding"
```

If user chooses to customize, use AskUserQuestion for each dimension adjustment.

---

## Phase 2: Create Directory Structure

### 2.1 Create Variations Parent Directory

```bash
mkdir -p .ai/alpha/specs/variations/design-system-2026
```

### 2.2 Create Spec Directories

```bash
# Create directories for each variation (pending until GitHub issues created)
mkdir -p .ai/alpha/specs/pending-Spec-design-system-v1-modern-vibrant/research-library
mkdir -p .ai/alpha/specs/pending-Spec-design-system-v2-clean-professional/research-library
mkdir -p .ai/alpha/specs/pending-Spec-design-system-v3-soft-approachable/research-library
mkdir -p .ai/alpha/specs/pending-Spec-design-system-v4-bold-geometric/research-library
```

---

## Phase 3: Create Base Requirements

### 3.1 Write Base Requirements Document

Write to `.ai/alpha/specs/variations/design-system-2026/base-requirements.md`:

```markdown
# Design System Variations - Base Requirements

**Created:** [Date]
**Variation Type:** Theme (Design Tokens)
**Number of Variations:** 4

## Overview

This experiment tests 4 different design system configurations to determine the optimal visual identity for SlideHeroes. All variations implement the same functional requirements but with different visual styling.

## Evaluation Pages

All variations will be evaluated on:
1. **Home page** (`/`) - Marketing site first impression
2. **Dashboard** (`/home/[account]`) - Application experience

## Shared Functional Requirements

All variations MUST:
- [ ] Apply design tokens to shadcn-ui.css
- [ ] Configure fonts in Tailwind and Next.js
- [ ] Maintain WCAG AA color contrast (4.5:1 for text)
- [ ] Support dark mode
- [ ] Pass `pnpm typecheck` and `pnpm lint`
- [ ] Not break any existing functionality

## Non-Functional Requirements

- **Performance:** No increase in LCP from font loading
- **Accessibility:** Maintain WCAG 2.1 AA compliance
- **Compatibility:** Work in Chrome, Firefox, Safari, Edge

## Variation Comparison Matrix

| Dimension | V1: Modern Vibrant | V2: Clean Professional | V3: Soft Approachable | V4: Bold Geometric |
|-----------|-------------------|----------------------|---------------------|-------------------|
| Primary Color | #24a9e0 (brand) | #24a9e0 (brand) | #24a9e0 (brand) | #24a9e0 (brand) |
| Accent Color | Orange #f59e0b | Purple #8b5cf6 | Coral #f97316 | Amber #d97706 |
| Heading Font | Outfit | Inter | Manrope | Plus Jakarta Sans |
| Body Font | Nunito Sans | Inter | Source Sans Pro | DM Sans |
| Shadow | Elevated | Balanced | Subtle | Elevated |
| Border Radius | 12px | 8px | 16px | 4px |
| Spacing | Spacious | Standard | Spacious | Compact |
| Personality | Bold, energetic | Classic, reliable | Friendly, warm | Modern, precise |

## Out of Scope (All Variations)

- New components or features
- Layout changes
- Data model changes
- API changes
```

---

## Phase 4: Create Spec Files

### 4.1 Variation 1 Spec: Modern Vibrant

Write to `.ai/alpha/specs/pending-Spec-design-system-v1-modern-vibrant/spec.md`:

```markdown
# Project Specification: Design System V1 - Modern Vibrant

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S[pending] |
| **GitHub Issue** | #[pending] |
| **Document Owner** | Claude |
| **Created** | [Date] |
| **Status** | Draft |
| **Version** | 0.1 |
| **Variation** | V1 of 4 |

---

## 1. Executive Summary

### One-Line Description
Apply the "Modern Vibrant" design system variation using brand cyan with warm orange accent, Outfit/Nunito typography, elevated shadows, rounded corners, and spacious layout.

### Press Release Headline
> "SlideHeroes unveils bold new visual identity with energetic accents and contemporary typography"

### Elevator Pitch
This variation tests a bold, contemporary visual identity for SlideHeroes. Using the brand cyan with warm orange accents and Outfit/Nunito Sans typography creates an energetic, modern feel with generous spacing that feels premium and approachable.

---

## 2. Problem Statement

### Problem Description
The current design system needs to be finalized with a cohesive visual identity that balances professionalism with approachability.

### Who Experiences This Problem?
- Marketing team (needs compelling brand identity)
- Users (need intuitive, pleasant interface)
- Development team (needs consistent design tokens)

### Current Alternatives
Current implementation uses neutral-based colors without a defined brand personality.

---

## 3. Vision & Goals

### Product Vision
Establish a distinctive visual identity that makes SlideHeroes memorable and professional.

### Primary Goals

| Goal | Success Metric | Target | Measurement |
|------|---------------|--------|-------------|
| G1: Visual Distinctiveness | User recognition | Subjective evaluation | Review screenshots |
| G2: Accessibility | WCAG compliance | AA level (4.5:1) | Contrast checker |
| G3: Performance | Font loading | No LCP regression | Lighthouse |

---

## 4. Target Users

### Primary Persona
**Name:** Business Professional
**Role:** Marketing Manager / Sales Lead
**Goals:** Create impressive presentations efficiently
**Quote:** "I want software that looks as professional as my presentations"

---

## 5. Solution Overview

### Proposed Solution
Apply design tokens for the "Modern Vibrant" variation across the application.

### Key Capabilities

1. **CSS Token Configuration**: Update shadcn-ui.css with brand cyan + warm orange accent
2. **Font Configuration**: Load and apply Outfit and Nunito Sans fonts
3. **Shadow System**: Apply elevated shadow scale
4. **Radius System**: Apply 12px base border radius
5. **Spacing System**: Apply spacious density (25% more breathing room)
6. **Accent Color**: Configure warm orange accent for CTAs and highlights

### Design Token Specification

#### Colors (HSL format for CSS)

```css
/* Primary Palette - Brand Cyan (FIXED) */
--color-primary: 195 78% 51%;           /* #24a9e0 */
--color-primary-hover: 195 78% 45%;     /* darker on hover */
--color-primary-foreground: 0 0% 100%;  /* white text */

/* Accent - Warm Orange */
--color-accent: 38 92% 50%;             /* #f59e0b */
--color-accent-hover: 38 92% 45%;
--color-accent-foreground: 0 0% 100%;
```

#### Typography

| Role | Font | Weight | Fallback |
|------|------|--------|----------|
| Display/Heading | Outfit | 600, 700 | system-ui |
| Body | Nunito Sans | 400, 500, 700 | system-ui |

#### Shadows (Elevated)

```css
--shadow-sm: 0 2px 4px -1px rgb(0 0 0 / 0.15), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 6px 10px -2px rgb(0 0 0 / 0.15), 0 3px 6px -3px rgb(0 0 0 / 0.1);
--shadow-lg: 0 15px 20px -4px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

#### Border Radius

```css
--radius: 0.75rem;  /* 12px base */
--radius-sm: calc(var(--radius) - 4px);  /* 8px */
--radius-md: calc(var(--radius) - 2px);  /* 10px */
--radius-lg: var(--radius);              /* 12px */
```

#### Spacing (Spacious)

```css
/* Spacious density - more breathing room */
--spacing-page-x: 2rem;           /* 32px horizontal padding */
--spacing-page-y: 3rem;           /* 48px vertical padding */
--spacing-section: 4rem;          /* 64px between sections */
--spacing-card: 2rem;             /* 32px card padding */
--spacing-stack: 1.5rem;          /* 24px stacked elements */

/* Component spacing multiplier */
--spacing-density: 1.25;          /* 25% more space than standard */
```

### Responsive Behavior

No layout changes - this is a token-only variation.

---

## 6. Scope Definition

### In Scope
- [ ] Update CSS custom properties in shadcn-ui.css
- [ ] Configure font loading in Next.js
- [ ] Update Tailwind config with font families
- [ ] Verify contrast ratios meet WCAG AA
- [ ] Test on home page and dashboard

### Out of Scope
- [ ] Component structure changes
- [ ] Layout modifications
- [ ] New features or functionality
- [ ] Database changes

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| apps/web/styles/shadcn-ui.css | CSS Variables | Primary token location |
| apps/web/tailwind.config.ts | Font config | Font family definitions |
| apps/web/app/layout.tsx | Font loading | Next.js font optimization |

### Technical Constraints

- **Performance:** Font loading must use next/font for optimization
- **Compatibility:** CSS must work in all modern browsers
- **Dark Mode:** All colors must have dark mode variants

---

## 8. Assumptions & Risks

### Key Assumptions
1. Outfit and Nunito Sans are available via Google Fonts
2. Violet provides sufficient contrast for accessibility

### Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R1 | Violet too bold for B2B | Medium | Medium | Test with users |
| R2 | Font loading affects LCP | Low | Medium | Use next/font |

---

## 9. Success Criteria

### Definition of Done
- [ ] All design tokens applied
- [ ] Fonts loading correctly
- [ ] WCAG AA contrast verified
- [ ] No visual regressions
- [ ] Dark mode working

---

## 10. Decomposition Hints

### Candidate Initiatives
1. **Design Token Application** (single initiative - this is a focused change)

### Candidate Features
1. **F1: CSS Token Configuration** - Update shadcn-ui.css
2. **F2: Font Configuration** - Configure font loading
3. **F3: Verification & Screenshots** - Capture evaluation assets

### Complexity Indicators
| Area | Complexity | Rationale |
|------|------------|-----------|
| CSS Changes | Low | Token updates only |
| Font Loading | Low | Standard Next.js pattern |
| Testing | Low | Visual verification |

---

## 11. Appendices

### A. Glossary
- **Design Token**: A named value (color, spacing, etc.) that can be changed globally
- **HSL**: Hue, Saturation, Lightness color format

### B. Codebase Exploration Results

| Component/Pattern | File Path | Reusable? |
|-------------------|-----------|-----------|
| CSS Variables | apps/web/styles/shadcn-ui.css | Modify in place |
| Font Config | apps/web/tailwind.config.ts | Modify in place |
| Layout | apps/web/app/layout.tsx | Modify for fonts |

### C. Research Integration

| Research File | Key Findings | Spec Section Affected |
|---------------|--------------|----------------------|
| DesignSystem.md | Violet option defined | Section 5 tokens |

### E. Visual Assets

**Target Pages for Evaluation:**
- `/` (Home page)
- `/home/[account]` (Dashboard)

Screenshots will be captured after implementation for comparison.
```

### 4.2 Create Remaining Variation Specs

Create similar spec files for V2, V3, and V4, changing only the variation-specific values:

**V2: Clean Professional** - Blue, Inter/Inter, Balanced shadows, 8px radius
**V3: Soft Approachable** - Teal, Manrope/Source Sans Pro, Subtle shadows, 16px radius
**V4: Bold Geometric** - Indigo, Plus Jakarta Sans/DM Sans, Elevated shadows, 4px radius

Use the Write tool to create each spec file with the appropriate token values.

---

## Phase 5: Create GitHub Issues

### 5.1 Create Issues for Each Variation

```bash
# Variation 1
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Spec: Design System V1 - Modern Vibrant" \
  --body "$(cat .ai/alpha/specs/pending-Spec-design-system-v1-modern-vibrant/spec.md)" \
  --label "type:spec" \
  --label "alpha:spec" \
  --label "alpha:design-variation"

# Capture issue number, then rename directory
# mv .ai/alpha/specs/pending-Spec-design-system-v1-modern-vibrant .ai/alpha/specs/S<issue-#>-Spec-design-system-v1-modern-vibrant
```

Repeat for V2, V3, V4.

### 5.2 Rename Directories

After issue creation, rename each directory:

```bash
mv .ai/alpha/specs/pending-Spec-design-system-v1-modern-vibrant .ai/alpha/specs/S<V1-issue>-Spec-design-system-v1-modern-vibrant
mv .ai/alpha/specs/pending-Spec-design-system-v2-clean-professional .ai/alpha/specs/S<V2-issue>-Spec-design-system-v2-clean-professional
mv .ai/alpha/specs/pending-Spec-design-system-v3-soft-approachable .ai/alpha/specs/S<V3-issue>-Spec-design-system-v3-soft-approachable
mv .ai/alpha/specs/pending-Spec-design-system-v4-bold-geometric .ai/alpha/specs/S<V4-issue>-Spec-design-system-v4-bold-geometric
```

---

## Phase 6: Create Configuration

### 6.1 Write Variations Config

Write to `.ai/alpha/specs/variations/design-system-2026/variations-config.json`:

```json
{
  "name": "Design System 2026",
  "created_at": "[ISO timestamp]",
  "variation_type": "theme",
  "status": "specs_created",
  "base_requirements": ".ai/alpha/specs/variations/design-system-2026/base-requirements.md",
  "evaluation_pages": [
    { "name": "Home Page", "path": "/" },
    { "name": "Dashboard", "path": "/home/[account]" }
  ],
  "variations": [
    {
      "id": "v1",
      "name": "Modern Vibrant",
      "spec_id": "S[V1-issue]",
      "spec_dir": ".ai/alpha/specs/S[V1-issue]-Spec-design-system-v1-modern-vibrant",
      "github_issue": "[V1-issue]",
      "branch": "alpha/S[V1-issue]",
      "status": "ready_for_decomposition",
      "tokens": {
        "primary_color": "#24a9e0",
        "accent_color": "#f59e0b",
        "heading_font": "Outfit",
        "body_font": "Nunito Sans",
        "shadow": "elevated",
        "radius": "12px",
        "spacing": "spacious"
      }
    },
    {
      "id": "v2",
      "name": "Clean Professional",
      "spec_id": "S[V2-issue]",
      "spec_dir": ".ai/alpha/specs/S[V2-issue]-Spec-design-system-v2-clean-professional",
      "github_issue": "[V2-issue]",
      "branch": "alpha/S[V2-issue]",
      "status": "ready_for_decomposition",
      "tokens": {
        "primary_color": "#24a9e0",
        "accent_color": "#8b5cf6",
        "heading_font": "Inter",
        "body_font": "Inter",
        "shadow": "balanced",
        "radius": "8px",
        "spacing": "standard"
      }
    },
    {
      "id": "v3",
      "name": "Soft Approachable",
      "spec_id": "S[V3-issue]",
      "spec_dir": ".ai/alpha/specs/S[V3-issue]-Spec-design-system-v3-soft-approachable",
      "github_issue": "[V3-issue]",
      "branch": "alpha/S[V3-issue]",
      "status": "ready_for_decomposition",
      "tokens": {
        "primary_color": "#24a9e0",
        "accent_color": "#f97316",
        "heading_font": "Manrope",
        "body_font": "Source Sans Pro",
        "shadow": "subtle",
        "radius": "16px",
        "spacing": "spacious"
      }
    },
    {
      "id": "v4",
      "name": "Bold Geometric",
      "spec_id": "S[V4-issue]",
      "spec_dir": ".ai/alpha/specs/S[V4-issue]-Spec-design-system-v4-bold-geometric",
      "github_issue": "[V4-issue]",
      "branch": "alpha/S[V4-issue]",
      "status": "ready_for_decomposition",
      "tokens": {
        "primary_color": "#24a9e0",
        "accent_color": "#d97706",
        "heading_font": "Plus Jakarta Sans",
        "body_font": "DM Sans",
        "shadow": "elevated",
        "radius": "4px",
        "spacing": "compact"
      }
    }
  ],
  "comparison": {
    "status": "pending_implementation",
    "winner": null,
    "merge_notes": null
  }
}
```

---

## Phase 7: Create README and Report

### 7.1 Write README

Write to `.ai/alpha/specs/variations/design-system-2026/README.md`:

```markdown
# Design System 2026 - Variation Experiment

**Created:** [Date]
**Status:** Ready for Decomposition

## Overview

This experiment tests 4 different design system configurations to determine the optimal visual identity for SlideHeroes.

## Variations

All use brand color `#24a9e0`. Variations differ by accent, typography, shadow, radius, and spacing.

| ID | Spec | Name | Accent | Typography | Shadow | Radius | Spacing |
|----|------|------|--------|------------|--------|--------|---------|
| V1 | S[#] | Modern Vibrant | Orange | Outfit/Nunito | Elevated | 12px | Spacious |
| V2 | S[#] | Clean Professional | Purple | Inter/Inter | Balanced | 8px | Standard |
| V3 | S[#] | Soft Approachable | Coral | Manrope/Source Sans | Subtle | 16px | Spacious |
| V4 | S[#] | Bold Geometric | Amber | Plus Jakarta/DM Sans | Elevated | 4px | Compact |

## Evaluation Focus

All variations evaluated on:
- **Home page** (`/`) - First impression, marketing appeal
- **Dashboard** (`/home/[account]`) - Application usability

## Next Steps

### 1. Decompose Each Variation

Run initiative decomposition for each (can be done in parallel in separate terminals):

\`\`\`bash
/alpha:initiative-decompose S[V1-issue]
/alpha:initiative-decompose S[V2-issue]
/alpha:initiative-decompose S[V3-issue]
/alpha:initiative-decompose S[V4-issue]
\`\`\`

### 2. Continue Decomposition

For each variation:
\`\`\`bash
/alpha:feature-decompose S[spec].I1
/alpha:task-decompose S[spec].I1
\`\`\`

### 3. Implement (Parallel)

Run orchestrator for each variation:
\`\`\`bash
tsx .ai/alpha/scripts/spec-orchestrator.ts [V1-issue]
tsx .ai/alpha/scripts/spec-orchestrator.ts [V2-issue]
tsx .ai/alpha/scripts/spec-orchestrator.ts [V3-issue]
tsx .ai/alpha/scripts/spec-orchestrator.ts [V4-issue]
\`\`\`

### 4. Evaluate

Each variation will be on its own branch. Compare:
- Screenshots of home page and dashboard
- Rate against criteria in COMPARISON.md template

## Files

| File | Purpose |
|------|---------|
| `variations-config.json` | Machine-readable configuration |
| `base-requirements.md` | Shared requirements |
| `COMPARISON.md` | Post-implementation comparison (create after review) |
```

### 7.2 Report Completion

Provide final summary:

```markdown
## Design System Variations Complete

**Variations Created:** 4
**Evaluation Pages:** Home page, Dashboard

### Specs Created

All variations use brand color `#24a9e0`.

| Variation | Spec ID | Name | Accent | Typography | Spacing | GitHub Issue |
|-----------|---------|------|--------|------------|---------|--------------|
| V1 | S[#] | Modern Vibrant | Orange #f59e0b | Outfit/Nunito | Spacious | #[#] |
| V2 | S[#] | Clean Professional | Purple #8b5cf6 | Inter/Inter | Standard | #[#] |
| V3 | S[#] | Soft Approachable | Coral #f97316 | Manrope/Source Sans | Spacious | #[#] |
| V4 | S[#] | Bold Geometric | Amber #d97706 | Plus Jakarta/DM Sans | Compact | #[#] |

### Files Created

- `.ai/alpha/specs/variations/design-system-2026/variations-config.json`
- `.ai/alpha/specs/variations/design-system-2026/base-requirements.md`
- `.ai/alpha/specs/variations/design-system-2026/README.md`
- `.ai/alpha/specs/S[#]-Spec-design-system-v1-modern-vibrant/spec.md`
- `.ai/alpha/specs/S[#]-Spec-design-system-v2-clean-professional/spec.md`
- `.ai/alpha/specs/S[#]-Spec-design-system-v3-soft-approachable/spec.md`
- `.ai/alpha/specs/S[#]-Spec-design-system-v4-bold-geometric/spec.md`

### Next Steps

1. Run `/alpha:initiative-decompose S[V1-issue]` for first variation
2. Continue with feature and task decomposition
3. Run orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts [V1-issue]`
4. Repeat for V2, V3, V4
5. Evaluate all variations and select winner
```

---

## Validation Commands

```bash
# Verify directories created
ls -la .ai/alpha/specs/variations/design-system-2026/
ls -la .ai/alpha/specs/ | grep design-system

# Verify spec files exist
for v in v1 v2 v3 v4; do
  test -f ".ai/alpha/specs/"*"-Spec-design-system-${v}-"*/spec.md && echo "✓ ${v} spec exists"
done

# Verify GitHub issues created
gh issue list --repo MLorneSmith/2025slideheroes --label "alpha:design-variation" --limit 10
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Font not available | Check Google Fonts availability, use fallback |
| Contrast fails WCAG | Adjust color values, test with contrast checker |
| Spec validation fails | Ensure all 11 sections present |
| GitHub issue creation fails | Check gh CLI auth: `gh auth status` |

---

## Related Commands

- `/alpha:ui-variations` - Generic UI variation generator
- `/alpha:initiative-decompose` - Next step after creating specs
- `/alpha:review` - Review implemented variations
