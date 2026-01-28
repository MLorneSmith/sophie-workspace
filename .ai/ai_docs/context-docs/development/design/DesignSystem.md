# SlideHeroes Design System

> A comprehensive design system for the SlideHeroes presentation platform.
> This document defines all design tokens and guidelines for consistent UI implementation.

---

## Table of Contents

1. [Overview](#overview)
2. [Design Tokens](#design-tokens)
3. [Colors](#1-colors)
4. [Typography](#2-typography)
5. [Spacing](#3-spacing)
6. [Elevation & Shadows](#4-elevation--shadows)
7. [Border Radius](#5-border-radius)
8. [Motion & Animation](#6-motion--animation)
9. [Iconography](#7-iconography)
10. [Breakpoints](#8-breakpoints)
11. [Z-Index Scale](#9-z-index-scale)
12. [Interaction States](#10-interaction-states)
13. [Accessibility](#11-accessibility)
14. [Implementation Guide](#implementation-guide)

---

## Overview

### Design Philosophy

SlideHeroes follows a **"professional yet approachable"** design language suitable for a B2B SaaS presentation platform. The design system prioritizes:

- **Clarity**: Clean, uncluttered interfaces that let content shine
- **Professionalism**: Trustworthy appearance for business users
- **Accessibility**: WCAG AA compliance as a minimum standard
- **Scalability**: Works across marketing and application contexts

### Token Architecture

We use a **three-layer token hierarchy**:

```
┌─────────────────────────────────────────────────────┐
│  COMPONENT TOKENS                                    │
│  Button padding, card border-radius, input height   │
├─────────────────────────────────────────────────────┤
│  SEMANTIC TOKENS                                     │
│  --color-primary, --spacing-section, --text-body    │
├─────────────────────────────────────────────────────┤
│  PRIMITIVE TOKENS                                    │
│  --color-blue-600, --spacing-4, --font-size-base    │
└─────────────────────────────────────────────────────┘
```

---

## Design Tokens

### Token Naming Convention

```
--[category]-[property]-[element]-[variant]-[state]
```

**Examples:**
- `--color-primary` (semantic)
- `--color-primary-hover` (semantic + state)
- `--spacing-component-padding` (semantic + element)
- `--color-blue-600` (primitive)

---

## 1. Colors

### 1.1 Color Philosophy

**Current**: Neutral-first palette with subtle accents
**Goal**: Define whether we want a more vibrant brand identity or maintain professional neutrality

### 1.2 Primitive Color Scales

These are the raw color values from which semantic colors are derived.

#### Neutral Scale (Current: Slate-based)

| Token | Value | Preview | Usage |
|-------|-------|---------|-------|
| `--color-neutral-50` | `#f8fafc` | ![#f8fafc](https://via.placeholder.com/20/f8fafc/f8fafc) | Subtle backgrounds |
| `--color-neutral-100` | `#f1f5f9` | ![#f1f5f9](https://via.placeholder.com/20/f1f5f9/f1f5f9) | Hover states |
| `--color-neutral-200` | `#e2e8f0` | ![#e2e8f0](https://via.placeholder.com/20/e2e8f0/e2e8f0) | Borders, dividers |
| `--color-neutral-300` | `#cbd5e1` | ![#cbd5e1](https://via.placeholder.com/20/cbd5e1/cbd5e1) | Disabled text |
| `--color-neutral-400` | `#94a3b8` | ![#94a3b8](https://via.placeholder.com/20/94a3b8/94a3b8) | Placeholder text |
| `--color-neutral-500` | `#64748b` | ![#64748b](https://via.placeholder.com/20/64748b/64748b) | Secondary text |
| `--color-neutral-600` | `#475569` | ![#475569](https://via.placeholder.com/20/475569/475569) | Body text |
| `--color-neutral-700` | `#334155` | ![#334155](https://via.placeholder.com/20/334155/334155) | Headings |
| `--color-neutral-800` | `#1e293b` | ![#1e293b](https://via.placeholder.com/20/1e293b/1e293b) | Dark backgrounds |
| `--color-neutral-900` | `#0f172a` | ![#0f172a](https://via.placeholder.com/20/0f172a/0f172a) | Darkest elements |
| `--color-neutral-950` | `#020617` | ![#020617](https://via.placeholder.com/20/020617/020617) | Near black |

#### Primary Brand Scale

> **EXPERIMENT CANDIDATES**: Test different primary colors

| Option | Name | Base Color | Personality |
|--------|------|------------|-------------|
| A | **Indigo** | `#4f46e5` | Professional, trustworthy |
| B | **Blue** | `#2563eb` | Classic SaaS, reliable |
| C | **Violet** | `#7c3aed` | Creative, modern |
| D | **Teal** | `#0d9488` | Fresh, approachable |

**Current Implementation** (Neutral-based):

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--color-primary` | `neutral-950` | `white` |
| `--color-primary-hover` | `neutral-800` | `neutral-200` |
| `--color-primary-foreground` | `white` | `neutral-900` |

#### Accent/Secondary Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-secondary` | `oklch(96.76% 0.0013 286.38)` | Secondary buttons |
| `--color-accent` | TBD | Highlights, badges |

#### Semantic Colors (Status/Feedback)

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--color-success` | `#22c55e` | `#22c55e` | Success states, positive |
| `--color-warning` | `#f59e0b` | `#f59e0b` | Warnings, cautions |
| `--color-error` | `#ef4444` | `#dc2626` | Errors, destructive |
| `--color-info` | `#3b82f6` | `#60a5fa` | Informational |

### 1.3 Semantic Color Tokens

These map primitives to UI purposes.

#### Surface Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-background` | `white` | `neutral-900` | Page background |
| `--color-foreground` | `neutral-950` | `white` | Primary text |
| `--color-card` | `white` | `neutral-900` | Card surfaces |
| `--color-card-foreground` | `neutral-950` | `white` | Card text |
| `--color-muted` | `neutral-100` | `neutral-800` | Muted backgrounds |
| `--color-muted-foreground` | `neutral-500` | `neutral-400` | Muted text |

#### Interactive Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-border` | `neutral-200` | `neutral-800` | Default borders |
| `--color-input` | `neutral-200` | `neutral-700` | Input borders |
| `--color-ring` | `neutral-400` | `neutral-300` | Focus rings |

### 1.4 Chart Colors

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--chart-1` | `orange-400` | `blue-600` |
| `--chart-2` | `teal-600` | `emerald-400` |
| `--chart-3` | `green-800` | `orange-400` |
| `--chart-4` | `yellow-200` | `purple-500` |
| `--chart-5` | `orange-200` | `pink-500` |

---

## 2. Typography

### 2.1 Font Stack

> **EXPERIMENT CANDIDATES**: Test different font combinations

| Option | Headings | Body | Personality |
|--------|----------|------|-------------|
| A | **Plus Jakarta Sans** | **DM Sans** | Modern, geometric |
| B | **Inter** | **Inter** | Clean, versatile |
| C | **Manrope** | **Source Sans Pro** | Rounded, friendly |
| D | **Outfit** | **Nunito Sans** | Contemporary, warm |

**Current Implementation**:
- Sans: `Inter` (all text)
- Heading: `Inter` (same as sans)

**Planned Implementation**:
- Headings: `Plus Jakarta Sans` (400, 500, 600, 700)
- Body: `DM Sans` (400, 500, 700)

### 2.2 Type Scale

We use two scales: **Marketing** (impactful) and **Application** (compact).

#### Marketing Scale (Large, for landing pages)

| Level | Token | Size | Line Height | Letter Spacing | Weight |
|-------|-------|------|-------------|----------------|--------|
| Display 1 | `--text-display-1` | 4.768rem (76px) | 1.1 | -0.02em | 700 |
| Display 2 | `--text-display-2` | 3.815rem (61px) | 1.15 | -0.02em | 700 |
| H1 | `--text-h1` | 3.052rem (49px) | 1.2 | -0.02em | 600 |
| H2 | `--text-h2` | 2.441rem (39px) | 1.25 | -0.01em | 600 |
| H3 | `--text-h3` | 1.953rem (31px) | 1.3 | -0.01em | 600 |
| H4 | `--text-h4` | 1.563rem (25px) | 1.4 | 0 | 600 |
| Body Large | `--text-body-lg` | 1.25rem (20px) | 1.6 | 0 | 400 |
| Body | `--text-body` | 1.125rem (18px) | 1.6 | 0 | 400 |
| Body Small | `--text-body-sm` | 1rem (16px) | 1.5 | 0 | 400 |
| Caption | `--text-caption` | 0.875rem (14px) | 1.4 | 0.01em | 400 |

#### Application Scale (Compact, for dashboard/app)

| Level | Token | Size | Line Height | Letter Spacing | Weight |
|-------|-------|------|-------------|----------------|--------|
| App H1 | `--text-app-h1` | 2.25rem (36px) | 1.2 | -0.02em | 600 |
| App H2 | `--text-app-h2` | 1.875rem (30px) | 1.25 | -0.01em | 600 |
| App H3 | `--text-app-h3` | 1.5rem (24px) | 1.3 | -0.01em | 600 |
| App H4 | `--text-app-h4` | 1.25rem (20px) | 1.4 | 0 | 600 |
| App Body | `--text-app-body` | 1rem (16px) | 1.5 | 0 | 400 |
| App Small | `--text-app-sm` | 0.875rem (14px) | 1.4 | 0 | 400 |
| App XS | `--text-app-xs` | 0.75rem (12px) | 1.4 | 0.01em | 400 |

### 2.3 Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-regular` | 400 | Body text, UI labels |
| `--font-weight-medium` | 500 | Emphasis, buttons |
| `--font-weight-semibold` | 600 | Headings, important labels |
| `--font-weight-bold` | 700 | Display text, strong emphasis |

### 2.4 Scale Activation

Marketing pages use `data-marketing` attribute:

```tsx
// Marketing layout
<div data-marketing className="flex min-h-screen flex-col">
  {children}
</div>

// CSS automatically applies larger scale
[data-marketing] h1 { @apply text-h1; }
```

---

## 3. Spacing

### 3.1 Base Unit

**Base unit**: `4px` (0.25rem)
All spacing values are multiples of the base unit.

### 3.2 Spacing Scale

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--spacing-0` | 0 | 0px | None |
| `--spacing-0.5` | 0.125rem | 2px | Micro adjustments |
| `--spacing-1` | 0.25rem | 4px | Tight gaps |
| `--spacing-1.5` | 0.375rem | 6px | Small gaps |
| `--spacing-2` | 0.5rem | 8px | Related elements |
| `--spacing-2.5` | 0.625rem | 10px | - |
| `--spacing-3` | 0.75rem | 12px | Component padding |
| `--spacing-4` | 1rem | 16px | Standard gap |
| `--spacing-5` | 1.25rem | 20px | - |
| `--spacing-6` | 1.5rem | 24px | Section padding |
| `--spacing-8` | 2rem | 32px | Large gaps |
| `--spacing-10` | 2.5rem | 40px | - |
| `--spacing-12` | 3rem | 48px | Section margins |
| `--spacing-16` | 4rem | 64px | Large sections |
| `--spacing-20` | 5rem | 80px | - |
| `--spacing-24` | 6rem | 96px | Hero spacing |
| `--spacing-32` | 8rem | 128px | Major sections |

### 3.3 Semantic Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-page-x` | `1rem` / `2rem` (lg) | Page horizontal padding |
| `--spacing-page-y` | `2rem` / `4rem` (lg) | Page vertical padding |
| `--spacing-section` | `3rem` / `6rem` (lg) | Between sections |
| `--spacing-card` | `1.5rem` | Card internal padding |
| `--spacing-stack` | `1rem` | Stacked elements |
| `--spacing-inline` | `0.5rem` | Inline elements |

### 3.4 Component Spacing Patterns

```typescript
// Standardized spacing patterns
const spacing = {
  sm: 'gap-4 my-4',      // 16px
  md: 'gap-6 my-6',      // 24px
  lg: 'gap-8 my-8',      // 32px
  xl: 'gap-12 my-12',    // 48px
  section: 'mt-12 md:mt-16 lg:mt-24'  // Responsive
};

const componentSpacing = {
  card: 'p-4 md:p-6',
  stack: 'space-y-4 md:space-y-6',
  grid: 'gap-4 md:gap-6 lg:gap-8'
};
```

### 3.5 Container Width

| Token | Value | Usage |
|-------|-------|-------|
| `--container-sm` | 640px | Narrow content |
| `--container-md` | 768px | Medium content |
| `--container-lg` | 1024px | Standard content |
| `--container-xl` | 1280px | Wide content |
| `--container-2xl` | 1400px | Maximum width |

**Container utility**:
```css
@utility container {
  margin-inline: auto;
  @apply xl:max-w-[80rem] px-4 lg:px-8;
}
```

---

## 4. Elevation & Shadows

### 4.1 Shadow Scale

> **EXPERIMENT CANDIDATES**: Test shadow intensity

| Option | Personality | Shadow Intensity |
|--------|-------------|------------------|
| A | **Subtle** | Very light, almost flat |
| B | **Balanced** | Moderate depth (current) |
| C | **Elevated** | Prominent shadows |

### 4.2 Shadow Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle lift |
| `--shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.1)` | Cards, buttons |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Dropdowns |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals, popovers |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Large overlays |
| `--shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Maximum depth |
| `--shadow-inner` | `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` | Inset elements |
| `--shadow-none` | `none` | Flat |

### 4.3 Elevation Levels

| Level | Token | Use Case | Shadow |
|-------|-------|----------|--------|
| 0 | `elevation-0` | Base surface | none |
| 1 | `elevation-1` | Cards, buttons | shadow-sm |
| 2 | `elevation-2` | Dropdowns, tooltips | shadow-md |
| 3 | `elevation-3` | Modals, dialogs | shadow-lg |
| 4 | `elevation-4` | Notifications | shadow-xl |

### 4.4 Dark Mode Shadows

In dark mode, shadows are reduced in intensity and may use color tints:

```css
.dark {
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
}
```

---

## 5. Border Radius

### 5.1 Radius Scale

> **EXPERIMENT CANDIDATES**: Test roundness levels

| Option | Personality | Base Radius |
|--------|-------------|-------------|
| A | **Sharp** | 0.25rem (4px) |
| B | **Balanced** | 0.5rem (8px) - Current |
| C | **Rounded** | 0.75rem (12px) |
| D | **Soft** | 1rem (16px) |

### 5.2 Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0 | No rounding |
| `--radius-sm` | 0.25rem (4px) | Small elements, badges |
| `--radius-md` | 0.375rem (6px) | Inputs, buttons |
| `--radius-lg` | 0.5rem (8px) | Cards, containers |
| `--radius-xl` | 0.75rem (12px) | Large cards |
| `--radius-2xl` | 1rem (16px) | Modal containers |
| `--radius-3xl` | 1.5rem (24px) | Hero elements |
| `--radius-full` | 9999px | Pills, avatars |

### 5.3 Current Implementation

```css
--radius: 0.5rem;
--radius-sm: calc(var(--radius) - 4px);  /* 0.25rem */
--radius-md: calc(var(--radius) - 2px);  /* 0.375rem */
--radius-lg: var(--radius);              /* 0.5rem */
```

---

## 6. Motion & Animation

### 6.1 Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 0ms | No animation |
| `--duration-fast` | 100ms | Micro-interactions |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-moderate` | 300ms | Entrances, exits |
| `--duration-slow` | 500ms | Complex animations |
| `--duration-slower` | 700ms | Page transitions |

### 6.2 Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Symmetrical |
| `--ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful |

### 6.3 Animation Presets

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `fade-in` | 200ms | ease-out | Element appearance |
| `fade-out` | 150ms | ease-in | Element disappearance |
| `slide-up` | 300ms | ease-out | Bottom sheets |
| `slide-down` | 200ms | ease-in | Dropdowns |
| `scale-in` | 200ms | ease-out | Modals |
| `accordion-down` | 200ms | ease-out | Expand |
| `accordion-up` | 200ms | ease-out | Collapse |

### 6.4 Current Implementation

```css
--animate-fade-up: fade-up 0.5s;
--animate-fade-down: fade-down 0.5s;
--animate-accordion-down: accordion-down 0.2s ease-out;
--animate-accordion-up: accordion-up 0.2s ease-out;
```

### 6.5 Reduced Motion

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Iconography

### 7.1 Icon System

**Library**: Lucide React (primary)
**Style**: Outlined, consistent 24px grid

### 7.2 Icon Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `--icon-xs` | 12px | Inline indicators |
| `--icon-sm` | 16px | Compact UI |
| `--icon-md` | 20px | Standard buttons |
| `--icon-lg` | 24px | Default size |
| `--icon-xl` | 32px | Feature icons |
| `--icon-2xl` | 48px | Hero/marketing |

### 7.3 Icon Guidelines

- **Stroke width**: 2px (default), 1.5px (smaller sizes)
- **Color**: Inherit from text (`currentColor`)
- **Accessibility**: Always include `aria-label` or adjacent text
- **Alignment**: Center vertically with text

```tsx
<Button>
  <PlusIcon className="size-4" aria-hidden="true" />
  <span>Add Item</span>
</Button>
```

---

## 8. Breakpoints

### 8.1 Breakpoint Scale

| Token | Value | Target |
|-------|-------|--------|
| `--breakpoint-sm` | 640px | Mobile landscape |
| `--breakpoint-md` | 768px | Tablet portrait |
| `--breakpoint-lg` | 1024px | Tablet landscape / small desktop |
| `--breakpoint-xl` | 1280px | Desktop |
| `--breakpoint-2xl` | 1536px | Large desktop |

### 8.2 Usage with Tailwind

```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>

// Responsive typography
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  {title}
</h1>
```

### 8.3 Container Queries (Future)

For component-level responsive design:

```css
@container (min-width: 400px) {
  .card-content {
    flex-direction: row;
  }
}
```

---

## 9. Z-Index Scale

### 9.1 Layer Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `--z-deep` | -1 | Background elements |
| `--z-base` | 0 | Default |
| `--z-raised` | 10 | Raised cards |
| `--z-dropdown` | 100 | Dropdown menus |
| `--z-sticky` | 200 | Sticky headers |
| `--z-fixed` | 300 | Fixed elements |
| `--z-backdrop` | 400 | Modal backdrops |
| `--z-modal` | 500 | Modal dialogs |
| `--z-popover` | 600 | Popovers, tooltips |
| `--z-toast` | 700 | Toast notifications |
| `--z-maximum` | 9999 | Emergency overlays |

### 9.2 Guidelines

- **Never use arbitrary z-index values** - always use tokens
- **Stack within layers** - modals stack at 500, 501, 502...
- **Avoid z-index wars** - restructure DOM if conflicts arise

---

## 10. Interaction States

### 10.1 State Definitions

| State | Visual Treatment | CSS |
|-------|-----------------|-----|
| **Default** | Base appearance | - |
| **Hover** | Subtle lift/color shift | `:hover` |
| **Focus** | Visible focus ring | `:focus-visible` |
| **Active** | Pressed appearance | `:active` |
| **Disabled** | Reduced opacity | `:disabled`, `[aria-disabled]` |
| **Loading** | Spinner/skeleton | `[data-loading]` |
| **Selected** | Highlighted | `[aria-selected]`, `[data-state="active"]` |
| **Error** | Error styling | `[aria-invalid]`, `[data-error]` |

### 10.2 Button States Example

```css
.button {
  /* Default */
  background: var(--color-primary);

  /* Hover */
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  /* Focus */
  &:focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 2px;
  }

  /* Active */
  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  /* Disabled */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

### 10.3 Focus Ring Standards

| Context | Ring Width | Ring Color | Ring Offset |
|---------|------------|------------|-------------|
| Buttons | 2px | `--color-ring` | 2px |
| Inputs | 2px | `--color-ring` | 0 |
| Cards | 2px | `--color-ring` | 2px |
| Links | 2px | `--color-ring` | 2px |

---

## 11. Accessibility

### 11.1 Color Contrast

| Level | Ratio | Usage |
|-------|-------|-------|
| **AA Large** | 3:1 | Large text (18px+), graphics |
| **AA Normal** | 4.5:1 | Body text (minimum) |
| **AAA Normal** | 7:1 | Enhanced (target) |

### 11.2 Current Implementation

```css
/* Placeholder contrast - WCAG AA compliant */
input::placeholder,
textarea::placeholder {
  color: hsl(0 0% 32%); /* 7.8:1 on white */
  opacity: 1;
}

.dark input::placeholder,
.dark textarea::placeholder {
  color: hsl(0 0% 64%);
  opacity: 1;
}
```

### 11.3 Focus Visibility

Always use `:focus-visible` over `:focus` for keyboard-only focus:

```css
/* Focus ring only visible for keyboard navigation */
button:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}
```

### 11.4 Motion Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 11.5 Touch Targets

Minimum touch target size: **44x44px** (WCAG 2.5.5)

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

---

## Implementation Guide

### CSS Variables Setup

All tokens are defined in `apps/web/styles/shadcn-ui.css`:

```css
@theme inline {
  /* Color primitives */
  --color-neutral-50: #f8fafc;
  /* ... */

  /* Semantic colors */
  --color-background: var(--color-white);
  --color-foreground: var(--color-neutral-950);
  /* ... */

  /* Spacing */
  --spacing-section: 3rem;
  /* ... */
}
```

### Tailwind Integration

Reference CSS variables in Tailwind classes:

```tsx
// Using semantic tokens
<div className="bg-background text-foreground border-border">
  <p className="text-muted-foreground">Secondary text</p>
</div>

// Using spacing tokens
<section className="py-section px-page-x">
  {content}
</section>
```

### Component Implementation

Use `cn()` utility for class merging:

```tsx
import { cn } from '@kit/ui/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-lg border shadow-sm p-6',
        className
      )}
      {...props}
    />
  );
}
```

---

## Phase 2: Experimentation Plan

### Experiment Categories

1. **Color Palette**
   - Primary brand color variations
   - Accent color intensity
   - Dark mode adjustments

2. **Typography**
   - Font pairing options
   - Scale ratios (marketing vs app)
   - Weight distribution

3. **Shape Language**
   - Border radius levels
   - Shadow intensity
   - Overall "softness"

4. **Spacing Density**
   - Compact mode for power users
   - Comfortable mode (default)
   - Relaxed mode for accessibility

### Implementation Approach

Each experiment will create isolated variations that can be:
- Previewed side-by-side
- A/B tested with users
- Easily combined into a final selection

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-28 | Initial comprehensive design system |

---

*This design system document serves as the single source of truth for all visual design decisions in SlideHeroes.*
