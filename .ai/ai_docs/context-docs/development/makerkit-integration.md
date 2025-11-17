---
id: "makerkit-integration"
title: "MakerKit Integration"
version: "1.0.0"
category: "implementation"
description: "Template integration, upstream syncing, merge automation for maintaining SlideHeroes fork of MakerKit"
tags: ["makerkit", "template", "upstream", "merge-automation", "git", "monorepo", "@kit-packages"]
created: "2025-11-14"
last_updated: "2025-11-14"
author: "consolidation"
---

# MakerKit Integration

This document consolidates MakerKit template usage, upstream synchronization patterns, and merge automation strategies for maintaining SlideHeroes as a customized fork of the MakerKit Next.js Supabase Turbo template.

## Overview

SlideHeroes is built on the **MakerKit Next.js Supabase Turbo template** (v2.13.1), a comprehensive SaaS starter that provides authentication, multi-tenancy, billing, and administrative features. This document explains how we use MakerKit as our upstream foundation while customizing for presentation intelligence needs.

**Template Repository**: `github.com/makerkit/next-supabase-saas-kit-turbo`
**Current Version**: v2.13.1
**Architecture**: Turborepo monorepo with Next.js 15 + Supabase + TypeScript

## Template Architecture

### Package System (@kit)

MakerKit organizes functionality into scoped workspace packages (`@kit/*`) that provide modular, reusable components:

```typescript
// Core UI components
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

// Authentication utilities
import { requireUser } from '@kit/supabase/require-user';
import { createAccountsApi } from '@kit/accounts/api';

// Billing integration
import { createBillingApi } from '@kit/billing/api';
```

### Architecture Layers

1. **Foundation Layer**: Next.js 15, Supabase, TypeScript, Tailwind CSS
2. **Framework Layer**: Authentication, RLS, multi-tenancy, billing
3. **Component Layer**: UI components, forms, layouts, patterns
4. **Feature Layer**: Account management, admin panels, user flows
5. **Customization Layer**: SlideHeroes-specific features and business logic

### Multi-Tenant Account System

- **Personal Accounts**: Individual user workspaces
- **Team Accounts**: Collaborative workspaces with role-based access
- **Account Switching**: Seamless context switching between accounts
- **Invitation System**: Team member management with roles

## Implementation Patterns

### Authentication & Authorization

```typescript
// Server Components - User requirement
import { requireUser } from '@kit/supabase/require-user';

export default async function ProtectedPage() {
  const user = await requireUser();
  // Component logic
}

// Client Components - Auth state
import { useUserProvider } from '@kit/supabase/hooks';

function ClientComponent() {
  const { user, accounts } = useUserProvider();
  // Component logic
}
```

### Component Patterns

```typescript
// Conditional rendering with If component
import { If } from '@kit/ui/if';

<If condition={isLoading} fallback={<Content />}>
  <Spinner />
</If>

// Internationalization with Trans
import { Trans } from '@kit/ui/trans';

<Trans
  i18nKey="user:welcomeMessage"
  values={{ name: user.name }}
/>
```

### Form Handling

```typescript
// Schema definition (reusable)
export const CreateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

// Form component
const form = useForm({
  resolver: zodResolver(CreateNoteSchema),
});

const onSubmit = (data) => {
  startTransition(async () => {
    await toast.promise(createNoteAction(data), {
      loading: 'Creating...',
      success: 'Created!',
      error: 'Failed!',
    });
  });
};
```

## Upstream Synchronization

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

## Merge Automation

### Automated Conflict Resolution

Automated merge conflict resolution system reduces conflicts from 50-80 to <5 per upstream sync.

**Enable automation:**

```bash
# Enable automated formatting conflict resolution
git config --global merge.formatting.driver 'biome format --write %A && exit 0'
git config --global rerere.enabled true
git config --global rerere.autoupdate true
```

### Custom Merge Drivers

Configured in `.gitattributes`:

```bash
# Formatting conflicts - auto-resolved
*.js *.ts *.tsx *.jsx merge=formatting

# SlideHeroes features - keep ours
**/kanban/** **/presentation/** **/slides/** merge=ours

# Template areas - take theirs
**/auth/** **/billing/** README.md merge=theirs

# Package management - smart merge
package.json merge=json-union
pnpm-lock.yaml merge=ours
```

### Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Manual conflicts | 50-80 | 2-5 | 90-96% reduction |
| Resolution time | 2-4 hours | 10-15 min | 85-90% faster |
| Formatting conflicts | 40-60 | 0 | 100% automated |

## Breaking Changes Management

### Major Version Migrations

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

### Package Updates

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

## SlideHeroes Extensions

### Custom Features

We extend MakerKit in these areas:

1. **Presentation Intelligence**: AI-powered slide analysis and recommendations
2. **Content Management**: Payload CMS integration for slide templates
3. **Analytics**: Custom analytics beyond MakerKit's base offering
4. **Workflow Automation**: Presentation creation and optimization workflows

### Package Customization Hierarchy

1. **Use @kit packages** when functionality exists
2. **Extend @kit packages** for additional features
3. **Create custom packages** only for SlideHeroes-specific needs
4. **Override carefully** with documented rationale

## Troubleshooting

### Merge Conflicts in pnpm-lock.yaml

**Symptoms**: Lock file conflicts after merge
**Solution**: Delete lock file and regenerate

```bash
rm pnpm-lock.yaml
pnpm install
```

### Build Fails After Update

**Symptoms**: TypeScript or build errors
**Solution**: Check migration guide for version

```bash
# Review changes in problem package
git log -p packages/@kit/[package]/
```

### Database Migration Conflicts

**Symptoms**: Schema out of sync
**Solution**: Use declarative schema merge

```bash
# Generate fresh schema from both sources
supabase db diff --schema public > local.sql
git show makerkit/main:supabase/schemas/ > upstream.sql
# Manually merge SQL files
```

## Environment Variable Updates

```bash
# Identify new required variables
diff .env.example .env.local | grep "^<"

# Add with safe defaults
echo "NEW_VAR=default_value" >> .env.local
```

## Best Practices

### Template Adherence

- **Leverage @kit packages** before building custom solutions
- **Follow MakerKit naming conventions** for consistency
- **Use template's TypeScript patterns** for type safety
- **Adopt template's testing approaches** for maintainability

### Customization Guidelines

- **Document all deviations** from template patterns
- **Create feature flags** for experimental customizations
- **Maintain upgrade compatibility** through careful abstraction
- **Test template updates** in isolated environments first

### Performance Optimization

- **Use MakerKit's LazyRender** for expensive components
- **Follow RLS performance patterns** for database queries
- **Leverage template's caching strategies** in Turbo pipeline
- **Apply template's bundle optimization** techniques

## Essential MakerKit Components

```typescript
// Conditional rendering
import { If } from '@kit/ui/if';

// Internationalization
import { Trans } from '@kit/ui/trans';

// User avatars with fallbacks
import { ProfileAvatar } from '@kit/ui/profile-avatar';

// Toast notifications
import { toast } from '@kit/ui/sonner';

// Performance optimization
import { LazyRender } from '@kit/ui/lazy-render';
```

## Related Files

- [Architecture Overview](./architecture-overview.md) - System architecture
- [Server Actions](./server-actions.md) - Server action patterns
- `.gitattributes` - Merge automation configuration
- `/packages/@kit/*` - Core MakerKit packages
- `CLAUDE.md` - Main project documentation
