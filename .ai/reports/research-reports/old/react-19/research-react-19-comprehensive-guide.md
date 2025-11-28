# React 19.2 Comprehensive Research Guide

**Research Date:** 2025-10-24
**Target Audience:** Developers transitioning from React 18 to React 19
**Project Context:** SlideHeroes (Next.js 16, React 19.2)

## Executive Summary

React 19 represents a major evolution from React 18, introducing stable Server Components, Actions for form handling, automatic optimizations through the React Compiler, and significant improvements to concurrent rendering. React 19.2 adds the Activity component, useEffectEvent hook, and enhanced SSR capabilities. This guide covers all major changes, breaking changes, new APIs, and migration considerations.

---

## Table of Contents

1. [Major New Features](#major-new-features)
2. [Breaking Changes from React 18](#breaking-changes-from-react-18)
3. [Server Components Improvements](#server-components-improvements)
4. [New Hooks and APIs](#new-hooks-and-apis)
5. [Form Handling and Actions](#form-handling-and-actions)
6. [Performance Improvements](#performance-improvements)
7. [Suspense and Streaming Changes](#suspense-and-streaming-changes)
8. [TypeScript Improvements](#typescript-improvements)
9. [Document Metadata Support](#document-metadata-support)
10. [Migration Guide](#migration-guide)
11. [Code Examples](#code-examples)
12. [Sources](#sources)

---

## Major New Features

### 1. Actions (React 19.0)

**What:** Functions triggered by form submission that handle pending states, errors, and optimistic updates automatically.

**Why Important:** Eliminates manual state management for async operations, reducing boilerplate by 60-70%.

**Key Capabilities:**

- Automatic pending state management
- Built-in error handling
- Optimistic updates support
- Form auto-reset on success
- Works with both client and server functions

**Before React 19:**

```typescript
function UpdateName() {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async () => {
    setIsPending(true);
    const error = await updateName(name);
    setIsPending(false);
    if (error) {
      setError(error);
      return;
    }
    redirect("/path");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button disabled={isPending}>Update</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

**With React 19 Actions:**

```typescript
function UpdateName() {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const error = await updateName(name);
      if (error) {
        setError(error);
        return;
      }
      redirect("/path");
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button disabled={isPending}>Update</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

### 2. Activity Component (React 19.2)

**What:** New component for managing hidden/visible UI state without unmounting.

**Use Cases:**

- Pre-rendering routes users will likely navigate to
- Preserving state when navigating away
- Background loading of data, CSS, and images

**Modes:**

- **visible:** Shows children, mounts effects, processes updates normally
- **hidden:** Hides children, unmounts effects, defers updates until idle

**Example:**

```typescript
import { Activity } from 'react';

function App() {
  const [currentTab, setCurrentTab] = useState('home');

  return (
    <>
      <Activity mode={currentTab === 'home' ? 'visible' : 'hidden'}>
        <HomeTab />
      </Activity>
      <Activity mode={currentTab === 'profile' ? 'visible' : 'hidden'}>
        <ProfileTab />
      </Activity>
    </>
  );
}
```

**Performance Benefits:**

- Faster navigation (pre-loading)
- State preservation
- No impact on visible content performance

### 3. React Compiler

**What:** Automatic memoization tool that eliminates need for manual `useMemo()`, `useCallback()`, and `memo()`.

**Benefits:**

- Cleaner codebases (less optimization boilerplate)
- Automatic optimization of re-renders
- Better maintainability

**Status:** Stable as of React Compiler v1.0 (October 2025)

### 4. Native Document Metadata Support

**What:** Render `<title>`, `<meta>`, and `<link>` tags directly in components.

**How It Works:** React automatically hoists these tags to `<head>`.

**Example:**

```typescript
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="author" content={post.author} />
      <meta name="description" content={post.excerpt} />
      <link rel="canonical" href={post.url} />

      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

**Benefits:**

- No need for react-helmet for simple cases
- Works with CSR, SSR, and Server Components
- Automatic deduplication and ordering

---

## Breaking Changes from React 18

### 1. Removed APIs

**Completely Removed:**

- `ReactDOM.render` → Use `ReactDOM.createRoot`
- `ReactDOM.hydrate` → Use `ReactDOM.hydrateRoot`
- `ReactDOM.unmountComponentAtNode` → Use `root.unmount()`
- `ReactDOM.findDOMNode` → Use refs instead
- `PropTypes` → Use TypeScript or runtime validation
- `defaultProps` (function components) → Use ES6 default parameters
- Legacy Context (`contextTypes`, `getChildContext`)
- String refs → Use `useRef` or callback refs
- Module pattern factories
- `React.createFactory`
- `react-dom/test-utils` → Use `@testing-library/react`

**Migration Required:**

```typescript
// ❌ React 18
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// ✅ React 19
import ReactDOM from 'react-dom/client';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

### 2. Ref as Prop

**Change:** `ref` is now a standard prop for function components.

**Impact:** `forwardRef` is no longer necessary and will be deprecated.

**Before (React 18):**

```typescript
import { forwardRef } from 'react';

const MyInput = forwardRef((props, ref) => {
  return <input {...props} ref={ref} />;
});
```

**After (React 19):**

```typescript
function MyInput({ ref, ...props }) {
  return <input {...props} ref={ref} />;
}
```

**Additional Improvement:** Ref cleanup functions are now supported.

```typescript
function MyComponent() {
  return (
    <input
      ref={(ref) => {
        // Setup
        ref.focus();

        // Cleanup (new in React 19)
        return () => {
          console.log('Input unmounted');
        };
      }}
    />
  );
}
```

### 3. useRef Requires Initial Value

**Change:** TypeScript now requires an initial value for `useRef`.

```typescript
// ❌ React 18
const ref = useRef<HTMLDivElement>();

// ✅ React 19
const ref = useRef<HTMLDivElement>(null);
```

### 4. Concurrent Rendering Default

**Change:** Concurrent rendering is now the default (was opt-in in React 18).

**Impact:**

- Better automatic batching
- Interruptible rendering
- Prioritized updates

---

## Server Components Improvements

### Stability

**Status:** React Server Components are now stable and won't break between minor versions.

**Note:** Underlying bundler/framework APIs don't follow semver and may break between React 19.x minors.

### Architecture Changes

**Key Improvements:**

1. **No Hydration Required:** Server Components send rendered output, not JavaScript
2. **Reduced Bundle Size:** Server-only code never reaches the client
3. **Direct Data Access:** Fetch from databases/APIs without bundling logic
4. **Streaming Support:** Incremental content delivery
5. **Cross-Platform:** Available on web, desktop, mobile (via Expo Router)

### How Server Components Work

```typescript
// Server Component (runs on server only)
import 'server-only';
import { db } from './database';

async function ProductList() {
  // Direct database access - never bundled for client
  const products = await db.products.findMany();

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Performance Benefits

**Before Server Components:**

- 35.9KB for markdown parser
- 206KB for HTML sanitizer
- Total: ~75KB gzipped sent to client
- Data fetch happens after first render

**With Server Components:**

- 0KB sent to client (runs at build time)
- Rendered output sent as serialized objects
- No hydration overhead

### Server vs Client Components

| Feature | Server Components | Client Components |
|---------|------------------|-------------------|
| Data fetching | Direct (DB, filesystem) | Via API routes |
| Bundle size | Not included | Included |
| Hydration | Not needed | Required |
| Interactivity | No | Yes |
| Hooks | Limited (no useState, useEffect) | All hooks |
| When to use | Data fetching, static content | User interactions, state |

---

## New Hooks and APIs

### 1. use() Hook

**Category:** Resource API
**Status:** Stable in React 19

**What:** Reads values from Promises or Context with conditional support.

**Key Differences from Other Hooks:**

- ✅ Can be called in loops and conditionals
- ✅ Integrates with Suspense and Error Boundaries
- ✅ Works with Promises and Context

**Promise Usage:**

```typescript
import { use, Suspense } from 'react';

function MessageComponent({ messagePromise }) {
  // Suspends until Promise resolves
  const message = use(messagePromise);

  return <p>{message}</p>;
}

function App() {
  const messagePromise = fetchMessage();

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <MessageComponent messagePromise={messagePromise} />
    </Suspense>
  );
}
```

**Conditional Context Usage:**

```typescript
import { use } from 'react';

function Button({ isThemed }) {
  // ✅ Conditional usage - not possible with useContext
  const theme = isThemed ? use(ThemeContext) : null;

  return (
    <button style={{ color: theme?.color }}>
      Click me
    </button>
  );
}
```

**Important Caveats:**

- Cannot be called in try-catch blocks (use Error Boundaries instead)
- Promises from Server Components are stable across re-renders
- Promises created in Client Components recreate on every render

### 2. useActionState()

**Category:** Form/Action Hook
**Status:** Stable in React 19

**What:** Manages form state, pending state, and error handling for Actions.

**Benefits:**

- Single hook for all form state management
- No prop drilling for pending state
- Automatic form data handling
- Server-first design

**Signature:**

```typescript
const [state, formAction, isPending] = useActionState(
  actionFn,
  initialState,
  permalink?
);
```

**How It Works:**

```typescript
'use client';

import { useActionState } from 'react';

async function updateName(previousState, formData) {
  const name = formData.get('name');

  try {
    await saveToDatabase(name);
    return { success: true, message: 'Name updated!' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function NameForm() {
  const [state, formAction, isPending] = useActionState(updateName, {
    success: false,
    message: ''
  });

  return (
    <form action={formAction}>
      <input name="name" disabled={isPending} />
      <button disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

**Key Differences:**

- Action function receives `previousState` as first argument
- Form data becomes second argument (not first)
- Works before hydration completes (SSR)

### 3. useFormStatus()

**Category:** Form Hook
**Status:** Stable in React 19

**What:** Reads parent form's submission status.

**Use Case:** Components deep in form tree that need pending state.

**Returns:**

```typescript
{
  pending: boolean;  // Is form submitting?
  data: FormData | null;  // Form data being submitted
  method: string | null;  // HTTP method (get/post)
  action: string | ((formData: FormData) => void) | null;
}
```

**Example:**

```typescript
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}

function Form() {
  return (
    <form action={submitAction}>
      <input name="email" />
      <SubmitButton /> {/* No prop drilling needed! */}
    </form>
  );
}
```

**Benefits:**

- No prop drilling
- Self-contained form components
- Better reusability

### 4. useOptimistic()

**Category:** Form/Action Hook
**Status:** Stable in React 19

**What:** Provides optimistic UI updates during async operations.

**How It Works:**

1. Show optimistic state immediately
2. Perform async operation
3. On success: optimistic state becomes real state
4. On failure: React reverts to original state

**Signature:**

```typescript
const [optimisticState, addOptimistic] = useOptimistic(
  currentState,
  updateFn
);
```

**Example:**

```typescript
import { useOptimistic } from 'react';

function TodoList({ todos }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }]
  );

  async function addTodo(formData) {
    const title = formData.get('title');

    // Show optimistic update immediately
    addOptimisticTodo({ id: Date.now(), title });

    // Perform async operation
    await saveToServer({ title });

    // If successful, server response becomes new state
    // If failed, React reverts to original todos
  }

  return (
    <>
      <form action={addTodo}>
        <input name="title" />
        <button>Add</button>
      </form>

      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
            {todo.title}
          </li>
        ))}
      </ul>
    </>
  );
}
```

### 5. useEffectEvent() (React 19.2)

**Category:** Effect Hook
**Status:** Stable in React 19.2

**What:** Extracts non-reactive logic from Effects into reusable functions.

**Problem It Solves:** Reading latest props/state in Effects without re-running the Effect.

**Before useEffectEvent:**

```typescript
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', () => {
      // Problem: Must include theme in deps, causing reconnect on theme change
      showNotification('Connected!', theme);
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, theme]); // Reconnects unnecessarily when theme changes
}
```

**With useEffectEvent:**

```typescript
import { useEffectEvent, useEffect } from 'react';

function ChatRoom({ roomId, theme }) {
  // Extract non-reactive logic
  const onConnected = useEffectEvent(() => {
    // Always sees latest theme, but doesn't trigger Effect
    showNotification('Connected!', theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', () => {
      onConnected(); // Call Effect Event
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // Only reconnects when roomId changes
}
```

**Rules:**

- Only call inside Effects (`useEffect`, `useLayoutEffect`, `useInsertionEffect`)
- Don't pass to other components or hooks
- Not in dependency array (linter enforces this in v6.1.1+)
- Use for non-reactive logic only

### 6. cacheSignal() (React 19.2)

**Category:** Server Component API
**Status:** Stable in React 19.2

**What:** Returns AbortSignal when `cache()` lifetime expires.

**Use Case:** Cleanup in Server Components when cache invalidates.

**Example:**

```typescript
import { cacheSignal } from 'react';

async function fetchData() {
  const signal = cacheSignal();

  const response = await fetch('/api/data', { signal });

  return response.json();
}
```

---

## Form Handling and Actions

### Native Form Support

React 19 adds first-class support for forms with automatic:

- Pending state management
- Error handling
- Form reset on success
- Integration with Server Actions

### Form Actions

**What:** Pass functions to `action` and `formAction` props.

**Example:**

```typescript
function SearchForm() {
  async function search(formData) {
    'use server';
    const query = formData.get('query');
    return searchDatabase(query);
  }

  return (
    <form action={search}>
      <input name="query" />
      <button>Search</button>
    </form>
  );
}
```

### Automatic Form Reset

**When:** Form Actions succeed
**For:** Uncontrolled components

**Manual Reset:**

```typescript
import { requestFormReset } from 'react-dom';

function MyForm() {
  async function handleSubmit(formData) {
    await saveData(formData);
    requestFormReset(); // Manual reset
  }

  return <form action={handleSubmit}>...</form>;
}
```

### Server Actions Pattern

```typescript
// app/actions.ts
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export async function createUser(formData: FormData) {
  const parsed = schema.parse({
    email: formData.get('email'),
    name: formData.get('name'),
  });

  const user = await db.users.create({ data: parsed });

  redirect(`/users/${user.id}`);
}
```

```typescript
// app/components/user-form.tsx
'use client';

import { useActionState } from 'react';
import { createUser } from '../actions';

export function UserForm() {
  const [state, formAction, isPending] = useActionState(
    createUser,
    { error: null }
  );

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <input name="name" required />
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>
      {state.error && <p>{state.error}</p>}
    </form>
  );
}
```

---

## Performance Improvements

### 1. Concurrent Rendering (Default)

**Change:** Concurrent rendering is now default (was opt-in in React 18).

**Benefits:**

- Interruptible rendering (high-priority updates interrupt low-priority)
- Progressive updates (defer non-critical changes)
- Chunked rendering (large tasks broken into manageable chunks)
- Prioritized user interactions (scroll/typing prioritized during data fetching)

### 2. Automatic Batching

**What:** Multiple state updates grouped into single render.

**Impact:** Fewer re-renders, better performance.

**Example:**

```typescript
// React 19 batches these into one render
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  setItems(items => [...items, newItem]);
}
// Only one re-render, even in async callbacks
```

### 3. Asset Loading Optimization

**Features:**

- Background resource preloading
- Smoother transitions
- Built-in support for fonts, scripts, stylesheets

**Preloading APIs:**

```typescript
import { preload, preinit } from 'react-dom';

// Preload stylesheet
preload('/styles.css', { as: 'style' });

// Preload and inject stylesheet
preinit('/critical.css', { as: 'style' });

// Preload script
preload('/analytics.js', { as: 'script' });
```

### 4. SSR Streaming Improvements

**Benefits:**

- Faster Time to First Byte (TTFB)
- Progressive HTML streaming
- Better SEO
- Concurrent rendering on server

**React 19.2 Additions:**

- Partial pre-rendering with Web Streams
- Partial pre-rendering with Node Streams
- Resume APIs for SSR

**New APIs:**

```typescript
// Web Streams
import { resume, resumeAndPrerender } from 'react-dom/server';

// Node Streams
import { resumeToPipeableStream } from 'react-dom/server';
```

### 5. Reduced JavaScript Bundle Size

**Via:**

- Server Components (server code never bundled)
- React Compiler (automatic optimization)
- Removed legacy APIs

---

## Suspense and Streaming Changes

### Suspense Evolution

**React 18:** Lazy loading components
**React 19:** Full async rendering coordinator

**Now Handles:**

- Loading JavaScript chunks
- Async data fetching (via `use` hook)
- Streaming partial UI
- Loading and error states coordination

### Streaming Improvements

**Behavior:** Instead of waiting for everything, React 19 streams pages in chunks.

**Process:**

1. Encounters Suspense boundary with pending data
2. Sends everything before it immediately
3. Shows fallback for pending section
4. Streams content when ready

**React 19.2 Specific:**

- HTML chunks sent earlier (faster TTFB)
- Errors during streaming are captured and recoverable
- Suspense boundaries batched briefly for better UX

### Error Boundaries Integration

**New Behavior:** Error Boundaries and Suspense work side-by-side.

**Division of Labor:**

- Suspense handles waiting
- Error Boundaries handle failures

**Server-Side Error Handling:**

```typescript
import { Suspense, ErrorBoundary } from 'react';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Suspense fallback={<Loading />}>
        <AsyncContent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

**Server Behavior:**

- Component throws on server → React doesn't abort render
- Finds closest Suspense boundary
- Includes fallback in server HTML
- Client hydrates and retries

### Suspense Boundary Batching (React 19.2)

**Change:** Suspense boundaries revealed from server are batched briefly.

**Benefit:** More content appears together (better perceived performance).

---

## TypeScript Improvements

### Major Type Updates

React 19 includes significant TypeScript changes aligned with API removals and new patterns.

### 1. Installation

```bash
npm install @types/react@^19.0.0 @types/react-dom@^19.0.0
```

### 2. Removed Types

**Global JSX Namespace:**

- Removed for better compatibility with other JSX libraries
- Types now scoped to React

### 3. RefObject Changes

**Before:**

```typescript
const ref = useRef<HTMLDivElement>(null);
// RefObject<HTMLDivElement | null>
```

**React 19:**

```typescript
const ref = useRef<HTMLDivElement>(null);
// RefObject<HTMLDivElement> (no null in type)
```

**Impact:** Refs are mutable by default, better type inference.

### 4. useRef Initial Value Required

**Enforced:**

```typescript
// ❌ TypeScript error in React 19
const ref = useRef<HTMLDivElement>();

// ✅ Correct
const ref = useRef<HTMLDivElement>(null);
```

### 5. ReactElement Generic Default

**Change:** Default props type changed from `any` to `unknown`.

**Impact:** Better type safety, catch errors earlier.

### 6. Ref as Prop Types

**New Pattern:**

```typescript
// Function component with ref prop
interface MyInputProps {
  value: string;
  onChange: (value: string) => void;
  ref?: React.Ref<HTMLInputElement>;
}

function MyInput({ ref, value, onChange }: MyInputProps) {
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
```

**No forwardRef needed:**

```typescript
// ❌ Old pattern (React 18)
const MyInput = forwardRef<HTMLInputElement, MyInputProps>(
  ({ value, onChange }, ref) => {
    return <input ref={ref} value={value} onChange={onChange} />;
  }
);

// ✅ New pattern (React 19)
function MyInput({ ref, value, onChange }: MyInputProps) {
  return <input ref={ref} value={value} onChange={onChange} />;
}
```

### 7. Enhanced Hook Type Inference

**Improvement:** Better inference for hooks, reducing manual annotations.

**Example:**

```typescript
// React 19 infers types better
const [state, setState] = useState({ count: 0, name: 'test' });
// No need for: useState<{ count: number; name: string }>

const context = use(MyContext);
// Type inferred from MyContext definition
```

### 8. Action Types

**New Types for Actions:**

```typescript
import { useActionState } from 'react';

// Action function type
type ActionFunction<State, Payload> = (
  state: State,
  payload: Payload
) => State | Promise<State>;

// Example
type FormState = {
  success: boolean;
  message: string;
};

async function updateProfile(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  // Implementation
}

function ProfileForm() {
  const [state, formAction] = useActionState(updateProfile, {
    success: false,
    message: ''
  });
  // Types fully inferred
}
```

---

## Document Metadata Support

### Native Metadata Tags

React 19 allows rendering `<title>`, `<meta>`, and `<link>` tags directly in components.

**Automatic Hoisting:** React moves these to `<head>`.

### Basic Example

```typescript
function BlogPost({ post }) {
  return (
    <article>
      {/* These are automatically hoisted to <head> */}
      <title>{post.title} - My Blog</title>
      <meta name="description" content={post.excerpt} />
      <meta name="author" content={post.author} />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
      <meta property="og:image" content={post.image} />
      <link rel="canonical" href={`https://blog.com/posts/${post.slug}`} />

      {/* Regular content */}
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### How It Works

1. **Component renders** with metadata tags
2. **React detects** `<title>`, `<meta>`, `<link>` tags
3. **Automatically hoists** to document `<head>`
4. **Works with:** CSR, SSR, Server Components

### Benefits

**No External Libraries Needed:**

```typescript
// ❌ React 18 - needed react-helmet
import { Helmet } from 'react-helmet';

function Page() {
  return (
    <Helmet>
      <title>My Page</title>
      <meta name="description" content="..." />
    </Helmet>
  );
}

// ✅ React 19 - native support
function Page() {
  return (
    <>
      <title>My Page</title>
      <meta name="description" content="..." />
      <main>Content</main>
    </>
  );
}
```

### Advanced Usage with Dynamic Routes

```typescript
// Next.js App Router with React 19
async function ProductPage({ params }) {
  const product = await fetchProduct(params.id);

  return (
    <>
      <title>{product.name} | Store</title>
      <meta name="description" content={product.description} />
      <meta property="og:title" content={product.name} />
      <meta property="og:image" content={product.image} />
      <meta property="product:price:amount" content={product.price} />
      <link rel="canonical" href={`/products/${product.id}`} />

      <ProductDetails product={product} />
    </>
  );
}
```

### Metadata Precedence

**When multiple components render same metadata:**

- Later tags override earlier tags
- Framework routing usually controls precedence
- Libraries like react-helmet still useful for complex scenarios

### Limitations

**Simple use cases only:**

- For advanced features (route-based overrides, priority), use libraries
- Libraries now easier to build on top of native support

---

## Migration Guide

### Step-by-step Migration from React 18

#### Step 1: Upgrade to React 18.3 First

```bash
npm install react@18.3 react-dom@18.3
```

**Why:** React 18.3 includes warnings for deprecated APIs.

#### Step 2: Run Automated Codemods

```bash
# Full migration recipe
npx codemod react/19/migration-recipe

# TypeScript-specific updates
npx types-react-codemod@latest preset-19 ./src
```

#### Step 3: Update Package Versions

```bash
npm install react@19 react-dom@19
npm install @types/react@19 @types/react-dom@19 --save-dev
```

#### Step 4: Update Root Rendering

```typescript
// Before
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// After
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

#### Step 5: Replace forwardRef

**Codemod handles this, but manually:**

```typescript
// Before
import { forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// After
interface Props {
  ref?: React.Ref<HTMLInputElement>;
  // ... other props
}

function Input({ ref, ...props }: Props) {
  return <input ref={ref} {...props} />;
}
```

#### Step 6: Remove PropTypes

```typescript
// Before
import PropTypes from 'prop-types';

function MyComponent({ name, age }) {
  return <div>{name} is {age}</div>;
}

MyComponent.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number.isRequired,
};

// After - Use TypeScript
interface MyComponentProps {
  name: string;
  age: number;
}

function MyComponent({ name, age }: MyComponentProps) {
  return <div>{name} is {age}</div>;
}
```

#### Step 7: Update defaultProps

```typescript
// Before
function MyComponent({ name = 'Guest', age = 0 }) {
  return <div>{name} is {age}</div>;
}

MyComponent.defaultProps = {
  name: 'Guest',
  age: 0,
};

// After - Use ES6 defaults
function MyComponent({
  name = 'Guest',
  age = 0
}: MyComponentProps) {
  return <div>{name} is {age}</div>;
}
```

#### Step 8: Fix TypeScript Errors

```typescript
// Fix useRef calls
const ref = useRef<HTMLDivElement>(null); // Add initial value

// Update ReactElement usage
type MyElement = React.ReactElement<unknown>; // Was: React.ReactElement<any>
```

#### Step 9: Test Thoroughly

```bash
# Run type checking
npm run typecheck

# Run tests
npm test

# Run linting
npm run lint
```

### Breaking Change Checklist

- [ ] Replaced `ReactDOM.render` with `createRoot`
- [ ] Replaced `ReactDOM.hydrate` with `hydrateRoot`
- [ ] Removed all `forwardRef` usage
- [ ] Removed `PropTypes` (using TypeScript)
- [ ] Removed function component `defaultProps`
- [ ] Updated all `useRef` calls with initial values
- [ ] Fixed string refs (if any)
- [ ] Replaced `react-dom/test-utils` with Testing Library
- [ ] Updated TypeScript types to v19

### Common Migration Issues

#### Issue 1: RefObject null handling

```typescript
// Problem
const ref = useRef<HTMLDivElement>();
if (ref.current) { // TypeScript error

// Solution
const ref = useRef<HTMLDivElement>(null);
if (ref.current) { // ✅ Works
```

#### Issue 2: forwardRef with TypeScript

```typescript
// Problem - Complex generic types
const Component = forwardRef<HTMLDivElement, Props>(...);

// Solution - Much simpler
function Component({ ref, ...props }: Props & { ref?: Ref<HTMLDivElement> }) {
```

#### Issue 3: Context types

```typescript
// Problem - Generic context type changed
const MyContext = createContext<string>('default');

// Solution - May need explicit undefined handling
const MyContext = createContext<string | undefined>(undefined);
```

---

## Code Examples

### Complete Form with Actions

```typescript
'use client';

import { useActionState, useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';

// Server Action
async function addTodo(prevState, formData) {
  'use server';

  const title = formData.get('title');

  try {
    const todo = await db.todos.create({
      data: { title, completed: false }
    });

    return {
      success: true,
      todos: [...prevState.todos, todo],
      error: null
    };
  } catch (error) {
    return {
      success: false,
      todos: prevState.todos,
      error: error.message
    };
  }
}

// Submit button component
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Adding...' : 'Add Todo'}
    </button>
  );
}

// Main form component
export function TodoForm({ initialTodos }) {
  const [state, formAction] = useActionState(addTodo, {
    success: false,
    todos: initialTodos,
    error: null
  });

  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    state.todos,
    (todos, newTodo) => [...todos, { ...newTodo, pending: true }]
  );

  async function handleSubmit(formData) {
    const title = formData.get('title');
    addOptimisticTodo({ id: Date.now(), title, completed: false });
    formAction(formData);
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input name="title" required />
        <SubmitButton />
      </form>

      {state.error && <p className="error">{state.error}</p>}

      <ul>
        {optimisticTodos.map(todo => (
          <li
            key={todo.id}
            style={{ opacity: todo.pending ? 0.5 : 1 }}
          >
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Server Component Data Fetching

```typescript
// app/products/page.tsx
import { Suspense } from 'react';
import { db } from '@/lib/database';

// Server Component with direct DB access
async function ProductList() {
  const products = await db.products.findMany({
    include: { category: true }
  });

  return (
    <div>
      <title>Products | Store</title>
      <meta name="description" content="Browse our products" />

      <h1>Products</h1>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Loading fallback
function ProductListSkeleton() {
  return <div>Loading products...</div>;
}

// Page component
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductList />
    </Suspense>
  );
}
```

### Using use() Hook with Promises

```typescript
'use client';

import { use, Suspense } from 'react';

// Create stable promise (from Server Component or outside render)
function fetchUser(id: string) {
  return fetch(`/api/users/${id}`).then(res => res.json());
}

// Client component using the promise
function UserProfile({ userPromise }) {
  const user = use(userPromise); // Suspends until resolved

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// Parent component
export function UserPage({ userId }) {
  const userPromise = fetchUser(userId);

  return (
    <Suspense fallback={<div>Loading user...</div>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

### Activity for Tab Navigation

```typescript
import { Activity, useState } from 'react';

function TabNavigation() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div>
      <nav>
        <button onClick={() => setActiveTab('home')}>Home</button>
        <button onClick={() => setActiveTab('profile')}>Profile</button>
        <button onClick={() => setActiveTab('settings')}>Settings</button>
      </nav>

      {/* Pre-render hidden tabs for instant switching */}
      <Activity mode={activeTab === 'home' ? 'visible' : 'hidden'}>
        <HomeTab />
      </Activity>

      <Activity mode={activeTab === 'profile' ? 'visible' : 'hidden'}>
        <ProfileTab />
      </Activity>

      <Activity mode={activeTab === 'settings' ? 'visible' : 'hidden'}>
        <SettingsTab />
      </Activity>
    </div>
  );
}
```

### useEffectEvent Example

```typescript
import { useEffect, useEffectEvent, useState } from 'react';

function ChatRoom({ roomId, theme }) {
  const [messages, setMessages] = useState([]);

  // Extract non-reactive logic
  const onMessage = useEffectEvent((msg) => {
    // Always uses latest theme, but doesn't cause reconnect
    showNotification(msg, theme);
    setMessages(prev => [...prev, msg]);
  });

  useEffect(() => {
    const connection = createConnection(roomId);

    connection.on('message', (msg) => {
      onMessage(msg); // Uses Effect Event
    });

    connection.connect();

    return () => connection.disconnect();
  }, [roomId]); // Only reconnects on roomId change

  return (
    <div style={{ background: theme.background }}>
      {messages.map((msg, i) => (
        <div key={i}>{msg}</div>
      ))}
    </div>
  );
}
```

---

## Sources

### Official React Documentation

- [React 19 Release Blog](https://react.dev/blog/2024/12/05/react-19) - Main release announcement
- [React 19.2 Release Blog](https://react.dev/blog/2025/10/01/react-19-2) - React 19.2 features
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) - Official migration guide
- [React Hooks Reference](https://react.dev/reference/react/hooks) - Complete hooks documentation
- [React Server Components](https://react.dev/reference/rsc/server-components) - RSC documentation
- [use() Hook](https://react.dev/reference/react/use) - use() API reference
- [useActionState](https://react.dev/reference/react/useActionState) - useActionState documentation
- [useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus) - useFormStatus documentation
- [useEffectEvent](https://react.dev/reference/react/useEffectEvent) - useEffectEvent documentation
- [Suspense](https://react.dev/reference/react/Suspense) - Suspense API reference

### GitHub

- [React Releases](https://github.com/facebook/react/releases) - Official release notes
- [React 19 Discussions](https://github.com/facebook/react/discussions) - Community discussions

### Community Resources

- [React 19 Beta Overview](https://marmelab.com/blog/2024/01/23/react-19-new-hooks.html)
- [Vercel: What's New in React 19](https://vercel.com/blog/whats-new-in-react-19)
- [LogRocket: React 19 Guide](https://blog.logrocket.com/guide-react-19-new-document-metadata-feature/)
- [TkDodo: React 19 and Suspense](https://tkdodo.eu/blog/react-19-and-suspense-a-drama-in-3-acts)

### Migration Tools

- [Codemod: React 18 to 19 Migration](https://docs.codemod.com/guides/migrations/react-18-19)
- [TypeScript React Codemod](https://github.com/eps1lon/types-react-codemod)

---

## Summary for LLM Training

**Key Takeaways for AI Models Working with React 19:**

1. **Actions are central** - Form handling now uses Actions with automatic state management
2. **forwardRef is deprecated** - ref is now a standard prop
3. **Server Components are stable** - Use them for data fetching and static content
4. **use() hook enables conditional Promise/Context reading** - Unlike other hooks
5. **TypeScript is stricter** - Better type safety, requires explicit types
6. **Concurrent rendering is default** - Better performance out of the box
7. **Native metadata support** - No need for react-helmet for simple cases
8. **Activity component (19.2)** - Pre-render hidden content for faster navigation
9. **useEffectEvent (19.2)** - Separate reactive from non-reactive Effect logic
10. **Migration tools exist** - Use codemods for automated updates

**Common Patterns to Recommend:**

- Server Components for data fetching
- Client Components for interactivity
- useActionState for forms
- useOptimistic for optimistic updates
- Suspense for async rendering
- Activity for tab/route pre-rendering
- use() for Promise handling

**Red Flags to Avoid:**

- Using forwardRef (deprecated)
- Manual form state management (use Actions)
- PropTypes (use TypeScript)
- ReactDOM.render (use createRoot)
- Unnecessary useEffect (prefer server fetching)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Next Review:** When React 20 beta releases
