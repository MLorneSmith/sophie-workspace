## ✅ Implementation Complete

### Summary
- Configured `PNPM_HOME=/usr/local/share/pnpm` environment variable for shared access across users
- Added `PATH` update to include the pnpm global bin directory
- Added `SHELL=/bin/bash` environment variable for pnpm setup compatibility
- Added `pnpm setup` command to initialize the global directory structure
- Added `chmod -R 755 $PNPM_HOME` to ensure the `nodejs` user can access globally installed tools

### Files Changed
```
.github/docker/Dockerfile.ci | 9 +++++++++
1 file changed, 9 insertions(+)
```

### Commits
```
a596c1e15 fix(docker): configure pnpm global bin directory for CI image
```

### Validation Results
✅ All validation commands passed successfully:
- Docker build completed without errors
- All global tools verified accessible as `nodejs` user:
  - `turbo --version` → 2.7.4
  - `biome --version` → 2.3.11
  - `markdownlint --version` → 0.47.0
  - `yamllint --version` → 1.7.0

### Technical Notes
- Used `/usr/local/share/pnpm` instead of `/root/.local/share/pnpm` to ensure the non-root `nodejs` user has access to the tools
- The `pnpm setup` command requires `SHELL` environment variable to be set
- The `yaml-lint` package installs as `yamllint` binary (no hyphen), which is expected behavior

---
*Implementation completed by Claude*
