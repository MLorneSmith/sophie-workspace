# Next.js 16 Common Patterns

This document provides practical code patterns for Next.js 16 development.

## Async Props Patterns

### Page Components

**Standard Pattern**:
```typescript
// app/products/[id]/page.tsx
interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const product = await fetchProduct(params.id);
  const filter = searchParams.filter;

  return (
    <div>
      <h1>{product.name}</h1>
      {filter && <p>Filter: {filter}</p>}
    </div>
  );
}
```

**Parallel Data Fetching**:
```typescript
export default async function ProductPage(props: Props) {
  const params = await props.params;

  // Fetch data in parallel
  const [product, reviews, relatedProducts] = await Promise.all([
    fetchProduct(params.id),
    fetchReviews(params.id),
    fetchRelatedProducts(params.id)
  ]);

  return (
    <div>
      <ProductDetails product={product} />
      <Reviews reviews={reviews} />
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
```

### Layout Components

**Standard Pattern**:
```typescript
// app/[locale]/layout.tsx
interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout(props: Props) {
  const params = await props.params;
  const locale = params.locale;

  const messages = await loadMessages(locale);

  return (
    <div lang={locale}>
      <I18nProvider messages={messages}>
        {props.children}
      </I18nProvider>
    </div>
  );
}
```

**With Authentication**:
```typescript
export default async function ProtectedLayout(props: Props) {
  const params = await props.params;
  const cookieStore = await cookies();

  const session = await verifySession(cookieStore);

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <Header user={session.user} />
      {props.children}
    </div>
  );
}
```

### Metadata Generation

**Dynamic Metadata**:
```typescript
// app/products/[id]/page.tsx
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const product = await fetchProduct(params.id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}
```

**With Search Params**:
```typescript
export async function generateMetadata(props: Props): Promise<Metadata> {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams
  ]);

  const category = searchParams.category || 'all';

  return {
    title: `${category} Products`,
    description: `Browse our ${category} collection`,
  };
}
```

### OpenGraph Images

```typescript
// app/products/[id]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export default async function Image(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const product = await fetchProduct(params.id);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {product.name}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

## Server Actions Patterns

### With Cookies and Headers

```typescript
'use server';

import { cookies, headers } from 'next/headers';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const user = await authenticateUser(email, password);

  if (user) {
    const cookieStore = await cookies();
    cookieStore.set('session', user.sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return { success: true };
  }

  return { success: false, error: 'Invalid credentials' };
}
```

### With Cache Invalidation

```typescript
'use server';

import { revalidateTag, updateTag } from 'next/cache';

export async function createProduct(data: ProductData) {
  'use cache';
  cacheTag('products');

  const product = await db.product.create({ data });

  // Immediate UI update
  updateTag('products');

  return product;
}

export async function updateProduct(id: string, data: ProductData) {
  const product = await db.product.update({
    where: { id },
    data
  });

  // Revalidate with cache profile
  revalidateTag('products', 'hours');

  return product;
}
```

### With Draft Mode

```typescript
'use server';

import { draftMode } from 'next/headers';

export async function enableDraftMode() {
  const draft = await draftMode();
  draft.enable();
}

export async function disableDraftMode() {
  const draft = await draftMode();
  draft.disable();
}
```

## Cache Components Patterns

### Component-Level Caching

```typescript
// app/components/user-profile.tsx
'use cache';

import { cacheLife, cacheTag } from 'next/cache';

export async function UserProfile({ userId }: { userId: string }) {
  cacheLife('hours');
  cacheTag('user-profile', userId);

  const user = await fetchUser(userId);

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
    </div>
  );
}
```

### Function-Level Caching

```typescript
// app/lib/data.ts
'use server';

import { cacheLife, cacheTag } from 'next/cache';

export async function getProducts(category?: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag('products', category || 'all');

  const products = await db.product.findMany({
    where: category ? { category } : undefined
  });

  return products;
}
```

### Page-Level Caching

```typescript
// app/blog/page.tsx
'use cache';

import { cacheLife, cacheTag } from 'next/cache';

export default async function BlogPage() {
  cacheLife('hours');
  cacheTag('blog-posts');

  const posts = await fetchBlogPosts();

  return (
    <div>
      {posts.map(post => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### Custom Cache Profiles

```javascript
// next.config.js
module.exports = {
  cacheLife: {
    // Frequent updates
    realtime: {
      stale: 10,      // 10 seconds
      revalidate: 30, // 30 seconds
      expire: 60      // 1 minute
    },

    // Product data
    product: {
      stale: 300,     // 5 minutes
      revalidate: 900, // 15 minutes
      expire: 3600    // 1 hour
    },

    // Static content
    static: {
      stale: 86400,   // 1 day
      revalidate: 604800, // 1 week
      expire: 2592000 // 30 days
    }
  }
};
```

**Using Custom Profiles**:
```typescript
'use cache';

export async function getStockPrice(symbol: string) {
  cacheLife('realtime');
  cacheTag('stock', symbol);

  const price = await fetchStockPrice(symbol);
  return price;
}
```

## Proxy Patterns

### Authentication

```typescript
// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedPaths = ['/dashboard', '/account', '/settings'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
```

### Geographic Routing

```typescript
export function proxy(request: NextRequest) {
  const country = request.geo?.country || 'US';
  const { pathname } = request.nextUrl;

  // Redirect to country-specific pages
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(`/${country.toLowerCase()}`, request.url)
    );
  }

  // Add country header for downstream consumption
  const response = NextResponse.next();
  response.headers.set('x-user-country', country);

  return response;
}
```

### A/B Testing

```typescript
export function proxy(request: NextRequest) {
  const variant = request.cookies.get('ab-test-variant')?.value;

  if (!variant && request.nextUrl.pathname === '/') {
    const response = NextResponse.next();
    const newVariant = Math.random() > 0.5 ? 'A' : 'B';

    response.cookies.set('ab-test-variant', newVariant, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  }

  return NextResponse.next();
}
```

### Request/Response Headers

```typescript
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // Add custom headers
  requestHeaders.set('x-forwarded-from', request.nextUrl.pathname);
  requestHeaders.set('x-client-ip', request.ip || 'unknown');

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add response headers
  response.headers.set('x-custom-header', 'value');
  response.headers.set('x-frame-options', 'DENY');

  return response;
}
```

## Error Handling Patterns

### Page-Level Error Boundaries

```typescript
// app/products/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Not Found Handling

```typescript
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';

export default async function ProductPage(props: Props) {
  const params = await props.params;
  const product = await fetchProduct(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} />;
}
```

```typescript
// app/products/[id]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Product Not Found</h2>
      <p>The product you're looking for doesn't exist.</p>
    </div>
  );
}
```

## Loading States

### Page-Level Loading

```typescript
// app/products/loading.tsx
export default function Loading() {
  return (
    <div>
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}
```

### Suspense Boundaries

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';

export default async function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <Chart />
      </Suspense>
    </div>
  );
}
```

## Parallel Routes Patterns

### Dashboard with Slots

```
app/dashboard/
├── @analytics/
│   ├── page.tsx
│   └── default.tsx
├── @notifications/
│   ├── page.tsx
│   └── default.tsx
├── layout.tsx
└── page.tsx
```

**Layout**:
```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  notifications,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  notifications: React.ReactNode;
}) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">{children}</div>
        <div>
          {notifications}
          {analytics}
        </div>
      </div>
    </div>
  );
}
```

**Default Fallbacks**:
```typescript
// app/dashboard/@analytics/default.tsx
export default function Default() {
  return null;
}

// app/dashboard/@notifications/default.tsx
export default function Default() {
  return null;
}
```

## Type-Safe Patterns

### Typed Params

```typescript
// app/products/[category]/[id]/page.tsx
type Params = {
  category: string;
  id: string;
};

interface Props {
  params: Promise<Params>;
}

export default async function ProductPage(props: Props) {
  const params = await props.params;

  // TypeScript knows params has category and id
  const { category, id } = params;

  return <div>{category} - {id}</div>;
}
```

### Typed Search Params

```typescript
type SearchParams = {
  filter?: string;
  sort?: 'asc' | 'desc';
  page?: string;
};

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function ProductsPage(props: Props) {
  const searchParams = await props.searchParams;

  const page = parseInt(searchParams.page || '1', 10);
  const sort = searchParams.sort || 'asc';

  return <ProductList page={page} sort={sort} />;
}
```

### Runtime Validation

```typescript
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export default async function ProductPage(props: Props) {
  const params = await props.params;

  // Validate at runtime
  const validated = paramsSchema.parse(params);

  const product = await fetchProduct(validated.id);

  return <ProductDetails product={product} />;
}
```
