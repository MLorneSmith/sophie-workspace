---
# Identity
id: "update-payload-version"
title: "Payload CMS Version Update Guide"
version: "2.0.0"
category: "pattern"

# Discovery
description: "Comprehensive guide for updating Payload CMS versions, managing dependencies, handling migrations, and resolving compatibility issues in the SlideHeroes project"
tags: ["payload", "cms", "version-update", "migration", "dependencies", "troubleshooting"]

# Relationships
dependencies: []
cross_references:
  - id: "payload-configuration"
    type: "related"
    description: "Configuration patterns for Payload CMS"
  - id: "database-migrations"
    type: "prerequisite"
    description: "Database migration strategies"

# Maintenance
created: "2025-01-05"
last_updated: "2025-09-15"
author: "create-context"
---

# Payload CMS Version Update Guide

## Overview

This comprehensive guide covers Payload CMS version updates in the SlideHeroes project. Payload CMS employs granular, field-level versioning with atomic rollbacks and Git-like branching capabilities. Version 3.0 represents a fundamental architectural shift to Next.js App Router with React Server Components, requiring careful migration planning.

## Key Concepts

- **Field-Level Versioning**: Every content change generates a new version record down to individual fields
- **Architectural Evolution**: v3.x uses Next.js native with React Server Components (ESM-only)
- **Database Adapter Patterns**: MongoDB requires data transformations; SQL databases need schema migrations
- **Plugin Ecosystem**: Tightly coupled to core versions with breaking changes between majors
- **Four-Step Migration**: Add → Backfill → Verify → Remove pattern for safe schema evolution

## Current Project Configuration

As of last update, the SlideHeroes project uses:

- **Payload CMS**: 3.53.0 (core)
- **Database Adapter**: @payloadcms/db-postgres@3.53.0
- **Framework Integration**: @payloadcms/next@3.54.0 (version mismatch - needs alignment)
- **Plugins**: All pinned to 3.53.0 except Next integration

## Files Requiring Updates

When updating Payload CMS versions, update these files in the SlideHeroes project:

### Primary Package Files

1. **Main Payload App**: `apps/payload/package.json`
2. **CMS Package**: `packages/cms/payload/package.json`
3. **Root Package**: `package.json` (workspace dependencies)

### Configuration Files

- `apps/payload/src/payload.config.ts` - Main Payload configuration
- Environment files: `.env`, `.env.development`, `.env.production`

## Payload Dependencies Matrix

### Core Dependencies

```json
{
  "payload": "3.53.0",
  "@payloadcms/db-postgres": "3.53.0",
  "@payloadcms/next": "3.53.0",  // Currently 3.54.0 - needs fix
  "@payloadcms/payload-cloud": "3.53.0",
  "@payloadcms/plugin-nested-docs": "3.53.0",
  "@payloadcms/richtext-lexical": "3.53.0",
  "@payloadcms/storage-s3": "3.53.0",
  "@payloadcms/translations": "3.53.0"
}
```

### Peer Dependencies

- **Next.js**: 15.5.2 (v14+ required for Payload 3.x)
- **React**: 19.1.1 (v18+ for RSC support)
- **Node.js**: ^18.20.2 || >=20.9.0

## Update Process

### 1. Pre-Update Checklist

```bash
# Check current versions
pnpm list payload @payloadcms/db-postgres @payloadcms/next

# Verify no uncommitted changes
git status

# Create backup branch
git checkout -b backup/pre-payload-update

# Check Payload changelog for breaking changes
# https://github.com/payloadcms/payload/blob/main/CHANGELOG.md
```

### 2. Version Alignment Update

```bash
# Fix version mismatches first
cd apps/payload
pnpm update @payloadcms/next@3.53.0  # Align with core version

# Or update all to new version
pnpm update payload@3.55.1 @payloadcms/db-postgres@3.55.1 @payloadcms/next@3.55.1
```

### 3. Update All Package Files

```bash
# Update using pnpm workspace commands
pnpm -r update payload@3.55.1
pnpm -r update @payloadcms/db-postgres@3.55.1
pnpm -r update @payloadcms/next@3.55.1
pnpm -r update @payloadcms/plugin-nested-docs@3.55.1
pnpm -r update @payloadcms/richtext-lexical@3.55.1
pnpm -r update @payloadcms/storage-s3@3.55.1
pnpm -r update @payloadcms/translations@3.55.1
pnpm -r update @payloadcms/payload-cloud@3.55.1
```

### 4. Install and Verify Dependencies

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Verify no peer dependency warnings
pnpm install --frozen-lockfile

# Check for duplicate packages
pnpm dedupe
```

### 5. Migration Execution

```bash
# Check migration status (if migrations exist)
cd apps/payload
pnpm payload migrate:status

# Generate migration for schema changes
pnpm payload migrate:create update-to-v355

# Run migrations
pnpm payload migrate

# For production
NODE_ENV=production pnpm payload migrate
```

### 6. Type Generation

```bash
# Regenerate Payload types
cd apps/payload
pnpm generate:types

# Sync types to other packages (custom script)
node scripts/sync-types.js
```

### 7. Testing

```bash
# Run development server
pnpm dev:test

# Run tests
pnpm test:run

# Verify build
pnpm build
```

### 8. Commit Changes

```bash
# Stage all package files
git add apps/payload/package.json packages/cms/payload/package.json pnpm-lock.yaml

# Commit with version info
git commit -m "chore: update Payload CMS to v3.55.1

- Update all @payloadcms packages to 3.55.1
- Align plugin versions with core
- Run migrations for schema changes"
```

## Migration Patterns

### Four-Step Safe Migration

For schema changes, follow this pattern to prevent data loss:

```typescript
// Step 1: ADD - Add new field without removing old
{
  name: 'newField',
  type: 'text',
  admin: {
    condition: ({ data }) => !data.oldField // Hide if old field exists
  }
}

// Step 2: BACKFILL - Migrate data
await payload.update({
  collection: 'items',
  where: { oldField: { exists: true } },
  data: ({ oldField }) => ({ newField: oldField })
})

// Step 3: VERIFY - Check data integrity
const unmigrated = await payload.find({
  collection: 'items',
  where: {
    oldField: { exists: true },
    newField: { exists: false }
  }
})

// Step 4: REMOVE - Delete old field after verification
// Remove oldField from schema
```

### Database-Specific Commands

```bash
# PostgreSQL migrations
pnpm payload migrate:create migration-name  # Create migration
pnpm payload migrate                        # Run pending
pnpm payload migrate:status                 # Check status
pnpm payload migrate:down                   # Rollback last
pnpm payload migrate:reset                  # Reset all

# MongoDB data transformations
pnpm payload migrate:create transform-data
# Edit migration file with transformation logic
pnpm payload migrate
```

## Troubleshooting

### Version Mismatch Errors

**Problem**: `Attempted import error: 'X' is not exported from 'payload'`

**Solution**:

```bash
# Ensure all Payload packages match versions
pnpm list @payloadcms

# Fix mismatches
pnpm update @payloadcms/db-postgres@3.55.1 @payloadcms/next@3.55.1
```

### React Context Errors

**Problem**: `Cannot destructure property 'config' of useContext`

**Solution**:

```bash
# Clear caches and reinstall
rm -rf .next node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Plugin Compatibility Issues

**Problem**: Plugin fails after upgrade

**Solution**:

1. Check plugin GitHub for compatibility updates
2. Review plugin changelog
3. Test in staging first
4. Consider alternatives if unmaintained

### Database Migration Failures

**Problem**: PostgreSQL migration fails with relation errors

**Solution**:

```bash
# Check current schema
pnpm payload migrate:status

# Create snapshot before changes
pg_dump $DATABASE_URI > backup_$(date +%Y%m%d).sql

# Run with verbose logging
DEBUG=payload:* pnpm payload migrate
```

### Build Failures

**Problem**: TypeScript errors after update

**Solution**:

```bash
# Regenerate types
pnpm generate:types

# Clear TypeScript cache
rm -rf apps/payload/tsconfig.tsbuildinfo

# Rebuild
pnpm build
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Payload Update Deployment
on:
  push:
    branches: [main]
    paths:
      - 'apps/payload/**'
      - 'packages/cms/**'
      - 'pnpm-lock.yaml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run migrations
        run: |
          cd apps/payload
          pnpm payload migrate:status
          pnpm payload migrate
        env:
          DATABASE_URI: ${{ secrets.DATABASE_URI }}
          PAYLOAD_SECRET: ${{ secrets.PAYLOAD_SECRET }}

      - name: Generate types
        run: |
          cd apps/payload
          pnpm generate:types

      - name: Build
        run: pnpm build

      - name: Run tests
        run: pnpm test:run
```

## Rollback Procedures

### Emergency Rollback

```bash
# 1. Stop application
pm2 stop payload-app

# 2. Rollback database migrations
cd apps/payload
pnpm payload migrate:down  # Last batch only

# 3. Restore code
git reset --hard previous-version-tag

# 4. Restore dependencies
git checkout package.json pnpm-lock.yaml
rm -rf node_modules
pnpm install

# 5. Restart application
pm2 start payload-app
```

### Gradual Rollback

```bash
# Rollback specific packages
pnpm add payload@3.53.0 @payloadcms/db-postgres@3.53.0

# Test in development
pnpm dev:test

# If stable, commit
git add -A && git commit -m "revert: rollback Payload to 3.53.0"
```

## Best Practices

1. **Version Alignment**: Keep all @payloadcms packages at the same version
2. **Pin Exact Versions**: Use exact versions (3.55.1) not ranges (^3.55.1)
3. **Test in Staging**: Always test updates in staging environment first
4. **Backup Before Updates**: Create database backups before major updates
5. **Monitor Plugin Compatibility**: Check plugin repos before updating
6. **Use pnpm**: Better dependency resolution than npm/yarn
7. **Document Changes**: Update this guide when patterns change

## Version Compatibility Reference

### Major Version Requirements

| Payload | Node.js | Next.js | React | Database |
|---------|---------|---------|-------|----------|
| 3.50.x+ | 18.20+/20+ | 14+ | 18+ | PostgreSQL/MongoDB |
| 3.30.x | 18+/20+ | 14+ | 18+ | PostgreSQL/MongoDB |
| 2.x | 16+/18+ | N/A | 17+ | MongoDB only |

### Breaking Changes Log

- **v3.54.0**: Forms plugin multi-tenant issues
- **v3.0.0**: Complete architecture shift to Next.js
- **v2.0.0**: Modular packages, database adapters

## Related Files

- `/apps/payload/package.json`: Main Payload app configuration
- `/apps/payload/src/payload.config.ts`: Payload configuration
- `/.github/workflows/deploy.yml`: CI/CD pipeline
- `/scripts/sync-types.js`: Type synchronization script

## Common Patterns

### Workspace-Wide Updates

```bash
# Update all workspace packages
pnpm -r update payload@latest

# Update specific workspace
pnpm --filter payload update @payloadcms/db-postgres@3.55.1
```

### Development Commands

```bash
# Payload-specific commands
pnpm payload generate:types     # Generate TypeScript types
pnpm payload generate:importmap  # Generate import map
pnpm payload migrate:create     # Create new migration
pnpm payload migrate            # Run migrations
```

## See Also

- [[database-migrations]]: Database migration strategies
- [[payload-configuration]]: Payload CMS configuration patterns
- [[ci-cd-deployment]]: Deployment pipelines
