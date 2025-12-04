# Bug Fix: Payload CMS Database Connection SSL Certificate Error

**Related Diagnosis**: #877 (REQUIRED)
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Configuration conflict between connection string `sslmode=disable` parameter and explicit `ssl: false` passed to pg-pool. Under certain runtime conditions (module caching, hot reload), pg still attempts SSL negotiation despite both settings.
- **Fix Approach**: Standardize SSL configuration by removing `sslmode=disable` from DATABASE_URI connection string and rely exclusively on explicit adapter configuration.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Payload CMS fails to connect to local Supabase PostgreSQL database in development with error:
```
Error: self-signed certificate in certificate chain
```

This occurs despite:
1. `sslmode=disable` in the DATABASE_URI connection string
2. Explicit `ssl: false` passed to pg-pool adapter configuration
3. Direct `psql` connections working correctly

The conflict between these two SSL configurations causes pg-pool to attempt SSL negotiation anyway, particularly during hot reloads or module caching scenarios.

For full details, see diagnosis issue #877.

### Solution Approaches Considered

#### Option 1: Remove `sslmode=disable` from DATABASE_URI ⭐ RECOMMENDED

**Description**: Clean the connection string by removing the SSL mode parameter and rely entirely on the explicit SSL configuration passed to pg-pool adapter.

**Pros**:
- Single source of truth for SSL configuration (the adapter config)
- Eliminates configuration conflicts and ambiguity
- Simpler to debug and understand
- Follows pg-pool best practices
- Reduces connection string complexity

**Cons**:
- Minor: one additional environment variable to update

**Risk Assessment**: low - Supabase local development doesn't enforce SSL, so `ssl: false` alone works reliably.

**Complexity**: simple - one line change in environment file.

#### Option 2: Set `ssl: { rejectUnauthorized: false }` Even When SSL Disabled

**Description**: Modify adapter config to set SSL object with `rejectUnauthorized: false` instead of `ssl: false`.

**Pros**:
- Keeps `sslmode=disable` in connection string (no env changes)
- Explicitly tells pg to not verify certificate authority

**Cons**:
- Leaves redundant `sslmode=disable` parameter in connection string
- More complex SSL configuration than needed for development
- Doesn't address root cause (configuration conflict)
- Could confuse future developers about why two SSL settings exist

**Why Not Chosen**: This is a band-aid that doesn't address the underlying configuration conflict. Option 1 is cleaner and more maintainable.

#### Option 3: Use Different Connection Strings for Dev/Production

**Description**: Keep both configurations but use separate DATABASE_URI values based on environment.

**Why Not Chosen**: Unnecessary complexity. Development environment doesn't need SSL at all.

### Selected Solution: Remove `sslmode=disable` from DATABASE_URI

**Justification**:
- Eliminates configuration conflict entirely
- Makes adapter SSL configuration the single source of truth
- Simpler and more maintainable long-term
- Follows pg-pool best practices
- Requires minimal change (one environment variable update)
- Works reliably for both local development and production scenarios

**Technical Approach**:
1. Update `.env.development` to remove `sslmode=disable` parameter from DATABASE_URI
2. Verify adapter config already correctly handles SSL based on environment
3. Test local development connection
4. Verify no regressions

**Architecture Changes**: None - only configuration update.

**Migration Strategy**: No data migration needed. Connection string format change is transparent to the application.

## Implementation Plan

### Affected Files

- `apps/payload/.env.development` - Remove `sslmode=disable` from DATABASE_URI connection string
- `apps/payload/src/lib/database-adapter-singleton.ts` - Already has correct SSL handling logic; no changes needed

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Environment Configuration

Update the DATABASE_URI in `.env.development` by removing the `sslmode=disable` query parameter.

- Remove `?schema=payload&sslmode=disable`
- Replace with `?schema=payload` (keep the schema parameter, remove SSL mode)
- Verify connection string format is valid

**Why this step first**: Environment configuration must be correct before testing the connection.

#### Step 2: Verify Adapter Configuration

Review `apps/payload/src/lib/database-adapter-singleton.ts` to confirm SSL handling is correct:

- Line 170-182: `shouldEnableSSL()` correctly returns `false` for development
- Line 194-200: `sslConfig` correctly sets `ssl: false` for development
- Line 206-210: Pool configuration correctly passes `ssl` setting

**Expected**: All SSL logic should remain unchanged - adapter already handles this correctly.

#### Step 3: Test Local Connection

Start the local development environment and verify Payload CMS connects successfully:

```bash
# Ensure Supabase is running
npx supabase start

# Start development server
pnpm dev

# Verify no SSL certificate errors in console
# Navigate to a page that fetches Payload CMS content
# e.g., /home/course/lessons/the-who
```

**Expected Result**: Payload CMS connects without SSL errors, pages load content successfully.

#### Step 4: Verify No Regressions

Test that production SSL configuration still works correctly:

- Check adapter logs show `sslEnabled=true` when NODE_ENV=production
- Verify adapter logs show correct SSL reasoning (NODE_ENV=production)
- Confirm no SSL-related errors in test suite

#### Step 5: Run Validation Commands

Execute full code quality checks:

```bash
pnpm typecheck
pnpm lint
pnpm format
pnpm test:unit
```

## Testing Strategy

### Unit Tests

The existing database adapter is already tested. No new unit tests needed as this is purely a configuration change.

**Test coverage**:
- ✅ SSL is disabled in development (existing test)
- ✅ SSL is enabled in production (existing test)
- ✅ Connection string is parsed correctly (existing test)

### Integration Tests

Test the actual Payload CMS connection:

- ✅ Payload CMS connects successfully in development
- ✅ Database queries work without SSL errors
- ✅ Page that fetches CMS content returns data successfully

### E2E Tests

No E2E test changes needed. Existing tests will verify functionality:

- ✅ Pages using Payload CMS content render correctly
- ✅ No console errors related to SSL certificates
- ✅ Content loads and displays properly

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start local Supabase with `npx supabase start`
- [ ] Run `pnpm dev` and wait for all servers to start
- [ ] Navigate to `/home/course/lessons/the-who` (or similar CMS content page)
- [ ] Verify page loads without errors
- [ ] Check browser console - no SSL certificate errors
- [ ] Check server logs - no "self-signed certificate in certificate chain" errors
- [ ] Verify Payload CMS admin panel loads at `http://localhost:3020/admin`
- [ ] Try creating/editing CMS content to verify database write operations work
- [ ] Stop dev server and verify clean shutdown

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Connection String Format Error**: Malformed connection string after removal of `sslmode=disable`
   - **Likelihood**: low - simple parameter removal
   - **Impact**: high - would break database connection
   - **Mitigation**: Verify connection string format before committing; test immediately after

2. **Environment Variable Not Updated in Other Locations**: `sslmode=disable` might be duplicated elsewhere
   - **Likelihood**: low - only in .env files typically
   - **Impact**: medium - connection might still fail if other configs have it
   - **Mitigation**: Search for `sslmode` in codebase before fix; verify only in .env.development

3. **Production SSL Configuration Regression**: Change somehow affects production SSL handling
   - **Likelihood**: very low - only changing development environment
   - **Impact**: high - production wouldn't work
   - **Mitigation**: Adapter logic is unchanged; test production config explicitly

**Rollback Plan**:

If this fix causes issues in production:
1. Revert `.env.development` to include `?schema=payload&sslmode=disable`
2. Restart development server
3. Verify connection works again

**Monitoring** (if needed):
- Monitor database connection errors in local development logs
- Verify no "certificate" errors in server logs
- Check Payload CMS is accessible and responsive

## Performance Impact

**Expected Impact**: none

This is a pure configuration change with no performance implications. Connection timeout and pool settings remain the same.

## Security Considerations

**Security Impact**: none - local development environment.

- Development Supabase doesn't use SSL
- Production still uses SSL with correct configuration
- Change only affects development environment

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# With sslmode=disable in DATABASE_URI:
pnpm dev

# Try to access Payload CMS page
# Expected: "self-signed certificate in certificate chain" error
```

**Expected Result**: SSL certificate error appears when trying to fetch CMS content.

### After Fix (Bug Should Be Resolved)

```bash
# Update .env.development to remove sslmode=disable

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Start development environment
pnpm dev

# Verify in browser: http://localhost:3000/home/course/lessons/the-who
# Should load without SSL errors
```

**Expected Result**: All commands succeed, page loads content without errors, zero SSL certificate errors in logs.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Check production build with SSL enabled
NODE_ENV=production pnpm typecheck

# Verify adapter configuration handles both dev and production
pnpm test:unit -- database-adapter
```

## Dependencies

### New Dependencies

No new dependencies required.

### Environment Variables

**Remove**:
- `?sslmode=disable` from DATABASE_URI (keep everything else)

**Keep**:
- All other environment variables remain unchanged
- DATABASE_URI still includes `?schema=payload`

**Example**:
```bash
# Before:
DATABASE_URI=postgresql://postgres:postgres@localhost:54522/postgres?schema=payload&sslmode=disable

# After:
DATABASE_URI=postgresql://postgres:postgres@localhost:54522/postgres?schema=payload
```

## Database Changes

**Migration needed**: no

No database schema or migration changes required. This is purely a connection configuration update.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required. This is a development environment-only change.

**Feature flags needed**: no

**Backwards compatibility**: maintained

- No breaking changes to the codebase
- Only affects how local development connects to Supabase
- Production SSL configuration unchanged

## Success Criteria

The fix is complete when:
- [ ] `.env.development` DATABASE_URI no longer contains `sslmode=disable`
- [ ] Connection string is valid: `postgresql://postgres:postgres@localhost:54522/postgres?schema=payload`
- [ ] `pnpm dev` starts without SSL certificate errors
- [ ] Payload CMS content pages load successfully
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Manual testing checklist complete
- [ ] No regressions in existing tests

## Notes

**Implementation Notes**:
- This is a minimal change that fixes the root cause of the SSL configuration conflict
- The adapter code already handles SSL correctly; only environment configuration needs updating
- Consider documenting why we don't include `sslmode` in development connection strings (eliminates redundant configuration)

**Related Documentation**:
- Payload CMS Database Adapter: `apps/payload/src/lib/database-adapter-singleton.ts`
- Environment Configuration: `apps/payload/.env.development`
- Supabase Local Development: Supabase documentation for local PostgreSQL configuration

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #877*
