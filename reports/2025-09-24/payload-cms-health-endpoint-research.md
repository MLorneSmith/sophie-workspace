# Payload CMS Health Endpoint and Container Health Check Research

**Research Summary**
Based on comprehensive research, your Payload container health check is failing due to Next.js 15's breaking changes with API route parameters and the specific routing structure used with Payload CMS. The health endpoint returns 404 because Next.js 15 now requires `params` to be awaited as Promises, but your health route doesn't use dynamic parameters.

## Key Findings

### 1. Payload CMS Health Endpoint Best Practices

**Official Stance**: Payload CMS doesn't provide built-in health endpoints, but recommends custom implementation:

```javascript
// Method 1: Add to Payload endpoints configuration
endpoints: [
  {
    path: '/health',
    method: 'get',
    handler: (req, res) => {
      res.status(200).send('OK')
    },
  },
]

// Method 2: Express-based health check
server.get('/health', (req, res) => {
  res.send('ok');
});
```

**Current Implementation Analysis**: Your health endpoint at `/apps/payload/src/app/(payload)/api/health/route.ts` is correctly structured for Next.js App Router but may be affected by Next.js 15 routing changes.

### 2. Next.js 15 Breaking Changes Impact

**Critical Breaking Change**: Next.js 15 made several APIs asynchronous including:
- `params` in route handlers now return Promises
- `cookies()`, `headers()`, `draftMode()` are now async
- This affects dynamic route segments and can cause 404 errors

**Your Health Route Issue**: Even though your health route doesn't use dynamic parameters, the Next.js 15 routing system may be interfering with the route resolution.

### 3. Docker Health Check Troubleshooting

**Common Issues with Next.js in Docker**:
- Health checks fail when using `curl` against localhost inside container
- Next.js may not be fully initialized when health check runs
- Container networking issues with localhost resolution

**Your Current Health Check**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3021/api/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 60s
```

### 4. Specific 404 Routing Issues

**Root Cause**: The combination of:
1. Payload CMS using `(payload)` route groups
2. Next.js 15's async parameter changes
3. Potential conflict with Payload's admin route handling

**Evidence**: Your admin interface loads correctly (Dashboard shows), but API routes fail, indicating a routing conflict rather than a startup issue.

## Practical Solutions and Code Examples

### Solution 1: Fix Health Route for Next.js 15 Compatibility

**Current Code** (`/apps/payload/src/app/(payload)/api/health/route.ts`):
```typescript
import { NextResponse } from "next/server";
import { getDatabaseMetrics } from "../../../../lib/database-adapter-singleton";

export async function GET() {
    const metrics = getDatabaseMetrics();
    const now = new Date();
    const dbConnected = metrics.consecutiveFailures === 0;
    const dbStatus = dbConnected ? "connected" : "disconnected";

    return NextResponse.json({
        status: dbConnected ? "ready" : "unhealthy",
        timestamp: now.toISOString(),
        database: {
            status: dbStatus,
            lastCheck: metrics.lastHealthCheck.toISOString(),
        },
        version: "3.56.0",
    });
}
```

**Recommended Fix**: Move health route outside the `(payload)` group to avoid conflicts:

1. **Move health route**: `apps/payload/src/app/api/health/route.ts`
```typescript
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Simple health check without database dependency
        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            service: "payload-cms",
            version: "3.56.0",
        });
    } catch (error) {
        return NextResponse.json({
            status: "unhealthy",
            error: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
```

### Solution 2: Alternative Health Check Approaches

**Option A: Simple HTTP Response**
```typescript
// apps/payload/src/app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
    return new Response("OK", {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
    });
}
```

**Option B: Add to Payload Configuration**
```javascript
// payload.config.ts
export default buildConfig({
    // ... other config
    endpoints: [
        {
            path: '/health',
            method: 'get',
            handler: (req, res) => {
                res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
            },
        },
    ],
});
```

### Solution 3: Improve Docker Health Check

**Enhanced Health Check with Better Error Handling**:
```yaml
healthcheck:
  test: ["CMD", "sh", "-c", "curl -f http://localhost:3021/api/health || exit 1"]
  interval: 15s
  timeout: 10s
  retries: 3
  start_period: 90s
```

**Alternative using Node.js instead of curl**:
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3021/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
  interval: 15s
  timeout: 10s
  retries: 3
  start_period: 90s
```

### Solution 4: Debug Container Networking

**Install curl in container** (if needed):
```dockerfile
RUN apt-get update && apt-get install -y curl
```

**Test health endpoint inside container**:
```bash
docker exec slideheroes-payload-test curl -v http://localhost:3021/api/health
```

### Solution 5: Add Logging for Debugging

**Enhanced Health Route with Logging**:
```typescript
import { NextResponse } from "next/server";

export async function GET() {
    console.log('Health check endpoint called at:', new Date().toISOString());

    try {
        const response = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            service: "payload-cms",
            version: "3.56.0",
            pid: process.pid,
            uptime: process.uptime(),
        };

        console.log('Health check response:', response);
        return NextResponse.json(response);
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json({
            status: "unhealthy",
            error: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
```

## Recommendations

### Immediate Actions
1. **Move health route** outside `(payload)` group to `/apps/payload/src/app/api/health/route.ts`
2. **Simplify health check** to avoid database dependencies during startup
3. **Increase start_period** to 90s to allow proper initialization
4. **Add logging** to debug route resolution

### Long-term Solutions
1. **Upgrade Payload CMS** to a version compatible with Next.js 15
2. **Implement proper dependency checks** in health endpoint after basic connectivity is confirmed
3. **Consider using Payload's endpoint configuration** instead of Next.js App Router for health checks

### Testing Commands
```bash
# Test health endpoint directly
curl -v http://localhost:3021/api/health

# Check container status
docker ps
docker logs slideheroes-payload-test

# Test inside container
docker exec slideheroes-payload-test curl -v http://localhost:3021/api/health
```

## Sources and Citations

1. **Payload CMS Health Endpoints**: [GitHub Discussion #646](https://github.com/payloadcms/payload/discussions/646)
2. **Next.js 15 Breaking Changes**: [Official Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
3. **Docker Health Checks**: [Best Practices Guide](https://docs.docker.com/engine/reference/builder/#healthcheck)
4. **Next.js 15 Params Promise**: [Route Handler Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route)

The root cause is likely the interaction between Payload CMS's route group structure and Next.js 15's routing changes. Moving the health endpoint outside the `(payload)` group should resolve the 404 issue.