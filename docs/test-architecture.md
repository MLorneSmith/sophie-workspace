# Test Architecture

## Overview

The SlideHeroes project uses a hybrid testing architecture that allows parallel development and testing without conflicts.

### Port Allocation

| Service | Development Port | Test Container Port | Purpose |
|---------|-----------------|---------------------|---------|
| Web App | 3000 | 3001 | Next.js main application |
| Payload CMS | 3020 | 3021 | PayloadCMS admin interface |
| Supabase Main | 54321/54322 | - | Development database/auth |
| Supabase E2E | - | 55321/55322 | Test database/auth |

### Architecture Benefits

1. **Parallel Execution**: Develop on port 3000 while tests run on port 3001
2. **Complete Isolation**: Test containers use separate databases (E2E Supabase)
3. **No Conflicts**: Development work never interferes with test execution
4. **Fast Iteration**: Host-based development with containerized testing

## Quick Start

### Running Tests with Containers

```bash
# Start test containers (both web and payload)
docker-compose -f docker-compose.test.yml up -d

# Run tests against containerized servers
node .claude/scripts/test/test-container.cjs --no-container

# Or use the regular test command with environment variable
SKIP_DEV_SERVER=true TEST_BASE_URL=http://localhost:3001 /test
```

### Parallel Development and Testing

```bash
# Terminal 1: Development
pnpm dev  # Runs on port 3000

# Terminal 2: Test Containers
docker-compose -f docker-compose.test.yml up

# Terminal 3: Run Tests
node .claude/scripts/test/test-container.cjs --no-container
```

## Configuration Files

### docker-compose.test.yml

Defines two test containers:

- `app-test`: Web application on port 3001
- `payload-test`: Payload CMS on port 3021

Both containers:

- Use `node:20-slim` base image
- Auto-install pnpm and dependencies
- Connect to E2E Supabase services
- Have health check endpoints

### test-container.cjs

Wrapper script that:

- Ensures test containers are running
- Sets environment variables for port 3001/3021
- Tells test controller to skip starting its own servers
- Runs tests against containerized servers

## Environment Variables

When using containerized testing, these variables are set:

- `SKIP_DEV_SERVER=true` - Prevents test controller from starting servers
- `TEST_BASE_URL=http://localhost:3001` - Points tests to container
- `PAYLOAD_TEST_URL=http://localhost:3021` - Points Payload tests to container

## How It Works

1. **Supabase Services**:
   - Main stack (dev): ports 54321/54322
   - E2E stack (test): ports 55321/55322

2. **Application Servers**:
   - Development: Run directly on host (WSL2/macOS/Linux)
   - Testing: Run in Docker containers

3. **Test Execution**:
   - Tests use Playwright to interact with containerized servers
   - Database operations go to E2E Supabase
   - Complete isolation from development environment

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs slideheroes-app-test
docker logs slideheroes-payload-test

# Restart containers
docker-compose -f docker-compose.test.yml restart
```

### Port Conflicts

```bash
# Check what's using ports
lsof -i :3001
lsof -i :3021

# Stop containers
docker-compose -f docker-compose.test.yml down
```

### Tests Can't Connect

```bash
# Verify containers are healthy
curl http://localhost:3001/api/health
curl http://localhost:3021/api/health

# Check container status
docker-compose -f docker-compose.test.yml ps
```

## Advanced Usage

### Running Specific Test Suites

```bash
# Unit tests only
node .claude/scripts/test/test-container.cjs --unit --no-container

# E2E tests only
node .claude/scripts/test/test-container.cjs --e2e --no-container

# Quick smoke tests
node .claude/scripts/test/test-container.cjs --quick --no-container
```

### Debugging Tests

```bash
# Enable debug output
node .claude/scripts/test/test-container.cjs --debug --no-container

# View container logs while testing
docker logs -f slideheroes-app-test
```

### CI/CD Integration

The containerized approach is ideal for CI/CD:

```yaml
# Example GitHub Actions
- name: Start test containers
  run: docker-compose -f docker-compose.test.yml up -d

- name: Wait for health
  run: |
    until curl -f http://localhost:3001/api/health; do sleep 1; done
    until curl -f http://localhost:3021/api/health; do sleep 1; done

- name: Run tests
  run: node .claude/scripts/test/test-container.cjs --no-container
```

## Best Practices

1. **Keep containers running** during development for faster test iterations
2. **Use --no-container flag** when containers are already running
3. **Monitor container health** with docker logs if tests fail
4. **Rebuild containers** after major dependency changes
5. **Use isolated databases** (E2E Supabase) for test data

## Migration Notes

To migrate existing tests to use containerized servers:

1. Update Playwright config to use `TEST_BASE_URL` environment variable
2. Update any hardcoded ports (3000 → 3001, 3020 → 3021)
3. Ensure health check endpoints exist in your applications
4. Add `SKIP_DEV_SERVER=true` to prevent port conflicts
