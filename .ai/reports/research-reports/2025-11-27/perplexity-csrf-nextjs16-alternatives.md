# Perplexity Research: CSRF Protection Alternatives for Next.js 16

**Date**: 2025-11-27
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary
Researched alternatives to the deprecated @edge-csrf/nextjs package for Next.js 16, including what replaced it, modern CSRF protection alternatives, and whether Next.js 16 has built-in CSRF protection.

## Findings

### Current Status of @edge-csrf/nextjs
**Important**: The package is **NOT officially deprecated**. However, it only officially supports Next.js 13, 14, and 15.

**Package Status**:
- **Current Version**: Actively maintained (last updated November 2024)
- **Supported Versions**: Next.js 13, 14, 15
- **Weekly Downloads**: 26,759
- **Health**: Healthy release cadence

### Next.js 16 Middleware Changes
Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts` - primarily a signaling change to indicate middleware should be used for edge operations rather than data access/authentication.

### Built-in Next.js CSRF Protection
**YES**, Next.js has built-in CSRF protection:
- **Server Actions**: Automatically compare request origin with host domain
- **Zero Configuration**: Works out of the box for Server Actions
- **Limitation**: Only covers Server Actions, not traditional API routes

### Modern CSRF Protection Alternatives

#### 1. @edge-csrf/nextjs (Recommended)
Most mature and widely-used solution. Actively maintained, 26K+ weekly downloads.

**Installation**: `pnpm add @edge-csrf/nextjs`

#### 2. @edge-csrf/core
Lower-level API for custom implementations with maximum flexibility.

#### 3. Built-in Server Actions CSRF
Zero-configuration, built into Next.js. Best for apps exclusively using Server Actions.

### Migration Recommendations

**Scenario 1: New Next.js 16 App** - Use built-in Server Actions CSRF
**Scenario 2: Existing App with API Routes** - Use @edge-csrf/nextjs in proxy.ts
**Scenario 3: Custom Requirements** - Use @edge-csrf/core

## Sources & Citations
1. [GitHub - vercel/next.js Discussion #38257](https://github.com/vercel/next.js/discussions/38257)
2. [@edge-csrf/nextjs on NPM](https://www.npmjs.com/package/@edge-csrf/nextjs)
3. [GitHub - amorey/edge-csrf](https://github.com/amorey/edge-csrf)
4. [Next.js Blog - Next.js 16](https://nextjs.org/blog)

## Key Takeaways
1. @edge-csrf/nextjs is NOT deprecated - actively maintained
2. Next.js 16 middleware.ts → proxy.ts rename required
3. Built-in CSRF protection exists for Server Actions
4. Hybrid approach recommended: built-in for Server Actions, @edge-csrf for API routes
5. Data Access Layer pattern recommended for Next.js 16
