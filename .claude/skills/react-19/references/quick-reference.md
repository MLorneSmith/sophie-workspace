# React 19.2 Quick Reference

## When to Use What

### Visibility Management

| Scenario | Use | Why |
|----------|-----|-----|
| Need to preserve state when hidden | `<Activity mode="hidden">` | Keeps component mounted |
| Content rarely accessed | `{condition && <Component />}` | Saves memory |
| Frequently toggled UI (tabs, modals) | `<Activity mode="hidden">` | Instant transitions |
| Pre-rendering for fast navigation | `<Activity mode="hidden">` | Pre-loads content |

### Effect Dependencies

| Scenario | Use | Why |
|----------|-----|-----|
| Callback changes on every render | `useEffectEvent()` | Stable reference with latest value |
| Value IS the trigger | Add to dependencies | Effect should re-run when it changes |
| Analytics/logging in effect | `useEffectEvent()` | Always logs latest state |
| Event listeners with changing handlers | `useEffectEvent()` | Don't re-subscribe unnecessarily |

### State Management

| Scenario | Use | Why |
|----------|-----|-----|
| Value affects UI | `useState()` | Triggers re-renders |
| Persist across renders (no UI update) | `useRef()` | No re-render overhead |
| Derive from props/state | Calculate during render | No state needed |
| Sync prop to state | Render-time update or key prop | No effect needed |

### Rendering Strategy

| Scenario | Use | Why |
|----------|-----|-----|
| Same for all users | Static rendering | Fast, cacheable |
| User-specific data | Server Components | Fresh data, no client JS |
| Mix of static + dynamic | Partial Pre-rendering | Best of both |
| Real-time updates | Client Component + streaming | Interactive |

## Common Patterns

### Pattern: Tabs with State Preservation

```tsx
<Activity mode={tab === 'home' ? 'visible' : 'hidden'}>
  <HomeTab />
</Activity>
<Activity mode={tab === 'settings' ? 'visible' : 'hidden'}>
  <SettingsTab />
</Activity>
```

### Pattern: Server Action with Callbacks

```tsx
const [state, action] = useActionState(serverAction, null);

const handleSuccess = useEffectEvent(() => {
  toast.success('Success!');
  onSuccess?.();
});

useEffect(() => {
  if (state?.success) handleSuccess();
}, [state]);
```

### Pattern: Event Listener with Latest State

```tsx
const handleEvent = useEffectEvent(() => {
  // Always sees latest props/state
  doSomething(latestValue);
});

useEffect(() => {
  element.addEventListener('event', handleEvent);
  return () => element.removeEventListener('event', handleEvent);
}, []); // No dependencies needed
```

### Pattern: Partial Pre-rendering

```tsx
export const experimental_ppr = true;

function Page() {
  return (
    <>
      {/* Static shell */}
      <Header />
      <Nav />

      {/* Dynamic holes */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />
      </Suspense>
    </>
  );
}
```

## Anti-Patterns to Avoid

### ❌ Setting State in useEffect

```tsx
// DON'T
useEffect(() => {
  setState(propValue);
}, [propValue]);

// DO
if (propValue !== state) {
  setState(propValue);
}
```

### ❌ Reading Refs in Render

```tsx
// DON'T
return <div>{ref.current}</div>;

// DO
const [value, setValue] = useState(0);
return <div>{value}</div>;
```

### ❌ Using Activity for Rarely Accessed Content

```tsx
// DON'T - Wastes memory
<Activity mode={showRare ? 'visible' : 'hidden'}>
  <RarelyUsedComponent />
</Activity>

// DO - Only mount when needed
{showRare && <RarelyUsedComponent />}
```

### ❌ Unnecessary useEffectEvent

```tsx
// DON'T - userId IS a dependency
const load = useEffectEvent(() => fetch(userId));
useEffect(() => load(), []);

// DO - Include real dependencies
useEffect(() => {
  fetch(userId);
}, [userId]);
```

## Migration Cheatsheet

| Deprecated | Replacement |
|------------|-------------|
| `forwardRef(Component)` | `function Component({ ref })` |
| `Component.defaultProps = {}` | `function Component({ prop = default })` |
| `PropTypes` | TypeScript interfaces |
| `ReactDOM.render()` | `createRoot().render()` |
| State in `useEffect` | Render-time update or `useEffectEvent` |
| Read ref in render | `useState` instead |

## Decision Trees

### Should I use `<Activity>`?

```
Does the component need to preserve state when hidden?
├─ Yes → Does it toggle frequently?
│  ├─ Yes → Use <Activity>
│  └─ No → Use key prop reset instead
└─ No → Use conditional rendering (&&)
```

### Should I use `useEffectEvent`?

```
Is the value used in an effect?
├─ Yes → Does the effect need to re-run when it changes?
│  ├─ Yes → Add to dependencies (normal pattern)
│  └─ No → Use useEffectEvent
└─ No → Don't use useEffectEvent (regular event handlers)
```

### Should I use PPR?

```
Does the page have both static and dynamic content?
├─ Yes → Can dynamic parts be wrapped in Suspense?
│  ├─ Yes → Enable PPR
│  └─ No → Refactor to add Suspense boundaries
└─ No → Use full static or full dynamic rendering
```

## Performance Quick Wins

1. **Replace tabs with `<Activity>`** - Instant navigation
2. **Add `useEffectEvent` to effects with callbacks** - Fewer re-renders
3. **Enable PPR on mixed pages** - 20x faster perceived load
4. **Wrap dynamic sections in Suspense** - Stream instead of block
5. **Derive state instead of syncing** - Eliminate effects

## TypeScript Quick Wins

```tsx
// Ref typing
const ref = useRef<HTMLDivElement>(null);

// Ref as prop
function Component({ ref }: { ref?: React.Ref<HTMLElement> })

// Action typing
async function action(data: FormData): Promise<ActionResult>

// Activity typing
<Activity mode={condition ? 'visible' : 'hidden'}>
```

## Common Gotchas

1. **`<Activity>` always renders children** - Use conditional rendering for truly optional content
2. **`useEffectEvent` only for effects** - Don't use for regular event handlers
3. **PPR needs Suspense** - Won't work without boundaries
4. **Ref changes don't re-render** - Use state for UI values
5. **ESLint v7 is strict** - Update rules or fix code

## Testing Considerations

### Testing Activity Components

```tsx
test('preserves state when hidden', () => {
  const { rerender } = render(<Activity mode="visible"><Counter /></Activity>);

  // Increment counter
  fireEvent.click(screen.getByText('Increment'));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();

  // Hide component
  rerender(<Activity mode="hidden"><Counter /></Activity>);

  // Show again - state preserved
  rerender(<Activity mode="visible"><Counter /></Activity>);
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### Testing useEffectEvent

```tsx
test('effect uses latest callback', () => {
  const callback = jest.fn();
  const { rerender } = render(<Component onEvent={callback} />);

  // Trigger effect
  fireEvent.click(screen.getByText('Trigger'));
  expect(callback).toHaveBeenCalledTimes(1);

  // Update callback (effect shouldn't re-run)
  const newCallback = jest.fn();
  rerender(<Component onEvent={newCallback} />);

  // Next trigger uses new callback
  fireEvent.click(screen.getByText('Trigger'));
  expect(newCallback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledTimes(1); // Still 1
});
```

## Resources by Topic

- **`<Activity>`**: See `activity-component.md`
- **`useEffectEvent`**: See `useEffectEvent.md`
- **PPR**: See `partial-prerendering.md`
- **Migrations**: See `deprecated-patterns.md`
- **Official docs**: https://react.dev/blog/2024/12/05/react-19-2
