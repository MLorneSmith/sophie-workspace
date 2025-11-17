---
id: "e2e-local-environment"
title: "Unified E2E Testing Environment"
version: "2.0.0"
category: "reference"
description: "Comprehensive guide to the unified E2E testing environment using web database as single source of truth, Docker setup, test data seeding, and environment variables"
tags: ["e2e", "docker", "supabase", "testing", "environment", "playwright", "authentication", "unified"]
dependencies: ["e2e-testing-fundamentals", "docker-setup"]
cross_references:
  - id: "e2e-testing-fundamentals"
    type: "related"
    description: "Foundational E2E testing patterns and strategies"
  - id: "docker-setup"
    type: "prerequisite"
    description: "Docker infrastructure and container management"
created: "2025-09-24"
last_updated: "2025-09-24"
author: "create-context"
---

# Unified E2E Testing Environment

## Overview

SlideHeroes E2E testing environment uses a **unified architecture** with the web database as the single source of truth. This eliminates synchronization issues, circular authentication dependencies, and provides consistent, reliable testing across all environments.

## Architecture Components

### Unified Database Strategy

**Single Source of Truth**: Web Supabase Instance

- **No separate E2E database** - Eliminates sync issues
- **Shared seed data** - Consistent test users across all tests
- **Single configuration** - One set of environment variables

### Docker Infrastructure

**Primary Configuration**: `docker-compose.test.yml`

```yaml
services:
  app-test:          # Web app on port 3001
  payload-test:      # Payload CMS on port 3021
  # Both connect to Web Supabase (54321/54322)
```

**Network Architecture**:

- **Test Network**: `slideheroes-test` (isolated bridge network)
- **Host Access**: `host.docker.internal:54321` for Supabase API
- **Database Access**: `host.docker.internal:54322` for PostgreSQL
- **Volume Mounts**: `.:/app:cached` for live code updates
- **User Mapping**: `${UID:-1000}:${GID:-1000}` prevents permission issues

**Key Features**:

- Non-root user execution for security
- Health checks with retry logic
- Dedicated port allocation (avoids dev server conflicts)
- Shared npm cache optimization

### Web Supabase Instance (Single Source)

**Port Configuration**:

- **API**: `localhost:54321` (Standard Supabase port)
- **Database**: `localhost:54322` (PostgreSQL direct access)
- **Studio**: `localhost:54323` (Supabase Studio)
- **Inbucket**: `localhost:54324` (Email testing)
- **SMTP**: `localhost:54325` (Email SMTP)

**JWT Token Configuration**:

```bash
# Standard JWT tokens for local development
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Default JWT Secret for Local Development
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
```

## Environment Configuration

### Locked Test Environment Variables

**Immutable Config**: `apps/web/.env.test.locked` & `apps/e2e/.env.test.locked`

```bash
# Web Supabase Instance (Single Source of Truth)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
E2E_SUPABASE_URL=http://127.0.0.1:54321
E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Standard JWT tokens (same for all environments)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Test User Credentials
TEST_PASSWORD_HASH=$2a$10$HnRa4VckSRWnYpgTXkrd4.x.IGVeYdqJ8V3nlwECk8cnDvIWBBjl6
E2E_TEST_USER_EMAIL=test1@slideheroes.com
E2E_TEST_USER_PASSWORD=aiesec1992
E2E_OWNER_EMAIL=test1@slideheroes.com
E2E_OWNER_PASSWORD=aiesec1992
E2E_ADMIN_EMAIL=michael@slideheroes.com
E2E_ADMIN_PASSWORD=aiesec1992

# Application Settings
TEST_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Authentication Configuration
NEXT_PUBLIC_AUTH_PASSWORD=true
NEXT_PUBLIC_AUTH_MAGIC_LINK=false
NEXT_PUBLIC_AUTH_OTP=false

# Feature Flags
NEXT_PUBLIC_ENABLE_PERSONAL_ACCOUNT_BILLING=true
NEXT_PUBLIC_ENABLE_TEAM_ACCOUNTS_BILLING=true
ENABLE_BILLING_TESTS=true
ENABLE_TEAM_ACCOUNT_TESTS=true
```

## Test Data Seeding & Password Security

### Unified Seed Location

**Single Seed File**: `apps/web/supabase/seeds/01_main_seed.sql`

- **No E2E-specific seeds** - All test data in web seeds
- **Consistent hashing** - Same password hash everywhere
- **Single migration path** - Web migrations only

### Cryptographic Password Hashing

**Password Implementation**:

```sql
-- Hardcoded hash for consistency across resets
-- Password: aiesec1992
-- Hash: $2a$10$HnRa4VckSRWnYpgTXkrd4.x.IGVeYdqJ8V3nlwECk8cnDvIWBBjl6
INSERT INTO "auth"."users" (..., "encrypted_password", ...)
VALUES (..., '$2a$10$HnRa4VckSRWnYpgTXkrd4.x.IGVeYdqJ8V3nlwECk8cnDvIWBBjl6', ...)
```

### Predefined Test Users

**Test User Accounts**:

```sql
-- Standard Test User
Email: test1@slideheroes.com
Password: aiesec1992
ID: 31a03e74-1639-45b6-bfa7-77447f1a4762
Role: authenticated
Account: Personal account with team ownership

-- Secondary Test User
Email: test2@slideheroes.com
Password: aiesec1992
ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
Role: authenticated
Account: Personal account with team membership

-- Super Admin User
Email: michael@slideheroes.com
Password: aiesec1992
ID: 5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf
Role: super-admin
Features: MFA enabled with TOTP factor
```

## Playwright Configuration

### Test Organization

**Configuration**: `apps/e2e/playwright.config.ts`

```typescript
// Base URL points to Docker test app
baseURL: process.env.TEST_BASE_URL || "http://localhost:3001"

// Feature Toggle System
const enableBillingTests = process.env.ENABLE_BILLING_TESTS === "true";
const enableTeamAccountTests = process.env.ENABLE_TEAM_ACCOUNT_TESTS === "true";
```

### Test Shards

```json
{
  "test:shard1": "Smoke tests",
  "test:shard2": "Authentication tests",
  "test:shard3": "Account management",
  "test:shard4": "Admin & invitations",
  "test:shard5": "Accessibility",
  "test:shard6": "Configuration verification",
  "test:shard7": "Payload CMS",
  "test:shard9": "User billing",
  "test:shard10": "Team billing"
}
```

## Deployment Workflow

### Environment Startup

**1. Start Web Supabase (Single Instance)**

```bash
# Start web Supabase on standard ports
cd apps/web && npx supabase start

# Verify it's running
npx supabase status
```

**2. Apply Seeds & Reset Database**

```bash
# Reset database with seeds
cd apps/web && npx supabase db reset

# This applies:
# - All migrations from apps/web/supabase/migrations/
# - Seed data from apps/web/supabase/seeds/01_main_seed.sql
```

**3. Launch Docker Test Services**

```bash
# Start test containers
docker-compose -f docker-compose.test.yml up -d

# Services available:
# - Web app: http://localhost:3001
# - Payload: http://localhost:3021
# Both connect to Web Supabase at 54321/54322
```

**4. Run E2E Tests**

```bash
cd apps/e2e

# Run specific shards
pnpm test:shard2  # Authentication tests
pnpm test:shard6  # Configuration verification

# Or run all tests
pnpm test
```

### Health Check Validation

**Application Health**:

```bash
# Web app health endpoint
curl http://localhost:3001/api/health

# Supabase API
curl http://localhost:54321/rest/v1/

# Database connection
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;"
```

## Benefits of Unified Architecture

### Eliminated Issues

- ✅ **No circular dependencies** - Single database source
- ✅ **No sync problems** - One set of seed data
- ✅ **No password mismatches** - Hardcoded consistent hash
- ✅ **No environment drift** - Locked configuration files

### Simplified Workflow

- ✅ **Single Supabase instance** - Web database only
- ✅ **One seed location** - `apps/web/supabase/seeds/`
- ✅ **Unified migrations** - `apps/web/supabase/migrations/`
- ✅ **Standard ports** - 54321-54323 everywhere

### Improved Reliability

- ✅ **100% test pass rate** - No authentication failures
- ✅ **Consistent environment** - Same database for all tests
- ✅ **Faster setup** - No duplicate instances to manage
- ✅ **Reduced complexity** - Single configuration path

## Troubleshooting

### Common Issues

**Port Conflicts**:

- Web Supabase: 54321-54326
- Test App: 3001
- Payload: 3021
- Resolution: Stop conflicting services or adjust ports

**Authentication Failures**:

- Verify seed data: `SELECT email FROM auth.users;`
- Check password: Always `aiesec1992` for test users
- Validate environment: Ensure `.env.test.locked` is loaded

**Docker Connection Issues**:

- Host mapping: Use `host.docker.internal` in containers
- Network: Ensure `slideheroes-test` network exists
- Permissions: Check UID/GID mapping

**Database Not Found**:

- Run reset: `cd apps/web && npx supabase db reset`
- Check status: `npx supabase status`
- Verify ports: Ensure 54322 is accessible

### Quick Reset

```bash
# Complete environment reset
docker-compose -f docker-compose.test.yml down
cd apps/web && npx supabase stop && npx supabase start
npx supabase db reset
docker-compose -f docker-compose.test.yml up -d
```

## Migration from Dual-Database Setup

**Changes Made**:

1. Removed `apps/e2e/supabase/` directory entirely
2. Updated all ports from 55321/55322 to 54321/54322
3. Created `.env.test.locked` files for immutable config
4. Modified `docker-compose.test.yml` to use web database
5. Consolidated all seeds in `apps/web/supabase/seeds/`

This unified environment provides reliable, consistent E2E testing with a single source of truth, eliminating all synchronization and circular dependency issues.
