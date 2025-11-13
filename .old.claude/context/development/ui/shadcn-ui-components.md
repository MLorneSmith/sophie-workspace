---
id: "shadcn-ui-components"
title: "Shadcn UI Components Guide"
version: "1.0.0"
category: "implementation"
description: "Comprehensive guide for using and adding shadcn UI components in the SlideHeroes project packages/ui/src/shadcn directory"
tags: ["shadcn", "ui", "components", "radix-ui", "tailwind", "design-system", "react"]
dependencies: ["typography-system", "code-standards"]
cross_references:
  - id: "typography-system"
    type: "related"
    description: "Typography scales and font pairings"
  - id: "code-standards"
    type: "prerequisite"
    description: "TypeScript and React coding standards"
created: "2025-09-22"
last_updated: "2025-09-22"
author: "create-context"
---

# Shadcn UI Components Guide

Comprehensive guide for using shadcn/ui components in SlideHeroes, including the complete component inventory, integration patterns, and adding new components.

## Overview

Shadcn/ui is not a traditional component library but a "copy-paste" approach where component source code is added directly to `packages/ui/src/shadcn/`. This provides complete control over components with built-in accessibility via Radix UI primitives.

## Project Setup

### Component Location

```
packages/ui/src/shadcn/    # All shadcn components
packages/ui/src/lib/utils/ # Utility functions (cn)
packages/ui/src/makerkit/  # Custom MakerKit components
```

### Import Pattern

```typescript
// Always import from @kit/ui
import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';
import { cn } from '@kit/ui/cn';
```

## Available Components (40 Components)

### Forms & Inputs

- **button** - Primary interactive element with variants (default, destructive, outline, ghost, link)
- **input** - Text input field with full form integration
- **input-otp** - One-time password input with automatic focus management
- **textarea** - Multi-line text input
- **select** - Dropdown selection with search capability
- **checkbox** - Boolean toggle with indeterminate state
- **radio-group** - Mutually exclusive options selection
- **switch** - Toggle switch for binary choices
- **slider** - Range input with single or multiple handles
- **form** - React Hook Form integration components
- **label** - Accessible form labels

### Layout & Navigation

- **card** - Content container with header/content/footer sections
- **tabs** - Tabbed interface navigation
- **accordion** - Collapsible content sections
- **collapsible** - Single collapsible container
- **sidebar** - Application sidebar with collapsible sections
- **navigation-menu** - Complex navigation with mega-menu support
- **breadcrumb** - Hierarchical navigation path
- **separator** - Visual divider element
- **resizable** - Resizable panel layouts

### Data Display

- **table** - Data table with sorting/filtering
- **data-table** - Advanced data table with built-in features
- **badge** - Status/category indicators
- **avatar** - User profile images with fallbacks
- **progress** - Progress indicators
- **chart** - Recharts integration for data visualization
- **skeleton** - Loading state placeholders

### Overlays & Modals

- **dialog** - Modal dialog windows
- **alert-dialog** - Confirmation dialogs
- **sheet** - Slide-out panels
- **popover** - Contextual floating panels
- **dropdown-menu** - Context menus with nested items
- **tooltip** - Hover information displays
- **command** - Command palette (cmd+k interface)

### Feedback

- **alert** - Information/warning/error messages
- **sonner** - Toast notifications (configured)
- **calendar** - Date picker component
- **scroll-area** - Custom scrollbar containers

### Typography

- **heading** - Semantic heading components

## Adding New Components

### Installation Process

```bash
# From project root
cd packages/ui

# Add new shadcn component
npx shadcn@latest add [component-name]

# Examples:
npx shadcn@latest add toggle
npx shadcn@latest add pagination
npx shadcn@latest add drawer
```

### Post-Installation Steps

1. **Update exports** in `packages/ui/src/index.ts`:

```typescript
export * from './shadcn/toggle';
```

2. **Verify dependencies** in `package.json`
3. **Test imports** from consuming packages:

```typescript
import { Toggle } from '@kit/ui/toggle';
```

## Component Patterns

### Using the cn Utility

```typescript
import { cn } from '@kit/ui/cn';

function MyComponent({ className, variant }) {
  return (
    <div className={cn(
      "bg-background text-foreground", // Base classes
      variant === "ghost" && "bg-transparent", // Conditional
      className // User overrides
    )}>
      Content
    </div>
  );
}
```

### Form Integration

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';

const FormSchema = z.object({
  email: z.string().email(),
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(FormSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Dark Mode Support

Components automatically support dark mode through CSS variables:

```typescript
// Semantic color usage (preferred)
<Card className="bg-background text-foreground border-border">
  <p className="text-muted-foreground">Secondary text</p>
</Card>

// Avoid hardcoded colors
// ❌ bg-white text-black
// ✅ bg-background text-foreground
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure component is exported from `packages/ui/src/index.ts`
2. **TypeScript Errors**: Run `pnpm typecheck` to verify types
3. **CSS Variables Missing**: Check that globals.css includes shadcn theme variables
4. **React Version Conflicts**: Ensure React 19 compatibility across packages
5. **Tailwind Classes Not Working**: Verify tailwind.config includes component paths

### Component Dependencies

Key packages required:

- `@radix-ui/*` - Primitive components
- `class-variance-authority` - Variant management
- `tailwind-merge` - Class merging
- `clsx` - Conditional classes
- `tailwindcss-animate` - Animation utilities

## Best Practices

1. **Always use semantic color classes** for dark mode support
2. **Import from @kit/ui** namespace, never direct paths
3. **Use cn() utility** for className merging
4. **Follow existing patterns** in packages/ui/src/shadcn
5. **Test accessibility** with keyboard navigation
6. **Maintain TypeScript strict mode** compliance

## Component Customization

### Modifying Existing Components

1. Locate component in `packages/ui/src/shadcn/`
2. Modify styling or behavior directly
3. Ensure changes maintain accessibility
4. Update any TypeScript types if needed
5. Test across light/dark themes

### Creating Variants

Use CVA (Class Variance Authority) for type-safe variants:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
      size: {
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## Integration with MakerKit

MakerKit provides additional components that work with shadcn:

- `If` - Conditional rendering
- `Trans` - Internationalization
- `ProfileAvatar` - User avatars
- Custom layouts and pages

Always check `packages/ui/CLAUDE.md` for UI-specific instructions and patterns used in the SlideHeroes project.
