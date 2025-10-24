# The `useEffectEvent` Hook

## Overview

`useEffectEvent` creates a **stable function that always has access to the latest props and state** without needing to be listed as a dependency in `useEffect`. This eliminates a major source of bugs and unnecessary re-renders.

## The Problem It Solves

### Traditional Pattern (Dependencies Hell)

```tsx
function ChatRoom({ roomId, onMessage }: Props) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const connection = createConnection(roomId);

    connection.on('message', (msg) => {
      // ❌ Problem: onMessage and theme are stale unless added to dependencies
      console.log(`Message in ${theme} theme:`, msg);
      onMessage?.(msg);
    });

    return () => connection.disconnect();
  }, [roomId, onMessage, theme]); // ❌ Re-connects on every theme/callback change
}
```

**Issues:**
1. Effect re-runs whenever `theme` or `onMessage` changes (even if `roomId` hasn't changed)
2. Connection unnecessarily closes and reopens
3. Parent must memoize `onMessage` to prevent re-renders
4. ESLint warnings if dependencies omitted

### React 19.2 Solution (useEffectEvent)

```tsx
function ChatRoom({ roomId, onMessage }: Props) {
  const [theme, setTheme] = useState('dark');

  // ✅ Create stable event that always sees latest values
  const onMessageEvent = useEffectEvent((msg: string) => {
    console.log(`Message in ${theme} theme:`, msg);
    onMessage?.(msg);
  });

  useEffect(() => {
    const connection = createConnection(roomId);

    connection.on('message', onMessageEvent); // ✅ Stable reference

    return () => connection.disconnect();
  }, [roomId]); // ✅ Only re-runs when roomId changes
}
```

**Benefits:**
1. Effect only re-runs when `roomId` changes (the actual dependency)
2. Connection stays open when `theme` or `onMessage` changes
3. No need to memoize callbacks in parent
4. Always reads latest values without re-subscription

## When to Use `useEffectEvent`

### 1. Server Action Callbacks (MakerKit Pattern)

**Problem:** Callbacks from server actions change on every render:

```tsx
// ❌ Old Pattern: Dependencies cause unnecessary re-renders
function MyForm({ onSuccess, onError }: Props) {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.data?.success) {
      onSuccess?.();
    } else if (fetcher.data?.error) {
      onError?.();
    }
  }, [fetcher.data, onSuccess, onError]); // ❌ Re-runs on callback changes

  return <fetcher.Form>...</fetcher.Form>;
}
```

**Solution:** Extract callbacks into stable events:

```tsx
// ✅ New Pattern: Stable callbacks that always work
function MyForm({ onSuccess, onError }: Props) {
  const fetcher = useFetcher();

  const handleSuccess = useEffectEvent(() => {
    onSuccess?.();
  });

  const handleError = useEffectEvent(() => {
    onError?.();
  });

  useEffect(() => {
    if (fetcher.data?.success) {
      handleSuccess();
    } else if (fetcher.data?.error) {
      handleError();
    }
  }, [fetcher.data]); // ✅ Only depends on data

  return <fetcher.Form>...</fetcher.Form>;
}
```

### 2. Event Listeners with Dynamic Handlers

```tsx
function useKeyboardShortcut(key: string, handler: () => void) {
  const handleKeyPress = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === key) {
      handler(); // ✅ Always calls latest handler
    }
  });

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [key]); // ✅ Only re-subscribes when key changes
}
```

### 3. Logging/Analytics with Component State

```tsx
function ProductPage({ productId, onView }: Props) {
  const [userPreferences, setUserPreferences] = useState(getPreferences());

  const logView = useEffectEvent(() => {
    // ✅ Always logs latest preferences
    analytics.track('product_view', {
      productId,
      preferences: userPreferences,
    });
    onView?.();
  });

  useEffect(() => {
    logView();
  }, [productId]); // ✅ Only logs when productId changes
}
```

### 4. Interval/Timeout with Latest State

```tsx
function CountdownTimer({ onComplete }: Props) {
  const [count, setCount] = useState(10);
  const [isPaused, setIsPaused] = useState(false);

  const tick = useEffectEvent(() => {
    if (!isPaused && count > 0) {
      setCount(c => c - 1);
    } else if (count === 0) {
      onComplete?.(); // ✅ Calls latest callback
    }
  });

  useEffect(() => {
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []); // ✅ Never re-creates timer
}
```

## When NOT to Use `useEffectEvent`

### ❌ Don't Use as General Event Handler Replacement

```tsx
// ❌ Bad - useEffectEvent is for effects, not regular events
function Button() {
  const handleClick = useEffectEvent(() => {
    console.log('clicked');
  });

  return <button onClick={handleClick}>Click</button>;
}

// ✅ Good - Use useCallback for regular event handlers
function Button() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <button onClick={handleClick}>Click</button>;
}
```

### ❌ Don't Use When Value IS a True Dependency

```tsx
// ❌ Bad - userId should be a dependency
function UserProfile({ userId }: Props) {
  const loadUser = useEffectEvent(async () => {
    const user = await fetchUser(userId);
    setUser(user);
  });

  useEffect(() => {
    loadUser();
  }, []); // ❌ Won't reload when userId changes
}

// ✅ Good - userId is a real dependency
function UserProfile({ userId }: Props) {
  useEffect(() => {
    const loadUser = async () => {
      const user = await fetchUser(userId);
      setUser(user);
    };
    loadUser();
  }, [userId]); // ✅ Reloads when userId changes
}
```

## API Reference

```typescript
function useEffectEvent<T extends (...args: any[]) => any>(
  callback: T
): T;

// Usage
const stableFunction = useEffectEvent((arg1, arg2) => {
  // Can access latest props/state here
  // Will never change identity
});
```

## Migration Pattern from React 18

### Before (React 18)
```tsx
function Component({ onEvent, value }: Props) {
  // Option 1: Omit dependencies (ESLint warns)
  useEffect(() => {
    doSomething(value);
    onEvent();
  }, []); // ⚠️ ESLint warning: missing dependencies

  // Option 2: Add all dependencies (effect re-runs too often)
  useEffect(() => {
    doSomething(value);
    onEvent();
  }, [value, onEvent]); // ❌ Re-runs on every render

  // Option 3: Require parent to memoize (awkward API)
  useEffect(() => {
    doSomething(value);
    onEvent();
  }, [value, onEvent]); // Parent must use useCallback
}
```

### After (React 19.2)
```tsx
function Component({ onEvent, value }: Props) {
  const handleEvent = useEffectEvent(() => {
    doSomething(value);
    onEvent();
  });

  useEffect(() => {
    handleEvent();
  }, []); // ✅ Clean, no warnings, works correctly
}
```

## ESLint Configuration

React 19.2 requires ESLint plugin v7+ which understands `useEffectEvent`:

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/exhaustive-deps": "error"
  }
}
```

The rule will **not** complain about `useEffectEvent` functions missing from dependencies.

## Common Patterns in SlideHeroes

### Pattern 1: Toast Notifications After Server Actions

```tsx
function CreateProjectForm() {
  const [, createProject] = useActionState(createProjectAction, null);

  const showSuccessToast = useEffectEvent(() => {
    toast.success('Project created!');
  });

  useEffect(() => {
    if (state?.success) {
      showSuccessToast();
    }
  }, [state]);

  return <form action={createProject}>...</form>;
}
```

### Pattern 2: Analytics Tracking

```tsx
function usePageView(page: string) {
  const trackView = useEffectEvent(() => {
    const user = getCurrentUser();
    analytics.track('page_view', {
      page,
      user: user?.id,
      timestamp: Date.now(),
    });
  });

  useEffect(() => {
    trackView();
  }, [page]);
}
```

### Pattern 3: WebSocket Message Handlers

```tsx
function useRealtimeUpdates(channelId: string, onUpdate: (data: any) => void) {
  const handleUpdate = useEffectEvent((data: any) => {
    console.log('Update received at', new Date());
    onUpdate(data);
  });

  useEffect(() => {
    const channel = supabase.channel(channelId);

    channel
      .on('postgres_changes', { event: '*' }, handleUpdate)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId]);
}
```

## Relationship to React Compiler

`useEffectEvent` is part of React's broader effort to **eliminate manual memoization**:

- **React Compiler** (upcoming): Auto-memoizes components and values
- **useEffectEvent**: Manual escape hatch for non-reactive dependencies
- Together they eliminate ~80% of `useCallback` and `useMemo` usage

When React Compiler ships, you'll still need `useEffectEvent` for cases where the compiler can't auto-detect non-reactive dependencies.
