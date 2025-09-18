# Payload CMS E2E Tests

Comprehensive end-to-end tests for Payload CMS with Supabase integration to catch runtime issues and ensure reliability.

## Test Coverage

### 🔐 Authentication Tests (`payload-auth.spec.ts`)

- ✅ First user creation flow
- ✅ Login/logout functionality
- ✅ Session management
- ✅ Invalid credential handling
- ✅ Concurrent login attempts
- ✅ Session persistence

### 📚 Collection Tests (`payload-collections.spec.ts`)

- ✅ Access all collections without errors
- ✅ Handle empty collections gracefully
- ✅ Create, Read, Update, Delete operations
- ✅ Search and pagination
- ✅ Validation error handling
- ✅ Bulk operations

### 🗄️ Database Tests (`payload-database.spec.ts`)

- ✅ Supabase connection verification
- ✅ Schema initialization checks
- ✅ Connection pool management
- ✅ UUID support validation
- ✅ Transaction rollback on errors
- ✅ RLS policy compliance
- ✅ Error recovery and resilience
- ✅ Concurrent update handling

## Common Issues These Tests Catch

1. **First User Creation Errors** - Database not initialized, schema missing
2. **Empty Collection Pages** - Missing data, permission issues, query errors
3. **Database Connection Issues** - Wrong credentials, network problems, pool exhaustion
4. **Schema Migration Issues** - Tables not created, missing columns
5. **Session Management Problems** - Auth not persisting, token expiry
6. **Validation Errors** - Required fields, data type mismatches
7. **Concurrent Access Issues** - Race conditions, deadlocks

## Prerequisites

1. **Payload CMS Running**

   ```bash
   cd apps/payload
   npm run dev
   ```

2. **Database Setup**
   - Ensure Supabase is running or configured
   - Run migrations if needed:

   ```bash
   cd apps/payload
   npm run payload migrate
   ```

3. **Environment Variables**
   Create `.env.test` in `apps/e2e/tests/payload/`:

   ```env
   PAYLOAD_URL=http://localhost:3020
   PAYLOAD_TEST_EMAIL=admin@test.payload.com
   PAYLOAD_TEST_PASSWORD=Admin123!@#
   ```

## Running the Tests

### Run All Payload Tests

```bash
# From project root
npx playwright test --config=apps/e2e/tests/payload/playwright.config.ts

# Or from the payload test directory
cd apps/e2e/tests/payload
npx playwright test
```

### Run Specific Test Suites

```bash
# Authentication tests only
npx playwright test payload-auth

# Collection tests only
npx playwright test payload-collections

# Database tests only
npx playwright test payload-database
```

### Run with UI Mode (Interactive Debugging)

```bash
npx playwright test --ui --config=apps/e2e/tests/payload/playwright.config.ts
```

### Run with Debug Mode

```bash
npx playwright test --debug --config=apps/e2e/tests/payload/playwright.config.ts
```

### Generate HTML Report

```bash
npx playwright show-report
```

## Test Configuration

The tests are configured to:

- Run sequentially to avoid database conflicts
- Use a single worker to prevent race conditions
- Capture screenshots and videos on failure
- Retry failed tests in CI (2 retries)
- Set appropriate timeouts for database operations

## Troubleshooting

### Tests Fail with "Database not initialized"

```bash
cd apps/payload
npm run payload migrate
npm run seed  # If you have seed data
```

### Tests Fail with "Cannot connect to Payload"

Ensure Payload is running on port 3020:

```bash
cd apps/payload
npm run dev
```

### Tests Fail with "First user already exists"

The tests handle this automatically, but you can reset:

```bash
# Reset your database (be careful in production!)
cd apps/payload
npm run db:reset  # If this script exists
```

### Tests are Flaky

- Increase timeouts in `playwright.config.ts`
- Check database connection stability
- Ensure no other processes are using port 3020

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Start Payload CMS
  run: |
    cd apps/payload
    npm run build
    npm run start &
    npx wait-on http://localhost:3020/api/health

- name: Run Payload E2E Tests
  run: npx playwright test --config=apps/e2e/tests/payload/playwright.config.ts
  env:
    CI: true
    PAYLOAD_URL: http://localhost:3020

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: payload-test-results
    path: |
      apps/e2e/tests/payload/playwright-report/
      apps/e2e/tests/payload/test-results/
```

## Writing New Tests

1. Create new spec files in this directory
2. Use the Page Object Models in `pages/`
3. Leverage test data helpers in `helpers/`
4. Follow the existing patterns for consistency

Example:

```typescript
import { test, expect } from '@playwright/test';
import { PayloadCollectionsPage } from './pages/PayloadCollectionsPage';

test('should do something specific', async ({ page }) => {
  const collectionsPage = new PayloadCollectionsPage(page);

  await collectionsPage.navigateToCollection('your-collection');
  // Your test logic here
});
```

## Maintenance

- Update Page Objects when UI changes
- Keep test data in `helpers/test-data.ts`
- Document new test patterns in this README
- Run tests before deploying to production

## Performance Benchmarks

Expected test execution times:

- Authentication suite: ~30 seconds
- Collections suite: ~45 seconds
- Database suite: ~40 seconds
- Full suite: ~2 minutes

If tests exceed these times, investigate:

- Database query performance
- Network latency
- Payload server response times
