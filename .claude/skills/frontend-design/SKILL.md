---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Component Foundation: shadcn/ui

**ALWAYS build on shadcn/ui components** from the `@kit/ui` package. These are production-ready, accessible, and highly customizable primitives that serve as the foundation for distinctive design work.

### Core Import Pattern

```tsx
// Standard components
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@kit/ui/dialog';
import { Input } from '@kit/ui/input';

// Utility
import { cn } from '@kit/ui/cn';
```

### Discovering Components

**Before building custom UI**, search for existing components:

```bash
# Search available components
pnpm --filter @kit/ui ui:search -q "toggle"

# Preview component code before adding
npx shadcn@latest view toggle

# List all installed components
pnpm --filter @kit/ui ui:list
```

### Adding New Components

When a component doesn't exist in the project:

```bash
# 1. Add from official registry
cd packages/ui && npx shadcn@latest add toggle -y

# 2. Add from community registries for animated/enhanced components
npx shadcn@latest add @magicui/animated-button
npx shadcn@latest add @aceternity/card-spotlight
npx shadcn@latest add @shadcnblocks/hero-section

# 3. Update exports in packages/ui/package.json:
#    "./toggle": "./src/shadcn/toggle.tsx"
```

### Community Registries for Distinctive UI

For designs requiring animation, 3D effects, or pre-built sections:

| Registry | Namespace | Specialty |
|----------|-----------|-----------|
| **MagicUI** | `@magicui` | Animated components with Framer Motion |
| **Aceternity** | `@aceternity` | Modern UI with 3D effects, spotlights |
| **shadcnblocks** | `@shadcnblocks` | Pre-built page sections and blocks |

```bash
# Search registry
npx shadcn@latest search @magicui -q "button"

# View before installing
npx shadcn@latest view @magicui/typing-animation
```

**Full CLI documentation**: `.ai/ai_docs/tool-docs/shadcn-cli.md`

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code that is:
- Production-grade and functional
- Built on shadcn/ui components with creative customization
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Styling with Tailwind CSS v4

Use semantic color classes that support dark mode:

```tsx
// Good - semantic colors
<div className="bg-background text-foreground border-border">
  <p className="text-muted-foreground">Secondary text</p>
</div>

// Avoid - hardcoded colors that break dark mode
<div className="bg-white text-black">...</div>
```

Use `cn()` for conditional class merging:

```tsx
import { cn } from '@kit/ui/cn';

<Button className={cn(
  'transition-all duration-300',
  isActive && 'scale-105 shadow-lg',
  variant === 'gradient' && 'bg-gradient-to-r from-primary to-accent'
)}>
```

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Consider `@magicui` components for animated variants. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Consider `@aceternity` components for spotlight effects, gradient backgrounds. Add contextual effects and textures that match the overall aesthetic.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

## Customizing shadcn Components

The power of shadcn/ui is full source control. Customize components directly:

```tsx
// Example: Custom button variant in packages/ui/src/shadcn/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        // Add custom variants for your design system:
        gradient: "bg-gradient-to-r from-primary to-accent text-primary-foreground",
        glass: "bg-white/10 backdrop-blur-md border border-white/20",
        neon: "bg-transparent border-2 border-primary shadow-[0_0_15px_rgba(var(--primary))]",
      },
    },
  }
)
```

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
