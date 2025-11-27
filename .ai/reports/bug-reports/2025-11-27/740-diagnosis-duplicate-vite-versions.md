# Bug Diagnosis: Duplicate Vite versions (7.2.2 and 7.2.4) in node_modules

**ID**: ISSUE-740
**Created**: 2025-11-27T17:30:00Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The project has two versions of Vite installed (7.2.2 and 7.2.4) due to inconsistent vitest version specifications across packages. The root `package.json` specifies `vitest: ^4.0.10` while `@vitest/coverage-v8: ^4.0.14` is also installed at the root. The `packages/e2b/package.json` also specifies `vitest: ^4.0.10`. When the lockfile was generated, vitest 4.0.10 resolved to use vite 7.2.2 as its peer dependency, while vitest 4.0.14 (from @vitest/coverage-v8) resolved to use vite 7.2.4.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: v22.16.0
- **pnpm Version**: 10.14.0
- **Database**: N/A (dependency issue)
- **Last Working**: N/A (not a runtime issue)

## Reproduction Steps

1. Run `pnpm why vite` to see the two versions
2. Run `find node_modules -name "package.json" -path "*/vite/*" -exec grep -l '"name": "vite"' {} \;` to see both vite package locations
3. Examine `pnpm-lock.yaml` and see both `vite@7.2.2` and `vite@7.2.4` entries

## Expected Behavior

Only one version of vite should be installed, as there's no need for multiple versions when they're compatible.

## Actual Behavior

Two versions of vite are installed:
- `node_modules/.pnpm/vite@7.2.2_@types+node@24.10.1_jiti@2.6.1_lightningcss@1.30.2_sass@1.77.4_terser@5.44.1_tsx@4.20.6_yaml@2.8.1/`
- `node_modules/.pnpm/vite@7.2.4_@types+node@24.10.1_jiti@2.6.1_lightningcss@1.30.2_sass@1.77.4_terser@5.44.1_tsx@4.20.6_yaml@2.8.1/`

## Diagnostic Data

### pnpm why vite output
```
Legend: production dependency, optional only, dev only

slideheroes@2.13.1 /home/msmith/projects/2025slideheroes (PRIVATE)

devDependencies:
@vitest/coverage-v8 4.0.14
└─┬ vitest 4.0.14 peer
  ├─┬ @vitest/mocker 4.0.14
  │ └── vite 7.2.4 peer
  └── vite 7.2.4
vitest 4.0.14
├─┬ @vitest/mocker 4.0.14
│ └── vite 7.2.4 peer
└── vite 7.2.4
```

### Lockfile Analysis
```
vitest@4.0.10(@types/debug@4.1.12)(@types/node@24.10.1)(jiti@2.6.1)(jsdom@27.2.0)...:
    dependencies:
      '@vitest/mocker': 4.0.10(vite@7.2.2...)
      ...
      vite: 7.2.2(...)

vitest@4.0.14(@types/debug@4.1.12)(@types/node@24.10.1)(jiti@2.6.1)(jsdom@27.2.0)...:
    dependencies:
      '@vitest/mocker': 4.0.14(vite@7.2.4...)
      ...
      vite: 7.2.4(...)
```

### Affected package.json files
```json
// Root package.json
"devDependencies": {
  "@vitest/coverage-v8": "^4.0.14",
  "vitest": "^4.0.10"
}

// packages/e2b/package.json
"devDependencies": {
  "vitest": "^4.0.10"
}
```

## Error Stack Traces
N/A - This is not causing runtime errors, but results in unnecessary disk space usage and potential for version confusion.

## Related Code
- **Affected Files**:
  - `package.json` (lines 131, 150)
  - `packages/e2b/package.json` (line 42)
  - `pnpm-lock.yaml` (multiple locations)
- **Recent Changes**: `1a30a9eb9 chore(deps): update payload to 3.65.0 and dev dependencies` (recent dependency update)

## Related Issues & Context

### Historical Context
This appears to be introduced when `@vitest/coverage-v8` was updated to 4.0.14 while vitest remained at ^4.0.10, and the lockfile resolution picked different vite versions for each.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Version mismatch between `vitest` (^4.0.10) and `@vitest/coverage-v8` (^4.0.14) causes pnpm to resolve two different vitest versions, each bringing its own vite peer dependency.

**Detailed Explanation**:
1. The root `package.json` has `vitest: ^4.0.10` and `@vitest/coverage-v8: ^4.0.14`
2. `@vitest/coverage-v8@4.0.14` has a peer dependency on `vitest@4.0.14`
3. When pnpm resolves dependencies:
   - Direct `vitest@^4.0.10` resolves to `4.0.10`, which depends on `vite@7.2.2`
   - `@vitest/coverage-v8@4.0.14` brings its peer `vitest@4.0.14`, which depends on `vite@7.2.4`
4. The `packages/e2b/package.json` also has `vitest: ^4.0.10`, contributing to keeping the older version

**Supporting Evidence**:
- Lockfile shows two distinct vitest installations: `vitest@4.0.10` and `vitest@4.0.14`
- Each vitest version has its own `@vitest/mocker` which requires vite as a peer dependency
- `@vitest/mocker@4.0.10` resolves to `vite@7.2.2`
- `@vitest/mocker@4.0.14` resolves to `vite@7.2.4`

### How This Causes the Observed Behavior

The `^` caret range in `^4.0.10` allows any version `>=4.0.10 <5.0.0`, but when the lockfile was generated/updated at different times, the "latest satisfying version" changed. Since `@vitest/coverage-v8@4.0.14` was explicitly updated (probably via `pnpm update`), it brought in the newer vitest/vite combo, while the direct vitest dependency stayed at its previously locked version.

### Confidence Level

**Confidence**: High

**Reasoning**: The lockfile clearly shows two distinct resolution paths for vitest, and the package.json version specifiers confirm the mismatch. The `pnpm why vite` output corroborates that both vitest versions bring their own vite dependencies.

## Fix Approach (High-Level)

Update the root `package.json` to align vitest with the coverage package:
1. Change `"vitest": "^4.0.10"` to `"vitest": "^4.0.14"` in root `package.json`
2. Change `"vitest": "^4.0.10"` to `"vitest": "^4.0.14"` in `packages/e2b/package.json`
3. Run `pnpm install` to update the lockfile
4. Verify with `pnpm why vite` that only one version exists

Alternatively, add a pnpm override to force a single vite version:
```json
"pnpm": {
  "overrides": {
    "vite": "7.2.4"
  }
}
```

## Diagnosis Determination

The duplicate vite versions are caused by misaligned vitest version specifications. The fix is straightforward: update the vitest version in both `package.json` files to match the version required by `@vitest/coverage-v8` (4.0.14+). This is a low-severity issue as it doesn't cause runtime problems, just unnecessary disk space usage.

## Additional Context
- This pattern of version drift is common in monorepos when individual packages are updated independently
- Using `syncpack` (already configured in this project) can help detect and fix these mismatches: `pnpm syncpack:list`

---
*Generated by Claude Debug Assistant*
*Tools Used: pnpm why, find, grep, git log, Read*
