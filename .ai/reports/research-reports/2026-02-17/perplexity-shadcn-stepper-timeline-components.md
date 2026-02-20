# Perplexity Research: Shadcn Stepper, Timeline & Process Step Components

**Date**: 2026-02-17
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary
Searched for stepper, timeline, and process step components across the shadcn/ui ecosystem (official registry, Magic UI, Aceternity UI, shadcnblocks) for use in a "How It Works" section with 5 steps on a SaaS marketing page.

## Findings

### 1. shadcn/ui Official Registry - NO stepper or timeline

The official shadcn/ui registry at ui.shadcn.com does **NOT** include stepper or timeline components. This has been a community request since at least 2024 (GitHub discussions #6219 and #1422), but remains unimplemented.

**Closest official components:**
- `Progress` - simple progress bar
- `Tabs` - tabbed content switching
- `Breadcrumb` - navigation breadcrumbs

**Third-party shadcn steppers (not official):**
- `shadcn-stepper` by damianricobelli - community stepper template (shadcn.io/template/damianricobelli-shadcn-stepper)
- `stepperize` - component registry template for custom steppers
- `next-stepper` - dynamic multi-step form template with progress tracking
- `buouui.com/docs/animations/stepper` - animated stepper component

### 2. Aceternity UI - BEST OPTIONS

#### Timeline Component (RECOMMENDED)
- **URL**: https://ui.aceternity.com/components/timeline
- **Visual**: Vertical scroll-based timeline with sticky header and animated scroll beam that follows content. Displays entries chronologically with year/date headers above content blocks.
- **Animation**: Scroll beam dynamically tracks user scroll position, highlighting active sections. Uses Framer Motion for smooth transitions.
- **Props**: `data: TimelineEntry[]` (each entry has date, title, content)
- **5-step suitability**: YES - pass 5 TimelineEntry objects (Step 1-5) and it renders a vertical process flow
- **Install**: `npx shadcn@latest add https://ui.aceternity.com/registry/timeline.json`

#### Tracing Beam Component
- **URL**: https://ui.aceternity.com/components/tracing-beam
- **Visual**: A glowing beam that follows an SVG path as user scrolls. Beam length adjusts dynamically based on scroll speed.
- **5-step suitability**: Can work as a vertical connector between 5 steps by defining an SVG path spanning the step sections
- **Install**: `npx shadcn@latest add https://ui.aceternity.com/registry/tracing-beam.json`

#### Multi-Step Loader Component
- **URL**: https://ui.aceternity.com/components/multi-step-loader
- **Visual**: Animated loading sequence showing multiple steps with checkmarks
- **5-step suitability**: Designed for loading states, NOT marketing "how it works" sections

#### Sticky Scroll Reveal (ALREADY INSTALLED)
- **Location in project**: `packages/ui/src/aceternity/sticky-scroll-reveal.tsx`
- **Visual**: Left side text content scrolls while right side shows sticky content that swaps. Currently configured for 3 items with scroll thresholds.
- **5-step suitability**: Would need modification to support 5 items (currently hardcoded for 3 with SCROLL_THRESHOLDS). Layout is two-column (text left, visual right), not a traditional step layout.

### 3. Magic UI - NO dedicated stepper/timeline

Magic UI (magicui.design) has 150+ animated components but NO dedicated stepper or timeline component.

**Potentially useful for building a custom "How It Works":**
- **Animated Beam** (magicui.design/docs/components/animated-beam) - animated light beam traveling between elements, good for showing connections between steps
- **Number Ticker** - animated number counter, could show step numbers with animation
- **Animated List** - animated list items, could show steps appearing sequentially
- **Bento Grid** - grid layout, could organize 5 steps in a visual grid

### 4. shadcnblocks - Has process/steps blocks

shadcnblocks.com hosts 878+ marketing blocks across categories.

**Relevant blocks found:**
- **Steps Feature Section Block** - responsive layout for feature steps (shadcn-ui-blocks.com)
- **Journey Steps Block** - numbered milestones with years, titles, descriptions connected by vertical line (shadcn.io/blocks/about-journey-steps)
- Marketing blocks category likely has more "how it works" sections but specific enumeration not available from search

### 5. Other Ecosystem Options
- **Creative Tim Stepper** (creative-tim.com/ui/docs/components/stepper) - controlled stepper with track marks, labels, loading states
- **Buou UI Stepper** (buouui.com/docs/animations/stepper) - animated stepper component
- **Cult UI** (cult-ui.com) - open-source shadcn components, may have step-related components

## Recommendation Matrix for "How It Works" (5 Steps)

| Component | Source | Visual Impact | Install Effort | 5-Step Fit |
|-----------|--------|--------------|----------------|------------|
| **Timeline** | Aceternity | High (scroll beam animation) | Low (CLI install) | Excellent |
| **Tracing Beam + custom steps** | Aceternity | Very High (glowing beam connector) | Medium (custom layout needed) | Good |
| **Journey Steps Block** | shadcnblocks | Medium (static numbered milestones) | Low (copy block) | Excellent |
| **Sticky Scroll Reveal** | Already installed | High (scroll-driven reveal) | Medium (modify for 5 items) | Moderate (two-column, not traditional steps) |
| **Custom with Number Ticker + Animated List** | Magic UI | High (animated numbers) | High (build from scratch) | Good |

## Sources & Citations
- https://ui.shadcn.com/docs/components (official component list)
- https://github.com/shadcn-ui/ui/discussions/6219 (stepper request)
- https://github.com/shadcn-ui/ui/discussions/1422 (stepper discussion)
- https://ui.aceternity.com/components/timeline
- https://ui.aceternity.com/components/tracing-beam
- https://ui.aceternity.com/components/multi-step-loader
- https://magicui.design/docs/components
- https://magicui.design/docs/components/animated-beam
- https://www.shadcnblocks.com/blocks/marketing
- https://www.shadcn-ui-blocks.com/blocks/react/marketing/feature-sections/steps
- https://www.shadcn.io/blocks/about-journey-steps
- https://shadcn.io/template/damianricobelli-shadcn-stepper
- https://buouui.com/docs/animations/stepper
- https://www.creative-tim.com/ui/docs/components/stepper

## Key Takeaways
- shadcn/ui has NO official stepper or timeline component
- Aceternity UI Timeline is the strongest ready-made option for a "How It Works" with 5 steps
- Aceternity Tracing Beam could create a visually striking vertical connector between custom step cards
- The project already has sticky-scroll-reveal installed but it's designed for 3 items and a two-column layout
- shadcnblocks has pre-built "steps" and "journey" blocks that are simpler but functional
- Magic UI lacks a stepper but has animated primitives (Number Ticker, Animated Beam) for building custom solutions

## Related Searches
- Aceternity Timeline component API documentation and customization options
- shadcnblocks "how it works" marketing blocks full catalog
- Framer Motion scroll-driven animations for step-by-step reveals
- buouui.com stepper component details and compatibility
