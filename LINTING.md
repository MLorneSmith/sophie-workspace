# Linting Strategy

This project uses a **hybrid linting approach** with different tools for different parts of the codebase.

## Current Configuration

### Biome (Primary Linter)

- **Root level**: `pnpm lint` runs Biome
- **Web app**: `pnpm --filter web lint` runs Biome
- **Pre-commit hooks**: Smart hybrid linting based on file location
- **Git workflow**: Context-aware linting enforcement

**Applications using Biome:**

- `apps/web/` - Main Next.js application
- Root level linting and formatting

### ESLint (Legacy/Specialized)

- **Payload CMS**: `apps/payload/` - Required by Payload CMS ecosystem
- **Packages**: 130+ packages in `/packages/` - Part of monorepo tooling

**Applications using ESLint:**

- `apps/payload/` - Payload CMS (officially requires ESLint)
- All packages in `/packages/` - Use shared `@kit/eslint-config`

## Why This Hybrid Approach?

1. **Payload CMS Requirement**: Payload CMS officially requires ESLint and provides `@payloadcms/eslint-config`
2. **Monorepo Packages**: Existing package structure uses shared ESLint configurations
3. **Main App Migration**: The primary web application has been migrated to Biome for better performance

## Commands Reference

### Biome Commands

```bash
# Root level linting (includes web app)
pnpm lint

# Web app specific linting
pnpm --filter web lint

# Fix Biome issues
pnpm lint:fix

# Format with Biome
pnpm format:fix
```

### ESLint Commands

```bash
# Payload CMS linting
pnpm --filter payload lint

# Individual package linting
pnpm --filter @kit/ui lint

# All packages (not recommended - use selectively)
pnpm -r lint
```

## Error Count Tracking

**Before unification:**

- Biome (root): ~289 errors
- ESLint (web): ~364 errors
- **Total**: ~650+ errors across two systems

**After web app unification:**

- Biome (unified): ~19 errors total
- ESLint (payload + packages): Maintained separately
- **Improvement**: Eliminated dual counting and confusion

## Configuration Files

### Biome Configuration

- `biome.json` - Root level Biome configuration
- Enhanced with rules equivalent to previous ESLint setup

### ESLint Configuration

- `apps/payload/eslint.config.mjs` - Payload CMS specific
- `tooling/eslint/` - Shared ESLint configurations for packages
- Individual `packages/*/eslint.config.mjs` - Package-specific configs

## Pre-Commit Hook Behavior

The pre-commit hook automatically detects file locations and applies the correct linter:

- **Main app files** (`apps/web/`, root files): Uses Biome
- **Payload CMS files** (`apps/payload/`): Uses ESLint
- **Package files** (`packages/`): Uses ESLint (selectively)
- **Markdown files** (`.md`, `.mdx`): Uses Prettier
- **All TypeScript files**: Runs typecheck

### Pre-Commit Process

1. 🔍 Detects staged file locations
2. 🎨 Applies Biome to main app files
3. 🔧 Applies ESLint to Payload CMS files
4. 📦 Applies ESLint to modified packages
5. 📝 Formats markdown with Prettier
6. 🔍 Runs TypeScript check if `.ts/.tsx` files present
7. 📥 Re-stages any formatted files

## Best Practices

1. **Use Biome for main development** - Web app and general code
2. **Use ESLint for Payload** - When working in `apps/payload/`
3. **Package linting** - Run selectively as needed
4. **Pre-commit** - Automatically uses correct linter per file location
5. **CI/CD** - Uses `pnpm lint` (Biome) for main validation

## Migration Notes

- **Web app successfully migrated** from ESLint to Biome
- **Payload CMS kept on ESLint** due to official requirements
- **Packages maintained** existing ESLint setup for stability
- **Git hooks updated** to use Biome as primary linter

## Troubleshooting

### Different Error Counts

- Biome and ESLint have different rule sets
- Focus on the relevant linter for your current work area
- Use `pnpm lint` for overall project health

### IDE Integration

- Configure your IDE to use Biome for `/apps/web/`
- Configure ESLint for `/apps/payload/` and `/packages/`
- Most IDEs can handle multiple linter configurations

### When to Use Which

- **Working on main app**: Use Biome (`pnpm lint`)
- **Working on Payload CMS**: Use ESLint (`pnpm --filter payload lint`)
- **Working on packages**: Use ESLint for that specific package
