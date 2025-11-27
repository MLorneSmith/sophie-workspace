# Node Modules Permission Issue - Resolution Report

**Issue ID**: ISSUE-448
**Resolved Date**: 2025-09-29
**Debug Engineer**: Claude Debug Assistant

## Root Cause Analysis

The permission issues (`EACCES: permission denied`) in node_modules were caused by symlinks owned by the root user instead of the local user (msmith). This occurred across multiple packages:

- `apps/payload/node_modules/@payloadcms/*`
- `apps/web/node_modules/@edge-csrf/*`
- `packages/plugins/testimonial/node_modules/@makerkit/*`
- And 69 total root-owned symlinks across the project

### Contributing Factors

1. **Docker Container Interaction**: The project uses a hybrid Docker architecture where some services run in containers. When Docker containers interact with the filesystem, they may create or modify files with root ownership.

2. **Test Container Volumes**: The `slideheroes-payload-test` container (port 3021) runs with shared volumes that can affect node_modules permissions.

3. **pnpm Symlink Management**: pnpm creates symlinks to a shared store, and when these symlinks get created with incorrect ownership, subsequent installs fail.

## Solution Implemented

Fixed ownership of all root-owned symlinks and files in node_modules directories:

```bash
# Step 1: Fix ownership of symlinks (preserving symlink targets)
sudo find . -type l -user root -exec chown -h msmith:msmith {} +

# Step 2: Fix any remaining root-owned files
sudo find . -path "*/node_modules/*" -user root -exec chown msmith:msmith {} +
```

## Verification Results

- ✅ **Issue reproduction**: No longer occurs
- ✅ **pnpm install**: Completes successfully without permission errors
- ✅ **Ownership verification**: 0 root-owned files or symlinks remain in node_modules
- ✅ **Performance impact**: No negative impact

## Prevention Measures

### Immediate Actions

1. **Avoid Global npm/pnpm Operations as Root**
   - Never use `sudo npm install` or `sudo pnpm install`
   - Install global packages to user directory: `npm config set prefix ~/.npm-global`

2. **Docker Container Best Practices**
   - Use `user: node` in docker-compose files when possible
   - Avoid mounting node_modules as volumes in Docker containers
   - Use named volumes for node_modules if mounting is necessary

3. **Regular Permission Checks**

   ```bash
   # Add to daily checks
   find . -type l -user root -path "*/node_modules/*" 2>/dev/null | wc -l
   ```

### Long-term Recommendations

1. **Update Docker Configurations**
   - Review `apps/payload/docker-compose.yml` to ensure proper user context
   - Consider removing the named volume for node_modules (line 10)
   - Use `.dockerignore` to exclude node_modules from build context

2. **CI/CD Pipeline Integration**
   - Add permission checks to CI pipeline
   - Ensure consistent user context across all environments

3. **Developer Guidelines**
   - Document in README: Never run package managers with sudo
   - Add pre-commit hook to check for permission issues
   - Consider using a `.npmrc` or `.pnpmrc` file with safe defaults

4. **Monitoring Script**
   Create a script to detect and alert on permission issues:

   ```bash
   #!/bin/bash
   # check-permissions.sh
   ROOT_FILES=$(find . -path "*/node_modules/*" -user root 2>/dev/null | wc -l)
   if [ $ROOT_FILES -gt 0 ]; then
     echo "WARNING: Found $ROOT_FILES root-owned files in node_modules"
     echo "Run: sudo find . -type l -user root -exec chown -h $(whoami):$(whoami) {} +"
     exit 1
   fi
   ```

## Lessons Learned

1. **WSL2 + Docker Complexity**: The interaction between WSL2, Docker Desktop, and host filesystem can create unexpected permission issues. The hybrid architecture (host development + containerized services) requires careful management of file ownership.

2. **pnpm Symlink Sensitivity**: pnpm's symlink-based architecture is more sensitive to permission issues than npm's node_modules structure. A single root-owned symlink can block entire installation.

3. **Incremental Permission Issues**: Permission problems can accumulate over time from various sources (Docker, accidental sudo usage, file copies). Regular checks are essential.

4. **Comprehensive Fix Required**: Fixing only visible directories (apps/payload, apps/web) wasn't sufficient. The entire project tree needed ownership correction due to pnpm's workspace architecture.

## Commands for Future Reference

```bash
# Quick diagnosis
find . -type l -user root -path "*/node_modules/*" 2>/dev/null | head -10

# Count affected files
find . -path "*/node_modules/*" -user root 2>/dev/null | wc -l

# Fix all at once
sudo find . -type l -user root -exec chown -h $(whoami):$(whoami) {} +
sudo find . -path "*/node_modules/*" -user root -exec chown $(whoami):$(whoami) {} +

# Verify fix
pnpm install --frozen-lockfile
```

## Related Issues

- This is a recurring problem that has been experienced multiple times during dependency updates
- Consider implementing automated permission fixing in development scripts
