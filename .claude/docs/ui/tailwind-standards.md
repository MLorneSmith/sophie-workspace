# Tailwind CSS Standards

## Class Organization

Order Tailwind classes in the following groups:

1. Layout (display, position, z-index)
2. Box model (width, height, padding, margin)
3. Typography (font, text)
4. Visual (colors, backgrounds, borders)
5. Interactivity (hover, focus)
6. Responsive variants

Example:
```tsx
<div className="
  flex items-center justify-between  /* Layout */
  w-full h-12 p-4 my-2             /* Box model */
  text-sm font-medium              /* Typography */
  bg-white border rounded-md       /* Visual */
  hover:bg-gray-50                 /* Interactivity */
  md:h-16 lg:h-20                  /* Responsive */
">
```

## Responsive Design

- Use mobile-first approach
- Standard breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px

## Color System

Use our design system colors:

- Primary: `primary` (brand color)
- Secondary: `secondary` (supporting color)
- Accent: `accent` (highlight color)
- Background: `background` (page background)
- Foreground: `foreground` (text on background)
- Muted: `muted` (subtle background)
- Card: `card` (card background)
- Border: `border` (borders and dividers)

Example:
```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Button
</button>
```

## Spacing System

Use consistent spacing with Tailwind's default scale:

- `px`: 1px
- `0.5`: 0.125rem (2px)
- `1`: 0.25rem (4px)
- `2`: 0.5rem (8px)
- `3`: 0.75rem (12px)
- `4`: 1rem (16px)
- `5`: 1.25rem (20px)
- `6`: 1.5rem (24px)
- `8`: 2rem (32px)
- `10`: 2.5rem (40px)
- `12`: 3rem (48px)
- `16`: 4rem (64px)

## Component Variants

Use consistent patterns for component variants:

```tsx
<Button variant="default" size="md" />
<Button variant="destructive" size="sm" />
<Button variant="outline" size="lg" />
```

## Custom Utilities

Use our custom utilities for common patterns:

```tsx
<div className="container"> {/* Max-width container with padding */}
<div className="prose"> {/* Typography styles for content */}
<div className="scrollbar"> {/* Custom scrollbar styles */}
```