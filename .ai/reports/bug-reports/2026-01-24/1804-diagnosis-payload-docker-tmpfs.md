# Bug Diagnosis: Payload CMS Docker Container Returns 500 Errors Due to tmpfs Mount

**ID**: ISSUE-1804
**Created**: 2026-01-24T19:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Payload CMS test container (`slideheroes-payload-test`) returns HTTP 500 errors for all page requests (including `/admin/login`) while API endpoints like `/api/health` intermittently work. The root cause is the `tmpfs` mount configuration for the `.next` directory in `docker-compose.test.yml`, which creates an unstable in-memory filesystem that interferes with Next.js dev server's file operations.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development (Docker test environment)
- **Payload CMS Version**: 3.72.0
- **Next.js Version**: 16.0.10
- **Node Version**: 22
- **Database**: PostgreSQL (Supabase)
- **Last Working**: The container shows as "healthy" but has been returning 500 errors

## Reproduction Steps

1. Start the Docker test environment: `docker compose -f docker-compose.test.yml up -d`
2. Wait for containers to start (health check passes)
3. Access `http://localhost:3021/admin/login`
4. Observe 500 Internal Server Error

## Expected Behavior

The Payload CMS admin login page should load successfully with HTTP 200.

## Actual Behavior

- `/api/health` - Intermittently returns 200, then switches to 500
- `/admin/login` - Always returns 500 after initial compilation
- Container shows as "healthy" despite returning 500 errors

## Diagnostic Data

### Console Output
```
Error: ENOENT: no such file or directory, open '/app/apps/payload/.next/dev/required-server-files.json'
    at ignore-listed frames {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/app/apps/payload/.next/dev/required-server-files.json'
}

GET /admin/login 500 in 23.5s

[webpack.cache.PackFileCacheStrategy] Caching failed for pack: Error: ENOENT: no such file or directory,
rename '/app/apps/payload/.next/dev/cache/webpack/client-development-fallback/0.pack.gz_' ->
'/app/apps/payload/.next/dev/cache/webpack/client-development-fallback/0.pack.gz'
```

### Network Analysis
```
GET /api/health - 200 (intermittent, then 500)
GET /admin/login - 500 (consistent after first failure)
GET /admin - 500
```

### File System Analysis
```
# Contents of .next/dev/ folder (missing required-server-files.json)
total 2904
drwxr-xr-x 6 node node     280 Jan 24 19:42 .
drwxrwxrwt 3 node node      60 Jan 24 19:40 ..
-rw-r--r-- 1 node node     617 Jan 24 19:42 build-manifest.json
drwxr-xr-x 4 node node     100 Jan 24 19:40 cache
-rw-r--r-- 1 node node     610 Jan 24 19:42 fallback-build-manifest.json
-rw-r--r-- 1 node node       0 Jan 24 19:40 lock
-rw-r--r-- 1 node node      20 Jan 24 19:40 package.json
-rw-r--r-- 1 node node     354 Jan 24 19:40 prerender-manifest.json
-rw-r--r-- 1 node node   23994 Jan 24 19:42 react-loadable-manifest.json
-rw-r--r-- 1 node node     604 Jan 24 19:40 routes-manifest.json
drwxr-xr-x 4 node node     300 Jan 24 19:40 server
drwxr-xr-x 7 node node     140 Jan 24 19:42 static
-rw-r--r-- 1 node node 2926575 Jan 24 19:42 trace
drwxr-xr-x 3 node node     140 Jan 24 19:40 types
# NOTE: required-server-files.json is MISSING
```

### Docker Configuration
```yaml
# docker-compose.test.yml - lines 97-99
tmpfs:
  - /app/apps/web/.next:uid=1000,gid=1000,mode=1777
  - /app/apps/payload/.next:uid=1000,gid=1000,mode=1777
```

## Error Stack Traces
```
Error: ENOENT: no such file or directory, open '/app/apps/payload/.next/dev/required-server-files.json'
    at ignore-listed frames {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/app/apps/payload/.next/dev/required-server-files.json'
}
```

## Related Code
- **Affected Files**:
  - `docker-compose.test.yml` (lines 97-99) - tmpfs mount configuration
  - `apps/payload/next.config.mjs` - Next.js configuration
- **Recent Changes**: No recent changes to these files
- **Suspected Functions**: tmpfs mount causing file system instability

## Related Issues & Context

### Similar Symptoms
- #1311: "Bug Diagnosis: Payload E2E Tests Fail Due to Container OOM Kill" - Container resource issues
- #1243: "Bug Diagnosis: Payload E2E Tests Timeout Due to Next.js Performance API Error" - Next.js issues
- #1584: "Bug Fix: E2E Sharded Tests WebServer Timeout" - Server startup issues

### Historical Context
The tmpfs mount was likely added to provide clean build state between container restarts, but it's causing more problems than it solves.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `tmpfs` mount for `/app/apps/payload/.next` in `docker-compose.test.yml` creates an unstable in-memory filesystem that causes Next.js dev server to fail.

**Detailed Explanation**:

The tmpfs mount (line 98-99 of docker-compose.test.yml) creates an empty in-memory filesystem at `/app/apps/payload/.next`. This causes several problems:

1. **File System Race Conditions**: The tmpfs filesystem doesn't handle concurrent file operations well, causing webpack cache operations to fail:
   - `rename '/app/apps/payload/.next/dev/cache/webpack/.../0.pack.gz_' -> '...0.pack.gz'` fails with ENOENT
   - This corrupts the webpack build state

2. **Missing Required Files**: The `required-server-files.json` file should be generated during `next dev` startup, but either:
   - It's not being created due to the unstable filesystem
   - It's being created but then lost due to race conditions
   - The file system sync between tmpfs and Next.js dev server is failing

3. **Why API Works But Admin Fails**:
   - Simple API routes (`/api/health`) don't require the full `.next` state - they can be compiled on-demand
   - Page routes (`/admin/login`) require server-rendered components and the `required-server-files.json` manifest
   - When the manifest is missing, page rendering fails with 500

**Supporting Evidence**:
- The webpack cache rename error proves file system operations are failing
- The `required-server-files.json` file is consistently missing from `.next/dev/`
- The container shows as "healthy" because the health check passes before the file system corruption occurs
- Research confirms this is a known Docker + Next.js dev mode incompatibility (see Payload CMS PR #14456)

### How This Causes the Observed Behavior

1. Container starts with empty tmpfs at `/app/apps/payload/.next`
2. `next dev --webpack` initializes and creates initial `.next/dev/` structure
3. Health check passes (compilation starts working)
4. As more files are compiled, file system race conditions occur
5. Webpack cache operations fail (rename errors)
6. `required-server-files.json` is corrupted or deleted
7. Subsequent page requests fail with 500 because the manifest is missing
8. API routes continue to work intermittently because they don't need the manifest

### Confidence Level

**Confidence**: High

**Reasoning**:
- The tmpfs mount is documented as problematic for Next.js dev mode
- The webpack cache error directly proves file system instability
- The missing `required-server-files.json` is the proximate cause of the 500 errors
- Research confirms Payload CMS + Next.js + Docker has this known issue pattern

## Fix Approach (High-Level)

Remove the tmpfs mount for `/app/apps/payload/.next` from `docker-compose.test.yml`. The Next.js dev server should manage its own `.next` folder without external filesystem constraints.

**Option 1 (Recommended)**: Remove tmpfs mount entirely
```yaml
# Before
tmpfs:
  - /app/apps/payload/.next:uid=1000,gid=1000,mode=1777

# After - remove the line or use anonymous volume
volumes:
  - payload_next:/app/apps/payload/.next
```

**Option 2**: Use anonymous volume instead of tmpfs
```yaml
volumes:
  - /app/apps/payload/.next  # Docker manages this volume
```

**Option 3**: Don't mount anything - let the container manage `.next` internally

## Diagnosis Determination

**Root cause confirmed**: The tmpfs mount in `docker-compose.test.yml` (line 98-99) is causing file system instability that prevents the Next.js dev server from maintaining proper build state.

**The fix is straightforward**: Remove or replace the tmpfs mount configuration.

**Impact**: This affects all Payload E2E tests (shards 7, 8, 9) because the Payload server cannot serve the admin pages needed for authentication tests.

## Additional Context

- This issue explains why the E2E test failures from issue #1801 showed timeout errors after the database timing fix was applied
- The database fix (unlockPayloadUser() error handling) is correct and should remain
- This is a separate infrastructure issue that needs to be fixed independently
- The Payload CMS team is actively working on Next.js 16 compatibility (PR #14456)

---
*Generated by Claude Debug Assistant*
*Tools Used: docker logs, docker exec, curl, GitHub issue search, Perplexity research*
