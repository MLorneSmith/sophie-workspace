---
description: Create multiple UI variation specs for A/B comparison before implementation. Precedes parallel /alpha:spec executions
argument-hint: [ui-feature-name]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, WebFetch, WebSearch, AskUserQuestion, Write, Skill]
---

# Alpha: UI Variations

Create 2-4 parallel UI variation specs with intentional design differences for A/B experimentation. This command generates complete spec files ready for `/alpha:initiative-decompose`.

## Context

The Alpha UI Variations workflow:
1. **UI Variations** (this command) - Define base requirements and create variation specs
2. **Initiative Decompose** (parallel) - `/alpha:initiative-decompose` for each spec
3. **Feature/Task Decompose** - Continue normal Alpha workflow
4. **Implement** (parallel) - Build each variation on separate branches
5. **Compare** - Review side-by-side and select winner

## Variation Types

| Type | Name | Focus Areas | When to Use |
|------|------|-------------|-------------|
| **Theme** | Design Token Variations | Colors, typography, spacing, shadows, border radius | First pass - establish visual identity |
| **Layout** | Structural Variations | Grid systems, component arrangement, information hierarchy | Second pass - page-level redesigns |
| **Component** | Interaction Variations | Component implementations, states, micro-interactions | Third pass - interaction refinement |

## Initial Topic

$ARGUMENTS

---

## Phase 1: Load Design Skills

### 1.1 Load Frontend Design Skill

Use the Skill tool to load design methodology:

```
Skill tool with skill: "frontend-design"
```

Key principles to apply:
- Choose BOLD aesthetic directions (not safe defaults)
- Avoid "AI slop" patterns (gradient text, glassmorphism everywhere, purple-to-blue gradients)
- Build on shadcn/ui components with creative customization
- Each variation should be DISTINCTIVE and MEMORABLE

### 1.2 Load Tailwind Design System Skill

```
Skill tool with skill: "tailwind-design-system"
```

Key patterns to apply:
- Design token hierarchy: Brand → Semantic → Component
- CVA (Class Variance Authority) for component variants
- CSS variables for runtime theming
- Consistent spacing scale and border radius tokens

### 1.3 Fetch Web Interface Guidelines

Use WebFetch to get current guidelines:

```
WebFetch tool with url: "https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md"
prompt: "Extract the key design rules and principles. Focus on layout, typography, accessibility, and interaction patterns."
```

---

## Phase 2: Research & Requirements

### 2.1 Explore Existing Patterns

Use the Task tool with `subagent_type=code-explorer`:

```
Task tool with subagent_type=code-explorer
prompt: "Explore UI patterns for [topic] in this codebase. Find:
1. Existing components in packages/ui/ and apps/web/
2. Current design tokens in Tailwind config (apps/web/tailwind.config.ts)
3. CSS variables in globals.css or theme files
4. Similar page layouts and component patterns
Return SPECIFIC FILE PATHS and current design token values."
```

### 2.2 Conduct Requirements Interview

Ask **4-6 questions** to understand the UI challenge:

**Required Questions:**

1. **Scope**: "What UI element/page are we creating variations for?"
   - Options: Single page, Component system, Full feature flow

2. **Problem**: "What's wrong with the current design (or what are we establishing)?"
   - Options based on research findings

3. **Target Users**: "Who is the primary user for this UI?"
   - Options: New users, Power users, Mobile users, Enterprise clients

4. **Key Action**: "What's the ONE thing users must be able to do?"
   - Free-form or options based on feature

5. **Variation Type**:
   ```
   AskUserQuestion:
   question: "What aspect should we vary across designs?"
   header: "Variation Type"
   options:
     - label: "Theme Variations (Recommended for first pass)"
       description: "Different design tokens: colors, typography, spacing. Same components, different visual identity."
     - label: "Layout Variations"
       description: "Different component arrangements and information hierarchy. Same content, different structure."
     - label: "Component Variations"
       description: "Different component implementations and interaction patterns. Same layout, different interactions."
   ```

6. **Variation Count**:
   ```
   AskUserQuestion:
   question: "How many variations should we create?"
   header: "Count"
   options:
     - label: "2 variations (Recommended)"
       description: "Faster implementation, clearer A/B comparison"
     - label: "3 variations"
       description: "More options, moderate implementation time"
   ```

---

## Phase 3: Define Variation Strategies

### 3.1 Design Direction Workshop

For each variation, define a BOLD aesthetic direction using frontend-design principles.

**For Theme Variations, define these dimensions:**

| Dimension | Description | Example Values |
|-----------|-------------|----------------|
| **Color Mood** | Overall color feeling | Warm/earthy, Cool/professional, Vibrant/energetic, Calm/minimal |
| **Typography** | Font personality | Classic serif, Bold geometric sans, Clean humanist, Playful rounded |
| **Spacing Scale** | Density preference | Compact/dense, Standard, Spacious/airy |
| **Border Radius** | Shape language | Sharp/squared (0-2px), Soft (4-8px), Rounded (12-16px), Pill (full) |
| **Shadow Style** | Depth treatment | Flat/minimal, Soft elevation, Pronounced depth, Colored shadows |
| **Accent Strategy** | How to draw attention | Subtle underlines, Bold color blocks, Gradient accents, Icon emphasis |

**For Layout Variations, define:**

| Dimension | Description | Example Values |
|-----------|-------------|----------------|
| **Primary Layout** | Overall structure | Sidebar navigation, Top navigation, Dashboard grid, Single column |
| **Information Flow** | Reading pattern | Top-to-bottom, Left-to-right, Center-focused, F-pattern |
| **Content Density** | How much visible | Compact with accordions, Cards with spacing, Full-width sections |
| **Mobile Strategy** | Small screen approach | Bottom sheet nav, Hamburger menu, Tab bar, Progressive disclosure |

**For Component Variations, define:**

| Dimension | Description | Example Values |
|-----------|-------------|----------------|
| **Interaction Style** | How users engage | Click/tap focused, Hover reveals, Keyboard optimized, Gesture-based |
| **Feedback Type** | How system responds | Subtle transitions, Bold animations, Instant/no animation, Sound cues |
| **State Display** | How to show status | Inline indicators, Toast notifications, Badge updates, Modal confirmations |
| **Loading Pattern** | Async handling | Skeleton screens, Spinners, Progressive reveal, Optimistic updates |

### 3.2 Capture Variation Definitions

For each variation, use AskUserQuestion to confirm design direction:

```
AskUserQuestion:
question: "For Variation 1, what design direction should we take?"
header: "V1 Direction"
options:
  - label: "Modern Minimal"
    description: "Clean lines, generous whitespace, subtle shadows, restrained color palette"
  - label: "Bold Expressive"
    description: "Strong typography, vibrant accents, dynamic spacing, memorable personality"
  - label: "Warm Professional"
    description: "Earthy tones, classic typography, balanced density, trustworthy feel"
  - label: "Tech Forward"
    description: "Geometric shapes, cool palette, precise spacing, innovative feel"
```

Repeat for each variation with DIFFERENT options (no two variations should be similar).

### 3.3 Document Design Tokens for Each Variation

Based on selected directions, define specific design tokens:

**Variation Template:**

```markdown
### Variation [N]: [Name]

**Design Philosophy:** [1-2 sentences capturing the distinctive feel]

**Key Differentiators (what makes this MEMORABLE):**
1. [Unique visual element or pattern]
2. [Distinctive interaction or animation]
3. [Unconventional layout choice]

**Design Tokens:**
| Token | Value | Rationale |
|-------|-------|-----------|
| --primary | [HSL value] | [Why this color] |
| --radius | [px value] | [Shape language reason] |
| --spacing-unit | [px value] | [Density rationale] |
| font-display | [font name] | [Typography personality] |
| font-body | [font name] | [Readability choice] |

**CSS Variable Overrides (for globals.css):**
```css
:root {
  --primary: [value];
  --primary-foreground: [value];
  --accent: [value];
  --radius: [value];
  /* Additional overrides */
}
```

**Tailwind Extend (for tailwind.config.ts):**
```typescript
extend: {
  colors: {
    // Variation-specific semantic colors
  },
  borderRadius: {
    // Variation-specific radius scale
  },
  fontFamily: {
    // Variation-specific fonts
  },
}
```
```

---

## Phase 4: Create Spec Files

### 4.1 Create Directory Structure

```bash
# Create variations parent directory
mkdir -p .ai/alpha/specs/variations/<feature-slug>

# Create spec directories for each variation (pending until GitHub issue created)
mkdir -p .ai/alpha/specs/pending-Spec-<feature-slug>-v1/research-library
mkdir -p .ai/alpha/specs/pending-Spec-<feature-slug>-v2/research-library
# ... for each variation
```

### 4.2 Create Base Requirements Document

Write shared requirements that ALL variations must satisfy:

**File:** `.ai/alpha/specs/variations/<feature-slug>/base-requirements.md`

```markdown
# [Feature Name] - UI Variations Base Requirements

**Created:** [Date]
**Variation Type:** [Theme | Layout | Component]
**Number of Variations:** [N]

## Shared Functional Requirements

All variations MUST implement these capabilities:

### User Story
As a [persona], I want to [action] so that [benefit].

### Acceptance Criteria (All Variations Must Pass)
- [ ] [Functional requirement 1]
- [ ] [Functional requirement 2]
- [ ] [Accessibility requirement - WCAG 2.1 AA]
- [ ] [Performance requirement - Core Web Vitals]
- [ ] [Responsive requirement - works on mobile/tablet/desktop]

### Non-Functional Requirements
- **Performance:** LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Accessibility:** WCAG 2.1 AA compliance, keyboard navigable
- **Responsive:** Mobile-first, breakpoints at 768px, 1024px, 1280px
- **Browser Support:** Chrome, Firefox, Safari, Edge (last 2 versions)

### Constraints
- Must use existing shadcn/ui components from @kit/ui
- Must support dark mode via CSS variables
- Must integrate with existing auth/data layer

### Out of Scope (All Variations)
- [Shared exclusion 1]
- [Shared exclusion 2]

## Variation Comparison Matrix

| Aspect | V1: [Name] | V2: [Name] | V3: [Name] |
|--------|------------|------------|------------|
| Design Philosophy | [1 line] | [1 line] | [1 line] |
| Color Mood | [Value] | [Value] | [Value] |
| Typography | [Value] | [Value] | [Value] |
| Key Differentiator | [Value] | [Value] | [Value] |
```

### 4.3 Create Spec Files for Each Variation

For EACH variation, create a complete spec file following the `.ai/alpha/templates/spec.md` structure.

**File:** `.ai/alpha/specs/pending-Spec-<feature-slug>-v[N]/spec.md`

**Critical spec sections to customize per variation:**

1. **Section 1 - Executive Summary**: Include variation design philosophy
2. **Section 5 - Solution Overview**: Include variation-specific design tokens and CSS
3. **Section 10 - Decomposition Hints**: Include variation-specific component implementations
4. **Section 11.E - Visual Assets**: Include variation-specific ASCII mockup

**Variation-Specific Content to Include:**

```markdown
## Variation-Specific Design Direction

**Variation ID:** V[N]
**Variation Name:** [Name]
**Design Philosophy:** [1-2 sentences]

### Design Token Overrides

This variation uses the following design token customizations:

```css
/* apps/web/app/globals.css - Variation V[N] overrides */
:root {
  --primary: [HSL];
  --primary-foreground: [HSL];
  --accent: [HSL];
  --radius: [value];
  /* ... additional tokens */
}
```

### Typography

| Role | Font | Weight | Size Scale |
|------|------|--------|------------|
| Display | [Font name] | [Weight] | [Scale] |
| Heading | [Font name] | [Weight] | [Scale] |
| Body | [Font name] | [Weight] | [Scale] |

### Key Visual Patterns

1. **[Pattern 1]:** [Description with Tailwind classes]
2. **[Pattern 2]:** [Description with Tailwind classes]
3. **[Pattern 3]:** [Description with Tailwind classes]

### Differentiators (What Makes This Memorable)

- [Unique element 1]
- [Unique element 2]
- [Unique element 3]
```

### 4.4 Create GitHub Issues for Each Variation

For EACH variation, create a GitHub issue:

```bash
# Create issue for Variation 1
gh issue create \
  --repo slideheroes/2025slideheroes \
  --title "Spec: [Feature Name] - V1 [Variation Name]" \
  --body "$(cat .ai/alpha/specs/pending-Spec-<feature-slug>-v1/spec.md)" \
  --label "type:spec" \
  --label "status:draft" \
  --label "alpha:spec" \
  --label "alpha:ui-variation"

# Capture issue number and rename directory
# Repeat for each variation
```

### 4.5 Rename Directories with S# Format

After issue creation, rename each directory:

```bash
mv .ai/alpha/specs/pending-Spec-<feature-slug>-v1 .ai/alpha/specs/S<issue-#>-Spec-<feature-slug>-v1
mv .ai/alpha/specs/pending-Spec-<feature-slug>-v2 .ai/alpha/specs/S<issue-#>-Spec-<feature-slug>-v2
# ... for each variation
```

### 4.6 Create Variations Configuration

**File:** `.ai/alpha/specs/variations/<feature-slug>/variations-config.json`

```json
{
  "feature_name": "[Feature Name]",
  "created_at": "[ISO timestamp]",
  "variation_type": "theme|layout|component",
  "status": "specs_created",
  "base_requirements": ".ai/alpha/specs/variations/<feature-slug>/base-requirements.md",
  "variations": [
    {
      "id": "v1",
      "name": "[Variation 1 Name]",
      "spec_id": "S[issue-#]",
      "spec_dir": ".ai/alpha/specs/S[issue-#]-Spec-<feature-slug>-v1",
      "github_issue": "[issue-#]",
      "branch": "alpha/S[issue-#]",
      "status": "ready_for_decomposition",
      "design_philosophy": "[1 sentence]",
      "key_differentiators": ["diff1", "diff2", "diff3"]
    },
    {
      "id": "v2",
      "name": "[Variation 2 Name]",
      "spec_id": "S[issue-#]",
      "spec_dir": ".ai/alpha/specs/S[issue-#]-Spec-<feature-slug>-v2",
      "github_issue": "[issue-#]",
      "branch": "alpha/S[issue-#]",
      "status": "ready_for_decomposition",
      "design_philosophy": "[1 sentence]",
      "key_differentiators": ["diff1", "diff2", "diff3"]
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

## Phase 5: Create README and Report

### 5.1 Create Variations README

**File:** `.ai/alpha/specs/variations/<feature-slug>/README.md`

```markdown
# [Feature Name] - UI Variations

**Created:** [Date]
**Variation Type:** [Theme | Layout | Component]
**Status:** Ready for Decomposition

## Overview

[2-3 sentences describing what we're varying and why]

## Variations

| ID | Spec ID | Name | Philosophy | GitHub Issue |
|----|---------|------|------------|--------------|
| v1 | S[#] | [Name] | [1 sentence] | #[issue-#] |
| v2 | S[#] | [Name] | [1 sentence] | #[issue-#] |

## Design Skill Integration

This workflow used the following design skills:
- **frontend-design**: Bold aesthetic direction, avoiding AI slop patterns
- **tailwind-design-system**: Design token architecture and CVA patterns
- **web-design-guidelines**: Vercel interface guidelines compliance

## Next Steps

### 1. Decompose Each Variation (Run in Parallel)

```bash
# Terminal 1
/alpha:initiative-decompose S[spec-id-v1]

# Terminal 2
/alpha:initiative-decompose S[spec-id-v2]
```

### 2. Continue Alpha Workflow

For each variation, continue with:
```bash
/alpha:feature-decompose S[spec-id].I1
/alpha:task-decompose S[spec-id].I1
# ... until all initiatives are decomposed
```

### 3. Implement Variations (Parallel)

```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts [spec-id-v1]
tsx .ai/alpha/scripts/spec-orchestrator.ts [spec-id-v2]
```

### 4. Compare & Select

After implementation, create COMPARISON.md with side-by-side analysis.

## Files

| File | Purpose |
|------|---------|
| `variations-config.json` | Machine-readable configuration |
| `base-requirements.md` | Shared requirements all variations meet |
| `COMPARISON.md` | Post-implementation comparison (created later) |
```

### 5.2 Report Completion

Provide completion summary:

```markdown
## UI Variations Complete

**Feature:** [Feature Name]
**Variation Type:** [Type]
**Variations Created:** [N]

### Specs Created

| Variation | Spec ID | Name | GitHub Issue | Spec Directory |
|-----------|---------|------|--------------|----------------|
| V1 | S[#] | [Name] | #[#] | `.ai/alpha/specs/S[#]-Spec-...` |
| V2 | S[#] | [Name] | #[#] | `.ai/alpha/specs/S[#]-Spec-...` |

### Design Decisions

| Dimension | V1 | V2 |
|-----------|----|----|
| Color Mood | [Value] | [Value] |
| Typography | [Value] | [Value] |
| Spacing | [Value] | [Value] |
| Key Differentiator | [Value] | [Value] |

### Next Steps

Run initiative decomposition for each variation:

```bash
/alpha:initiative-decompose S[spec-id-v1]
/alpha:initiative-decompose S[spec-id-v2]
```

### Files Created

- `.ai/alpha/specs/variations/<feature-slug>/variations-config.json`
- `.ai/alpha/specs/variations/<feature-slug>/base-requirements.md`
- `.ai/alpha/specs/variations/<feature-slug>/README.md`
- `.ai/alpha/specs/S[#]-Spec-<feature-slug>-v1/spec.md`
- `.ai/alpha/specs/S[#]-Spec-<feature-slug>-v2/spec.md`
```

---

## Comparison Template (For Post-Implementation)

After all variations are implemented, create:

**File:** `.ai/alpha/specs/variations/<feature-slug>/COMPARISON.md`

```markdown
# [Feature Name] - Variation Comparison

**Date:** [Date]
**Reviewers:** [Names]

## Live URLs

| Variation | Branch | Dev Server URL |
|-----------|--------|----------------|
| V1: [Name] | alpha/S[#] | [E2B URL or local] |
| V2: [Name] | alpha/S[#] | [E2B URL or local] |

## Side-by-Side Screenshots

| Screen | V1 | V2 |
|--------|----|----|
| Desktop | ![v1](./screenshots/v1-desktop.png) | ![v2](./screenshots/v2-desktop.png) |
| Mobile | ![v1](./screenshots/v1-mobile.png) | ![v2](./screenshots/v2-mobile.png) |

## Evaluation Matrix

| Criterion | Weight | V1 Score | V2 Score | Notes |
|-----------|--------|----------|----------|-------|
| Visual Distinctiveness | 15% | /10 | /10 | Does it avoid AI slop? |
| Usability | 25% | /10 | /10 | Task completion ease |
| Accessibility | 20% | /10 | /10 | WCAG compliance |
| Performance | 15% | /10 | /10 | Core Web Vitals |
| Brand Alignment | 15% | /10 | /10 | Fits product identity |
| Implementation Quality | 10% | /10 | /10 | Code maintainability |
| **Weighted Total** | 100% | | | |

## Verdict

**Winner:** [V1 | V2 | Merge]

**Rationale:** [2-3 sentences]

**Merge Strategy (if applicable):**
- Take [element] from V1 because [reason]
- Take [element] from V2 because [reason]

## Next Steps

- [ ] Merge winning variation to main branch
- [ ] Archive non-winning variation branch
- [ ] Update variations-config.json with decision
```

---

## Key Principles

- **Use Design Skills** - Always load and apply frontend-design, tailwind-design-system, web-design-guidelines
- **Bold Differences** - Each variation should be DISTINCTIVELY different, not subtle tweaks
- **Complete Specs** - Create full spec files, not just inputs
- **Parallel Paths** - Each variation gets its own spec ID and branch
- **Measurable Comparison** - Use structured evaluation criteria

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Variations too similar | Apply frontend-design skill more aggressively, choose opposite ends of design spectrum |
| Too many variations | Start with 2, add more only if needed |
| Skills not loading | Use Skill tool explicitly before design phase |
| Spec validation fails | Check all 11 sections present per template |

---

## Related Commands

- `/alpha:initiative-decompose` - Next step after creating specs
- `/alpha:review` - Review implemented variations
- `frontend-design` skill - Bold aesthetic direction
- `tailwind-design-system` skill - Design token patterns
- `web-design-guidelines` skill - Interface guidelines review
