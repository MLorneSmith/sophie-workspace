# Typography System Documentation

## Font Pairing

### Plus Jakarta Sans (Headings)

- **Purpose**: All headings and titles
- **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Characteristics**: Modern, geometric, distinctive
- **CSS Variable**: `var(--font-plus-jakarta)`

### DM Sans (Body)

- **Purpose**: All body text and UI elements
- **Weights**: 400 (Regular), 500 (Medium), 700 (Bold)
- **Characteristics**: Contemporary, friendly, highly readable
- **CSS Variable**: `var(--font-dm-sans)`

## Type Scale

Our type scale uses Tailwind classes for a consistent, responsive hierarchy:

| Level      | Tailwind Class    | Usage                                    | Example                                           |
| ---------- | ----------------- | ---------------------------------------- | ------------------------------------------------- |
| Display    | text-display-1    | Hero titles                             | "Write more impactful presentations"               |
| H2         | text-h2          | Section headers                         | "Everything you need to create winning presentations" |
| Body Large | text-body-lg     | Subtitles, lead text                    | Section subtitles, hero subtitle                   |
| Body       | text-base        | Regular text                            | General content, descriptions                      |

## Responsive Behavior

```typescript
// In tailwind.config.ts
fontSize: {
  'display-1': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
  'display-2': ['3.75rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
  'h2': ['2.25rem', { lineHeight: '1.3' }],
  'body-lg': ['1.125rem', { lineHeight: '1.6' }],
}
```

## Spacing System

```typescript
// Standardized spacing system
const spacing = {
  sm: 'gap-4 my-4',
  md: 'gap-6 my-6',
  lg: 'gap-8 my-8',
  xl: 'gap-12 my-12',
  section: 'mt-12 md:mt-16 lg:mt-24'
};

const componentSpacing = {
  card: 'mb-6 md:mb-8',
  grid: 'gap-4 md:gap-6 lg:gap-8',
  stack: 'space-y-4 md:space-y-6 lg:space-y-8'
};

const containerWidth = "container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl";
```

## Component-Specific Implementation

### Hero Title

```tsx
<span className="text-display-1 md:text-display-2 lg:text-display-1 leading-tight tracking-tight">
  {homepageContentConfig.hero.title}
</span>
```

### Section Headers

```tsx
<h2 className="text-h2 mb-4 text-center leading-snug">
  {sectionTitle}
</h2>
```

### Section Subtitles

```tsx
<p className="text-body-lg text-gray-600 dark:text-gray-300 text-center leading-relaxed max-w-4xl mx-auto mb-12">
  {sectionSubtitle}
</p>
```

## Standard Section Pattern

Each main section follows this pattern:

```tsx
<section className={`${containerWidth} ${spacing.section}`}>
  {/* Title */}
  <h2 className="text-h2 mb-4 text-center leading-snug">
    {homepageContentConfig.section.title}
  </h2>
  
  {/* Subtitle */}
  <p className="text-body-lg text-gray-600 dark:text-gray-300 text-center leading-relaxed max-w-4xl mx-auto mb-12">
    {homepageContentConfig.section.subtitle}
  </p>
  
  {/* Section content */}
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${componentSpacing.grid}`}>
    {/* Content items */}
  </div>
</section>
```

## Special Cases

### SecondaryHero Component

When using SecondaryHero (e.g., in pricing section), use span instead of h2 to avoid nesting issues:

```tsx
<SecondaryHero
  heading={
    <span className="text-h2 mb-12 text-center leading-snug">
      {title}
    </span>
  }
  subheading={
    <p className="text-body-lg text-gray-600 dark:text-gray-300 leading-relaxed">
      {subtitle}
    </p>
  }
/>
```

### StickyScrollReveal Section

The sticky section requires additional spacing to prevent headline overlap:

```tsx
<section className={`w-full ${spacing.section}`}>
  <div className={`${containerWidth} mb-[20vh]`}>
    <h2 className="text-h2 mb-4 text-center leading-snug">
      {title}
    </h2>
    <p className="text-body-lg text-gray-600 dark:text-gray-300 text-center leading-relaxed max-w-4xl mx-auto">
      {subtitle}
    </p>
  </div>
  <StickyScrollReveal content={stickyContent} />
</section>
```

## Design Principles

1. **Consistent Hierarchy**
   - Hero uses larger display text (text-display-1/2)
   - All section headers use text-h2
   - All subtitles use text-body-lg
   - Consistent spacing (mb-4 between title and subtitle, mb-12 after subtitle)

2. **Responsive Considerations**
   - Hero text scales: text-display-1 → text-display-2 → text-display-1
   - Section width adapts with containerWidth
   - Subtitle max-width (max-w-4xl) prevents excessive line length
   - Responsive spacing through spacing system

3. **Accessibility**
   - Clear typographic hierarchy with distinct size differences
   - Proper heading structure (h2 for sections)
   - Color contrast with text-gray-600 dark:text-gray-300
   - Consistent leading (line-height) for readability

## Content Management

Typography content is managed through homepage-content.config.ts:

```typescript
export const homepageContentConfig = {
  section: {
    title: string;    // Main headline
    subtitle: string; // Supporting text, designed to fit on one line with max-w-4xl
  }
}
```

## Font Loading Implementation

```tsx
// layout.tsx
import { DM_Sans } from 'next/font/google';

const plusJakarta = DM_Sans({
  // Using DM Sans as a substitute for Plus Jakarta Sans
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '700'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${plusJakarta.variable} ${dmSans.variable}`}>
      {children}
    </div>
  );
}
```

## Reference Implementation

Complete implementation examples can be found at:

- `apps/web/app/(marketing)/page.tsx`
- `apps/web/app/test/page.tsx`

---

## Dual Typography System (Marketing vs Internal Pages)

We've implemented a dual typography system that maintains the large, impactful scale for marketing pages while providing a more compact scale for internal app pages.

### Typography Scales

#### Marketing Pages (Original Large Scale)

```typescript
fontSize: {
  'display': ['4.768rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
  'h2': ['3.052rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
  'h3': ['2.441rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
  'body-lg': ['1.563rem', { lineHeight: '1.5' }],
  'body': ['1.25rem', { lineHeight: '1.5' }],
}
```

#### Internal Pages (Compact Scale)

```typescript
fontSize: {
  'app-display': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
  'app-h2': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
  'app-h3': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
  'app-body-lg': ['1.25rem', { lineHeight: '1.5' }],
  'app-body': ['1.125rem', { lineHeight: '1.5' }],
}
```

### Implementation Details

1. **Layout-Based Typography**
   - Marketing pages use the data-marketing attribute to enable large typography
   - Internal pages use the compact scale by default

   ```tsx
   // Marketing layout
   <div data-marketing className="flex min-h-screen flex-col">
     {children}
   </div>
   ```

2. **CSS Implementation**

   ```css
   /* Default (Internal App) Typography */
   h1, .h1 { @apply text-app-h1 font-heading font-bold tracking-tight; }
   
   /* Marketing Typography */
   [data-marketing] h1,
   [data-marketing] .h1 { @apply text-h1 font-heading font-bold tracking-tight; }
   ```

3. **Component System**
   - Typography component for consistent usage:

   ```tsx
   export function Typography({ 
     variant,
     children,
     className,
     as
   }: TypographyProps) {
     const Component = (as || defaultElements[variant]) as ElementType;
     return (
       <Component className={`${styles[variant]} ${className}`}>
         {children}
       </Component>
     );
   }
   ```

4. **Convenience Components**

   ```tsx
   export function AppHeading1(props: Omit<TypographyProps, 'variant'>) {
     return <Typography variant="h1" {...props} />;
   }
   ```

### Usage Guidelines

1. **Marketing Pages**
   - Continue using existing classes (text-display-1, text-h2)
   - Ensure parent container has data-marketing attribute
   - Use for high-impact, promotional content

2. **Internal App Pages**
   - Use Typography components (AppHeading1, AppHeading2)
   - Benefits from more compact, efficient typography
   - Better suited for dense information displays

3. **Responsive Behavior**
   - Both scales maintain responsive adjustments
   - Marketing pages focus on impact
   - Internal pages prioritize readability and information density

This dual system allows us to maintain the marketing site's high-impact design while providing a more practical typography scale for internal app pages where information density and readability are priorities.
