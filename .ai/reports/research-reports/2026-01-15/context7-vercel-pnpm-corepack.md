# Context7 Research: Vercel pnpm and Corepack Configuration

**Date**: 2026-01-15
**Agent**: context7-expert
**Libraries Researched**: websites/vercel, websites/vercel_monorepos

## Query Summary

Researched Vercel documentation for:
1. `ENABLE_EXPERIMENTAL_COREPACK` environment variable
2. How to use pnpm 10.x with Vercel
3. `packageManager` field detection in monorepos
4. Best practices for pnpm monorepo deployments on Vercel

## Findings

### 1. ENABLE_EXPERIMENTAL_COREPACK Environment Variable

**Source**: https://vercel.com/docs/builds/configure-a-build

Corepack is an experimental Node.js feature that allows projects to ensure consistent package manager usage across environments. To enable it on Vercel:

**Configuration**:
```bash
# Set as Vercel environment variable
ENABLE_EXPERIMENTAL_COREPACK=1
```

When enabled, Vercel will respect the `packageManager` field in your `package.json`.

### 2. Using pnpm 10.x with Vercel

**Method 1: Corepack with packageManager field (Recommended)**

```json
{
  "packageManager": "pnpm@10.14.0"
}
```

Combined with:
```bash
ENABLE_EXPERIMENTAL_COREPACK=1
```

**Method 2: engines field (for validation)**

```json
{
  "engines": {
    "pnpm": "^10.14.0"
  },
  "packageManager": "pnpm@10.14.0"
}
```

**Method 3: Override via vercel.json**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "pnpm install"
}
```

Note: This method uses Vercel's bundled pnpm version, not a specific version.

### 3. Package Manager Detection in Monorepos

**Source**: https://vercel.com/docs/llms-full (Deploy Button documentation)

Vercel's auto-detection behavior based on lock files:

| Lock File | Install Command | Package Manager |
| --- | --- | --- |
| `pnpm-lock.yaml` | `pnpm install` | pnpm 6/7/8/9/10 |
| `package-lock.json` | `npm install` | npm |
| `bun.lockb` | `bun install` | bun 1 |
| `bun.lock` | `bun install` | bun 1 |
| None | `npm install` | Default |

**Important**: When Corepack is enabled (`ENABLE_EXPERIMENTAL_COREPACK=1`), Vercel will use the **exact version** specified in `packageManager` instead of auto-detecting based on lock file.

### 4. Best Practices for pnpm Monorepo Deployments

**Recommended Configuration**:

1. **package.json** (root):
```json
{
  "packageManager": "pnpm@10.14.0",
  "engines": {
    "node": ">=20",
    "pnpm": ">=10.14.0"
  }
}
```

2. **Vercel Environment Variables**:
```bash
ENABLE_EXPERIMENTAL_COREPACK=1
```

3. **For Turborepo monorepos** (turbo.json):
```json
{
  "$schema": "https://turborepo.com/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

4. **Enable Turborepo Remote Caching**:
```bash
pnpm i
turbo link
```

**Local Development Setup**:
```bash
corepack enable pnpm && pnpm install
```

## Key Takeaways

- **ENABLE_EXPERIMENTAL_COREPACK=1** must be set as an environment variable in Vercel project settings to use specific pnpm versions
- The `packageManager` field in `package.json` is the source of truth when Corepack is enabled
- Format: `"packageManager": "pnpm@10.14.0"` (exact version, no caret or tilde)
- Without Corepack enabled, Vercel auto-detects based on lock file presence but uses its bundled pnpm version
- The `engines` field provides validation but doesn't control the version used
- For monorepos, ensure the `packageManager` field is in the root `package.json`

## Code Examples

### Complete package.json for pnpm 10.x Monorepo

```json
{
  "name": "my-monorepo",
  "private": true,
  "packageManager": "pnpm@10.14.0",
  "engines": {
    "node": ">=20",
    "pnpm": ">=10.14.0"
  },
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  }
}
```

### vercel.json (Optional Override)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "corepack enable pnpm && pnpm install"
}
```

Note: The installCommand override is typically not needed when `ENABLE_EXPERIMENTAL_COREPACK=1` is set.

## Sources

- Vercel Documentation via Context7 (/websites/vercel)
- Vercel Monorepos Documentation via Context7 (/websites/vercel_monorepos)

**Key Documentation URLs**:
- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/docs/package-managers
- https://vercel.com/docs/monorepos/turborepo
