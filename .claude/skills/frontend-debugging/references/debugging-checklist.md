# Frontend Debugging Checklist

Comprehensive troubleshooting patterns for common front-end issues in React/Next.js applications.

## Visual & Rendering Issues

### Blank/White Page

**Symptoms**: Page loads but shows nothing or just white screen.

**Checklist**:
- [ ] Check browser console for JavaScript errors
- [ ] Verify the component is being rendered (`console.log` in component)
- [ ] Check if Suspense boundary is missing a fallback
- [ ] Verify data fetching isn't throwing unhandled errors
- [ ] Check for CSS `display: none` or `visibility: hidden`
- [ ] Verify z-index isn't hiding content behind another element

**Commands**:
```bash
# Capture console errors
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3000 --console-logs

# Check for hidden elements
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3000 --dump-html /tmp/page.html
grep -i "display.*none\|visibility.*hidden" /tmp/page.html
```

### Layout Broken/Shifted

**Symptoms**: Elements out of position, overlapping, or misaligned.

**Checklist**:
- [ ] Check for Cumulative Layout Shift (CLS) with Lighthouse
- [ ] Verify image dimensions are specified (width/height)
- [ ] Check for dynamic content without reserved space
- [ ] Verify CSS Grid/Flexbox properties
- [ ] Check for conflicting Tailwind classes
- [ ] Verify responsive breakpoints

**Commands**:
```bash
# Check CLS score
.claude/skills/frontend-debugging/scripts/lighthouse_audit.sh \
  http://localhost:3000 --categories performance --summary

# Inspect element structure
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3000 --selector ".broken-layout" --dump-html /tmp/element.html
```

### CSS Not Applied

**Symptoms**: Styles missing or not taking effect.

**Checklist**:
- [ ] Verify CSS file is imported
- [ ] Check for typos in class names
- [ ] Check CSS specificity conflicts
- [ ] Verify Tailwind classes are in the safelist (if dynamic)
- [ ] Check for `!important` overrides
- [ ] Verify PostCSS/Tailwind is processing the file

**Commands**:
```bash
# Search for class definition
rg "broken-class" apps/web/app --glob "*.css"
rg "broken-class" apps/web/app --glob "*.tsx"

# Check if class is in compiled CSS
rg "broken-class" apps/web/.next/static/css/
```

## JavaScript & Runtime Errors

### Uncaught TypeError

**Symptoms**: "Cannot read property 'x' of undefined/null"

**Checklist**:
- [ ] Add null checks or optional chaining (`?.`)
- [ ] Verify data is loaded before accessing
- [ ] Check async data fetching completes
- [ ] Verify object shape matches expected type
- [ ] Check for array access on non-array

**Fix Pattern**:
```typescript
// Before
const value = data.nested.property;

// After
const value = data?.nested?.property;

// Or with fallback
const value = data?.nested?.property ?? 'default';
```

### React Hooks Errors

**Symptoms**: "Hooks can only be called inside function components"

**Checklist**:
- [ ] Verify hook is called at component top level
- [ ] Check hook isn't inside conditional/loop
- [ ] Verify component name starts with capital letter
- [ ] Check for duplicate React versions

**Commands**:
```bash
# Check for duplicate React
pnpm ls react

# Find hook usage
rg "use[A-Z]" apps/web/app --glob "*.tsx" -A 2 -B 2
```

### Hydration Mismatch

**Symptoms**: "Text content did not match" or "Hydration failed"

**Checklist**:
- [ ] Avoid rendering based on `typeof window`
- [ ] Don't use `Date`, `Math.random()` during SSR
- [ ] Check for browser extensions modifying DOM
- [ ] Verify localStorage/sessionStorage access is client-only
- [ ] Check for conditional rendering differences

**Fix Pattern**:
```typescript
// Client-only rendering
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null; // or skeleton

return <ClientOnlyComponent />;
```

**Commands**:
```bash
# Capture hydration warnings
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3000 --console-logs 2>&1 | grep -i "hydrat"
```

## Performance Issues

### Slow Initial Load

**Symptoms**: High LCP (Largest Contentful Paint), slow first render.

**Checklist**:
- [ ] Run Lighthouse performance audit
- [ ] Check bundle size with analyzer
- [ ] Verify images are optimized (next/image)
- [ ] Check for render-blocking resources
- [ ] Verify code splitting is effective
- [ ] Check server response time

**Commands**:
```bash
# Full performance audit
.claude/skills/frontend-debugging/scripts/lighthouse_audit.sh \
  http://localhost:3000 --categories performance --summary

# Analyze bundle
pnpm --filter web analyze
```

### Slow Interactions

**Symptoms**: High TBT (Total Blocking Time), laggy UI.

**Checklist**:
- [ ] Check for expensive computations on main thread
- [ ] Verify large lists use virtualization
- [ ] Check for excessive re-renders
- [ ] Verify event handlers are debounced/throttled
- [ ] Check for synchronous storage operations

**Fix Pattern**:
```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Debounce handlers
const debouncedHandler = useMemo(
  () => debounce(handleChange, 300),
  []
);
```

### Memory Leaks

**Symptoms**: Increasing memory usage, eventual slowdown.

**Checklist**:
- [ ] Verify useEffect cleanup functions
- [ ] Check for unsubscribed event listeners
- [ ] Verify intervals/timeouts are cleared
- [ ] Check for retained references in closures
- [ ] Verify WebSocket connections are closed

**Fix Pattern**:
```typescript
useEffect(() => {
  const subscription = api.subscribe(handler);
  const timer = setInterval(poll, 1000);

  return () => {
    subscription.unsubscribe();
    clearInterval(timer);
  };
}, []);
```

## Network & API Issues

### Failed API Requests

**Symptoms**: 4xx/5xx errors, network failures.

**Checklist**:
- [ ] Check request URL is correct
- [ ] Verify authentication headers
- [ ] Check CORS configuration
- [ ] Verify request body format
- [ ] Check server logs for errors
- [ ] Verify environment variables

**Commands**:
```bash
# Capture network requests
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3000 --network --output /tmp/network.json

# Check for failed requests
jq '.network[] | select(.status >= 400)' /tmp/network.json
```

### CORS Errors

**Symptoms**: "Access-Control-Allow-Origin" errors in console.

**Checklist**:
- [ ] Verify API allows the origin
- [ ] Check for missing CORS headers
- [ ] Verify preflight (OPTIONS) is handled
- [ ] Check if credentials mode is correct
- [ ] Verify API proxy configuration

**Fix Pattern** (Next.js API proxy):
```typescript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/external/:path*',
        destination: 'https://external-api.com/:path*',
      },
    ];
  },
};
```

### Slow API Responses

**Symptoms**: Long wait times for data, loading spinners.

**Checklist**:
- [ ] Check network timing in waterfall
- [ ] Verify database query performance
- [ ] Check for N+1 query problems
- [ ] Verify caching is effective
- [ ] Check for unnecessary data fetching

**Commands**:
```bash
# Analyze request timing
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3000 --network --output /tmp/network.json

jq '.network[] | {url: .url, timing: .timing}' /tmp/network.json
```

## Next.js Specific Issues

### RSC (React Server Components) Errors

**Symptoms**: "Client component cannot be rendered on server"

**Checklist**:
- [ ] Verify "use client" directive is present
- [ ] Check for browser APIs in server components
- [ ] Verify props are serializable
- [ ] Check component import paths

### Static Generation Failures

**Symptoms**: Build errors, missing pages.

**Checklist**:
- [ ] Verify dynamic route params
- [ ] Check generateStaticParams
- [ ] Verify data fetching doesn't fail
- [ ] Check for environment variables at build time

### Middleware Issues

**Symptoms**: Redirects not working, auth failures.

**Checklist**:
- [ ] Verify matcher patterns
- [ ] Check middleware execution order
- [ ] Verify response headers
- [ ] Check for infinite redirect loops

## Accessibility Issues

### Missing Alt Text

**Commands**:
```bash
.claude/skills/frontend-debugging/scripts/lighthouse_audit.sh \
  http://localhost:3000 --categories accessibility --summary
```

### Keyboard Navigation

**Checklist**:
- [ ] Verify focus indicators are visible
- [ ] Check tab order is logical
- [ ] Verify interactive elements are focusable
- [ ] Check for keyboard traps

### Screen Reader

**Checklist**:
- [ ] Verify ARIA labels on icons/buttons
- [ ] Check heading hierarchy
- [ ] Verify form labels are associated
- [ ] Check for proper landmark regions

## E2E Authentication Failures

### Cookie Mismatch (Port 3000 vs 3001)

**Symptoms**: Tests pass global setup but fail authentication; protected pages redirect to login despite valid auth states.

**Root Cause**: Auth cookie names are derived from the Supabase URL hostname:
- Docker test server (`host.docker.internal`) → `sb-host-auth-token`
- Dev server (`127.0.0.1`) → `sb-127-auth-token`

Running E2E tests against port 3000 (dev server) when auth states were generated for port 3001 (Docker) causes silent authentication failures.

**Diagnostic Commands**:
```bash
# Check which port is being used
grep -i "baseURL" apps/e2e/playwright.config.ts

# Check if Docker test container is running
curl -s http://localhost:3001/api/health && echo "Docker ready" || echo "Docker not running"

# Check what cookies are in auth state files
jq '.cookies[] | {name: .name, domain: .domain}' apps/e2e/.auth/test1@slideheroes.com.json

# Look for cookie name in auth states
grep -o 'sb-[^-]*-auth-token' apps/e2e/.auth/*.json | sort | uniq
```

**Resolution Checklist**:
- [ ] Start Docker test environment: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Wait for health check: `curl http://localhost:3001/api/health`
- [ ] Run E2E tests against port 3001 (default): `pnpm --filter e2e test`
- [ ] If must use port 3000, set `E2E_SERVER_SUPABASE_URL=http://127.0.0.1:54521`

**Prevention**:
- Always use Docker test environment for E2E tests
- The global setup will warn if running against port 3000
- See SKILL.md "⚠️ CRITICAL: E2E Auth State Requirements" section

### Auth State File Issues

**Symptoms**: "Cannot find auth state file", authentication redirects even with `--auth` flag.

**Checklist**:
- [ ] Check auth state files exist: `ls -la apps/e2e/.auth/`
- [ ] Regenerate auth states: `cd apps/e2e && npx playwright test --project=setup`
- [ ] Ensure Supabase is running: `pnpm supabase:web:status`
- [ ] Check test users exist in database

### Session Expired

**Symptoms**: Auth worked previously but now fails; sporadic authentication failures.

**Checklist**:
- [ ] Auth states contain JWT tokens that expire
- [ ] Delete and regenerate: `rm -rf apps/e2e/.auth/*.json && cd apps/e2e && npx playwright test --project=setup`
- [ ] Check system clock is correct (JWT validation is time-sensitive)

## Quick Diagnostic Commands

| Issue Type | Command |
|------------|---------|
| All console output | `--console-logs` |
| JavaScript errors only | `--console-logs 2>&1 \| grep -i error` |
| Network failures | `--network` then filter 4xx/5xx |
| Performance metrics | `lighthouse_audit.sh --summary` |
| Component HTML | `--selector ".class" --dump-html` |
| Full debug data | `--screenshot --console-logs --network --output` |
| **E2E cookie mismatch** | `grep -o 'sb-[^-]*-auth-token' apps/e2e/.auth/*.json` |
| **Docker status** | `curl -s http://localhost:3001/api/health` |
