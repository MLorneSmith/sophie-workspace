---
# Identity
id: "vercel-deployment-guide"
title: "Vercel Deployment Guide for Web App and Payload CMS"
version: "2.0.0"
category: "implementation"

# Discovery
description: "Comprehensive guide for deploying monorepo applications with Next.js and Payload CMS to Vercel production environments"
tags: ["vercel", "deployment", "nextjs", "payload-cms", "monorepo", "ci-cd", "production", "devops"]

# Relationships
dependencies: ["project-architecture", "cicd-llm-context"]
cross_references:
  - id: "cicd-pipeline-design"
    type: "related"
    description: "Complete CI/CD pipeline architecture and workflows"
  - id: "database-migrations"
    type: "prerequisite"
    description: "Database setup and migration strategies"
  - id: "environment-management"
    type: "related"
    description: "Environment variable management across deployments"

# Maintenance
created: "2025-01-05"
last_updated: "2025-09-15"
author: "create-context"
---

# Vercel Deployment Guide for Web App and Payload CMS

## Overview

This guide provides comprehensive instructions for deploying both the Payload CMS and Next.js web application to Vercel from a monorepo structure. It covers deployment architecture, performance optimization, troubleshooting, and production best practices based on real-world patterns and Vercel platform capabilities.

## Key Concepts

- **Monorepo Deployment**: Separate Vercel projects for each application with Turborepo integration
- **Build Optimization**: Up to 66% faster builds with ISR and caching strategies
- **Edge Functions**: 1MB limit, global distribution, 25ms cold start
- **Serverless Functions**: Up to 3008MB memory, regional deployment, configurable timeouts
- **Environment Management**: 64KB total limit, 5KB for edge functions, hierarchical configuration
- **Zero-Downtime Deployment**: Automatic rollback, preview deployments, branch protection

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Deployment Architecture](#deployment-architecture)
4. [Build Configuration](#build-configuration)
5. [Deploying Payload CMS](#deploying-payload-cms)
6. [Deploying Web App](#deploying-web-app)
7. [Environment Variables](#environment-variables)
8. [Database Configuration](#database-configuration)
9. [Performance Optimization](#performance-optimization)
10. [CI/CD Integration](#cicd-integration)
11. [Monitoring & Rollback](#monitoring--rollback)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deployment, ensure you have:

- Vercel account (Pro or Enterprise for advanced features)
- Supabase project with database credentials
- Git repository with monorepo structure
- Access to third-party services (Stripe, Resend, etc.)
- Domain configuration (optional but recommended)

## Project Structure

This monorepo uses Turborepo with the following structure:

```
/
├── apps/
│   ├── web/               # Next.js web application
│   │   └── vercel.json    # Web-specific Vercel config
│   └── payload/           # Payload CMS application
│       └── vercel.json    # Payload-specific Vercel config
├── packages/              # Shared packages
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # PNPM workspace config
```

## Deployment Architecture

### Rendering Patterns

1. **Static Site Generation (SSG)**
   - Build time: ~5.5 minutes for 1000 pages
   - Best for: Marketing pages, documentation
   - Cache: Immutable, instant global

2. **Incremental Static Regeneration (ISR)**
   - Build time: 66% faster than SSG
   - Best for: Dynamic content with cache
   - Revalidation: On-demand or time-based

3. **Server-Side Rendering (SSR)**
   - Build time: Minimal
   - Best for: Personalized content
   - Performance: Regional with edge middleware

### Function Types

| Type | Memory | Timeout | Size Limit | Cold Start | Use Case |
|------|--------|---------|------------|------------|----------|
| Edge | 128MB | 30s | 1MB | 25ms | Authentication, redirects |
| Serverless | 3008MB | 60s (Pro) | 50MB | 300ms | API routes, data processing |
| Background | 3008MB | 300s | 250MB | N/A | Long-running tasks |

## Build Configuration

### Web App Configuration (apps/web/vercel.json)

```json
{
  "buildCommand": "pnpm turbo run build --filter=web",
  "devCommand": "pnpm turbo run dev --filter=web",
  "installCommand": "pnpm install",
  "outputDirectory": ".next",
  "functions": {
    "app/api/generate-slides/route.ts": {
      "maxDuration": 60,
      "memory": 3008
    },
    "app/api/webhook/stripe/route.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Payload CMS Configuration (apps/payload/vercel.json)

```json
{
  "buildCommand": "pnpm turbo run build --filter=payload",
  "installCommand": "pnpm install",
  "outputDirectory": ".next",
  "functions": {
    "app/api/[...slug]/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

## Deploying Payload CMS

### Step 1: Database Preparation

```sql
-- Create Payload schema in Supabase
CREATE SCHEMA IF NOT EXISTS payload;

-- Grant permissions
GRANT ALL ON SCHEMA payload TO postgres;
GRANT USAGE ON SCHEMA payload TO anon, authenticated;
```

### Step 2: Create Vercel Project

```bash
# Using Vercel CLI
vercel link --project=slideheroes-payload

# Set root directory
vercel --cwd apps/payload

# Configure build settings
vercel env add DATABASE_URI production
vercel env add PAYLOAD_SECRET production
```

### Step 3: Environment Variables

```bash
# Required Payload CMS variables
DATABASE_URI=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?schema=payload&pgbouncer=true
PAYLOAD_SECRET=<generate-with-openssl-rand-base64-32>
PAYLOAD_PUBLIC_SERVER_URL=https://slideheroes-payload.vercel.app
PAYLOAD_PUBLIC_CORS_ORIGINS=https://slideheroes.com

# Storage Configuration
STORAGE_ADAPTER=vercelBlob
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>

# Email Configuration
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=noreply@slideheroes.com
```

### Step 4: Deploy

```bash
# Initial deployment
vercel deploy --prod --cwd apps/payload

# Verify deployment
curl https://slideheroes-payload.vercel.app/api/health
```

## Deploying Web App

### Step 1: Create Vercel Project

```bash
# Using Vercel CLI
vercel link --project=slideheroes-web

# Set root directory
vercel --cwd apps/web

# Import environment variables
vercel env pull .env.production
```

### Step 2: Configure Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Payload CMS Integration
CMS_CLIENT=payload
PAYLOAD_PUBLIC_SERVER_URL=https://slideheroes-payload.vercel.app
NEXT_PUBLIC_SITE_URL=https://slideheroes.com

# Third-Party Services
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-key>
STRIPE_SECRET_KEY=<stripe-secret>
STRIPE_WEBHOOK_SECRET=<webhook-secret>

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn>
SENTRY_AUTH_TOKEN=<sentry-token>
```

### Step 3: Deploy with Optimization

```bash
# Deploy with cache
vercel deploy --prod --cwd apps/web \
  --env TURBO_TOKEN=$TURBO_TOKEN \
  --env TURBO_TEAM=$TURBO_TEAM

# Enable ISR for dynamic pages
vercel --prod --prerender=false
```

## Environment Variables

### Variable Management Strategy

1. **Development**: Local `.env` files
2. **Preview**: Branch-specific variables
3. **Production**: Encrypted Vercel storage

### Security Best Practices

```typescript
// apps/web/lib/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  // Public variables (exposed to browser)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Server-only variables
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),

  // Optional with defaults
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
});

export const env = envSchema.parse(process.env);
```

### Variable Limits

| Scope | Size Limit | Count Limit | Notes |
|-------|------------|-------------|-------|
| Total | 64KB | 100 | All environments |
| Edge Functions | 5KB | 100 | Subset of total |
| Build Time | 32KB | 100 | Available during build |
| Secret Length | 32KB | Per variable | Encrypted storage |

## Database Configuration

### Supabase Connection Pooling

```typescript
// Use PgBouncer for serverless
const DATABASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.DATABASE_URL.replace(':5432', ':6543') + '&pgbouncer=true'
  : process.env.DATABASE_URL;
```

### Connection Limits

```typescript
// packages/database/config.ts
export const poolConfig = {
  max: 10,              // Max connections
  min: 2,               // Min connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 60000,
};
```

## Performance Optimization

### Build Optimization

```javascript
// next.config.js
module.exports = {
  // Enable SWC minification
  swcMinify: true,

  // Optimize imports
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}'
    },
    'lodash': {
      transform: 'lodash/{{member}}'
    }
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 1080, 1200, 1920],
    minimumCacheTTL: 31536000,
  },

  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
      config.plugins.push(new BundleAnalyzerPlugin());
    }
    return config;
  }
};
```

### Edge Middleware Optimization

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Early return for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static')) {
    return NextResponse.next();
  }

  // Geolocation-based routing
  const country = request.geo?.country || 'US';

  // A/B testing with cookies
  const variant = request.cookies.get('experiment-variant');

  // Performance: Keep middleware under 1MB
  return NextResponse.rewrite(
    new URL(`/${country}${request.nextUrl.pathname}`, request.url)
  );
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)']
};
```

### Caching Strategy

```typescript
// API Route caching
export async function GET(request: Request) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'max-age=3600',
    },
  });
}

// ISR with on-demand revalidation
export async function POST(request: Request) {
  const { path } = await request.json();

  try {
    await revalidatePath(path);
    return Response.json({ revalidated: true });
  } catch (err) {
    return Response.json({ revalidated: false }, { status: 500 });
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/production-deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Turbo Cache
        run: |
          echo "TURBO_REMOTE_CACHE_ENABLED=true" >> $GITHUB_ENV

      - name: Deploy to Vercel
        id: deploy
        run: |
          npx vercel deploy --prod \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --scope=${{ secrets.VERCEL_ORG_ID }} \
            --yes

      - name: Run E2E tests
        run: pnpm test:e2e --url=${{ steps.deploy.outputs.url }}
```

### Deployment Protection

```typescript
// scripts/ignore-build-step.sh
#!/bin/bash

# Skip builds for unchanged apps
if [[ "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then
  # Check if app has changes
  git diff HEAD^ HEAD --quiet -- apps/web
  if [ $? -eq 0 ]; then
    echo "🔵 No changes in apps/web, skipping build"
    exit 0
  fi
fi

echo "✅ Changes detected, proceeding with build"
exit 1
```

## Monitoring & Rollback

### Health Checks

```typescript
// app/api/healthcheck/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    payload: await checkPayloadCMS(),
  };

  const healthy = Object.values(checks).every(Boolean);

  return Response.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
```

### Auto-Rollback Configuration

```javascript
// vercel.json
{
  "functions": {
    "app/api/*/route.ts": {
      "maxDuration": 60,
      "memory": 1024,
      "runtime": "nodejs20.x"
    }
  },
  "monitoring": {
    "errorThreshold": 1,
    "latencyThreshold": 3000,
    "checkInterval": 60
  }
}
```

### Monitoring Integration

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

export function initMonitoring() {
  if (process.env.VERCEL_ENV === 'production') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.VERCEL_ENV,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Postgres(),
      ],
    });
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### Build Failures

**Issue**: `Cannot find module` errors

```bash
# Solution: Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

**Issue**: Out of memory during build

```javascript
// vercel.json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

#### Function Timeouts

**Issue**: API routes timing out

```typescript
// Increase timeout for specific routes
export const maxDuration = 60; // seconds

export async function POST(request: Request) {
  // Long-running operation
}
```

#### Database Connection Issues

**Issue**: Too many connections

```typescript
// Use connection pooling
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduced for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### CORS Errors

**Issue**: Cross-origin blocked

```typescript
// app/api/[...route]/route.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}
```

### Debug Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Inspect environment variables
vercel env ls production

# Rollback deployment
vercel rollback [deployment-url]

# Analyze bundle size
ANALYZE=true pnpm build
```

## Related Files

- `/apps/web/vercel.json`: Web app Vercel configuration
- `/apps/payload/vercel.json`: Payload CMS Vercel configuration
- `/.github/workflows/production-deploy.yml`: Production deployment workflow
- `/.github/actions/vercel-deploy/action.yml`: Reusable Vercel deployment action
- `/scripts/ignore-build-step.sh`: Build optimization script
- `/turbo.json`: Turborepo configuration with caching

## Common Patterns

### Preview Deployments

```bash
# Automatic preview for PRs
vercel --build-env NEXT_PUBLIC_IS_PREVIEW=true

# Comment preview URL on PR
vercel --no-wait | gh pr comment --body-file -
```

### Domain Configuration

```bash
# Add custom domain
vercel domains add slideheroes.com

# Configure subdomain for Payload
vercel domains add cms.slideheroes.com --project slideheroes-payload

# Set up redirects
vercel alias set slideheroes-web.vercel.app slideheroes.com
```

### Environment Promotion

```bash
# Promote preview to production
vercel promote [deployment-url]

# Copy environment variables
vercel env pull .env.production
vercel env push --environment=production
```

## See Also

- [[cicd-pipeline-design]]: Complete CI/CD architecture
- [[database-migrations]]: Database migration strategies
- [[payload-cms-setup]]: Payload CMS configuration
- [[nextjs-optimization]]: Next.js performance guide
- [[monitoring-setup]]: Production monitoring configuration
