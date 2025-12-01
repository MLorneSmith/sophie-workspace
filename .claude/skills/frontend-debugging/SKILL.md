---
name: frontend-debugging
description: Debug front-end issues including rendering bugs, performance problems, network failures, and client-side errors. This skill should be used when investigating React/Next.js components, CSS styling problems, console errors, hydration mismatches, or Core Web Vitals issues. Leverages Playwright for browser automation and Lighthouse for performance audits.
allowed-tools: Bash, Read, Grep, Glob
---

# Frontend Debugging

Systematic front-end debugging using Playwright for browser automation, Lighthouse for performance audits, and structured workflows for common issues.

## When to Use This Skill

- Investigating rendering issues or visual bugs
- Analyzing performance bottlenecks (LCP, CLS, TBT)
- Debugging client-side errors or console warnings
- Inspecting network requests or API failures
- Testing responsive design or browser compatibility
- Diagnosing hydration mismatches in SSR/RSC apps
- Troubleshooting CSS specificity conflicts

## Server Environment (IMPORTANT)

This project uses a **hybrid Docker architecture**. Before debugging, verify which server is running:

### Server Ports

| Server | Port | Description | When Running |
|--------|------|-------------|--------------|
| Host Dev Server | 3000 | `pnpm dev` on host | Local development |
| Docker Test Container | 3001 | `slideheroes-app-test` | E2E tests, isolated testing |
| Payload CMS Test | 3021 | `slideheroes-payload-test` | CMS testing |

### Pre-Debug Server Check

**ALWAYS check which server is available before running debug commands:**

```bash
# Check all servers at once
curl -s -o /dev/null -w "Port 3000: %{http_code}\n" http://localhost:3000/api/health 2>/dev/null || echo "Port 3000: Not running"
curl -s -o /dev/null -w "Port 3001: %{http_code}\n" http://localhost:3001/api/health 2>/dev/null || echo "Port 3001: Not running"
curl -s -o /dev/null -w "Port 3021: %{http_code}\n" http://localhost:3021/api/health 2>/dev/null || echo "Port 3021: Not running"
```

### Starting Servers

```bash
# Option 1: Start host development server (fastest for dev)
pnpm dev  # Runs on port 3000

# Option 2: Start Docker test containers (isolated environment)
docker-compose -f docker-compose.test.yml up -d
# Wait for health check, then verify:
curl http://localhost:3001/api/health  # Should return {"status":"ready"}
```

### URL Selection

- **Use `http://localhost:3000`** when: Running `pnpm dev` for active development
- **Use `http://localhost:3001`** when: Docker test containers are running (preferred for debugging production-like issues)
- **Use `http://localhost:3021`** when: Debugging Payload CMS specifically

## Authentication for Protected Pages

When debugging protected pages (like Payload admin, user dashboards, or authenticated routes), you need to use pre-authenticated browser states. The E2E test infrastructure provides storage states for different user roles.

### Available Auth Roles

| Role | Description | Storage State File | Use For |
|------|-------------|-------------------|---------|
| `test` | Standard test user | `.auth/test1@slideheroes.com.json` | User-facing features, course pages |
| `owner` | Account owner user | `.auth/test2@slideheroes.com.json` | Team/account management features |
| `admin` | Super admin (AAL2) | `.auth/michael@slideheroes.com.json` | Admin dashboards, sensitive operations |
| `payload-admin` | Payload CMS admin | `.auth/payload-admin.json` | Payload admin panel, CMS debugging |

### Check Available Auth States

Before debugging authenticated pages, verify which auth states exist:

```bash
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py --list-auth
```

### Generate Auth States (If Missing)

If auth states don't exist, generate them by running the E2E setup:

```bash
# Generate all auth states (recommended)
cd apps/e2e && npx playwright test --project=setup

# Or via pnpm
pnpm --filter web-e2e playwright test --project=setup
```

**Requirements for auth state generation:**
- Supabase must be running (`pnpm supabase:web:start`)
- Test users must exist in the database (created by seed script)
- For Payload admin: Payload CMS must be running (`pnpm --filter payload dev`)

### Quick Start with Authentication

> **Note**: Replace `$PORT` with `3000` (host dev), `3001` (Docker test), or `3021` (Payload CMS).

```bash
# Debug authenticated user dashboard
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3001/home \
  --auth test \
  --screenshot /tmp/user-dashboard.png

# Debug Payload admin panel
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3021/admin \
  --auth payload-admin \
  --screenshot /tmp/payload-admin.png \
  --console-logs

# Debug admin-only features
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3001/admin \
  --auth admin \
  --screenshot /tmp/admin-panel.png \
  --network

# Use custom storage state file
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3001/settings \
  --storage-state /path/to/custom-auth.json \
  --screenshot /tmp/settings.png
```

### Payload CMS Authentication Details

Payload CMS uses Supabase for authentication (not separate Payload auth). The `payload-admin` storage state:

1. Contains Supabase session cookies for `michael@slideheroes.com`
2. Includes Payload-specific cookies set during admin panel navigation
3. Is generated by the global setup which logs into Payload admin after Supabase auth

**Payload Admin URLs:**
- Login: `http://localhost:3021/admin/login`
- Dashboard: `http://localhost:3021/admin`
- Collections: `http://localhost:3021/admin/collections/{slug}`

**Common Payload Debug Scenarios:**

```bash
# Debug Payload collection list
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3021/admin/collections/posts \
  --auth payload-admin \
  --screenshot /tmp/payload-posts.png

# Debug Payload document editor
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3021/admin/collections/courses/create \
  --auth payload-admin \
  --screenshot /tmp/payload-course-editor.png \
  --console-logs

# Capture network requests to debug API issues
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3021/admin \
  --auth payload-admin \
  --network \
  --output /tmp/payload-debug.json
```

### Test Credentials Reference

| Role | Email | Environment Variables |
|------|-------|----------------------|
| test | `test1@slideheroes.com` | `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD` |
| owner | `test2@slideheroes.com` | `E2E_OWNER_EMAIL`, `E2E_OWNER_PASSWORD` |
| admin | `michael@slideheroes.com` | `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` |
| payload-admin | `michael@slideheroes.com` | Same as admin (Payload uses Supabase auth) |

**Note:** Credentials are defined in `apps/e2e/tests/utils/credential-validator.ts` and `apps/e2e/tests/payload/helpers/test-data.ts`.

## Quick Start

> **Note**: Replace `$PORT` with `3000` (host dev), `3001` (Docker test), or `3021` (Payload CMS) based on which server is running. See [Server Environment](#server-environment-important) above.

### Visual Debugging (Screenshots)

```bash
# Full-page screenshot (use port 3001 for Docker, 3000 for host dev)
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3001 \
  --screenshot /tmp/debug.png

# Screenshot with console and network capture
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3001 \
  --screenshot /tmp/debug.png \
  --console-logs \
  --network
```

### Console Error Capture

```bash
# Capture all console output
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3001 \
  --console-logs
```

### Performance Audit

```bash
# Run Lighthouse with Core Web Vitals summary
.claude/skills/frontend-debugging/scripts/lighthouse_audit.sh \
  http://localhost:3001 \
  --summary
```

### Full Debug Capture

```bash
# Complete debug data as JSON
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3001 \
  --screenshot /tmp/page.png \
  --console-logs \
  --network \
  --output /tmp/debug.json
```

## Debugging Workflows

> **Prerequisite**: Before starting any workflow, verify a server is running using the [Pre-Debug Server Check](#pre-debug-server-check). Use the appropriate port (3000/3001/3021).

### 1. Visual Bug Investigation

When a user reports a rendering issue:

1. **Verify server is running**
   ```bash
   # Check which servers are available
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "Docker not running"
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "Host dev not running"
   ```

2. **Capture the current state**
   ```bash
   # Use port 3001 for Docker test container, 3000 for host dev
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3001/affected-page \
     --screenshot /tmp/before.png \
     --console-logs
   ```

3. **Inspect the component HTML**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3001/affected-page \
     --selector ".problematic-component" \
     --dump-html /tmp/component.html
   ```

4. **Find the component source**
   ```bash
   rg -l "problematic-component" apps/web/app
   ```

5. **Check for CSS issues**
   ```bash
   rg "problematic-component" -A 5 -B 5 apps/web/app --glob "*.css"
   rg "problematic-component" -A 5 -B 5 apps/web/app --glob "*.tsx"
   ```

### 2. Console Error Debugging

When investigating JavaScript errors:

1. **Capture console output**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3001 \
     --console-logs \
     --output /tmp/console-debug.json
   ```

2. **Review the JSON output** for:
   - Error messages and stack traces
   - Warning messages (React warnings, deprecations)
   - Failed network requests logged to console

3. **Search for error source**
   ```bash
   rg "ErrorMessage" apps/web/app --type ts --type tsx
   ```

### 3. Performance Investigation

When diagnosing slow page loads:

1. **Run Lighthouse audit**
   ```bash
   .claude/skills/frontend-debugging/scripts/lighthouse_audit.sh \
     http://localhost:3001 \
     --categories performance \
     --summary
   ```

2. **Analyze network waterfall**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3001 \
     --network \
     --output /tmp/network.json
   ```

3. **Review bundle size** (if applicable)
   ```bash
   pnpm --filter web analyze
   ```

4. **Check for common issues**:
   - Large JavaScript bundles
   - Unoptimized images
   - Render-blocking resources
   - Excessive re-renders

### 4. Network Request Debugging

When API calls fail or behave unexpectedly:

1. **Capture all network traffic**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3001 \
     --network
   ```

2. **Look for**:
   - 4xx/5xx status codes
   - CORS errors
   - Slow responses (timing data)
   - Missing requests

3. **Check API routes**
   ```bash
   rg "api/endpoint-name" apps/web/app
   ```

### 5. Hydration Mismatch Debugging

For SSR/RSC hydration errors in Next.js:

1. **Capture console for hydration warnings**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3001 \
     --console-logs 2>&1 | grep -i "hydrat"
   ```

2. **Common causes**:
   - Date/time rendering differences
   - Browser-only APIs used during SSR
   - Conditional rendering based on `window`
   - Extension-injected content

3. **Fix pattern**:
   ```typescript
   // Use useEffect for browser-only rendering
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   if (!mounted) return null;
   ```

## Script Reference

### playwright_inspect.py

Captures screenshots, DOM, console logs, and network requests. Supports authenticated sessions.

| Option | Description |
|--------|-------------|
| `--screenshot <path>` | Save full-page screenshot |
| `--dump-html <path>` | Save page HTML |
| `--selector <css>` | Target specific element |
| `--console-logs` | Capture console output |
| `--network` | Capture network requests |
| `--output <path>` | Save all data as JSON |
| `--viewport <WxH>` | Set viewport (default: 1920x1080) |
| `--wait <ms>` | Wait after load (default: 2000) |
| `--headed` | Show browser window |
| `--auth <role>` | Use project auth state (test, owner, admin, payload-admin) |
| `--storage-state <path>` | Load custom auth state from JSON file |
| `--list-auth` | List available auth states and exit |

### lighthouse_audit.sh

Runs Lighthouse performance and accessibility audits.

| Option | Description |
|--------|-------------|
| `--output-dir <dir>` | Output directory (default: /tmp/lighthouse) |
| `--categories <list>` | Categories: performance,accessibility,best-practices,seo |
| `--format <type>` | Output: json, html, both |
| `--quick` | Fast mode with reduced accuracy |
| `--summary` | Print Core Web Vitals to stdout |

## Existing Project Resources

This project has existing Playwright E2E infrastructure:

- **Playwright config**: `apps/e2e/playwright.config.ts`
- **Playwright docs**: `.ai/ai_docs/tool-docs/playwright.md`
- **E2E tests**: `apps/e2e/tests/`

### Using Project E2E Commands

```bash
# Run E2E with trace capture (uses Docker container on port 3001)
pnpm --filter web-e2e playwright test --trace on

# View trace file
pnpm --filter web-e2e playwright show-trace trace.zip

# Interactive UI mode
pnpm --filter web-e2e playwright test --ui

# Debug mode with Inspector
pnpm --filter web-e2e playwright test --debug

# Generate test by recording (use port 3001 for Docker, 3000 for host)
npx playwright codegen http://localhost:3001
```

> **Note**: E2E tests are configured to use port 3001 (Docker test container) by default. See `apps/e2e/playwright.config.ts` for configuration.

## Common Issues Reference

For detailed troubleshooting patterns, see: `references/debugging-checklist.md`

Quick reference for common issues:

| Issue | First Check | Tool |
|-------|-------------|------|
| **Connection refused** | Server not running | Check ports 3000/3001/3021 with curl |
| **Redirected to login** | Auth state missing | `--list-auth`, then `--auth <role>` |
| **401/403 errors** | Session expired | Regenerate auth states |
| Blank page | Console errors | `--console-logs` |
| Slow load | Core Web Vitals | `lighthouse_audit.sh --summary` |
| Layout broken | CSS classes | `--dump-html` + grep |
| API errors | Network status | `--network` |
| Hydration error | Console warnings | `--console-logs` |
| Wrong data | Network payloads | `--network --output` |
| Payload admin 404 | Wrong port or auth | Use `--auth payload-admin` with port 3021 |

### Troubleshooting Connection Issues

If you see `net::ERR_CONNECTION_REFUSED`:

1. **No server is running** - Start either:
   ```bash
   pnpm dev                                    # Host dev on port 3000
   docker-compose -f docker-compose.test.yml up -d  # Docker on port 3001
   ```

2. **Wrong port** - Verify which server is actually running:
   ```bash
   curl -s http://localhost:3000/api/health && echo "Port 3000 OK" || echo "Port 3000 not available"
   curl -s http://localhost:3001/api/health && echo "Port 3001 OK" || echo "Port 3001 not available"
   ```

3. **Container not healthy** - Check Docker container status:
   ```bash
   docker ps --filter "name=slideheroes" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
   ```

### Troubleshooting Authentication Issues

If you're redirected to login or see authentication errors:

1. **Auth state file not found**:
   ```bash
   # Check which auth states exist
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py --list-auth

   # Generate missing auth states
   cd apps/e2e && npx playwright test --project=setup
   ```

2. **Auth state expired** - Regenerate:
   ```bash
   # Delete old auth states and regenerate
   rm -rf apps/e2e/.auth/*.json
   cd apps/e2e && npx playwright test --project=setup
   ```

3. **Supabase not running** (required for auth generation):
   ```bash
   pnpm supabase:web:start
   pnpm supabase:web:status  # Verify it's healthy
   ```

4. **Test users don't exist**:
   ```bash
   # Reset and reseed database
   pnpm supabase:web:reset
   ```

5. **Payload-specific auth issues**:
   ```bash
   # Ensure Payload is running before generating auth
   pnpm --filter payload dev  # Start Payload on port 3021

   # Then regenerate auth states
   rm apps/e2e/.auth/payload-admin.json
   cd apps/e2e && npx playwright test --project=setup
   ```

6. **Wrong domain/port mismatch**:
   - Auth states are tied to specific domains
   - `payload-admin` state is for `localhost:3021`
   - `admin` state is for `localhost:3001` or `localhost:3000`
   - Use the correct auth role for the server you're targeting
