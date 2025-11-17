# Deprecated Patterns and Breaking Changes

## Overview

React 19.2 and ESLint v7 introduce strict rules that prohibit patterns that were previously allowed but prone to bugs. This document covers deprecated patterns and their recommended replacements.

## ESLint v7 Breaking Changes

### 1. Setting State in useEffect Based on Props (Now Prohibited)

**Problematic Pattern:**

```tsx
function MyComponent({ value }: { value: string }) {
  const [state, setState] = useState(value);

  // ❌ ESLint error: "setState should not be called in useEffect"
  useEffect(() => {
    setState(value);
  }, [value]);

  return <div>{state}</div>;
}
```

**Why It's Problematic:**

- Creates unnecessary render cycles
- Can cause infinite loops
- Timing issues between renders and effects
- Makes component behavior unpredictable

**Recommended Solution:**

```tsx
function MyComponent({ value }: { value: string }) {
  const [state, setState] = useState(value);

  // ✅ Direct state update during render
  if (value !== state) {
    setState(value);
  }

  return <div>{state}</div>;
}
```

**Or Better: Derive State**

```tsx
function MyComponent({ value }: { value: string }) {
  // ✅ No state needed - just use the prop
  return <div>{value}</div>;
}

// If transformation needed:
function MyComponent({ value }: { value: string }) {
  // ✅ Derive during render
  const displayValue = value.toUpperCase();
  return <div>{displayValue}</div>;
}
```

### 2. Reading/Writing Refs in Render (Now Discouraged)

**Problematic Pattern:**

```tsx
function Counter() {
  const countRef = useRef(0);

  // ❌ Reading ref during render
  return (
    <div>
      <p>Count: {countRef.current}</p>
      <button onClick={() => {
        countRef.current += 1; // ❌ Won't trigger re-render
      }}>
        Increment
      </button>
    </div>
  );
}
```

**Why It's Problematic:**

- Refs don't trigger re-renders
- UI won't update when ref changes
- Breaks React's reactivity model
- Confusing for other developers

**Recommended Solution:**

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  // ✅ Use state for values that affect the UI
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**When Refs ARE Appropriate:**

```tsx
function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // ✅ Good: Refs for DOM manipulation
  const play = () => {
    videoRef.current?.play();
  };

  // ✅ Good: Refs for non-reactive persistence
  const requestIdRef = useRef<number | null>(null);

  return <video ref={videoRef} />;
}
```

## Component Splitting Pattern for Side Effects

### Problem: Callbacks in useEffect Dependencies

**Old Pattern:**

```tsx
function MyForm({ onSuccess, onError }: Props) {
  const fetcher = useFetcher();

  // ❌ Effect re-runs whenever callbacks change
  useEffect(() => {
    if (fetcher.data) {
      fetcher.data.success ? onSuccess?.() : onError?.();
    }
  }, [fetcher.data, onSuccess, onError]);

  return <fetcher.Form>...</fetcher.Form>;
}
```

**Problems:**

- Parent must memoize callbacks
- Effect re-runs unnecessarily
- Complex dependency management

### Solution 1: useEffectEvent (Preferred)

```tsx
function MyForm({ onSuccess, onError }: Props) {
  const fetcher = useFetcher();

  const handleSuccess = useEffectEvent(() => {
    onSuccess?.();
  });

  const handleError = useEffectEvent(() => {
    onError?.();
  });

  useEffect(() => {
    if (fetcher.data) {
      fetcher.data.success ? handleSuccess() : handleError();
    }
  }, [fetcher.data]); // ✅ Only depends on data

  return <fetcher.Form>...</fetcher.Form>;
}
```

### Solution 2: Component Splitting

```tsx
// Child: Handles fetching
function MyFormInner({ onSuccess, onError }: Props) {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.data) {
      fetcher.data.success ? onSuccess?.() : onError?.();
    }
  }, [fetcher.data, onSuccess, onError]);

  return <fetcher.Form>...</fetcher.Form>;
}

// Parent: Provides stable callbacks
function MyForm() {
  const onSuccess = useCallback(() => {
    toast.success('Success');
  }, []);

  const onError = useCallback(() => {
    toast.error('Error');
  }, []);

  return <MyFormInner onSuccess={onSuccess} onError={onError} />;
}
```

## Deprecated React 19 APIs

### 1. forwardRef (Deprecated)

**Old Pattern:**

```tsx
import { forwardRef } from 'react';

// ❌ forwardRef is deprecated
const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={className} {...props} />;
  }
);
```

**New Pattern:**

```tsx
// ✅ ref is now a standard prop
function Input({ ref, className, ...props }: Props & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={className} {...props} />;
}

// Or with proper typing:
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>;
}

function Input({ ref, ...props }: InputProps) {
  return <input ref={ref} {...props} />;
}
```

### 2. defaultProps (Deprecated for Function Components)

**Old Pattern:**

```tsx
// ❌ defaultProps is deprecated
function Button({ color, size }: Props) {
  return <button className={`${color} ${size}`} />;
}

Button.defaultProps = {
  color: 'blue',
  size: 'medium',
};
```

**New Pattern:**

```tsx
// ✅ Use ES6 default parameters
function Button({
  color = 'blue',
  size = 'medium'
}: Props) {
  return <button className={`${color} ${size}`} />;
}

// Or with destructuring:
interface ButtonProps {
  color?: string;
  size?: string;
}

function Button({ color, size }: ButtonProps) {
  const finalColor = color ?? 'blue';
  const finalSize = size ?? 'medium';
  return <button className={`${finalColor} ${finalSize}`} />;
}
```

### 3. PropTypes (Removed)

**Old Pattern:**

```tsx
import PropTypes from 'prop-types';

// ❌ PropTypes removed in React 19
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
```

**New Pattern:**

```tsx
// ✅ Use TypeScript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

### 4. ReactDOM.render (Removed)

**Old Pattern:**

```tsx
import { render } from 'react-dom';

// ❌ Removed in React 19
render(<App />, document.getElementById('root'));
```

**New Pattern:**

```tsx
import { createRoot } from 'react-dom/client';

// ✅ Use createRoot
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

## MakerKit-Specific Refactoring Patterns

### Pattern 1: useFetcher with Callbacks

**Before:**

```tsx
function CreateProjectForm({ onSuccess }: Props) {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.data?.success) {
      onSuccess?.();
      router.push('/projects');
    }
  }, [fetcher.data, onSuccess, router]);

  return <fetcher.Form method="post">...</fetcher.Form>;
}
```

**After:**

```tsx
function CreateProjectForm({ onSuccess }: Props) {
  const fetcher = useFetcher();
  const router = useRouter();

  const handleSuccess = useEffectEvent(() => {
    onSuccess?.();
    router.push('/projects');
  });

  useEffect(() => {
    if (fetcher.data?.success) {
      handleSuccess();
    }
  }, [fetcher.data]);

  return <fetcher.Form method="post">...</fetcher.Form>;
}
```

### Pattern 2: Server Action with Toast

**Before:**

```tsx
function Form() {
  const [state, action] = useActionState(serverAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
    }
  }, [state]); // ❌ toast function reference changes

  return <form action={action}>...</form>;
}
```

**After:**

```tsx
function Form() {
  const [state, action] = useActionState(serverAction, null);

  const showToast = useEffectEvent(() => {
    if (state?.success) {
      toast.success(state.message);
    }
  });

  useEffect(() => {
    showToast();
  }, [state]);

  return <form action={action}>...</form>;
}
```

### Pattern 3: Multi-Step Form State

**Before:**

```tsx
function Wizard({ initialStep }: Props) {
  const [step, setStep] = useState(initialStep);

  // ❌ Setting state in effect
  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  return <div>Step {step}</div>;
}
```

**After:**

```tsx
function Wizard({ initialStep }: Props) {
  const [step, setStep] = useState(initialStep);

  // ✅ Update during render if needed
  if (initialStep !== step && initialStep !== undefined) {
    setStep(initialStep);
  }

  return <div>Step {step}</div>;
}

// Or better: Use key prop to reset
function WizardContainer({ initialStep }: Props) {
  return <Wizard key={initialStep} initialStep={initialStep} />;
}
```

## Common Migration Scenarios

### Scenario 1: Syncing Prop to State

```tsx
// ❌ Don't do this
function Component({ externalValue }: Props) {
  const [value, setValue] = useState(externalValue);

  useEffect(() => {
    setValue(externalValue);
  }, [externalValue]);
}

// ✅ Do this instead
function Component({ externalValue }: Props) {
  // Option 1: Just use the prop
  return <div>{externalValue}</div>;

  // Option 2: Derive state
  const [internalValue, setInternalValue] = useState(externalValue);
  const displayValue = internalValue ?? externalValue;

  // Option 3: Key prop reset
  <ChildComponent key={externalValue} value={externalValue} />;
}
```

### Scenario 2: Conditional Effect Execution

```tsx
// ❌ Don't do this
function Component({ shouldFetch, id }: Props) {
  useEffect(() => {
    if (shouldFetch) {
      fetchData(id);
    }
  }, [shouldFetch, id]);
}

// ✅ Do this instead
function Component({ shouldFetch, id }: Props) {
  const fetch = useEffectEvent(() => {
    fetchData(id);
  });

  useEffect(() => {
    if (shouldFetch) {
      fetch();
    }
  }, [shouldFetch]);
}
```

### Scenario 3: Cleanup with Latest Props

```tsx
// ❌ Don't do this
function Component({ onUnmount }: Props) {
  useEffect(() => {
    return () => onUnmount();
  }, [onUnmount]); // Re-subscribes on every render
}

// ✅ Do this instead
function Component({ onUnmount }: Props) {
  const handleUnmount = useEffectEvent(() => {
    onUnmount();
  });

  useEffect(() => {
    return () => handleUnmount();
  }, []);
}
```

## TypeScript Migration

### Stricter Ref Types

**Before (React 18):**

```tsx
function Component() {
  const ref = useRef(); // Type: MutableRefObject<undefined>
  return <div ref={ref} />;
}
```

**After (React 19):**

```tsx
function Component() {
  // ✅ Must provide initial value or type
  const ref = useRef<HTMLDivElement>(null);
  return <div ref={ref} />;
}
```

### Action Types

**Before:**

```tsx
async function serverAction(formData: FormData) {
  // No specific return type
}
```

**After:**

```tsx
async function serverAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  // ✅ Explicit return type for type safety
  return { success: true };
}
```

## Checklist for Migration

- [ ] Replace `forwardRef` with standard ref props
- [ ] Remove `defaultProps`, use ES6 defaults
- [ ] Remove `PropTypes`, use TypeScript
- [ ] Replace `ReactDOM.render` with `createRoot`
- [ ] Find state updates in `useEffect`, move to render or use `useEffectEvent`
- [ ] Find ref reads/writes in render, replace with `useState`
- [ ] Update ESLint to v7+
- [ ] Add `useEffectEvent` for non-reactive effect dependencies
- [ ] Test thoroughly with StrictMode enabled

## Resources

- [React 19 Migration Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [ESLint Plugin React Hooks v7](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [React 19.2 Release Notes](https://react.dev/blog/2024/12/05/react-19-2)
