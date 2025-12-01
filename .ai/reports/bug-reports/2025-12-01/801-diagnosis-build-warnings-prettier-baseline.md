# Bug Diagnosis: Build warnings for baseline-browser-mapping and prettier version mismatches

**ID**: ISSUE-pending
**Created**: 2025-12-01T15:00:00Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: bug

## Summary

During `pnpm run build`, the build displays multiple warning messages:
1. `[baseline-browser-mapping] The data in this module is over two months old` - repeated multiple times
2. Prettier version mismatches across the monorepo (though this is a separate infrastructure concern)

The project uses Biome for formatting/linting but still has extensive Prettier configuration as a legacy from Makerkit template.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: 18.x+
- **pnpm Version**: 10.14.0
- **Build Tool**: Turbo 2.6.1
- **Last Working**: N/A (warnings are non-blocking)

## Reproduction Steps

1. Run `pnpm run build`
2. Observe the build output
3. Note the `[baseline-browser-mapping]` warnings appearing multiple times during payload build
4. Build completes successfully despite warnings

## Expected Behavior

Build should complete without stale dependency warnings.

## Actual Behavior

Build shows warnings:
```
[baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
```

The warning appears 10+ times during the payload app build phase.

## Diagnostic Data

### Console Output
```
payload:build: [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
```

### Dependency Analysis

**baseline-browser-mapping dependency chain:**
```
eslint-plugin-react-hooks 7.0.1
└─┬ @babel/core 7.28.5
  └─┬ @babel/helper-compilation-targets 7.27.2
    └─┬ browserslist 4.28.0
      └── baseline-browser-mapping 2.8.29  (installed)
                                    2.8.32 (latest)
```

**Prettier situation:**
- Project uses Biome 2.3.6 for formatting/linting (root `biome.json`)
- But `@kit/prettier-config` package exists at `tooling/prettier/`
- Prettier 3.6.2 is installed as devDependency in root and several packages
- Multiple packages reference prettier in `format` scripts

### Current Versions
- `baseline-browser-mapping`: 2.8.29 (outdated)
- `prettier`: 3.7.1 installed (package.json specifies ^3.6.2)
- `@biomejs/biome`: 2.3.6

### Related Files
- Root `package.json` line 65: `"prettier": "@kit/prettier-config"`
- Root `package.json` line 144: `"prettier": "^3.6.2"` in devDependencies
- `tooling/prettier/package.json`: Prettier config package with plugins
- `apps/payload/.prettierrc.json`: Local prettier config
- `biome.json`: Active formatter configuration

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two separate issues - one is a transitive dependency being outdated, the other is legacy prettier infrastructure that should be removed.

**Issue 1 - baseline-browser-mapping (WARNING)**:
The `baseline-browser-mapping` package is a transitive dependency of `eslint-plugin-react-hooks` via the chain:
`eslint-plugin-react-hooks` → `@babel/core` → `@babel/helper-compilation-targets` → `browserslist` → `baseline-browser-mapping`

Version 2.8.29 is installed but 2.8.32 is available. The warning is purely informational and does not affect build correctness.

**Issue 2 - Prettier (INFRASTRUCTURE)**:
The project has migrated to Biome for formatting/linting but retains extensive Prettier infrastructure:
- `@kit/prettier-config` package at `tooling/prettier/`
- Prettier devDependency in root package.json
- Multiple packages have `format: "prettier --check ..."` scripts
- `apps/payload/.prettierrc.json` local config
- Root `package.json` has `"prettier": "@kit/prettier-config"` field

This creates confusion and potential version mismatches as both formatters are present.

**Supporting Evidence**:
- Root `biome.json` has `formatter: { enabled: true }` - Biome is the active formatter
- Root scripts use Biome: `"format": "biome format ."`, `"format:fix": "biome format --write ."`
- Package-level scripts still reference prettier (legacy)

### How This Causes the Observed Behavior

1. **baseline-browser-mapping**: The browserslist package checks its data freshness on startup and emits a warning when >2 months old. This is informational for CSS/JS target browsers.

2. **Prettier**: Multiple package.json files reference `@kit/prettier-config` and prettier, but the root workflow uses Biome. This doesn't cause build failures but represents technical debt.

### Confidence Level

**Confidence**: High

**Reasoning**:
- The dependency chain is clearly identified via `pnpm why`
- The Prettier/Biome situation is evident from config files
- Both issues are well-understood infrastructure concerns

## Fix Approach (High-Level)

**For baseline-browser-mapping**:
Add a pnpm override in root `package.json` to pin `baseline-browser-mapping` to latest version:
```json
"pnpm": {
  "overrides": {
    "baseline-browser-mapping": "^2.8.32"
  }
}
```

**For Prettier removal** (optional, larger effort):
1. Remove `prettier` from root devDependencies
2. Remove `"prettier": "@kit/prettier-config"` field from root and all package.json files
3. Remove `@kit/prettier-config` dependency from all packages
4. Update all package `format` scripts to use Biome instead of prettier
5. Delete `tooling/prettier/` directory
6. Delete `apps/payload/.prettierrc.json`
7. Remove `@trivago/prettier-plugin-sort-imports` (Biome handles imports via `assist.actions.source.organizeImports`)

## Diagnosis Determination

Both issues are identified and understood:

1. **baseline-browser-mapping**: Transitive dependency warning, easily fixable with pnpm override
2. **Prettier infrastructure**: Legacy technical debt from Makerkit template, can be cleaned up as a chore

Neither issue blocks the build - they are warnings and infrastructure debt respectively.

## Additional Context

The Prettier infrastructure appears to be inherited from the Makerkit template and was not fully removed when Biome was adopted. The `@trivago/prettier-plugin-sort-imports` functionality is now handled by Biome's `assist.actions.source.organizeImports` setting in `biome.json`.

---
*Generated by Claude Debug Assistant*
*Tools Used: pnpm why, grep, Read, pnpm dlx syncpack list-mismatches*
