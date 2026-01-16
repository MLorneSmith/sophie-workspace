# Context7 Research: Vercel pnpm Monorepo Deployments

**Date**: 2026-01-14
**Agent**: context7-expert
**Libraries Researched**: websites/vercel, websites/vercel_monorepos, vercel/vercel

## Query Summary

Researched Vercel documentation for pnpm monorepo deployments, focusing on:
1. installCommand configuration in vercel.json
2. Preinstall hooks interaction with Vercel install process
3. Best practices for pnpm monorepo deployments
4. Common pnpm installation failures (ERR_PNPM errors)
5. Corepack integration with Vercel

## Findings

### 1. installCommand in vercel.json for Monorepos

The installCommand property in vercel.json overrides the default package manager detection and install command used by Vercel.

**Basic Configuration:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "pnpm install"
}
```

**Key Behaviors:**
- **Override**: installCommand completely overrides the default install command from Project Settings
- **Empty String**: Setting installCommand to an empty string ("") skips the install step entirely
- **Monorepo Context**: In monorepos, the install command runs from the root directory by default unless rootDirectory is configured

**Project Settings Alternative:**
- Can also be configured in Vercel Dashboard under Project Settings > General > Build & Development Settings
- vercel.json takes precedence over dashboard settings for individual deployments

### 2. Preinstall Hooks and Vercel Install Process

**Important Discovery**: Vercel documentation mentions postinstall scripts but has limited documentation on preinstall hooks specifically.

**What We Know:**
- postinstall scripts execute after dependencies are installed
- Vercel recommends avoiding postinstall scripts for performance (Conformance rule: NO_POSTINSTALL_SCRIPT)
- The vercel-build script in package.json runs during the build phase, after install

**Best Practice**: If you need preinstall logic, consider:
1. Using installCommand to run a custom script instead
2. Moving logic to a pre-build script
3. Using environment variables for configuration

### 3. Best Practices for pnpm Monorepo Deployments on Vercel

#### a. Package Manager Version Pinning

**Recommended Configuration in package.json:**
```json
{
  "engines": {
    "pnpm": "^9.0.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

#### b. Enable Corepack for Version Management

Set environment variable in Vercel:
```
ENABLE_EXPERIMENTAL_COREPACK=1
```

This allows Vercel to use the exact pnpm version specified in packageManager field.

#### c. Root Directory Configuration

For monorepos, configure the root directory in Vercel:
- **Dashboard**: Project Settings > General > Root Directory
- **URL Parameter**: root-directory=apps/web

**vercel.json for specific app:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm build"
}
```

#### d. Turborepo Integration (Recommended for pnpm Monorepos)

**turbo.json configuration:**
```json
{
  "$schema": "https://turborepo.com/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "env": ["SOME_ENV_VAR"],
      "outputs": [
        ".next/**",
        "!.next/cache/**"
      ]
    }
  },
  "globalEnv": ["GITHUB_TOKEN"],
  "globalDependencies": ["tsconfig.json"]
}
```

**Link to Remote Cache:**
```bash
pnpm i
turbo link
```

#### e. Output Directory Configuration

Ensure outputs align with your framework:
```json
{
  "pipeline": {
    "build": {
      "outputs": [
        ".next/**", "!.next/cache/**",
        ".svelte-kit/**", ".vercel/**",
        ".vercel/output/**",
        ".nuxt/**", "dist/**"
      ]
    }
  }
}
```

### 4. Common pnpm Installation Failures

#### ERR_PNPM_UNSUPPORTED_ENGINE

**Cause**: pnpm version mismatch between local and Vercel environment

**Solution:**
```json
{
  "engines": {
    "pnpm": "^9.0.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

**Plus enable Corepack:**
```
ENABLE_EXPERIMENTAL_COREPACK=1
```

#### Install Command Failures

**Common Issues:**
1. **Missing dependencies**: Ensure all workspace packages are properly declared
2. **Private registry auth**: Configure NPM_TOKEN or use Vercel Private Registry
3. **Lockfile conflicts**: Ensure pnpm-lock.yaml is committed and up-to-date

**Override Install Command:**
```json
{
  "installCommand": "pnpm install --frozen-lockfile"
}
```

#### Build Output Not Found After Cache Hit

**Cause**: Turborepo cache hit but build outputs not configured correctly

**Solution**: Ensure turbo.json outputs match your framework output directory exactly.

### 5. Corepack Integration with Vercel

#### Enabling Corepack

**Environment Variable:**
```
ENABLE_EXPERIMENTAL_COREPACK=1
```

**Manual Enable (in custom install command):**
```bash
corepack enable pnpm && pnpm install
```

#### How Corepack Works with Vercel

1. Vercel reads packageManager field from package.json
2. With ENABLE_EXPERIMENTAL_COREPACK=1, Vercel uses Corepack to install the exact version
3. Corepack downloads and activates the specified pnpm version
4. Install and build proceed with the pinned version

**Example package.json:**
```json
{
  "name": "my-monorepo",
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

#### Version String Format

Use the exact format: pnpm@X.Y.Z (e.g., pnpm@9.15.0)

## Key Takeaways

1. **Always pin pnpm version** using both packageManager field and engines in package.json
2. **Enable Corepack** via ENABLE_EXPERIMENTAL_COREPACK=1 environment variable for version consistency
3. **Use installCommand** in vercel.json to explicitly specify pnpm install for monorepos
4. **Configure Turborepo outputs** carefully to match framework expectations for cache hits
5. **Avoid postinstall scripts** - use vercel-build or custom build commands instead
6. **Set root directory** correctly for monorepo deployments (apps/web, packages/app, etc.)
7. **Use --frozen-lockfile** in production builds for reproducibility

## Recommended vercel.json for pnpm Monorepo

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next"
}
```

## Recommended package.json Fields

```json
{
  "name": "my-app",
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "next build",
    "vercel-build": "pnpm build"
  }
}
```

## Environment Variables to Set in Vercel

| Variable | Value | Purpose |
|----------|-------|---------|
| ENABLE_EXPERIMENTAL_COREPACK | 1 | Enable Corepack for package manager version pinning |
| NPM_TOKEN | (token) | Private registry authentication (if needed) |

## Code Examples

### Complete Monorepo Setup

**Root package.json:**
```json
{
  "name": "my-monorepo",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev"
  }
}
```

**apps/web/vercel.json:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo build --filter=web"
}
```

**Alternative: Use Root Directory Setting:**
- Set Root Directory to apps/web in Vercel Dashboard
- Vercel will run install from repo root automatically

### Handling Private Dependencies

**vercel.json with auth:**
```json
{
  "installCommand": "echo '//registry.npmjs.org/:_authToken=$NPM_TOKEN' >> .npmrc && pnpm install"
}
```

## Sources

- Vercel Documentation via Context7 (websites/vercel)
- Vercel Monorepos Documentation via Context7 (websites/vercel_monorepos)
- Vercel CLI Repository via Context7 (vercel/vercel)
