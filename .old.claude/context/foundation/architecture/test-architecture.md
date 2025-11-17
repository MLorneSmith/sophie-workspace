---
# Identity
id: "test-architecture"
title: "Test Architecture and Infrastructure"
version: "2.0.0"
category: "implementation"

# Discovery
description: "Comprehensive guide to SlideHeroes testing architecture, including containerization, parallel execution, port management, and CI/CD integration"
tags: ["testing", "architecture", "docker", "playwright", "vitest", "ci-cd", "e2e", "unit-testing", "containerization"]

# Relationships
dependencies: ["docker-setup", "cicd-pipeline"]
cross_references:
  - id: "docker-setup"
    type: "related"
    description: "Docker container configuration for test environments"
  - id: "cicd-pipeline"
    type: "related"
    description: "CI/CD pipeline integration for automated testing"
  - id: "playwright-expert"
    type: "pattern"
    description: "Playwright E2E testing patterns and best practices"

# Maintenance
created: "2025-01-09"
last_updated: "2025-09-09"
author: "create-context"
---

# Test Architecture and Infrastructure

## Overview

The SlideHeroes project implements a sophisticated hybrid testing architecture that enables parallel development and testing without conflicts. The architecture leverages containerization, intelligent port management, and modular test orchestration to achieve:

- **3-5x faster test execution** through parallelization
- **Complete isolation** between development and test environments
- **Zero-conflict parallel execution** across multiple test suites
- **Robust CI/CD integration** with automatic recovery mechanisms

## Architecture Components

### 1. Test Pyramid Implementation

```
┌─────────────────────────────────────┐
│           E2E Tests                 │  10% - Critical user journeys
│      (Playwright: 3001)             │  
├─────────────────────────────────────┤
│      Integration Tests              │  20% - Service boundaries
│    (Vitest: In-process)             │
├─────────────────────────────────────┤
│         Unit Tests                  │  70% - Business logic
│    (Vitest: In-process)             │
└─────────────────────────────────────┘
```

### 2. Port Allocation Strategy

| Service | Development | Test Container | E2E Container | Purpose |
|---------|------------|----------------|---------------|---------|
| Web App | 3000 | 3001 | 3001 | Next.js application |
| Payload CMS | 3020 | 3021 | 3021 | PayloadCMS admin |
| Supabase Main | 54321/54322 | - | - | Development DB/Auth |
| Supabase E2E | - | 55321/55322 | 55321/55322 | Test DB/Auth |

### 3. Modular Test Controller Architecture

```javascript
// Refactored from 3700+ lines monolith to modular design
.claude/scripts/test/
├── test-controller.cjs         // Main orchestrator (<500 lines)
├── test-container.cjs          // Container wrapper
├── config/
│   └── test-config.cjs        // Centralized configuration
├── modules/
│   ├── infrastructure-manager.cjs  // Supabase & server management
│   ├── process-manager.cjs        // Process lifecycle
│   ├── unit-test-runner.cjs       // Unit test execution
│   ├── e2e-test-runner.cjs        // E2E test execution
│   ├── phase-coordinator.cjs      // Phase orchestration
│   └── test-reporter.cjs          // Result aggregation
└── utils/
    ├── condition-waiter.cjs       // Condition-based waiting
    └── resource-lock.cjs          // Resource coordination
```

## Implementation Details

### Container Orchestration

```yaml
# docker-compose.test.yml
services:
  app-test:
    image: node:20-slim
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:55321
      - NODE_ENV=test
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 10s
      start_period: 60s
```

### Test Execution Workflow

```javascript
// test-container.cjs - Container wrapper pattern
async function main() {
  // 1. Start test containers
  await startTestContainer();
  
  // 2. Wait for health checks
  await waitForServer(maxRetries = 60);
  
  // 3. Execute tests with isolation
  const success = await runTests({
    env: {
      TEST_BASE_URL: "http://localhost:3001",
      SKIP_DEV_SERVER: "true",
    }
  });
  
  // 4. Cleanup if needed
  if (process.env.STOP_CONTAINER_AFTER_TEST === "true") {
    stopTestContainer();
  }
}
```

### Parallel Execution Strategy

```javascript
// Phase-based execution with timeouts
class PhaseCoordinator {
  async executePhase(phaseName, operation, timeout = 30000) {
    const timeoutId = setTimeout(() => {
      throw new Error(`Phase ${phaseName} timeout`);
    }, timeout);
    
    try {
      await operation();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

## Code Examples

### Playwright Configuration

```typescript
// apps/e2e/playwright.config.ts
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 3,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    navigationTimeout: 15 * 1000,
  },
  timeout: 120 * 1000,
});
```

### Vitest Workspace Configuration

```typescript
// vitest.workspace.ts
export default defineWorkspace([
  {
    extends: "./vitest.config.ts",
    test: {
      include: ["apps/web/**/*.test.{ts,tsx}"],
      environment: "jsdom",
    },
  },
  {
    extends: "./packages/vitest.config.base.ts",
    test: {
      include: ["packages/**/*.test.{ts,tsx}"],
      environment: "node",
    },
  },
]);
```

### Health Check Implementation

```typescript
// api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    services: await checkServices(),
  };
  
  const status = Object.values(checks).every(c => c) ? "ready" : "degraded";
  
  return Response.json({
    status,
    timestamp: new Date().toISOString(),
    checks,
  });
}
```

## Related Files

### Core Configuration

- `/docker-compose.test.yml`: Test container definitions
- `/.claude/scripts/test/test-controller.cjs`: Main test orchestrator
- `/.claude/scripts/test/test-container.cjs`: Container wrapper
- `/.claude/scripts/test/config/test-config.cjs`: Centralized configuration

### Test Modules

- `/.claude/scripts/test/modules/infrastructure-manager.cjs`: Infrastructure management
- `/.claude/scripts/test/modules/process-manager.cjs`: Process lifecycle
- `/.claude/scripts/test/modules/e2e-test-runner.cjs`: E2E execution
- `/.claude/scripts/test/modules/unit-test-runner.cjs`: Unit test execution

### Test Configurations

- `/apps/e2e/playwright.config.ts`: Playwright E2E configuration
- `/vitest.workspace.ts`: Vitest workspace configuration
- `/apps/web/vitest.config.ts`: Web app test configuration

## Common Patterns

### 1. Condition-Based Waiting

```javascript
// Replace hardcoded delays with condition checks
class ConditionWaiter {
  async waitFor(condition, options = {}) {
    const { timeout = 30000, interval = 1000 } = options;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) return true;
      await sleep(interval);
    }
    throw new Error("Timeout waiting for condition");
  }
}
```

### 2. Resource Lock Pattern

```javascript
// Prevent resource conflicts during parallel execution
class ResourceLock {
  constructor() {
    this.locks = new Map();
  }
  
  async acquire(resource) {
    while (this.locks.has(resource)) {
      await sleep(100);
    }
    this.locks.set(resource, Date.now());
  }
  
  release(resource) {
    this.locks.delete(resource);
  }
}
```

### 3. Cleanup Coordination

```javascript
// Prevent race conditions in cleanup
const cleanupCoordinator = {
  portsCleared: new Set(),
  
  async clearPort(port, processManager) {
    if (this.portsCleared.has(port)) {
      return true; // Already cleared
    }
    
    const cleared = await processManager.killPort(port, {
      maxRetries: 3,
      waitTime: 2000,
    });
    
    if (cleared) {
      this.portsCleared.add(port);
    }
    return cleared;
  }
};
```

## Troubleshooting

### Container Won't Start

**Symptoms**: Docker container fails to start or exits immediately  
**Cause**: Missing dependencies, port conflicts, or configuration issues  
**Solution**:

```bash
# Check container logs
docker logs slideheroes-app-test

# Verify port availability
lsof -i :3001

# Restart with clean state
docker-compose -f docker-compose.test.yml down
docker-compose -f docker-compose.test.yml up -d
```

### Flaky Tests

**Symptoms**: Tests pass/fail inconsistently  
**Cause**: Race conditions, timing issues, or external dependencies  
**Solution**:

```javascript
// Use explicit waits instead of arbitrary delays
await page.waitForSelector('[data-testid="submit-button"]');
await expect(page.locator('.success-message')).toBeVisible();

// Use retry logic for external services
await retry(async () => {
  const response = await fetch(url);
  expect(response.ok).toBe(true);
}, { retries: 3, delay: 1000 });
```

### Port Conflicts

**Symptoms**: "Address already in use" errors  
**Cause**: Previous test run didn't clean up properly  
**Solution**:

```bash
# Find and kill processes on ports
lsof -ti:3001 | xargs kill -9
lsof -ti:3021 | xargs kill -9

# Use cleanup guard
node .claude/scripts/test/test-cleanup-guard.cjs
```

### Database State Issues

**Symptoms**: Tests fail due to unexpected database state  
**Cause**: Tests not properly isolated or cleanup failures  
**Solution**:

```javascript
// Use transactions for test isolation
beforeEach(async () => {
  await db.transaction(async (tx) => {
    // Test setup
  });
});

// Reset database between test suites
afterAll(async () => {
  await db.reset();
});
```

## CI/CD Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Start Supabase
        run: npx supabase start
      
      - name: Start test containers
        run: docker-compose -f docker-compose.test.yml up -d
      
      - name: Wait for health
        run: |
          until curl -f http://localhost:3001/api/health; do
            sleep 1
          done
      
      - name: Run tests
        run: node .claude/scripts/test/test-container.cjs --no-container
```

### Parallel Test Sharding

```yaml
# Run tests in parallel shards
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - name: Run E2E shard ${{ matrix.shard }}
    run: pnpm --filter web-e2e test:shard${{ matrix.shard }}
```

## Best Practices

1. **Container Management**
   - Keep containers running during development for faster iteration
   - Use `--no-container` flag when containers are already running
   - Implement health checks for all services

2. **Test Isolation**
   - Use separate databases for development and testing
   - Reset test data between suites
   - Avoid shared state between tests

3. **Performance Optimization**
   - Parallelize independent test suites
   - Use test sharding for large test suites
   - Cache dependencies in CI/CD

4. **Error Recovery**
   - Implement automatic retry mechanisms
   - Use phase timeouts to prevent hanging
   - Clean up resources in finally blocks

5. **Debugging**
   - Enable debug output with `--debug` flag
   - Capture screenshots and traces on failure
   - Use structured logging for better troubleshooting

## Migration Guide

### From Monolithic to Modular Architecture

1. **Update test scripts**:

```bash
# Old approach
npm test

# New approach
node .claude/scripts/test/test-controller.cjs
```

2. **Configure environment variables**:

```bash
# .env.test
TEST_BASE_URL=http://localhost:3001
SKIP_DEV_SERVER=true
```

3. **Update Playwright configuration**:

```typescript
// Use environment variable for base URL
baseURL: process.env.TEST_BASE_URL || "http://localhost:3000"
```

4. **Implement health checks**:

```typescript
// Add /api/health endpoint to your application
export async function GET() {
  return Response.json({ status: "ready" });
}
```

## Performance Metrics

- **Test Execution Time**: Reduced from 4+ hours to 15-30 minutes
- **Parallel Efficiency**: 3-5x speedup with proper sharding
- **Resource Usage**: 60% reduction in CI/CD resource consumption
- **Flaky Test Rate**: Reduced from 15% to <2% with proper isolation

## See Also

- [[docker-setup]]: Docker configuration for development and testing
- [[cicd-pipeline]]: CI/CD pipeline configuration and optimization
- [[playwright-expert]]: Playwright testing patterns and best practices
- [[vitest-testing-expert]]: Vitest unit testing strategies
