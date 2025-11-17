# Shadcn CLI Tool Documentation

**Purpose**: Command-line interface for managing shadcn/ui components in the SlideHeroes monorepo. Use for discovering, installing, and maintaining UI components from the official registry and community sources.

**Related Files**:
- `packages/ui/components.json` - CLI configuration
- `packages/ui/src/shadcn/` - Component installation directory (45+ components)
- `apps/web/styles/globals.css` - Tailwind CSS and theme variables
- `packages/ui/CLAUDE.md` - UI package guidelines

**When to Use**:
- Adding new shadcn/ui components to the `@kit/ui` package
- Discovering components from community registries (@magicui, @aceternity, @shadcnblocks)
- Updating existing components to latest versions
- Exploring available components before implementation
- Setting up shadcn configuration in new projects

## Overview

Shadcn CLI is a component management tool that adds source code directly to your project (not an npm package). Components are based on Radix UI primitives with full customization control.

**Key Features**:
- 🎨 **50+ Official Components**: Forms, overlays, data display, navigation
- 🌐 **Registry Directory**: Access 500+ community components via namespaced registries
- 🎯 **Direct Source Control**: Components added to your codebase, not node_modules
- ⚡ **Zero Config**: Works without installation via `npx`
- 🔧 **Full Customization**: Modify components directly, no wrapper constraints
- 🎭 **Dark Mode Built-in**: CSS variables for automatic theme support
- ♿ **Accessibility First**: Radix UI primitives ensure WCAG compliance

**SlideHeroes Status**:
- ✅ 45+ components already installed
- ✅ Configuration file exists (`packages/ui/components.json`)
- ⚠️ Configuration needs fixes for Tailwind v4 compatibility
- 📦 Components exported via `@kit/ui/[component]` pattern

## Installation

### Recommended: Direct Execution (Zero Install)

```bash
# From packages/ui directory
cd packages/ui

# Run any command without installing
npx shadcn@latest add button
npx shadcn@latest search
npx shadcn@latest view card
```

**Advantages**:
- Always uses latest version
- No global installation needed
- Works in CI/CD without setup
- Consistent across team members

### Alternative: Global Installation

```bash
# Install globally (optional)
pnpm add -g shadcn@latest

# Then use directly
shadcn add button
shadcn search @magicui
```

**Use Cases**:
- Frequent CLI usage (10+ times per day)
- Offline development scenarios
- Personal preference for shorter commands

### pnpm Workspace Scripts

SlideHeroes provides convenient pnpm scripts:

```bash
# From project root
pnpm --filter @kit/ui ui:add button       # Add component
pnpm --filter @kit/ui ui:search -q form   # Search components
pnpm --filter @kit/ui ui:list             # List installed components
```

**Benefits**:
- Automatically sets correct working directory
- Enforces UI package context
- Integrates with Turborepo caching
- Team-consistent command patterns

## Core Commands

### `init` - Initialize Configuration

**Purpose**: Create or reinitialize `components.json` configuration file.

```bash
# Basic initialization
npx shadcn@latest init

# Skip prompts with defaults
npx shadcn@latest init -y

# Force overwrite existing config
npx shadcn@latest init -f

# Specify template
npx shadcn@latest init -t next
```

**Common Options**:
| Flag | Description | Default |
|------|-------------|---------|
| `-y, --yes` | Skip confirmation prompts | Interactive |
| `-f, --force` | Overwrite existing config | Fail if exists |
| `-c, --cwd <path>` | Working directory | Current dir |
| `-t, --template` | Template (next, next-monorepo) | Detected |
| `--src-dir` | Use src directory | Auto-detect |
| `--css-variables` | Enable CSS variable theming | true |

**Interactive Prompts**:
1. **Style**: `New York` (modern) or `Default` (deprecated)
2. **Base Color**: Zinc, Slate, Gray, Neutral, or Stone
3. **CSS Variables**: Yes (recommended) or No
4. **TypeScript**: Yes (SlideHeroes uses TSX)
5. **Tailwind Config**: Auto-detected
6. **Global CSS**: Auto-detected
7. **Import Alias**: `@/` or `~/` prefix

**SlideHeroes Configuration**:
```bash
# From packages/ui directory
cd packages/ui
npx shadcn@latest init -f

# Select these options:
# Style: New York
# Base Color: Slate
# CSS Variables: Yes
# TypeScript: Yes
# Tailwind Config: (leave blank for Tailwind v4)
# Global CSS: ../../apps/web/styles/globals.css
# Alias: @/components
```

**Note**: SlideHeroes uses Tailwind v4 which doesn't require `tailwind.config.ts`. Leave config path blank or set to empty string.

### `add` - Install Components

**Purpose**: Add components and dependencies to your project.

```bash
# Add single component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button card dialog

# Add all available components
npx shadcn@latest add --all

# Add from community registry
npx shadcn@latest add @magicui/animated-button

# Skip confirmations and overwrite
npx shadcn@latest add button -y -o
```

**Common Options**:
| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip confirmation prompts |
| `-o, --overwrite` | Overwrite existing files |
| `-a, --all` | Add all available components |
| `-p, --path <path>` | Custom installation path |
| `-c, --cwd <path>` | Working directory |

**SlideHeroes Workflow**:

```bash
# 1. Navigate to UI package
cd packages/ui

# 2. Add component
npx shadcn@latest add toggle -y

# 3. Component installed to: src/shadcn/toggle.tsx

# 4. Update package.json exports (manual step)
# Add to exports field:
#   "./toggle": "./src/shadcn/toggle.tsx"

# 5. Test import
# import { Toggle } from '@kit/ui/toggle';

# 6. Verify TypeScript
pnpm typecheck

# 7. Commit changes
git add .
git commit -m "feat(ui): add toggle component via shadcn CLI"
```

**Automatic Dependencies**:
- npm packages (e.g., `@radix-ui/react-dialog`)
- Dependent components (e.g., `button` required by `dialog`)
- Utility functions (e.g., `cn` helper)

**Registry Components**:
```bash
# MagicUI animated components
npx shadcn@latest add @magicui/animated-button
npx shadcn@latest add @magicui/globe

# Aceternity modern components
npx shadcn@latest add @aceternity/background-gradient
npx shadcn@latest add @aceternity/card-spotlight

# Shadcn Blocks pre-built sections
npx shadcn@latest add @shadcnblocks/login-form
npx shadcn@latest add @shadcnblocks/pricing-section
```

### `search` / `list` - Discover Components

**Purpose**: Find available components across all registries.

```bash
# List all components from default registry
npx shadcn@latest search

# Search with query
npx shadcn@latest search -q "button"

# Search specific registry
npx shadcn@latest search @magicui

# Search registry with query
npx shadcn@latest search @magicui -q "animated"

# Limit results
npx shadcn@latest search -l 10

# Skip first N results (pagination)
npx shadcn@latest search -o 10 -l 10
```

**Common Options**:
| Flag | Description | Default |
|------|-------------|---------|
| `-q, --query <string>` | Search query | All |
| `-l, --limit <number>` | Max results per registry | 20 |
| `-o, --offset <number>` | Skip items | 0 |

**Example Output**:
```
📦 shadcn/ui Registry (50 components)
  - button: Displays a button or a component that looks like a button
  - card: Displays a card with header, content, and footer
  - dialog: A window overlaid on either the primary window or another dialog
  ...

📦 @magicui (150 components)
  - animated-button: Button with smooth animations and variants
  - globe: Interactive 3D globe component
  - sparkles: Sparkle effect overlay
  ...

📦 @aceternity (50 components)
  - background-gradient: Animated gradient background
  - card-spotlight: Card with spotlight hover effect
  ...
```

**SlideHeroes Use Cases**:
- Planning which components to add
- Discovering alternatives before implementing custom components
- Exploring community solutions for complex UI patterns
- Finding animated/enhanced versions of standard components

### `view` - Preview Component Code

**Purpose**: Display component source code before installation.

```bash
# View official component
npx shadcn@latest view button

# View from registry
npx shadcn@latest view @magicui/animated-button

# View multiple components
npx shadcn@latest view button card dialog
```

**Example Output**:
```typescript
// Displays complete source code including:
// - Component implementation
// - TypeScript types
// - Dependencies
// - Usage examples (sometimes)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // ... component implementation
  }
)
```

**Use Cases**:
- Understanding component API before adding
- Checking implementation complexity
- Reviewing code quality and patterns
- Verifying accessibility features
- Comparing alternative registry components

### `build` - Create Custom Registry

**Purpose**: Build registry JSON files from component definitions (advanced).

```bash
# Build registry in default location
npx shadcn@latest build

# Build to custom directory
npx shadcn@latest build -o ./dist/registry
```

**Use Cases**:
- Creating private company registry
- Distributing custom components to team
- Building internal design system
- Publishing component collection

**Not typically needed for SlideHeroes** - only relevant if creating custom registry.

## Registry Directory System

### Overview

The **Registry Directory** is shadcn's component marketplace featuring community-built registries. It enables installing curated components from third-party sources without manual configuration.

**Key Benefits**:
- 🎁 **500+ Additional Components**: Beyond official 50 components
- 🔌 **Zero Configuration**: Built-in integration
- 🏷️ **Namespaced**: Clear `@registry/component` syntax
- 🎨 **Specialized Collections**: Animated, data viz, forms, blocks
- 🚀 **Production Ready**: Community-vetted components

### Featured Registries

| Registry | Namespace | Components | Specialty |
|----------|-----------|------------|-----------|
| **MagicUI** | `@magicui` | 150+ | Animated components with Framer Motion |
| **Aceternity** | `@aceternity` | 50+ | Modern components with 3D effects |
| **shadcnblocks** | `@shadcnblocks` | 300+ | Pre-built page sections and blocks |
| **Supabase** | `@supabase` | 20+ | Supabase-connected auth and data components |

### Using Registry Components

**Discovery Workflow**:

```bash
# 1. Search all registries
npx shadcn@latest search

# 2. Search specific registry
npx shadcn@latest search @magicui

# 3. Find component with query
npx shadcn@latest search @magicui -q "button"

# 4. Preview component code
npx shadcn@latest view @magicui/animated-button

# 5. Install component
npx shadcn@latest add @magicui/animated-button
```

**Installation Examples**:

```bash
# MagicUI - Animated Components
npx shadcn@latest add @magicui/animated-button  # Button with entrance animations
npx shadcn@latest add @magicui/globe            # Interactive 3D globe
npx shadcn@latest add @magicui/sparkles         # Sparkle effect overlay
npx shadcn@latest add @magicui/typing-animation # Typewriter text effect

# Aceternity - Modern UI
npx shadcn@latest add @aceternity/background-gradient  # Animated gradient bg
npx shadcn@latest add @aceternity/card-spotlight       # Spotlight hover effect
npx shadcn@latest add @aceternity/floating-navbar      # Sticky navbar
npx shadcn@latest add @aceternity/moving-border        # Animated border

# Shadcn Blocks - Page Sections
npx shadcn@latest add @shadcnblocks/login-form         # Complete login form
npx shadcn@latest add @shadcnblocks/pricing-section    # Pricing cards
npx shadcn@latest add @shadcnblocks/hero-section       # Hero with CTA
npx shadcn@latest add @shadcnblocks/testimonial-grid   # Testimonial layout

# Supabase - Backend Connected
npx shadcn@latest add @supabase/auth-form              # Auth with Supabase
npx shadcn@latest add @supabase/data-table             # Real-time data table
```

**SlideHeroes Integration**:

```typescript
// After installing registry component
// 1. Component is in: packages/ui/src/shadcn/@magicui/animated-button.tsx

// 2. Add export to package.json:
{
  "exports": {
    "./animated-button": "./src/shadcn/@magicui/animated-button.tsx"
  }
}

// 3. Import in your app:
import { AnimatedButton } from '@kit/ui/animated-button';

// 4. Use with SlideHeroes theming:
<AnimatedButton variant="default" className="bg-primary text-primary-foreground">
  Click Me
</AnimatedButton>
```

### Creating Custom Registry (Advanced)

**When to Create Custom Registry**:
- Internal design system distribution
- Team-specific component library
- Client project component reuse
- Open source component collection

**Basic Setup**:

```bash
# 1. Create registry project
mkdir slideheroes-registry
cd slideheroes-registry

# 2. Create registry.json
cat > registry.json <<EOF
{
  "name": "slideheroes-registry",
  "homepage": "https://components.slideheroes.com",
  "items": [
    {
      "name": "presentation-card",
      "type": "registry:ui",
      "files": [
        {
          "path": "registry/presentation-card.tsx",
          "type": "registry:ui"
        }
      ]
    }
  ]
}
EOF

# 3. Build registry
npx shadcn@latest build -o ./public/r

# 4. Deploy to static hosting (Vercel, Netlify, Cloudflare)
vercel --prod

# 5. Configure in components.json
{
  "registries": {
    "@slideheroes": "https://components.slideheroes.com/r/{name}.json"
  }
}

# 6. Use custom registry
npx shadcn@latest add @slideheroes/presentation-card
```

## Configuration Reference

### components.json Schema

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "../../apps/web/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Configuration Fields

**`$schema`**: Enables IDE autocomplete and validation
- Value: `"https://ui.shadcn.com/schema.json"`

**`style`**: Component style variant
- `"new-york"` - Modern, refined (recommended)
- `"default"` - **Deprecated**, use new-york

**`rsc`**: React Server Components support
- `true` - Adds `"use client"` to client components automatically
- `false` - No automatic directives

**`tsx`**: TypeScript vs JavaScript
- `true` - Generate `.tsx` files (SlideHeroes uses this)
- `false` - Generate `.jsx` files

**`tailwind.config`**: Path to Tailwind config
- For Tailwind v3: `"./tailwind.config.ts"`
- **For Tailwind v4: `""` (empty string) or omit**
- SlideHeroes uses v4, so set to empty

**`tailwind.css`**: Global CSS file path
- Relative to package root
- SlideHeroes: `"../../apps/web/styles/globals.css"`

**`tailwind.baseColor`**: Base color palette
- Options: `zinc`, `slate`, `gray`, `neutral`, `stone`
- SlideHeroes: `"slate"`

**`tailwind.cssVariables`**: Theme system
- `true` - Use CSS variables (recommended, supports dark mode)
- `false` - Use Tailwind utility classes directly

**`aliases`**: Import path mappings
- Must match TypeScript `paths` in `tsconfig.json`
- Use package-relative paths, not web app paths

**`iconLibrary`**: Icon package
- `"lucide"` - Lucide React (SlideHeroes uses this)
- Support for other libraries varies

### SlideHeroes Configuration

**Current Issues**:
- ❌ `tailwind.config` points to non-existent file
- ❌ Aliases use `~/` (web app convention)

**Fixed Configuration**:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "../../apps/web/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Key Changes**:
1. Set `tailwind.config` to `""` (Tailwind v4 compatible)
2. Aliases already use `@/` which matches TypeScript paths
3. Verify CSS path points to correct location

## Monorepo Workflows

### Adding Components to @kit/ui Package

**Complete Workflow**:

```bash
# 1. Navigate to UI package
cd packages/ui

# 2. Search for component (optional)
npx shadcn@latest search -q "toggle"

# 3. Preview component (optional)
npx shadcn@latest view toggle

# 4. Add component
npx shadcn@latest add toggle -y

# 5. Verify installation
ls src/shadcn/toggle.tsx
# Output: src/shadcn/toggle.tsx

# 6. Update package.json exports
# Add to "exports" field:
{
  "./toggle": "./src/shadcn/toggle.tsx"
}

# 7. Test TypeScript compilation
pnpm typecheck

# 8. Test import in consuming app
cd ../../apps/web
# Create test file:
cat > test-toggle.tsx <<EOF
import { Toggle } from '@kit/ui/toggle';
export function TestToggle() {
  return <Toggle>Test</Toggle>;
}
EOF

# 9. Run linting and formatting
cd ../..
pnpm format:fix
pnpm lint:fix

# 10. Commit changes
git add packages/ui/
git commit -m "feat(ui): add toggle component via shadcn CLI

Added toggle component from shadcn/ui for binary state controls.
Includes TypeScript types and dark mode support.

Closes #[issue-number]"

# 11. Clean up test file
rm apps/web/test-toggle.tsx
```

### Using pnpm Workspace Scripts

**From Project Root**:

```bash
# Add component (automatically sets cwd to packages/ui)
pnpm --filter @kit/ui ui:add toggle

# Search components
pnpm --filter @kit/ui ui:search -q "form"

# List installed components
pnpm --filter @kit/ui ui:list

# View installed component count
pnpm --filter @kit/ui ui:list | wc -l
```

**Script Definitions** (in `packages/ui/package.json`):

```json
{
  "scripts": {
    "ui:add": "npx shadcn@latest add",
    "ui:search": "npx shadcn@latest search",
    "ui:list": "ls src/shadcn",
    "ui:init": "npx shadcn@latest init"
  }
}
```

### Updating Existing Components

**Workflow**:

```bash
cd packages/ui

# 1. Backup current component (if heavily customized)
cp src/shadcn/button.tsx src/shadcn/button.tsx.backup

# 2. Check for local modifications
git diff src/shadcn/button.tsx

# 3. Add component with overwrite flag
npx shadcn@latest add button -o -y

# 4. Review changes
git diff src/shadcn/button.tsx

# 5a. If changes are acceptable:
git add src/shadcn/button.tsx
git commit -m "chore(ui): update button component to latest version"

# 5b. If customizations were lost:
# Manually merge backup with new version
# Or reject update:
git checkout -- src/shadcn/button.tsx
```

**Best Practices**:
- Always commit before updating components
- Review diffs carefully before accepting updates
- Document customizations in component file comments
- Consider creating wrapper components for heavily customized components

## Common Operations

### Bulk Component Addition

```bash
# Add all form-related components
cd packages/ui
npx shadcn@latest add form input label textarea select checkbox radio-group -y

# Add all layout components
npx shadcn@latest add card tabs accordion collapsible separator -y

# Add all overlay components
npx shadcn@latest add dialog alert-dialog sheet popover dropdown-menu tooltip -y
```

### Component Discovery Workflow

```bash
# 1. Explore what's available
npx shadcn@latest search

# 2. Search for specific functionality
npx shadcn@latest search -q "data"
# Results: table, data-table, chart, etc.

# 3. Preview implementation
npx shadcn@latest view data-table

# 4. Check registry alternatives
npx shadcn@latest search @magicui -q "table"
npx shadcn@latest search @aceternity -q "table"

# 5. Compare implementations
npx shadcn@latest view data-table
npx shadcn@latest view @magicui/enhanced-table

# 6. Make decision and install
npx shadcn@latest add data-table -y
```

### Testing New Components

```bash
# 1. Add component
cd packages/ui
npx shadcn@latest add toggle -y

# 2. Build UI package
pnpm build

# 3. Test import in dev-tool app
cd ../../apps/dev-tool
cat > app/test-page/page.tsx <<EOF
import { Toggle } from '@kit/ui/toggle';

export default function TestPage() {
  return (
    <div className="p-8">
      <Toggle>Toggle Me</Toggle>
    </div>
  );
}
EOF

# 4. Start dev server
pnpm dev

# 5. Visit http://localhost:3000/test-page

# 6. Test variants and dark mode
# 7. Test keyboard accessibility (Tab, Space/Enter)
# 8. Clean up test page
```

### Component Customization

```typescript
// packages/ui/src/shadcn/button.tsx

// Document customizations at top of file:
/**
 * SlideHeroes Custom Button Component
 *
 * Customizations:
 * - Added "gradient" variant for CTA buttons
 * - Increased default padding for better touch targets
 * - Custom focus ring color matching brand
 *
 * @see https://ui.shadcn.com/docs/components/button
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        // Custom variant (SlideHeroes):
        gradient: "bg-gradient-to-r from-primary to-accent text-primary-foreground",
      },
    },
  }
)
```

## Troubleshooting

### Configuration Issues

**Issue**: "Could not find a valid configuration file"

```bash
# Check if components.json exists
ls packages/ui/components.json

# If missing, initialize:
cd packages/ui
npx shadcn@latest init
```

**Issue**: "Invalid configuration: tailwind.config not found"

```bash
# For Tailwind v4 (SlideHeroes):
# Edit components.json and set:
{
  "tailwind": {
    "config": ""  # Empty string for v4
  }
}
```

**Issue**: "Component installed to wrong directory"

```bash
# Check aliases in components.json match TypeScript paths
# components.json:
{
  "aliases": {
    "ui": "@/ui"
  }
}

# tsconfig.json:
{
  "compilerOptions": {
    "paths": {
      "@/ui": ["./src/shadcn"]
    }
  }
}
```

### Import Errors

**Issue**: "Cannot find module '@kit/ui/button'"

```bash
# 1. Verify component file exists
ls packages/ui/src/shadcn/button.tsx

# 2. Check package.json exports
grep -A 1 '"./button"' packages/ui/package.json
# Should show: "./button": "./src/shadcn/button.tsx"

# 3. If missing, add export manually

# 4. Rebuild package
pnpm --filter @kit/ui typecheck
```

**Issue**: "Module has no exported member 'Button'"

```bash
# Check component exports correctly:
grep -A 3 "export.*Button" packages/ui/src/shadcn/button.tsx

# Should have:
# export { Button, buttonVariants }

# Also check index.ts if used:
grep "button" packages/ui/src/index.ts
```

### CLI Errors

**Issue**: "Network error: Failed to fetch component"

```bash
# Check internet connection
ping ui.shadcn.com

# Try with verbose output
npx shadcn@latest add button --verbose

# Use alternative registry URL (if configured)
```

**Issue**: "Permission denied writing files"

```bash
# Check directory permissions
ls -la packages/ui/src/shadcn/

# Fix permissions if needed
chmod -R u+w packages/ui/src/shadcn/

# Ensure you're in correct directory
pwd
# Should be in packages/ui or project root with --cwd flag
```

**Issue**: "Component already exists"

```bash
# Use overwrite flag to update
npx shadcn@latest add button -o

# Or skip confirmation
npx shadcn@latest add button -o -y

# Backup first if heavily customized
cp src/shadcn/button.tsx src/shadcn/button.tsx.backup
```

### TypeScript Errors

**Issue**: "Cannot find name 'VariantProps'"

```bash
# Install class-variance-authority
pnpm --filter @kit/ui add class-variance-authority

# Verify import in component:
grep "class-variance-authority" packages/ui/src/shadcn/button.tsx
```

**Issue**: "Property 'cn' does not exist"

```bash
# Check utils file exists
ls packages/ui/src/lib/utils.ts

# Install dependencies
pnpm --filter @kit/ui add tailwind-merge clsx

# Verify export
grep "export.*cn" packages/ui/src/lib/utils.ts
```

### Dark Mode Issues

**Issue**: "Component doesn't respond to dark mode"

```bash
# Verify CSS variables are defined
grep "dark" apps/web/styles/shadcn-ui.css

# Check component uses semantic colors
grep "bg-background\|text-foreground" packages/ui/src/shadcn/button.tsx

# Ensure theme provider is configured in app
grep "ThemeProvider" apps/web/app/layout.tsx
```

### Registry Issues

**Issue**: "Registry component not found"

```bash
# Verify registry is accessible
npx shadcn@latest search @magicui

# Check components.json for registry config
grep -A 5 "registries" packages/ui/components.json

# Try official component if registry fails
npx shadcn@latest add button  # Official
```

## Best Practices

### 1. Always Run from UI Package Directory

```bash
# ✅ Correct
cd packages/ui
npx shadcn@latest add button

# ❌ Incorrect
npx shadcn@latest add button  # From project root
```

### 2. Use Version Control

```bash
# Commit before adding components
git add .
git commit -m "chore: checkpoint before adding components"

# Add component
npx shadcn@latest add toggle -y

# Review changes
git diff

# Commit if acceptable
git add .
git commit -m "feat(ui): add toggle component"
```

### 3. Document Customizations

```typescript
/**
 * CUSTOMIZED: Added gradient variant for SlideHeroes CTAs
 * Last Updated: 2025-01-17
 * Original: https://ui.shadcn.com/docs/components/button
 *
 * Custom Changes:
 * - gradient variant with brand colors
 * - increased touch target size
 * - custom focus ring
 */
```

### 4. Export Pattern Consistency

```json
{
  "exports": {
    "./button": "./src/shadcn/button.tsx",
    "./card": "./src/shadcn/card.tsx",
    "./dialog": "./src/shadcn/dialog.tsx"
  }
}
```

### 5. Test Before Committing

```bash
# 1. TypeScript compilation
pnpm --filter @kit/ui typecheck

# 2. Linting
pnpm --filter @kit/ui lint

# 3. Import test
echo 'import { Toggle } from "@kit/ui/toggle";' | tsc --noEmit

# 4. Visual test in dev environment
pnpm dev
```

### 6. Registry Component Evaluation

**Before installing from registry:**

1. **Preview code**: `npx shadcn@latest view @magicui/component`
2. **Check dependencies**: Verify npm packages required
3. **Review complexity**: Ensure it's not over-engineered
4. **Test accessibility**: Check for proper ARIA attributes
5. **Verify maintenance**: Check registry update frequency

### 7. Component Updates

```bash
# Check for updates periodically
npx shadcn@latest search

# Update specific component
npx shadcn@latest add button -o

# Bulk update (careful!)
npx shadcn@latest add --all -o
```

### 8. Monorepo Hygiene

```bash
# Use workspace filtering
pnpm --filter @kit/ui ui:add component

# Keep UI package isolated
# Don't add components directly to apps

# Maintain single source of truth
# All components in @kit/ui package
```

## Related Documentation

- [Shadcn UI Official Docs](https://ui.shadcn.com)
- [Shadcn CLI Reference](https://ui.shadcn.com/docs/cli)
- [Registry Directory](https://ui.shadcn.com/docs/directory)
- [Components JSON Schema](https://ui.shadcn.com/docs/components-json)
- [Tailwind CSS v4 Docs](https://tailwindcss.com)
- [Radix UI Primitives](https://www.radix-ui.com)

**SlideHeroes Documentation**:
- `packages/ui/CLAUDE.md` - UI package guidelines
- `CLAUDE.md` - Root project documentation
- `.ai/ai_docs/context-docs/development/shadcn-ui-components.md` - Component guide
- `.ai/specs/feature-shadcn-cli-setup-and-documentation.md` - This feature plan

## Quick Reference

### Essential Commands

```bash
# Add component
npx shadcn@latest add [component]

# Search components
npx shadcn@latest search

# Preview component
npx shadcn@latest view [component]

# Initialize config
npx shadcn@latest init
```

### SlideHeroes Commands

```bash
# From project root
pnpm --filter @kit/ui ui:add [component]
pnpm --filter @kit/ui ui:search
pnpm --filter @kit/ui ui:list

# From packages/ui
npx shadcn@latest add [component] -y
ls src/shadcn  # List installed
```

### Registry Components

```bash
# MagicUI
npx shadcn@latest add @magicui/animated-button

# Aceternity
npx shadcn@latest add @aceternity/background-gradient

# Shadcn Blocks
npx shadcn@latest add @shadcnblocks/login-form
```

### Post-Installation Checklist

- [ ] Component file exists in `src/shadcn/`
- [ ] Export added to `package.json`
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] Import works: `import { X } from '@kit/ui/x'`
- [ ] Dark mode tested
- [ ] Changes committed to git
