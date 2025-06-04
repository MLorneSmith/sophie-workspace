# Component Patterns

## Component Structure

```tsx
/**
 * ComponentName - Brief description of the component
 * Used in: PageA, PageB, etc.
 */
export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // 1. Hooks
  const [state, setState] = useState(initialState);
  
  // 2. Derived state
  const derivedValue = useMemo(() => computeValue(prop1), [prop1]);
  
  // 3. Event handlers
  const handleEvent = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // 4. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 5. Render
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
}

// Props interface
interface ComponentNameProps {
  prop1: string;
  prop2?: number;
}
```

## Component Types

### 1. UI Components

- Pure presentational components
- No data fetching or business logic
- Highly reusable across the application
- Located in `packages/ui` or `apps/web/components/ui`

### 2. Feature Components

- Implement specific feature functionality
- May contain business logic
- Specific to a particular feature
- Located in `packages/features` or `apps/web/app/[feature]/components`

### 3. Page Components

- Top-level components for routes
- Compose UI and feature components
- Handle data fetching (Server Components)
- Located in `apps/web/app/[route]/page.tsx`

### 4. Layout Components

- Define the structure of pages
- Handle navigation and common UI elements
- Located in `apps/web/app/[route]/layout.tsx`

## Best Practices

1. **Composition over Inheritance**: Build complex UIs by composing simple components
2. **Prop Drilling Alternatives**: Use context or composition patterns for deep prop passing
3. **Loading States**: Always handle loading states with skeletons or spinners
4. **Error States**: Always handle error states with appropriate messaging
5. **Empty States**: Always handle empty data states with appropriate messaging
6. **Responsive Design**: Design components to work across all device sizes
7. **Accessibility**: Ensure all components meet WCAG 2.1 AA standards