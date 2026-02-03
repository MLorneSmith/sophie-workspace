# Implementation Report: Issue #1132

## Status: ❌ BLOCKED - Plan Has Fundamental Error

## Summary
Attempted to implement the fix from the diagnosis but discovered a critical flaw in the root cause analysis. The proposed fix of changing `host.docker.internal` to `127.0.0.1` breaks server-side code.

## What Was Tried

1. Changed `NEXT_PUBLIC_SUPABASE_URL` from `http://host.docker.internal:54521` to `http://127.0.0.1:54521` in both docker-compose.test.yml services (app-test and payload-test)
2. Updated `apps/e2e/global-setup.ts` to use `http://127.0.0.1:54521` for the supabaseCookieUrl fallback
3. Rebuilt Docker containers with new environment variables
4. Ran E2E tests to validate the fix

## What Happened

**Server-side code inside Docker containers started failing with:**
```
Error: connect ECONNREFUSED 127.0.0.1:54521
```

The container logs showed:
```
[cause]: Error: connect ECONNREFUSED 127.0.0.1:54521
    address: '127.0.0.1'
```

## Root Cause of Failure

The diagnosis issue #1132 incorrectly stated:
> "Docker containers can reach 127.0.0.1:54521 because of the extra_hosts mapping"

**This is false.** I verified directly by running commands inside the Docker container:

```bash
# Inside Docker container - host.docker.internal WORKS:
docker exec slideheroes-app-test node -e "http.get('http://host.docker.internal:54521/rest/v1/')"
# Result: status 200

# Inside Docker container - 127.0.0.1 FAILS:
docker exec slideheroes-app-test node -e "http.get('http://127.0.0.1:54521/rest/v1/')"
# Result: connect ECONNREFUSED 127.0.0.1:54521
```

The `extra_hosts` mapping in docker-compose.test.yml:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

This only maps `host.docker.internal` → host IP. It does NOT make `127.0.0.1` refer to the host machine. Inside a container, `127.0.0.1` refers to the container itself, not the host.

## The Real Problem (Needs Re-diagnosis)

`NEXT_PUBLIC_SUPABASE_URL` is used by BOTH:
- **Server-side code** (middleware, SSR) - runs inside Docker, needs `host.docker.internal` to reach host
- **Client-side code** (browser JavaScript) - runs in browser, needs `127.0.0.1` because browsers can't resolve Docker hostnames

These requirements are **mutually exclusive** with a single `NEXT_PUBLIC_*` environment variable.

## Possible Correct Solutions

1. **Add a server-side-only env var**
   - Create `SUPABASE_SERVER_URL` for server components/middleware
   - Keep `NEXT_PUBLIC_SUPABASE_URL` for browser code
   - Modify Supabase client code to use the appropriate URL based on context

2. **Use a reverse proxy**
   - Configure nginx/traefik to proxy requests
   - Have a single URL that works in all contexts

3. **Add host entry on development machine**
   - Add `host.docker.internal 127.0.0.1` to host machine's `/etc/hosts`
   - Allows browsers to resolve `host.docker.internal`
   - Not portable across dev machines

4. **Browser request interception**
   - Use service worker or client-side code to rewrite URLs
   - Complex and fragile

## Recommendation

The diagnosis issue #1132 needs to be **re-opened and re-diagnosed** with the correct understanding that:
- `127.0.0.1` cannot work for Docker server-side code (middleware, SSR)
- `host.docker.internal` cannot work for browser client-side code
- A different architectural approach is needed to handle this dual-context requirement

## Files Modified (All Reverted)

All changes have been reverted. No files were modified permanently.

---
*Implementation blocked pending correct diagnosis*
*Report generated: 2025-12-15*
*GitHub Issue: https://github.com/slideheroes/2025slideheroes/issues/1132*
