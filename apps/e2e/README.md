# E2E Tests

## Overview

This E2E test suite uses a **dedicated Supabase instance** specifically for testing, completely isolated from the development database. This ensures:

- ✅ No port conflicts between development and E2E databases
- ✅ Consistent test data across test runs
- ✅ Parallel CI/CD job execution without interference
- ✅ Clean database state for reliable testing

## Quick Start

```bash
# 1. Setup E2E database (first time only)
cd apps/e2e
pnpm supabase start     # Start dedicated E2E Supabase instance
pnpm supabase db reset  # Apply migrations and seed test data

# 2. Run tests
pnpm test:auth  # Run auth tests with automatic setup
pnpm test       # Run all tests
```

## Dedicated E2E Database Setup

### Port Configuration

The E2E database runs on **different ports** than the development database to allow both to run simultaneously:

| Service | Development Ports | E2E Ports | Purpose |
|---------|------------------|-----------|---------|
| API Gateway | 54321 | **55321** | Main Supabase API endpoint |
| Database | 54322 | **55322** | PostgreSQL database |
| Studio | 54323 | **55323** | Supabase Studio UI |
| Inbucket Web | 54324 | **55324** | Email testing interface |
| Inbucket SMTP | 54325 | **55325** | SMTP server for emails |
| Inbucket POP3 | 54326 | **55326** | POP3 email retrieval |
| Analytics | 54327 | **55327** | Analytics service |

### Environment Variables

The E2E tests use dedicated environment variables (prefixed with `E2E_`):

```bash
# Copy the example file
cp .env.example .env.local

# Key environment variables:
E2E_SUPABASE_URL="http://localhost:55321"
E2E_SUPABASE_ANON_KEY="your-anon-key-here"
E2E_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
E2E_DATABASE_URL="postgresql://postgres:postgres@localhost:55322/postgres"
```

### Database Management

```bash
# Start E2E Supabase instance
pnpm supabase start

# Stop E2E Supabase instance
pnpm supabase stop

# Reset database (apply migrations + seed data)
pnpm supabase db reset

# Check status
pnpm supabase status
```

### Test Data

The E2E database includes pre-configured test users that match the web application:

- `test1@slideheroes.com` - Standard test user
- `test2@slideheroes.com` - Secondary test user  
- `michael@slideheroes.com` - Admin test user

Test data is automatically seeded when running `pnpm supabase db reset`.

## Running Tests

### Test Scripts

- `pnpm test` - Run all tests with retries
- `pnpm test:auth` - Run authentication tests with automatic setup
- `pnpm test:quick` - Fail fast on first error
- `pnpm test:ui` - Open Playwright UI mode for debugging
- `pnpm test:headed` - Run tests with visible browser

### Automatic Setup

The `test:auth` script automatically:
1. Checks for port conflicts and cleans up if needed
2. Starts the E2E Supabase instance if not running
3. Verifies database schema and test data
4. Runs the authentication tests

## Troubleshooting

### Port Conflicts

If you encounter port conflict errors:

```bash
# Check what's using E2E ports
lsof -i :55321-55327

# Stop all E2E Supabase services
cd apps/e2e
pnpm supabase stop --project-id 2025slideheroes-e2e

# Force kill processes if needed
pkill -f "supabase.*55321"
```

### Database Issues

If tests fail due to missing tables or data:

```bash
# Reset the E2E database
cd apps/e2e
pnpm supabase db reset

# Verify database status
pnpm supabase status

# Check critical tables exist
docker exec -i supabase_db_2025slideheroes-e2e psql -U postgres -d postgres -c "\dt public.*"
```

### Email Testing

The E2E tests use a dedicated Inbucket instance for email testing:

```bash
# View E2E email interface
open http://127.0.0.1:55324

# Check for emails via API
curl -s http://127.0.0.1:55324/api/v1/messages | jq '.messages | length'

# Clear all emails
curl -X DELETE http://127.0.0.1:55324/api/v1/messages
```

### Running Both Databases Simultaneously

You can run both development and E2E databases at the same time:

```bash
# Terminal 1: Development database (ports 54321-54327)
cd apps/web
pnpm supabase start

# Terminal 2: E2E database (ports 55321-55327)
cd apps/e2e
pnpm supabase start

# Verify both are running
lsof -i :54321 # Should show development
lsof -i :55321 # Should show E2E
```

### CI/CD Configuration

For GitHub Actions, set these repository secrets:

```yaml
E2E_SUPABASE_URL: https://your-e2e-project.supabase.co
E2E_SUPABASE_ANON_KEY: eyJ...
E2E_SUPABASE_SERVICE_ROLE_KEY: eyJ...
E2E_DATABASE_URL: postgresql://postgres:[PASSWORD]@db.your-e2e-project.supabase.co:5432/postgres
```

## Architecture

### File Structure

```
apps/e2e/
├── supabase/           # E2E-specific Supabase configuration
│   ├── config.toml     # Port configuration (55321-55327)
│   ├── migrations/     # Database migrations (synced with main)
│   └── seeds/          # Test data seeds
├── scripts/
│   ├── test-setup.sh   # Automatic E2E environment setup
│   └── seed-test-data.sql # Test user and data seeding
├── tests/              # Playwright test files
├── .env.example        # Environment variable template
└── playwright.config.ts # Playwright configuration
```

### Key Components

- **Page Objects**: `tests/*/_.po.ts` - Reusable page interaction patterns
- **Mailbox Utility**: `tests/utils/mailbox.ts` - Email testing helpers
- **Test Setup**: `scripts/test-setup.sh` - Automatic environment preparation
- **Config**: `playwright.config.ts` - Test configuration and browser settings

## Best Practices

1. **Always use the E2E database for tests** - Never run E2E tests against development database
2. **Reset database before test runs** - Use `pnpm supabase db reset` for clean state
3. **Check port availability** - Ensure ports 55321-55327 are free before starting
4. **Use test data consistently** - Rely on seeded test users, don't create random data
5. **Clean up after tests** - Tests should restore initial state when possible

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Port already in use" | Stop existing E2E Supabase: `pnpm supabase stop` |
| "Table does not exist" | Reset database: `pnpm supabase db reset` |
| "Emails not arriving" | Check Inbucket at http://127.0.0.1:55324 |
| "Tests timeout" | Verify E2E Supabase is running: `pnpm supabase status` |
| "Permission denied" | Check service role key in `.env.local` |

## Support

For issues specific to E2E testing setup, check:
- This README for troubleshooting steps
- GitHub Issues with label `e2e`
- Supabase logs: `pnpm supabase logs`
