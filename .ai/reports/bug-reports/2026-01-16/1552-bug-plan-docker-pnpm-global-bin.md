# Bug Fix: Docker CI Image Build Fails - pnpm Global Bin Directory Missing

**Related Diagnosis**: #1549
**Severity**: Low
**Bug Type**: infrastructure
**Risk Level**: Low
**Complexity**: Simple

## Quick Reference

- **Root Cause**: Dockerfile uses `corepack enable` to install pnpm but doesn't set `PNPM_HOME` environment variable before attempting to install global packages
- **Fix Approach**: Set `PNPM_HOME` environment variable and run `pnpm setup` before installing global tools
- **Estimated Effort**: Small
- **Breaking Changes**: No

## Solution Design

### Problem Recap

The CI Docker image build fails when trying to install global npm packages (turbo, biome, markdownlint-cli, yaml-lint) because pnpm's global bin directory is not configured. The Dockerfile at `.github/docker/Dockerfile.ci` uses `corepack` to enable pnpm but skips the setup step that creates the global directory structure.

When `pnpm add -g` runs without a configured `PNPM_HOME`, it fails with:
```
ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory
```

For full details, see diagnosis issue #1549.

### Solution Approaches Considered

#### Option 1: Set PNPM_HOME environment variable ⭐ RECOMMENDED

**Description**: Add `PNPM_HOME` and update `PATH` environment variables before installing global packages. This is the minimal fix that aligns with pnpm's documented configuration.

**Pros**:
- Minimal code changes (2 lines)
- Follows pnpm's documented best practice
- Explicitly configurable if different location needed in future
- No additional setup commands required
- Fast and reliable

**Cons**:
- Doesn't use `pnpm setup` script which could miss other initialization
- Less idiomatic than using `pnpm setup`

**Risk Assessment**: Low - Environment variables are a standard Docker pattern

**Complexity**: Simple - Just environment variable assignments

#### Option 2: Run `pnpm setup` after enabling corepack ⭐ RECOMMENDED (Alternative)

**Description**: Run `pnpm setup` command which automatically creates the global bin directory and updates environment variables. This is pnpm's official setup mechanism.

**Pros**:
- Uses pnpm's official setup command
- Handles all initialization in one command
- Future-proof if pnpm's setup evolves
- More idiomatic approach

**Cons**:
- Adds one extra RUN command
- Slightly longer setup time

**Risk Assessment**: Low - Official pnpm mechanism

**Complexity**: Simple - One additional command

#### Option 3: Run both PNPM_HOME and `pnpm setup`

**Description**: Set environment variables AND run `pnpm setup` for maximum compatibility.

**Why Not Chosen**: Redundant - if using `pnpm setup`, environment variables are unnecessary; if using environment variables alone, `pnpm setup` is redundant.

### Selected Solution: Combination Approach

**Justification**: Best practice combines environment variables for explicitness with `pnpm setup` for official initialization. This ensures:
- Environment is explicitly configured in Dockerfile (visible to readers)
- pnpm's internal setup is properly initialized
- Future changes to pnpm setup are handled automatically
- Works with both root and non-root users

**Technical Approach**:
1. Set `PNPM_HOME` environment variable to `/root/.local/share/pnpm` (default pnpm location)
2. Add `$PNPM_HOME` to `PATH` environment variable
3. Run `pnpm setup` to initialize the global structure
4. Install global packages with `pnpm add -g`

**Architecture Changes**: None - only Dockerfile configuration changes

**Migration Strategy**: Not applicable - this is a CI build fix with no production impact

## Implementation Plan

### Affected Files

- `.github/docker/Dockerfile.ci` - Add environment variables and pnpm setup command (lines 15-23)

### New Files

None - configuration only

### Step-by-Step Tasks

#### Step 1: Add PNPM_HOME Environment Variable

Add environment variable before the corepack commands. This makes the configuration explicit and visible.

- Add `ENV PNPM_HOME=/root/.local/share/pnpm` before line 16
- Add `ENV PATH="$PNPM_HOME:$PATH"` to include global bin in PATH
- These lines should be placed immediately before `RUN corepack enable`

**Why this step first**: Environment variables must be set before any commands that rely on them

#### Step 2: Run pnpm setup

After enabling corepack and preparing pnpm, run `pnpm setup` to initialize the global structure:

- Add `RUN pnpm setup` after line 16 (after corepack prepare)
- This command creates the global bin directory and any other necessary structures

**Why after corepack**: pnpm must be activated before setup can run

#### Step 3: Test the Build

Verify the Docker image builds successfully:

- Build the image: `docker build -f .github/docker/Dockerfile.ci -t slideheroes-ci:test .`
- Verify global tools are installed: `docker run slideheroes-ci:test which turbo`
- Check all tools are available: turbo, biome, markdownlint-cli, yaml-lint

#### Step 4: Validation

- Run the Docker build in isolation
- Confirm all global packages are installed and accessible
- Verify the image can be used in GitHub Actions

#### Step 5: Documentation

- Add inline comments in Dockerfile explaining PNPM_HOME configuration
- Update any CI documentation if needed

## Testing Strategy

### Unit Tests

Not applicable - Docker image build is integration-level testing

### Integration Tests

Verify the Docker image builds and contains necessary tools:

**Test cases**:
- ✅ Docker image builds without errors
- ✅ Global tools (turbo, biome, markdownlint-cli, yaml-lint) are installed
- ✅ Tools are executable and in PATH
- ✅ Running `pnpm add -g <package>` works inside built image
- ✅ Image works as expected in CI/CD pipeline

**Test execution**:
```bash
# Build the image
docker build -f .github/docker/Dockerfile.ci -t slideheroes-ci:test .

# Verify each tool is available
docker run slideheroes-ci:test which turbo
docker run slideheroes-ci:test which biome
docker run slideheroes-ci:test which markdownlint-cli
docker run slideheroes-ci:test which yarn-lint

# Test that we can install additional global packages
docker run slideheroes-ci:test pnpm add -g serve
```

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Build Docker image locally: `docker build -f .github/docker/Dockerfile.ci -t slideheroes-ci:test .`
- [ ] Verify turbo is available: `docker run slideheroes-ci:test turbo --version`
- [ ] Verify biome is available: `docker run slideheroes-ci:test biome --version`
- [ ] Verify markdownlint-cli is available: `docker run slideheroes-ci:test markdownlint --version`
- [ ] Verify yaml-lint is available: `docker run slideheroes-ci:test yaml-lint --version`
- [ ] Test pnpm global package installation works: `docker run slideheroes-ci:test pnpm add -g http-server`
- [ ] Verify no warnings or errors in build output

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Path Configuration Changes**: Setting `PNPM_HOME` to non-default location
   - **Likelihood**: Low (using standard pnpm default)
   - **Impact**: Low (only affects global packages in CI)
   - **Mitigation**: Use standard pnpm default `/root/.local/share/pnpm`

2. **CI/CD Pipeline Changes**: Unexpected behavior in GitHub Actions
   - **Likelihood**: Low (Docker image is self-contained)
   - **Impact**: Medium (could affect CI/CD pipeline)
   - **Mitigation**: Test image locally before merging; monitor first CI runs after fix

**Rollback Plan**:

If this fix causes issues:
1. Revert `.github/docker/Dockerfile.ci` to previous version
2. Remove the PNPM_HOME and PATH lines
3. Remove the pnpm setup command
4. Rebuild and redeploy the image

**Monitoring**: Monitor GitHub Actions CI builds after this change for any unexpected failures

## Performance Impact

**Expected Impact**: Minimal

- `pnpm setup` adds ~500ms to Docker build time
- Overall CI build time impact: <1%
- No runtime performance impact

## Security Considerations

**Security Impact**: None - low

- Setting environment variables is standard practice
- Using default pnpm locations is secure
- No additional permissions or elevated access required
- Works with non-root user (nodejs user)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Build the original Dockerfile (should fail)
docker build -f .github/docker/Dockerfile.ci -t slideheroes-ci:original .
# Expected: Build fails with ERR_PNPM_NO_GLOBAL_BIN_DIR
```

### After Fix (Bug Should Be Resolved)

```bash
# Build the fixed Dockerfile
docker build -f .github/docker/Dockerfile.ci -t slideheroes-ci:fixed .

# Verify global tools are installed
docker run slideheroes-ci:fixed turbo --version
docker run slideheroes-ci:fixed biome --version
docker run slideheroes-ci:fixed markdownlint-cli --version
docker run slideheroes-ci:fixed yaml-lint --version

# Test that pnpm global installation works
docker run slideheroes-ci:fixed pnpm add -g serve
```

**Expected Result**: All commands succeed, no errors, all tools available in PATH

## Dependencies

### New Dependencies

None - uses existing pnpm and Node.js capabilities

**No new dependencies required**

## Database Changes

**No database changes required** - Docker image build only

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
- Rebuild Docker image from updated Dockerfile
- Tag with new version
- Update GitHub Actions workflows to use new image if needed

**Feature flags needed**: No

**Backwards compatibility**: Maintained - image is internal build tool, no breaking changes

## Success Criteria

The fix is complete when:
- [ ] `.github/docker/Dockerfile.ci` has PNPM_HOME and PATH configured
- [ ] pnpm setup command is executed in Dockerfile
- [ ] Docker image builds without `ERR_PNPM_NO_GLOBAL_BIN_DIR` errors
- [ ] All global tools (turbo, biome, markdownlint-cli, yaml-lint) are accessible in image
- [ ] `pnpm add -g` works successfully inside built image
- [ ] Local Docker build verification passes
- [ ] CI/CD pipeline uses updated image and builds successfully

## Notes

This is a low-severity fix for the CI infrastructure. The bug only affects the CI Docker image build process, not the actual application. The fix is straightforward: configure pnpm's global bin directory before attempting to install global packages.

The selected approach (PNPM_HOME env vars + pnpm setup) balances clarity with robustness, following pnpm's official documentation while being explicit about the configuration.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1549*
