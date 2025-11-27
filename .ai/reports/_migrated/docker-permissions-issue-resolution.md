# Docker Permissions Issue Resolution Report

## Date: 2025-09-19

## Executive Summary
Recurring permission issues with `.next` build directories are caused by Docker test containers creating files as root user while host development runs as regular user, leading to ownership conflicts.

## Root Cause
The project uses a hybrid architecture where:
- Host-based development (runs as user `msmith`)
- Docker test containers (run as `root`)
- Both attempt to write to the same `.next` directories

### Evidence
```bash
# Current ownership showing the problem:
msmith:msmith apps/web/.next
root:root apps/web/.next/build        # Docker created
msmith:msmith apps/web/.next/server   # Host created
msmith:msmith apps/payload/.next
root:root apps/payload/.next/server   # Docker created
```

### Contributing Factors
1. Docker containers (`slideheroes-app-test`, `slideheroes-payload-test`) running
2. `docker-compose.test.yml` mounts project directory but uses container's `.next`
3. `node:20-slim` image runs as root by default
4. No user mapping in Docker configuration

## Immediate Solutions

### Option 1: Stop Test Containers (Quick Fix)
```bash
# Stop the test containers that are causing the issue
docker-compose -f docker-compose.test.yml down

# Fix permissions
./fix-build-permissions.sh

# Now build will work
pnpm build
```

### Option 2: Use Separate Build Directories
Modify docker-compose.test.yml to use completely separate build directories:

```yaml
services:
  app-test:
    volumes:
      - .:/app:cached
      - /app/apps/web/.next     # Isolated from host
      - /app/apps/payload/.next # Isolated from host
```

## Long-Term Solutions

### Solution 1: Run Docker Containers as Non-Root User
Add user configuration to docker-compose.test.yml:

```yaml
services:
  app-test:
    image: node:20-slim
    user: "${UID:-1000}:${GID:-1000}"  # Run as host user
    # ... rest of config
```

### Solution 2: Use Named Volumes for Build Artifacts
```yaml
services:
  app-test:
    volumes:
      - .:/app:cached
      - test_web_next:/app/apps/web/.next
      - test_payload_next:/app/apps/payload/.next

volumes:
  test_web_next:
  test_payload_next:
```

### Solution 3: Separate Build Paths for Test Environment
Configure test containers to use different build output directories:

```yaml
environment:
  - NEXT_BUILD_DIR=.next-test  # Different from default .next
```

### Solution 4: Enhanced fix-build-permissions.sh
Create a version that doesn't require sudo:

```bash
#!/bin/bash
# Enhanced permission fixer that handles Docker scenarios

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "Running in Docker, skipping permission fixes"
    exit 0
fi

# Try to fix without sudo first
fix_permissions_no_sudo() {
    local dir=$1
    if [ -d "$dir" ]; then
        # Only fix files we own
        find "$dir" -user $(whoami) -type d -exec chmod 755 {} \; 2>/dev/null
        find "$dir" -user $(whoami) -type f -exec chmod 644 {} \; 2>/dev/null
    fi
}

# Main logic...
```

## Recommended Action Plan

1. **Immediate**: Stop test containers when doing host builds
2. **Short-term**: Implement user mapping in docker-compose.test.yml
3. **Long-term**: Refactor to use separate build directories for test vs development

## Prevention Strategies

1. **Clear Separation**: Never mix Docker and host build artifacts
2. **User Mapping**: Always configure Docker containers to run as host user
3. **Named Volumes**: Use Docker named volumes for container-specific data
4. **Build Scripts**: Create separate build commands for test vs development
5. **CI/CD**: Use dedicated CI/CD environments to avoid local conflicts

## Testing Workflow Recommendation

```bash
# For development (on host)
pnpm dev                    # Port 3000, uses host .next

# For testing (in containers)
docker-compose -f docker-compose.test.yml up  # Port 3001, isolated .next

# Never run both builds in the same directories
```

## Monitoring
Add to your build scripts:
```bash
# Check for ownership issues before building
find apps/web/.next apps/payload/.next -not -user $(whoami) 2>/dev/null | head -5
if [ $? -eq 0 ]; then
    echo "⚠️  Warning: Some build files are not owned by current user"
    echo "Run ./fix-build-permissions.sh or stop Docker test containers"
fi
```

## Conclusion
The permission issues are a direct result of the hybrid Docker/host architecture without proper user mapping. The immediate fix is to stop test containers when building on the host. The long-term fix is to properly isolate Docker and host build artifacts.