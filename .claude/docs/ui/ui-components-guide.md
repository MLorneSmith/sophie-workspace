# UI Components Guide

This document provides comprehensive guidance for working with UI components in the SlideHeroes project, which uses both shadcn UI and Aceternity UI component libraries.

## Overview

The project uses a combination of two component libraries:

- **shadcn UI**: A collection of reusable components built using Radix UI and Tailwind CSS
- **Aceternity UI**: Modern, animated components for creating visually appealing interfaces

All UI components are centralized in the `@kit/ui` package located at `packages/ui`.

## Component Structure

### Location

- **shadcn components**: `packages/ui/src/shadcn/`
- **Aceternity components**: `packages/ui/src/aceternity/`
- **Custom MakerKit components**: `packages/ui/src/makerkit/`

### Import Pattern

Components are imported from the `@kit/ui` package using the export aliases defined in `packages/ui/package.json`:

```typescript
// shadcn components
// Aceternity components
import { BackgroundBoxes } from '@kit/ui/background-boxes';
import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';
import { CardSpotlight } from '@kit/ui/card-spotlight';
import { Dialog } from '@kit/ui/dialog';
```

## Installed shadcn Components

The following shadcn components are currently installed and available:

### Forms & Inputs

- **Button**: Interactive element for user actions
- **Input**: Standard text input field
- **Textarea**: Multi-line text input
- **Checkbox**: Binary selection control
- **Radio Group**: Single selection from multiple options
- **Select**: Dropdown list for single selection
- **Switch**: Toggle control for on/off states
- **Form**: React Hook Form integration
- **Label**: Accessible labels for form controls
- **Input OTP**: One-time password input

### Layout & Navigation

- **Card**: Content container with header/body/footer
- **Tabs**: Tabbed content organization
- **Accordion**: Expandable/collapsible panels
- **Sheet**: Slide-out panel (drawer)
- **Dialog**: Modal overlay
- **Alert Dialog**: Critical action confirmation
- **Popover**: Contextual overlay
- **Dropdown Menu**: Menu triggered by button/link
- **Navigation Menu**: Complex hierarchical navigation
- **Command**: Command palette/search interface
- **Breadcrumb**: Navigation path display
- **Sidebar**: Vertical navigation area
- **Separator**: Visual content divider

### Data Display

- **Table**: Structured data display
- **Data Table**: Advanced table with sorting/filtering
- **Badge**: Status indicators and tags
- **Alert**: Important messages display
- **Skeleton**: Loading state placeholders
- **Progress**: Task completion indicator
- **Chart**: Data visualization (via Recharts)
- **Scroll Area**: Custom scrollbar regions

### Feedback & Overlays

- **Tooltip**: Hover information
- **Sonner**: Toast notifications
- **Avatar**: User profile pictures

### Advanced

- **Calendar**: Date picker component
- **Resizable**: Adjustable content panels
- **Collapsible**: Show/hide content sections
- **Heading**: Typography component

## Installed Aceternity Components

The following Aceternity components are currently installed:

- **Background Boxes**: Animated background grid effect
- **Blog Post Card**: Card design for blog posts
- **Card Spotlight**: Card with spotlight hover effect
- **Card Hover Effect**: Interactive hover animations for cards
- **Container Scroll Animation**: Reveal animations on scroll
- **Logo Marquee**: Continuous scrolling logo display
- **Placeholders and Vanish Input**: Animated input with disappearing placeholders
- **Sticky Scroll Reveal**: Content revealed while scrolling
- **Testimonial Masonry Grid**: Masonry layout for testimonials

## Adding New Components

### Adding shadcn Components

1. **Manual Installation**: Follow the component's manual installation steps from [ui.shadcn.com](https://ui.shadcn.com/docs/components)

2. **Component Placement**: Add the component file to `packages/ui/src/shadcn/`

3. **Import Management**: Replace any absolute imports with relative imports

4. **Export Configuration**: Add a new export in `packages/ui/package.json`:

   ```json
   {
     "exports": {
       "./new-component": "./src/shadcn/new-component.tsx"
     }
   }
   ```

5. **Usage**: Import the component in your application:

   ```typescript
   import { NewComponent } from '@kit/ui/new-component';
   ```

### Adding Aceternity Components

Follow the same process as shadcn, but:

- Place components in `packages/ui/src/aceternity/`
- Ensure all animations and dependencies are properly configured
- Test thoroughly as Aceternity components often have complex animations

## Available Components Not Yet Installed

### shadcn Components

- Aspect Ratio
- Carousel
- Combobox
- Context Menu
- Date Picker
- Drawer
- Hover Card
- Menubar
- Pagination
- Slider
- Toast
- Toggle
- Toggle Group

### Aceternity Components

- 3D Card
- 3D Animated Pin
- 3D Marquee
- Animated Modal
- Animated Tabs
- Animated Tooltip
- Background Beams
- Background Grid & Glow Card
- Bento Grid
- Card Stack
- Evervault Card
- Expandable Cards
- Feature Sections
- File Upload
- Floating Dock
- Focus Cards
- Glare Card
- Google Gemini Effect
- Hero Parallax
- Hero Sections
- Infinite Moving Cards
- Lens
- Parallax Grid Scroll
- Pointer Highlight
- Resizable Navbar
- Scroll Beam
- Sticky Banner
- Tracing Beam
- World Map

## Best Practices

1. **Consistency**: Use shadcn for core UI functionality and Aceternity for enhanced visual effects
2. **Performance**: Be mindful of animation performance, especially with multiple Aceternity components
3. **Accessibility**: Ensure all components maintain proper accessibility standards
4. **Theming**: Components automatically respect the application's theme (light/dark mode)
5. **Tree-shaking**: The export pattern ensures optimal bundle size through tree-shaking

## Component Usage Examples

### Basic Button

```typescript
import { Button } from '@kit/ui/button';

<Button variant="primary" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

### Dialog with Form

```typescript
import { Dialog, DialogContent, DialogHeader } from '@kit/ui/dialog';
import { Form } from '@kit/ui/form';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>Dialog Title</DialogHeader>
    <Form onSubmit={handleSubmit}>
      {/* Form content */}
    </Form>
  </DialogContent>
</Dialog>
```

### Aceternity Card with Spotlight

```typescript
import { CardSpotlight } from '@kit/ui/card-spotlight';

<CardSpotlight className="h-96 w-96">
  <p className="text-xl font-bold">Hover for spotlight effect</p>
</CardSpotlight>
```

## Resources

- [shadcn UI Documentation](https://ui.shadcn.com/)
- [Aceternity UI Components](https://ui.aceternity.com/components)
- [MakerKit Documentation](https://makerkit.dev/docs/next-supabase-turbo/customization/adding-shadcn-ui-components)
- [Radix UI Primitives](https://www.radix-ui.com/) (underlying shadcn)
