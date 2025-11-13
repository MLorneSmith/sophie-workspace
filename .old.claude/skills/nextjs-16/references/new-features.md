# Next.js 16 New Features

This document details the new features introduced in Next.js 16.

## Cache Components

Cache Components represent a fundamental shift in Next.js caching philosophy from implicit to explicit caching.

### Overview

**Philosophy Change**:

- Next.js 15 and earlier: Implicit caching by default
- Next.js 16: Explicit opt-in caching using `"use cache"` directive

**Key Benefits**:

- More predictable caching behavior
- Explicit control over what gets cached
- Better debugging and understanding of cache behavior
- Completes Partial Prerendering (PPR) implementation

### Using "use cache" Directive

The `"use cache"` directive can be applied at three levels:

#### 1. Component-Level Caching

```typescript
// app/components/product-list.tsx
'use cache';

export async function ProductList() {
  const products = await fetchProducts();

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

#### 2. Function-Level Caching

```typescript
// app/lib/data.ts
'use server';

export async function getUser(id: string) {
  'use cache';

  const user = await db.user.findUnique({
    where: { id }
  });

  return user;
}
```

#### 3. Page-Level Caching

```typescript
// app/products/page.tsx
'use cache';

export default async function ProductsPage() {
  const products = await fetchProducts();

  return <ProductList products={products} />;
}
```

### Cache Configuration

Configure cache behavior with `cacheLife` and `cacheTag`:

```typescript
'use server';

export async function getProducts() {
  'use cache';
  cacheLife('hours');
  cacheTag('products');

  return await db.product.findMany();
}
```

**Built-in Cache Profiles**:

- `'default'`: General content (3600 seconds)
- `'seconds'`: Frequently changing data (60 seconds)
- `'minutes'`: Moderate freshness needs (300 seconds)
- `'hours'`: Stable content (3600 seconds)
- `'days'`: Rarely changing data (86400 seconds)
- `'weeks'`: Static content (604800 seconds)
- `'max'`: Maximum duration allowed

**Custom Cache Profiles**:

```javascript
// next.config.js
module.exports = {
  cacheLife: {
    product: {
      stale: 300,    // 5 minutes
      revalidate: 900, // 15 minutes
      expire: 3600   // 1 hour
    }
  }
};
```

### New Caching APIs

#### updateTag()

Provides read-your-writes semantics for immediate UI updates after mutations:

```typescript
'use server';

import { updateTag } from 'next/cache';

export async function createProduct(data: ProductData) {
  const product = await db.product.create({ data });

  // Immediately update cache for instant UI reflection
  updateTag('products');

  return product;
}
```

**Use Cases**:

- Immediate UI updates after mutations
- Optimistic UI patterns
- Real-time data synchronization

#### revalidateTag() with cacheLife

Enhanced `revalidateTag()` now accepts a cache profile:

```typescript
'use server';

import { revalidateTag } from 'next/cache';

export async function updateProduct(id: string, data: ProductData) {
  await db.product.update({
    where: { id },
    data
  });

  // Revalidate with specific cache profile
  revalidateTag('products', 'hours');
}
```

#### refresh()

New API to refresh only uncached data from Server Actions:

```typescript
'use server';

import { refresh } from 'next/cache';

export async function refreshData() {
  // Only fetches data that isn't cached
  refresh();
}
```

### Migration from Implicit Caching

**Next.js 15 (Implicit)**:

```typescript
// Automatically cached
export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}
```

**Next.js 16 (Explicit)**:

```typescript
'use cache';

// Explicitly opt-in to caching
export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}
```

## Turbopack (Stable)

Turbopack has reached stability and is now the default bundler for all Next.js applications.

### Performance Improvements

- **Development**: Up to 10× faster Fast Refresh
- **Production**: 2-5× faster builds
- **Memory**: Lower memory usage
- **Incremental**: Better incremental compilation

### Key Features

**Stable in Next.js 16**:

- Full App Router support
- Pages Router support
- TypeScript
- CSS Modules, Sass, PostCSS
- Image optimization
- Font optimization
- Environment variables
- All Next.js built-in features

**Default Behavior**:

```bash
# These now use Turbopack by default
next dev
next build
```

**Opt-out if needed**:

```bash
next dev --webpack
next build --webpack
```

### Configuration

**Basic Turbopack Config**:

```javascript
// next.config.js
module.exports = {
  turbopack: {
    // Module resolution
    resolveAlias: {
      '@': './src',
      'components': './src/components'
    },

    // Custom loaders
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  }
};
```

## proxy.ts (Replaces middleware.ts)

The new `proxy.ts` file clarifies the network boundary and runs on the Node.js runtime.

### Key Differences from middleware.ts

**Runtime**:

- `middleware.ts`: Edge runtime
- `proxy.ts`: Node.js runtime (cannot be configured)

**Use Cases**:

- Route-level request/response manipulation
- Authentication checks
- Redirects and rewrites
- Header modifications

### Basic Usage

```typescript
// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Authentication example
  const token = request.cookies.get('auth-token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add custom headers
  const response = NextResponse.next();
  response.headers.set('x-custom-header', 'value');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Advanced Patterns

**Conditional Redirects**:

```typescript
export function proxy(request: NextRequest) {
  const country = request.geo?.country;

  if (country === 'US' && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/us', request.url));
  }

  if (country === 'GB' && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/uk', request.url));
  }

  return NextResponse.next();
}
```

**Request Transformation**:

```typescript
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-forwarded-from', request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

## Next.js DevTools MCP

Model Context Protocol integration for AI-assisted debugging.

### Features

- **Next.js Knowledge**: Routing, caching, and rendering behavior context
- **Unified Logs**: Browser and server logs in one place
- **AI Assistance**: Contextual debugging suggestions
- **Performance Insights**: Timing and performance metrics

### Usage

The DevTools MCP is automatically available when using AI development tools that support MCP (like Claude Code).

**Example Debugging Session**:

```typescript
// Claude can now understand Next.js-specific context like:
// - Why a component is/isn't cached
// - Route segment configuration impact
// - Server vs client component boundaries
// - Hydration issues
// - Performance bottlenecks
```

## Enhanced Logging

### Development Logs

**Request-Level Timing**:

```
GET /dashboard 200 in 234ms
├─ Compile: 45ms
└─ Render: 189ms
   ├─ Server Component: 120ms
   └─ Client Component: 69ms
```

### Build Logs

**Step-by-Step Timing**:

```
Creating an optimized production build...
├─ Compiled successfully (3.2s)
├─ Collecting page data (1.8s)
├─ Generating static pages (2.1s)
│  ├─ / (234ms)
│  ├─ /about (189ms)
│  └─ /products (456ms)
└─ Finalizing page optimization (0.9s)

Build completed in 8.0s
```

## Enhanced Routing System

Complete routing system overhaul with no code changes required.

### Key Improvements

**Layout Deduplication**:

- Shared layouts are downloaded once
- Multiple links to pages with same layout don't re-fetch
- Significant reduction in data transfer

**Incremental Prefetching**:

- Only uncached route segments are prefetched
- Smarter cache utilization
- Faster navigation

**Performance Impact**:

- Faster initial page loads
- Reduced bandwidth usage
- Improved navigation performance
- Better caching efficiency

## React 19.2 Support

Next.js 16 includes React 19.2 with new features:

### View Transitions

Animate elements during Transitions or navigation:

```typescript
'use client';

import { useTransition } from 'react';

export function ProductFilter() {
  const [isPending, startTransition] = useTransition();

  function handleFilterChange(filter: string) {
    startTransition(() => {
      // Animate the filter transition
      updateFilter(filter);
    });
  }

  return <FilterUI onChange={handleFilterChange} />;
}
```

### useEffectEvent (Experimental)

```typescript
'use client';

import { useEffectEvent } from 'react';

export function Component() {
  const onResize = useEffectEvent(() => {
    // Non-reactive event handler
    console.log('Window resized');
  });

  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []); // onResize doesn't trigger re-runs
}
```

## React Compiler (Stable)

Built-in support for the React Compiler is now stable.

### Configuration

```javascript
// next.config.js
module.exports = {
  reactCompiler: true,

  // Or with options
  reactCompiler: {
    compilationMode: 'annotation', // or 'all'
  }
};
```

### Benefits

- Automatic memoization
- Reduced manual `useMemo`/`useCallback` usage
- Better performance with less code
- No runtime overhead

### Trade-offs

- Increased compile times
- Larger bundle sizes in some cases
- May require code adjustments for edge cases

**Use annotation mode for gradual adoption**:

```typescript
'use memo'; // Opt-in to compilation for this component

export function ExpensiveComponent({ data }) {
  // Automatically optimized
  const processed = processData(data);
  return <div>{processed}</div>;
}
```
