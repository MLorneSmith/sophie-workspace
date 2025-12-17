# Feature: Better Stack Monitoring Integration with Health Endpoints

## Feature Description

Implement Better Stack uptime monitoring integration for SlideHeroes, including:

1. **Health Check Endpoints** - Create comprehensive health check endpoints that monitor internal services (Next.js app, Supabase database, Payload CMS, Docker health)
2. **Better Stack Integration** - Configure Better Stack free tier (10 monitors) to continuously monitor critical services
3. **Public Status Page** - Set up a public-facing status page at `status.slideheroes.com` showing current system status
4. **Footer Status Link** - Add a footer link on the main app pointing to the status page

This feature enables customers to:
- View real-time system status
- Check historical uptime and incident history
- Understand when issues are SlideHeroes vs. third-party services
- Feel confident in platform reliability

## User Story

As a **SlideHeroes customer**
I want to **view the current status of all SlideHeroes services**
So that **I can understand if issues I experience are SlideHeroes problems or network/external issues**

## Problem Statement

Currently, customers have no visibility into system status. When they experience issues, they don't know:
- Is SlideHeroes down?
- Is it a Supabase issue?
- Is it a network connectivity issue?
- When will services be restored?

This lack of transparency erodes trust and creates support overhead as customers contact support to check status. A public status page solves this by providing:
- Real-time visibility into service health
- Historical uptime metrics (SLA compliance)
- Incident communication channel
- Reduced support burden (customers can self-diagnose)

## Solution Statement

Implement a comprehensive status monitoring system by:

1. **Creating health endpoints** in the Next.js app that check:
   - Next.js app itself (readiness check)
   - Supabase database connectivity
   - Payload CMS availability
   - Docker container health (if applicable)

2. **Configuring Better Stack** to:
   - Monitor these health endpoints (HTTP checks)
   - Monitor third-party APIs used (OpenAI, Groq, Stripe, SendGrid, etc.)
   - Send alerts to team Slack when issues occur
   - Provide historical uptime data

3. **Setting up the status page** at:
   - Public domain: `status.slideheroes.com`
   - Shows component status in real-time
   - Displays incident history
   - Monthly uptime percentage

4. **Adding footer link** to:
   - Marketing site footer: "System Status"
   - App footer (if present): "System Status"
   - Links directly to status.slideheroes.com

This solution starts with Better Stack's free tier (10 monitors) and can scale to paid tiers as monitoring needs grow.

## Relevant Files

### Existing Files to Modify

- **`apps/web/app/layout.tsx`** - Root layout, add Supabase provider if needed
- **`apps/web/app/(marketing)/layout.tsx`** - Marketing layout where SiteFooter is used
- **`apps/web/app/(marketing)/_components/site-footer.tsx`** - Footer component, add status link
- **`apps/web/app/(marketing)/_components/site-footer-link-list.tsx`** - Footer link list component
- **`apps/web/app/home/layout.tsx`** - App layout, possibly add footer to authenticated app

### New Files to Create

- **`apps/web/app/api/health/route.ts`** - Root health check endpoint
- **`apps/web/app/api/health/database/route.ts`** - Database connectivity check
- **`apps/web/app/api/health/cms/route.ts`** - Payload CMS health check
- **`apps/web/app/api/health/_lib/checks.ts`** - Shared health check utilities
- **`apps/web/app/api/health/_lib/schemas.ts`** - Zod schemas for health response
- **`apps/web/app/(marketing)/_components/status-page-link.tsx`** - Reusable status link component (optional)
- **`.ai/guides/better-stack-setup.md`** - Setup guide for Better Stack configuration

### Configuration Files

- **`apps/web/.env.example`** - Add BETTER_STACK_API_KEY (optional, for manual API interactions)
- **`apps/web/.env.test`** - Copy example if created

## Impact Analysis

### Dependencies Affected

**Direct Dependencies:**
- `@kit/supabase/server-client` - Used for database health checks
- `@kit/shared/logger` - Logging health check results
- `next` - Route handlers and API responses

**Potential Dependencies to Add:**
- None required for MVP. Health checks use existing dependencies.

**Affected Features:**
- Footer component (marketing site) - Adding status link
- Status page visibility - New public feature

### Risk Assessment

**Risk Level: LOW**

**Justification:**
- **Well-understood patterns**: Health checks are a standard pattern used throughout the industry
- **Isolated changes**: New API routes don't affect existing functionality
- **No breaking changes**: All changes are additive; existing code remains unchanged
- **Minimal external dependencies**: Uses only existing packages
- **Graceful degradation**: If health checks fail, they simply report `unhealthy` status without breaking the app

**Specific Mitigations:**
- Health check endpoints are read-only (no mutations)
- Database health check uses single SELECT query (minimal resource impact)
- Health checks have short timeouts to prevent hanging
- Better Stack can be configured independently without affecting app behavior

### Backward Compatibility

- ✅ **Fully backward compatible**
- Existing API routes, components, and functionality remain unchanged
- New routes are additive only
- Footer link is new, doesn't change existing footer structure
- No database migrations or schema changes
- No breaking changes to any exports or public APIs

### Performance Impact

**Minimal Performance Impact:**

1. **Database**: Single lightweight SELECT query on health check (SELECT id FROM accounts LIMIT 1)
   - ~5-10ms per check
   - Executed once per 3 minutes (Better Stack free tier)
   - Negligible impact to overall query volume

2. **API Overhead**: Health check endpoints are lightweight and cacheable
   - Response time: ~50-100ms
   - Can be cached by CDN if desired

3. **Client-side**: Footer link addition has no performance impact
   - Static link, no JavaScript required

4. **Bundle Size**: No new dependencies, no bundle size impact

### Security Considerations

**Authentication/Authorization:**
- ✅ Health check endpoints are **public** (no authentication required)
- This is standard practice - status pages must be accessible to everyone
- No sensitive data exposed in health responses (status only, no internal details)

**Data Validation:**
- ✅ Health endpoints only return structured responses
- No request validation needed (health checks don't accept parameters)
- Response schema defined in Zod for type safety

**Potential Vulnerabilities:**
- Health check endpoints could be targeted for DDoS, but:
  - Better Stack manages traffic, not the app
  - Health checks are simple and fast (minimal resource usage)
  - Can be rate-limited at CDN level if needed
  - This is an accepted risk for public status pages

**Privacy/Compliance:**
- ✅ No sensitive data exposed
- Status page doesn't contain user information
- Complies with GDPR/privacy requirements

## Pre-Feature Checklist

- [x] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/better-stack-monitoring`
- [ ] Review existing health check patterns in codebase (found 3 existing endpoints)
- [ ] Identify all integration points (Better Stack website, DNS/domain config)
- [ ] Define success metrics (uptime monitoring active, status page live)
- [ ] Confirm feature doesn't duplicate existing functionality
- [ ] Verify all required dependencies are available (all present)
- [ ] Plan rollback strategy (independent service, easy disable)

## Documentation Updates Required

- **Technical docs**:
  - Create `.ai/guides/better-stack-setup.md` - Setup instructions for Better Stack
  - Update `CLAUDE.md` - Add monitoring/status page section
  - Add comments in health check endpoints

- **User-facing docs** (future):
  - Add status page link to help docs
  - Document what each status component means
  - Incident communication guidelines

- **Code documentation**:
  - JSDoc comments on health check routes
  - Inline comments explaining health check logic
  - Schema documentation for health responses

## Rollback Plan

**How to Disable the Feature:**

1. **Disable Better Stack monitoring**: Log into Better Stack, pause all monitors
2. **Remove status page link**: Remove status link from footer component
3. **Keep health endpoints**: Health endpoints can remain (they're harmless and useful for internal monitoring)
4. **Database**: No database changes, no migration rollback needed

**Monitoring for Issues:**

- Better Stack provides dashboard to monitor monitor health
- Check `/api/health` endpoint manually: `curl https://slideheroes.com/api/health`
- Monitor Slack alerts from Better Stack for false positives
- Log aggregation through `pino` logger to track health check patterns

**Graceful Degradation:**

- If Better Stack is down, status page is unavailable (not a problem - Better Stack is hosted separately)
- If health endpoints fail, Better Stack reports monitors as down (correct behavior)
- If footer link is broken, users simply won't see the status page link (no app breakage)

## Implementation Plan

### Phase 1: Foundation - Health Check Endpoints

Create the infrastructure for health monitoring without exposing it externally yet.

### Phase 2: Core Implementation - Better Stack Configuration

Configure Better Stack free tier and connect to health endpoints.

### Phase 3: Integration - Status Page Frontend

Add the status page link to the footer and ensure proper branding/integration.

## Step by Step Tasks

### Task 1: Create Health Check Endpoint Utilities

**Objective**: Build reusable health check functions for database and external services

**Files to Create:**
- `apps/web/app/api/health/_lib/schemas.ts` - Zod schemas for health responses
- `apps/web/app/api/health/_lib/checks.ts` - Health check implementations

**Details:**

1. Define Zod schemas for:
   - Individual service health (status: "healthy" | "unhealthy", message?: string)
   - Aggregate health response (status, timestamp, services: {})

2. Implement check functions:
   - `checkDatabase()` - Query `accounts` table
   - `checkPayloadCMS()` - HTTP GET to `/api/cms-health` (or similar)
   - `checkSupabaseAuth()` - Test Supabase auth endpoint
   - `checkDependencies()` - Verify critical dependencies

3. Add error handling:
   - Try/catch with timeout handling
   - Return unhealthy status instead of throwing errors
   - Log failures with context

**Validation Commands:**
```bash
# Test the schemas and checks in isolation
pnpm --filter web test:unit -- health/_lib
```

---

### Task 2: Create Root Health Endpoint

**Objective**: Create `/api/health` endpoint that aggregates all health checks

**Files to Create:**
- `apps/web/app/api/health/route.ts` - Main health endpoint

**Details:**

1. Create GET route handler:
   - Aggregate health checks from all services
   - Return 200 with status="healthy" if all checks pass
   - Return 503 with status="unhealthy" if any check fails
   - Include timestamp and individual service statuses

2. Use `enhanceRouteHandler`:
   ```typescript
   export const GET = enhanceRouteHandler(
     async () => {
       // aggregate health checks
     },
     { auth: false } // Public endpoint
   );
   ```

3. Response format:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-12-16T12:00:00Z",
     "services": {
       "database": { "status": "healthy" },
       "cms": { "status": "healthy" },
       "dependencies": { "status": "healthy" }
     }
   }
   ```

**Validation Commands:**
```bash
# Manually test the endpoint
curl http://localhost:3000/api/health

# With logging
curl -v http://localhost:3000/api/health

# Verify response format
curl http://localhost:3000/api/health | jq .
```

---

### Task 3: Create Database Health Check Endpoint

**Objective**: Create `/api/health/database` for granular database monitoring

**Files to Create/Modify:**
- `apps/web/app/api/health/database/route.ts` - Database-specific health check

**Details:**

1. Create GET route:
   - Query Supabase directly: `SELECT COUNT(*) FROM accounts LIMIT 1`
   - Measure query latency
   - Return database-specific status

2. Response format:
   ```json
   {
     "status": "healthy",
     "latency_ms": 8,
     "connection": "active",
     "timestamp": "2025-12-16T12:00:00Z"
   }
   ```

3. Error handling:
   - Network timeout → status: "unhealthy", message: "Connection timeout"
   - Query error → status: "unhealthy", message: "Database error"

**Validation Commands:**
```bash
curl http://localhost:3000/api/health/database | jq .
```

---

### Task 4: Create CMS Health Check Endpoint (Optional)

**Objective**: Create `/api/health/cms` to monitor Payload CMS

**Files to Create/Modify:**
- `apps/web/app/api/health/cms/route.ts` - CMS health check

**Details:**

1. Create GET route:
   - HTTP request to Payload health endpoint (TBD based on Payload setup)
   - Or query `payload_preferences` table as a proxy

2. Response format:
   ```json
   {
     "status": "healthy",
     "latency_ms": 150,
     "timestamp": "2025-12-16T12:00:00Z"
   }
   ```

3. Note: This may depend on how Payload CMS is deployed in this project

**Validation Commands:**
```bash
curl http://localhost:3000/api/health/cms | jq .
```

---

### Task 5: Add Status Link to Marketing Footer

**Objective**: Add "System Status" link to marketing site footer

**Files to Modify:**
- `apps/web/app/(marketing)/_components/site-footer.tsx` - Add status link data
- `apps/web/app/(marketing)/_components/site-footer-link-list.tsx` - Verify structure

**Details:**

1. In `site-footer.tsx`:
   - Add new constant for status page link:
     ```typescript
     const STATUS_LINKS = [
       {
         label: 'System Status',
         href: 'https://status.slideheroes.com',
         target: '_blank'
       }
     ];
     ```
   - Add to footer grid (possibly as new section or in COMPANY section)

2. Update footer layout if needed:
   - Consider adding new column for "Support" or "Trust" section
   - Or add to existing section

3. Styling:
   - Use existing Tailwind classes
   - Consistent with existing footer links

**Validation Commands:**
```bash
# Verify footer renders without errors
pnpm --filter web dev

# Navigate to marketing site and verify link appears
# Check link points to correct URL
# Verify link opens in new tab (if target="_blank")
```

---

### Task 6: Add Status Link to App Footer (If Applicable)

**Objective**: Add status link to authenticated app footer (if one exists)

**Files to Modify:**
- `apps/web/app/home/layout.tsx` - Check if footer exists in app
- Create footer component if needed

**Details:**

1. Investigate existing app layout:
   - Check if there's a footer in authenticated app
   - If not, decide if one is needed (status link alone might not justify it)

2. If footer exists:
   - Add status link similar to marketing footer
   - Use consistent styling

3. If no footer:
   - Consider adding to header or other visible location
   - Or skip for now (marketing site link is sufficient for MVP)

**Validation Commands:**
```bash
# Log in to app and verify footer link appears
pnpm --filter web dev
# Navigate to authenticated app
# Check if link is visible and clickable
```

---

### Task 7: Test Health Endpoints

**Objective**: Ensure health endpoints work correctly under various conditions

**Files to Create:**
- `apps/web/app/api/health/__tests__/health.test.ts` - Unit tests for health endpoints

**Details:**

1. Create unit tests:
   - Test GET /api/health returns 200 with status: "healthy"
   - Test database check catches connection errors
   - Test CMS check handles timeouts gracefully
   - Test response schema validation

2. Create integration tests:
   - Test full health check flow
   - Test error scenarios
   - Test timeout scenarios

3. Tests should verify:
   - Response shape matches Zod schema
   - Status codes are correct (200/503)
   - All health check functions are called
   - Error handling works as expected

**Validation Commands:**
```bash
# Run health endpoint tests
pnpm --filter web test:unit -- health

# Run with coverage
pnpm --filter web test:unit -- health --coverage
```

---

### Task 8: Document Health Endpoints

**Objective**: Create setup guide for Better Stack configuration

**Files to Create:**
- `.ai/guides/better-stack-setup.md` - Complete setup instructions

**Details:**

1. Create guide with:
   - Better Stack account setup steps
   - Health endpoint URLs to monitor
   - Alert configuration (Slack channel)
   - Status page domain setup
   - Free tier limit explanations
   - How to upgrade to paid tier

2. Document:
   - Health endpoint request/response format
   - Which endpoints to monitor in free tier (prioritized list)
   - Troubleshooting steps

**Files to Create:**
- `.ai/guides/better-stack-setup.md`

**Validation Commands:**
```bash
# Verify guide is readable and complete
cat .ai/guides/better-stack-setup.md
```

---

### Task 9: Update CLAUDE.md

**Objective**: Document status page feature in project guidelines

**Details:**

1. Add new section under "Infrastructure" or "Monitoring":
   - Status page overview
   - Health endpoint documentation
   - How to add new monitors
   - Links to Better Stack setup guide

2. Keep documentation concise and reference the detailed guide

**Files to Modify:**
- `CLAUDE.md`

**Validation Commands:**
```bash
# Verify CLAUDE.md syntax is correct
pnpm format:fix
```

---

### Task 10: Manual Better Stack Configuration

**Objective**: Configure Better Stack with health endpoints

**Details:**

This is a manual step (not automated in code):

1. Go to https://betterstack.com
2. Create account (free tier available)
3. Create monitors for:
   - `/api/health` (main endpoint)
   - `/api/health/database` (database specific)
   - `/api/health/cms` (if applicable)
   - Major AI APIs if desired (OpenAI, Groq, Anthropic)

4. Configure alerts:
   - Slack integration to development channel
   - Email alerts to team

5. Set up status page:
   - Custom domain or Better Stack subdomain
   - Add components (Web App, Database, CMS, etc.)
   - Enable public access

6. Document process in guide (Task 8)

**Validation Commands:**
```bash
# Test that better stack can reach your endpoints
# Navigate to Better Stack dashboard and verify green status on monitors

# Manual curl test
curl -I https://slideheroes.com/api/health
# Should return 200 OK
```

---

### Task 11: Run Full Validation Suite

**Objective**: Ensure all code changes work correctly with zero regressions

**Details:**

Run comprehensive validation to ensure:
- Type safety is maintained
- All tests pass
- Formatting is correct
- No regressions in existing code

**Validation Commands:**

```bash
# Type checking - must pass with zero errors
pnpm typecheck

# Linting and formatting - must pass
pnpm lint:fix
pnpm format:fix

# Unit tests - must pass with no failures
pnpm --filter web test:unit

# Build verification - must succeed
pnpm build

# Manual smoke test - verify endpoints work
curl -s http://localhost:3000/api/health | jq .
curl -s http://localhost:3000/api/health/database | jq .

# Verify footer link exists on marketing site
pnpm --filter web dev
# Navigate to http://localhost:3000 and verify "System Status" link in footer
```

---

## Testing Strategy

### Unit Tests

**Scope**: Health check functions and schema validation

**Coverage:**
- `checkDatabase()` function
  - ✅ Successful database connection
  - ✅ Database connection timeout
  - ✅ Database query error
  - ✅ Returns correct schema shape

- `checkPayloadCMS()` function
  - ✅ Successful HTTP check
  - ✅ HTTP timeout
  - ✅ HTTP error response
  - ✅ Returns correct schema shape

- Zod schemas
  - ✅ Valid health response passes validation
  - ✅ Invalid response fails validation
  - ✅ Missing required fields fails validation

**Test File**: `apps/web/app/api/health/__tests__/health.test.ts`

### Integration Tests

**Scope**: Full health endpoint behavior under various conditions

**Coverage:**
- GET /api/health returns 200 when all services healthy
- GET /api/health returns 503 when any service unhealthy
- GET /api/health returns correct response structure
- GET /api/health/database returns database-specific info
- GET /api/health/cms returns CMS-specific info (if applicable)
- Concurrent health checks work without race conditions
- Error handling doesn't expose sensitive data

**Test File**: `apps/web/app/api/health/__tests__/integration.test.ts`

### E2E Tests

**Scope**: User-facing functionality (status link in footer)

**Coverage:**
- Status page link appears in marketing footer
- Status page link has correct href
- Status page link opens in new tab
- Link is clickable and accessible
- Footer layout doesn't break with new link

**Test File**: `apps/e2e/tests/status-page.spec.ts`

### Edge Cases

Test these scenarios:

1. **Database Connection Issues**
   - Supabase is down
   - Network timeout
   - Invalid credentials
   - → Should return unhealthy status, not crash

2. **Slow Services**
   - Database responds in 2+ seconds
   - HTTP timeout configured to 5 seconds
   - → Should still return healthy (within timeout)

3. **Concurrent Requests**
   - Multiple health checks at same time
   - → Should not cause race conditions or resource exhaustion

4. **Invalid Responses**
   - Payload CMS returns HTML instead of JSON
   - → Health check should handle gracefully

5. **Network Failures**
   - Cannot reach Supabase
   - Cannot reach Payload CMS
   - → Should timeout and return unhealthy

## Acceptance Criteria

1. ✅ Health check endpoints exist and return correct response format
   - GET `/api/health` returns 200/503 with status field
   - GET `/api/health/database` returns database-specific health
   - All endpoints return valid Zod schema responses

2. ✅ Database health check works correctly
   - Connects to Supabase without credentials exposure
   - Queries lightweight SELECT statement
   - Returns latency information
   - Fails gracefully on connection errors

3. ✅ Status page link appears in footer
   - Marketing site footer includes "System Status" link
   - Link points to `https://status.slideheroes.com`
   - Link opens in new tab
   - Footer layout remains responsive

4. ✅ Better Stack is configured and monitoring
   - At least 3 monitors active (main health, database, optional CMS)
   - Status page is live and publicly accessible
   - Slack alerts configured for development team
   - All acceptance criteria below for Better Stack config

5. ✅ Zero regressions in existing functionality
   - All existing tests pass
   - Type checking passes
   - Linting/formatting passes
   - Build succeeds
   - Existing components/pages not affected

6. ✅ Documentation is complete
   - Health endpoint behavior documented
   - Better Stack setup guide created
   - CLAUDE.md updated with status page info
   - Code comments explain health check logic

7. ✅ Feature is deployable
   - All changes committed with proper commit messages
   - Feature branch created from `dev`
   - Ready for PR review

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

```bash
# 1. Type safety check - must pass with zero errors
pnpm typecheck

# 2. Code quality checks - must pass all
pnpm lint:fix
pnpm format:fix

# 3. Unit tests - must pass with zero failures
pnpm --filter web test:unit

# 4. Unit tests for health endpoints specifically
pnpm --filter web test:unit -- health

# 5. Build production bundle - must succeed
pnpm build

# 6. Development server health check
# Start server in background
pnpm --filter web dev > /tmp/web-dev.log 2>&1 &
sleep 10  # Wait for startup

# 7. Manual endpoint tests
curl -s http://localhost:3000/api/health | jq '.' || echo "Health endpoint failed"
curl -s http://localhost:3000/api/health/database | jq '.' || echo "Database endpoint failed"

# 8. Verify response schema
curl -s http://localhost:3000/api/health | jq '.status' # Should output "healthy" or "unhealthy"
curl -s http://localhost:3000/api/health | jq '.timestamp' # Should output ISO timestamp

# 9. Verify status codes
# Healthy response should return 200
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "503" ]; then echo "✓ Health endpoint returns correct status code"; fi

# 10. Verify footer link in marketing site
# Navigate to http://localhost:3000 and search HTML for "System Status" and "status.slideheroes.com"
curl -s http://localhost:3000 | grep -q "status.slideheroes.com" && echo "✓ Status link found in footer" || echo "✗ Status link not found"

# 11. Verify footer component doesn't break layout
curl -s http://localhost:3000 | grep -q "site-footer" && echo "✓ Footer component renders" || echo "✗ Footer missing"

# 12. Verify no console errors
# This requires E2E test, see Task 7

# 13. Final check - all tests pass
pnpm --filter web test:unit && echo "✓ All unit tests passed"

# 14. Type check one more time to be sure
pnpm typecheck && echo "✓ Type checking passed"
```

## Notes

### Future Enhancements

1. **Better Stack Paid Tier**: When monitoring needs grow beyond 10 monitors
   - Upgrade to Team plan ($29/mo)
   - Reduce check interval from 3 minutes to 30 seconds
   - Add more monitors for AI APIs and third-party services
   - Add SMS/phone call alerts

2. **Atlassian Statuspage Alternative**: If customer communication needs grow
   - Current Better Stack status page is basic but functional
   - Future: Could upgrade to Atlassian for:
     - Automatic third-party service status sync
     - Advanced incident management
     - Audience-specific status pages

3. **Custom Status Page**: If branding requirements are strict
   - Could build custom status page using Better Stack API
   - Current Better Stack page is sufficient for MVP

4. **Real User Monitoring (RUM)**: Track actual user experience metrics
   - Complement synthetic monitoring with real data
   - Track Core Web Vitals
   - Better Stack has RUM capabilities

5. **Advanced Monitoring**: As product scales
   - Multi-region monitoring from different geographic locations
   - SSL certificate expiry monitoring
   - Cron job heartbeat monitoring
   - Docker container health checks

### Dependencies Analysis

**No new dependencies required** - Uses existing packages:
- `@kit/supabase/server-client` - Already present
- `@kit/shared/logger` - Already present
- `zod` - Already present

### Deployment Notes

- Health endpoints are independent service - can be deployed without affecting app
- Status page at `status.slideheroes.com` is separate service (Better Stack hosted)
- Footer link is static, requires no runtime configuration
- No environment variables required for MVP

### Support & Maintenance

- Better Stack provides admin dashboard for managing monitors
- Team can easily add/remove/pause monitors as needed
- Status page provides incident communication channel
- Reduces support load by providing customer self-service
