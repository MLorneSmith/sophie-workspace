---
# Identity
id: "makerkit-upstream-sync"
title: "Makerkit SaaS Template Upstream Synchronization"
version: "1.0.0"
category: "pattern"

# Discovery
description: "Comprehensive guide for synchronizing Makerkit Next.js Supabase Turbo template updates with custom project code while preserving modifications"
tags: ["makerkit", "template", "upstream", "git", "merge", "update", "monorepo", "turbo", "pnpm"]

# Relationships
dependencies: []
cross_references:
  - id: "git-aliases"
    type: "related"
    description: "Git operations for upstream management"
  - id: "migrations"
    type: "related"
    description: "Database schema update patterns"

# Maintenance
created: "2025-09-16"
last_updated: "2025-09-16"
author: "create-context"
---

# Makerkit SaaS Template Upstream Synchronization

## Overview

Makerkit releases updates almost daily, requiring systematic upstream synchronization strategies. This context provides proven patterns for safely merging template updates while preserving custom business logic, with focus on monorepo structure, dependency management, and conflict resolution.

## Key Concepts

- **Upstream Remote**: Makerkit's official repository at `github.com/makerkit/next-supabase-saas-kit-turbo`
- **Selective Merge**: Categorized file updates based on safety classification
- **Declarative Schema**: 2025 approach using `/supabase/schemas/` instead of migrations
- **@kit Packages**: Modular workspace packages providing core functionality

## Architecture & Critical Files

### Repository Structure
```
/
├── apps/web/              # Main Next.js application
├── packages/@kit/         # Core workspace packages
├── supabase/schemas/      # Declarative DB schemas (2025)
├── turbo.json            # Turborepo pipeline config
└── pnpm-workspace.yaml   # Workspace definition
```

### Update-Critical Files
- `package.json` & `pnpm-lock.yaml` - Dependencies requiring careful merge
- `.env.example` - New environment variables reference
- `turbo.json` - Build pipeline updates
- `/supabase/schemas/*.sql` - Database schema declarations
- `apps/web/styles/global.css` - Tailwind v4 variables

## Upstream Synchronization Workflow

### Initial Setup
```bash
# Add upstream remote (one-time)
git remote add makerkit https://github.com/makerkit/next-supabase-saas-kit-turbo.git
```

### Update Process
```bash
# 1. Ensure clean state
git status --porcelain

# 2. Create backup branch
git checkout -b backup/update-$(date +%Y%m%d)

# 3. Fetch & analyze changes
git fetch makerkit
git log --oneline HEAD..makerkit/main

# 4. Selective merge by category
git checkout makerkit/main -- package.json pnpm-lock.yaml  # Dependencies
git checkout makerkit/main -- packages/@kit/*              # Core packages
# Preserve: .env*, custom business logic, project-specific configs

# 5. Validate changes
pnpm install && pnpm build && pnpm typecheck
```

## Conflict Resolution Patterns

### File Categories & Resolution Strategy

**Auto-Accept Upstream:**
- Security updates in @kit packages
- Dependency vulnerability fixes
- Framework configuration updates
- Build tool configurations

**Preserve Local:**
- `.env` and `.env.local` files
- Custom business logic in `/app`
- Project-specific API routes
- Custom database schemas

**Manual Merge Required:**
- `package.json` dependencies
- Tailwind/TypeScript configs
- Component modifications
- RLS policies with custom logic

### Smart Package.json Merge
```javascript
// Strategy: Keep custom deps, update shared ones
const upstream = JSON.parse(upstreamPackageJson);
const local = JSON.parse(localPackageJson);

// Merge dependencies intelligently
const merged = {
  ...local,
  dependencies: {
    ...upstream.dependencies,  // Framework deps
    ...local.dependencies      // Custom deps override
  },
  devDependencies: {
    ...upstream.devDependencies,
    ...local.devDependencies
  }
};
```

## Breaking Changes Management

### Major Version Migrations (2025)

**v2.7.0 - Declarative Schemas:**
- Migrate from `/migrations` to `/schemas` approach
- Use `supabase db diff` for change generation
- Apply with `supabase db push`

**v2.13.0 - React 19 + Next.js 15:**
- Remove `forwardRef` wrappers
- Update dynamic params to use `Promise`
- Apply provided codemods

**Tailwind v4:**
- Update `global.css` with CSS variables
- Migrate color system to OKLCH
- Update component class names

## Dependency Management

### @kit Package Updates
```bash
# Update all @kit packages together
pnpm update --recursive --latest "@kit/*"

# Verify compatibility
pnpm build
pnpm test
```

### Version Alignment
- Use `workspace:*` for internal dependencies
- Keep @kit packages version-aligned
- Update framework deps (Next.js, React) together

## Validation Checklist

### Pre-Update
- [ ] Clean git working directory
- [ ] All tests passing
- [ ] Backup branch created
- [ ] Changelog reviewed for breaking changes

### Post-Update
- [ ] TypeScript compilation: `pnpm typecheck`
- [ ] Linting clean: `pnpm lint`
- [ ] Build successful: `pnpm build`
- [ ] E2E tests pass: `pnpm test:e2e`
- [ ] Critical flows tested (auth, billing)

## Common Patterns

### Environment Variable Updates
```bash
# Identify new required variables
diff .env.example .env.local | grep "^<"

# Add with safe defaults
echo "NEW_VAR=default_value" >> .env.local
```

### Database Schema Updates
```bash
# Review schema changes
diff -r supabase/schemas/ upstream/supabase/schemas/

# Apply selectively
supabase db diff --schema public
supabase db reset  # Local testing
```

### Component Library Updates
```typescript
// Check for component API changes
// Before (React 18): forwardRef required
// After (React 19): Direct ref prop

// Update pattern:
- export default forwardRef(Component)
+ export default Component
```

## Troubleshooting

### Issue: Merge Conflicts in pnpm-lock.yaml
**Symptoms**: Lock file conflicts after merge
**Cause**: Divergent dependency trees
**Solution**: Delete lock file and regenerate
```bash
rm pnpm-lock.yaml
pnpm install
```

### Issue: Build Fails After Update
**Symptoms**: TypeScript or build errors
**Cause**: Breaking changes in @kit packages
**Solution**: Check migration guide for version
```bash
# Review changes in problem package
git log -p packages/@kit/[package]/
```

### Issue: Database Migration Conflicts
**Symptoms**: Schema out of sync
**Cause**: Conflicting schema modifications
**Solution**: Use declarative schema merge
```bash
# Generate fresh schema from both sources
supabase db diff --schema public > local.sql
git show makerkit/main:supabase/schemas/ > upstream.sql
# Manually merge SQL files
```

## See Also

- [[update-makerkit]]: Automated update command implementation
- [[migrations]]: Database migration patterns
- [[git-aliases]]: Git workflow shortcuts