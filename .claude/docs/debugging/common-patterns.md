# Common Bug Debugging Patterns

This guide provides systematic approaches for AI coding assistants to debug common bug patterns effectively.

## Core Debugging Principles

### 1. Systematic Investigation
- **Start with reproduction**: Always reproduce the issue first
- **Gather evidence**: Collect logs, error messages, and stack traces
- **Form hypotheses**: Based on evidence, not assumptions
- **Test incrementally**: Make small changes and verify each step

### 2. Information Gathering Strategy
```typescript
// Essential information to collect
const debugInfo = {
  errorMessage: string,
  stackTrace: string[],
  reproductionSteps: string[],
  environment: {
    browser: string,
    nodeVersion: string,
    dependencies: Record<string, string>
  },
  recentChanges: string[],
  affectedFiles: string[]
};
```

## Common Bug Patterns

### Pattern 1: Null/Undefined Reference Errors

**Symptoms:**
- `Cannot read property 'x' of undefined`
- `Cannot read properties of null`
- `TypeError: x is not a function`

**Investigation Steps:**
1. **Trace the data flow**: Follow where the undefined value originates
2. **Check initialization**: Verify objects are properly initialized
3. **Examine async timing**: Look for race conditions in async operations
4. **Validate API responses**: Ensure external data matches expected shape

**Common Fixes:**
```typescript
// Add null checks
if (user?.profile?.name) {
  // Safe to access
}

// Use optional chaining
const name = user?.profile?.name ?? 'Unknown';

// Add default values
const { data = [] } = response;

// Validate before use
if (!data || !Array.isArray(data)) {
  throw new Error('Invalid data format');
}
```

### Pattern 2: State Management Issues

**Symptoms:**
- UI not updating when data changes
- Stale closures in React hooks
- Inconsistent state across components

**Investigation Steps:**
1. **Check state updates**: Verify state is being updated correctly
2. **Examine dependencies**: Look for missing dependencies in useEffect
3. **Trace re-renders**: Use React DevTools to track component updates
4. **Validate state flow**: Follow state changes through the application

**Common Fixes:**
```typescript
// Fix stale closures
useEffect(() => {
  const handler = () => {
    // Use current state
    setCount(prevCount => prevCount + 1);
  };
  // Add proper dependencies
}, [dependency]);

// Immutable updates
setState(prevState => ({
  ...prevState,
  updatedField: newValue
}));
```

### Pattern 3: Async/Promise Issues

**Symptoms:**
- Unhandled promise rejections
- Race conditions
- Memory leaks from uncanceled operations

**Investigation Steps:**
1. **Check error handling**: Verify all promises have catch blocks
2. **Examine timing**: Look for race conditions between async operations
3. **Validate cleanup**: Ensure async operations are properly canceled
4. **Test edge cases**: Consider network failures and timeouts

**Common Fixes:**
```typescript
// Proper error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  logger.error('API call failed', { error, context });
  throw new Error('Failed to fetch data');
}

// Cleanup async operations
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal);
  
  return () => controller.abort();
}, []);
```

### Pattern 4: Type-Related Bugs

**Symptoms:**
- Runtime type errors
- Unexpected data transformations
- API response mismatches

**Investigation Steps:**
1. **Validate types**: Check TypeScript errors and warnings
2. **Examine data flow**: Trace data transformations
3. **Test boundaries**: Verify API contracts and interfaces
4. **Check serialization**: Look for JSON parsing issues

**Common Fixes:**
```typescript
// Add runtime validation
function validateUser(data: unknown): User {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid user data');
  }
  
  const user = data as Record<string, unknown>;
  if (typeof user.id !== 'string' || typeof user.name !== 'string') {
    throw new Error('User missing required fields');
  }
  
  return user as User;
}

// Use type guards
function isUser(data: unknown): data is User {
  return data !== null && 
         typeof data === 'object' && 
         'id' in data && 
         'name' in data;
}
```

## Debugging Workflow

### Phase 1: Reproduction
1. **Set up environment**: Match the reported environment exactly
2. **Follow steps**: Execute reproduction steps precisely
3. **Document observations**: Record what happens vs. what's expected
4. **Isolate variables**: Remove unnecessary complexity

### Phase 2: Investigation
1. **Add logging**: Insert strategic console.log statements
2. **Use debugger**: Set breakpoints at key locations
3. **Check network**: Monitor API calls and responses
4. **Examine state**: Inspect component and application state

### Phase 3: Hypothesis Testing
1. **Form hypothesis**: Based on gathered evidence
2. **Create minimal test**: Isolate the suspected issue
3. **Test fix**: Implement and verify the solution
4. **Validate broadly**: Ensure fix doesn't break other functionality

### Phase 4: Prevention
1. **Add tests**: Create regression tests
2. **Improve error handling**: Add defensive programming
3. **Update documentation**: Document the issue and solution
4. **Review patterns**: Look for similar issues elsewhere

## Tools and Techniques

### Browser DevTools
```javascript
// Console debugging
console.group('Debug: User Login');
console.log('Input:', { email, password: '***' });
console.log('Response:', response);
console.groupEnd();

// Performance debugging
console.time('API Call');
await apiCall();
console.timeEnd('API Call');
```

### React DevTools
- **Components tab**: Inspect props and state
- **Profiler tab**: Identify performance issues
- **Hooks inspection**: Debug custom hooks

### Network Debugging
- **Network tab**: Monitor API calls
- **Response inspection**: Verify data format
- **Timing analysis**: Identify slow requests

## Best Practices for AI Assistants

### 1. Systematic Approach
- Always follow the same debugging workflow
- Document findings at each step
- Don't skip reproduction even if the fix seems obvious

### 2. Evidence-Based Decisions
- Collect concrete evidence before making changes
- Test hypotheses with minimal examples
- Verify fixes solve the actual problem

### 3. Comprehensive Testing
- Test the fix in isolation
- Verify no regressions are introduced
- Add automated tests to prevent recurrence

### 4. Clear Communication
- Document the root cause clearly
- Explain the fix and why it works
- Provide guidance for preventing similar issues

## Common Pitfalls to Avoid

1. **Assuming the cause**: Don't jump to conclusions without evidence
2. **Over-engineering**: Keep fixes simple and targeted
3. **Ignoring edge cases**: Consider error conditions and boundary cases
4. **Skipping tests**: Always add regression tests
5. **Poor logging**: Add meaningful debug information for future issues
