# Next.js 16 Migration Guide

This document provides comprehensive guidance for migrating from Next.js 15 to Next.js 16.

## Breaking Changes

### 1. Async Request APIs (Critical Breaking Change)

**What Changed**: All request-scoped APIs must now be accessed asynchronously. Synchronous access has been fully removed.

**Affected APIs**:

- `cookies()`
- `headers()`
- `draftMode()`
- `params` prop in layout.js, page.js, route.js, default.js, and metadata files
- `searchParams` prop

**Before (Next.js 15)**:

```typescript
// Page component
export default function Page({ params, searchParams }: Props) {
  const { slug } = params;
  const query = searchParams.q;
  return <div>{slug}</div>;
}

// Using cookies/headers
import { cookies, headers } from 'next/headers';

export default function Page() {
  const cookieStore = cookies();
  const headersList = headers();
  const theme = cookieStore.get('theme');
  return <div>{theme?.value}</div>;
}
```

**After (Next.js 16)**:

```typescript
// Page component - MUST await params and searchParams
export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { slug } = params;
  const query = searchParams.q;
  return <div>{slug}</div>;
}

// Using cookies/headers - MUST await
import { cookies, headers } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const headersList = await headers();
  const theme = cookieStore.get('theme');
  return <div>{theme?.value}</div>;
}
```

**Layout Components**:

```typescript
// Before (Next.js 15)
export default function Layout({ params, children }: Props) {
  const { account } = params;
  return <div>{children}</div>;
}

// After (Next.js 16)
export default async function Layout(props: Props) {
  const params = await props.params;
  const { account } = params;
  return <div>{props.children}</div>;
}
```

**Metadata Files (opengraph-image, twitter-image, icon, apple-icon)**:

```typescript
// Before (Next.js 15)
export default function Image({ params, id }: Props) {
  const { slug } = params;
  return new ImageResponse(<div>{slug}</div>);
}

// After (Next.js 16)
export default async function Image(props: Props) {
  const params = await props.params;
  const imageId = await props.id;
  const { slug } = params;
  return new ImageResponse(<div>{slug}</div>);
}
```

**Migration Tool**: Run the official codemod to automate this migration:

```bash
npx @next/codemod@canary upgrade latest
```

### 2. Middleware Renamed to Proxy

**What Changed**: The `middleware.ts` file has been deprecated and renamed to `proxy.ts` to clarify network boundary responsibilities.

**Key Differences**:

- `proxy.ts` runs on Node.js runtime (not Edge runtime)
- Cannot configure runtime in proxy.ts
- Edge runtime middleware still supported via `middleware.ts` (deprecated)

**Before (Next.js 15)**:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url));
}

export const config = {
  matcher: '/about/:path*',
};
```

**After (Next.js 16)**:

```typescript
// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url));
}

export const config = {
  matcher: '/about/:path*',
};
```

### 3. Turbopack is Default Bundler

**What Changed**: Turbopack is now the default bundler for both development and production.

**Impact**:

- Projects with custom Webpack configurations must migrate or opt-out
- Significant performance improvements (2-5× faster production builds, up to 10× faster Fast Refresh)

**Opt-out to continue using Webpack**:

```bash
# Development
next dev --webpack

# Production
next build --webpack
```

**Migrate Webpack config to Turbopack**: Update `next.config.js`:

```javascript
// Before (Next.js 15 with Webpack)
module.exports = {
  webpack: (config, { dev, isServer }) => {
    config.module.rules.push({
      test: /\.custom$/,
      use: 'custom-loader'
    });
    return config;
  }
};

// After (Next.js 16 with Turbopack)
module.exports = {
  turbopack: {
    rules: {
      '*.custom': {
        loaders: ['custom-loader'],
        as: '*.js'
      }
    }
  }
};
```

### 4. Image Configuration Changes

**minimumCacheTTL Default Changed**:

- Old default: 60 seconds
- New default: 14,400 seconds (4 hours)

**imageSizes Array Changed**:

- Removed: `16` from default array
- Default is now: `[640, 750, 828, 1080, 1200, 1920, 2048, 3840]`

**qualities Array Simplified**:

- Old default: `[75, 100]`
- New default: `[75]`

**Local Images with Query Strings**:

```javascript
// next.config.js
module.exports = {
  images: {
    localPatterns: [
      {
        pathname: '/assets/images/**',
        search: '?quality=90', // Now required for query strings
      }
    ]
  }
};
```

**images.domains Deprecated**:

```javascript
// Before (deprecated)
module.exports = {
  images: {
    domains: ['example.com', 'cdn.example.com']
  }
};

// After (recommended)
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com'
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com'
      }
    ]
  }
};
```

### 5. Parallel Routes Require default.js

**What Changed**: All parallel route slots now require explicit `default.js` files.

**Impact**: Builds will fail if any parallel route slot is missing a `default.js` file.

**Example Structure**:

```
app/
├── @analytics/
│   ├── page.js
│   └── default.js  // ← Required
├── @team/
│   ├── page.js
│   └── default.js  // ← Required
└── layout.js
```

**default.js Template**:

```typescript
// app/@slot/default.js
export default function Default() {
  return null;
}
```

### 6. Node.js and TypeScript Requirements

**Minimum Versions**:

- Node.js: 20.9.0 (Node.js 18 no longer supported)
- TypeScript: 5.1.0

**Update Node.js**:

```bash
# Using nvm
nvm install 20
nvm use 20

# Verify version
node --version  # Should be 20.9.0 or higher
```

**Update TypeScript**:

```bash
pnpm add -D typescript@latest
```

### 7. Browser Support Changes

**Minimum Browser Versions**:

- Chrome: 111+
- Edge: 111+
- Firefox: 111+
- Safari: 16.4+

## Removed/Deprecated Features

### Fully Removed

1. **next/legacy/image**: Use `next/image` instead
2. **AMP Support**: Removed entirely
3. **Runtime Configuration**: `serverRuntimeConfig` and `publicRuntimeConfig` removed
4. **next lint CLI**: Use `eslint` directly with Next.js config
5. **images.domains**: Use `images.remotePatterns` instead

### Deprecated (Will be removed in future)

1. **middleware.ts**: Rename to `proxy.ts`
2. **Experimental PPR flags**: Use Cache Components instead

## Migration Checklist

- [ ] Verify Node.js version is 20.9.0 or higher
- [ ] Verify TypeScript version is 5.1.0 or higher
- [ ] Run automated codemod: `npx @next/codemod@canary upgrade latest`
- [ ] Add `await` to all `params` and `searchParams` prop accesses
- [ ] Add `await` to all `cookies()`, `headers()`, `draftMode()` calls
- [ ] Rename `middleware.ts` to `proxy.ts` and update export name
- [ ] Update `next/legacy/image` to `next/image`
- [ ] Add `default.js` files to all parallel route slots
- [ ] Migrate or opt-out of Turbopack if using custom Webpack config
- [ ] Update `images.domains` to `images.remotePatterns`
- [ ] Test thoroughly with `next dev` and `next build`
- [ ] Update browser support documentation if needed
