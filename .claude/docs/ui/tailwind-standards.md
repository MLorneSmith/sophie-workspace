# Tailwind CSS Standards

## Tailwind CSS v4 Configuration

This project uses Tailwind CSS v4 with the new CSS-based configuration approach.

### Configuration Setup

The Tailwind configuration is defined in `apps/web/styles/globals.css` and processed via PostCSS:

```css
/* Import Tailwind CSS v4 */
@import 'tailwindcss';

/* Local style imports */
@import './theme.css';
@import './theme.utilities.css';
@import './shadcn-ui.css';
@import './markdoc.css';
@import './makerkit.css';

/* Plugins */
@plugin "tailwindcss-animate";

/* Content sources - paths to scan for classes */
@source "../../../packages/*/src/**/*.{ts,tsx}";
@source "../../../packages/features/*/src/**/*.{ts,tsx}";
@source "../../../packages/billing/*/src/**/*.{ts,tsx}";
@source "../../../packages/plugins/*/src/**/*.{ts,tsx}";
@source "../../../packages/cms/*/src/**/*.{ts,tsx}";
@source "../{app,components,config,lib}/**/*.{ts,tsx}";

/* Custom dark mode variant */
@variant dark (&:where(.dark, .dark *));
```

### PostCSS Configuration

The project uses PostCSS to process Tailwind CSS v4. The configuration is in `postcss.config.mjs`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Theme Configuration

Custom theme values are defined in `apps/web/styles/theme.css` using CSS custom properties. These values are automatically available to Tailwind utilities:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  /* ... other theme values */
}
```

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

### Design System Colors

Our application uses CSS variables for theming, which automatically adapt to light/dark modes. Always use these semantic color names instead of specific Tailwind colors:

- **Primary**: `primary` / `primary-foreground` - Brand color and text on primary
- **Secondary**: `secondary` / `secondary-foreground` - Supporting color
- **Accent**: `accent` / `accent-foreground` - Highlight color
- **Background**: `background` - Page background
- **Foreground**: `foreground` - Default text color
- **Muted**: `muted` / `muted-foreground` - Subtle backgrounds and text
- **Card**: `card` / `card-foreground` - Card backgrounds
- **Popover**: `popover` / `popover-foreground` - Popover backgrounds
- **Border**: `border` - Borders and dividers
- **Input**: `input` - Form input borders
- **Ring**: `ring` - Focus ring color
- **Destructive**: `destructive` / `destructive-foreground` - Error/danger states

Example:

```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Button
</button>

<div className="bg-card text-card-foreground border rounded-lg p-4">
  Card content
</div>

<p className="text-muted-foreground">
  Secondary text
</p>
```

### Dark Mode Support

All color variables automatically adjust for dark mode. The dark variant is configured as:

```css
@variant dark (&:where(.dark, .dark *));
```

This means you can use `dark:` prefix for dark mode specific styles when needed:

```tsx
<div className="bg-white dark:bg-gray-900">Custom dark mode background</div>
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

### Container Utility

The `container` utility provides consistent max-width and padding:

```tsx
<div className="container mx-auto px-4">
  {/* Centered content with responsive padding */}
</div>
```

### Typography Classes

For rich text content, use the `prose` classes:

```tsx
<article className="prose prose-gray dark:prose-invert">
  <h1>Article Title</h1>
  <p>Content with proper typography...</p>
</article>
```

### Animation Classes

The `tailwindcss-animate` plugin is configured via the `@plugin` directive in `globals.css`. It provides additional animation utilities:

```tsx
<div className="animate-in fade-in duration-500">
  {/* Fade in animation */}
</div>

<div className="animate-pulse">
  {/* Loading skeleton */}
</div>

<div className="animate-spin">
  {/* Loading spinner */}
</div>

<div className="animate-bounce">
  {/* Bouncing element */}
</div>
```

Available animation utilities:

- `animate-in` / `animate-out` - Entry and exit animations
- `fade-in` / `fade-out` - Opacity animations
- `zoom-in` / `zoom-out` - Scale animations
- `slide-in-from-*` / `slide-out-to-*` - Slide animations
- `duration-*` - Animation duration control

## Project-Specific Patterns

### Focus States

Always include focus styles for accessibility:

```tsx
<button className="focus:ring-primary focus:outline-none focus:ring-2 focus:ring-offset-2">
  Accessible Button
</button>
```

### Form Inputs

Standard pattern for form inputs:

```tsx
<input className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
```

### Card Components

Standard card pattern:

```tsx
<div className="bg-card text-card-foreground rounded-lg border shadow-sm">
  <div className="p-6">{/* Card content */}</div>
</div>
```

## Container Queries

Tailwind CSS v4 supports container queries for component-responsive design:

```tsx
<div className="@container">
  <div className="@sm:flex @md:grid @lg:grid-cols-2">
    {/* Responsive based on container size, not viewport */}
  </div>
</div>
```

Container query breakpoints:

- `@sm`: 384px
- `@md`: 448px
- `@lg`: 512px
- `@xl`: 576px
- `@2xl`: 672px
- `@3xl`: 768px
- `@4xl`: 896px
- `@5xl`: 1024px
- `@6xl`: 1152px
- `@7xl`: 1280px

## Performance Considerations

### Production Optimization

Tailwind CSS v4 automatically removes unused styles in production builds. The `@source` directives in `globals.css` tell Tailwind which files to scan for class usage.

### Best Practices for Performance

1. **Avoid dynamic class names**:

   ```tsx
   // ❌ Bad - Tailwind can't detect these
   <div className={`text-${color}-500`} />

   // ✅ Good - Use complete class names
   <div className={color === 'red' ? 'text-red-500' : 'text-blue-500'} />
   ```

2. **Use CSS variables for dynamic values**:

   ```tsx
   // For truly dynamic values, use CSS variables
   <div
     className="bg-[var(--dynamic-color)]"
     style={{ '--dynamic-color': dynamicColor }}
   />
   ```

3. **Minimize custom utilities**: Use Tailwind's built-in utilities when possible

4. **Leverage caching**: The PostCSS output is cached in development for faster rebuilds

5. **Monitor bundle size**: Regularly check that unused styles are being purged correctly

### Development Performance

- Use `pnpm dev` for fast refresh and HMR
- Tailwind CSS v4 includes performance improvements for faster builds
- The JIT (Just-In-Time) engine generates styles on-demand
