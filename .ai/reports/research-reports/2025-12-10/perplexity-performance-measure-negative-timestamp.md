# Perplexity Research: Performance.measure Negative Timestamp Error

**Date**: 2025-12-10
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched the error "Failed to execute 'measure' on 'Performance': cannot have a negative time stamp" with focus on:
- Next.js 16 Turbopack issues
- Payload CMS 3.x admin panel issues
- Recent GitHub issues and Stack Overflow discussions
- Known bugs and workarounds

## Error Overview

The error occurs when `performance.measure()` is called with timestamps where the end mark is earlier than the start mark, resulting in a negative duration. This is a browser DOMException that Turbopack in Next.js 16 surfaces more strictly than previous bundlers.

## Key Findings

### 1. Turbopack-Specific Behavior (Next.js 16)

**Context:**
- Next.js 16 uses Turbopack by default for both `next dev` and `next build`
- Turbopack enforces stricter validation of Performance API calls
- The error was likely happening before but silently failing in Webpack

**Diagnosis Steps:**
1. Test with Webpack to isolate if it's Turbopack-related:
   ```bash
   next dev --webpack
   next build --webpack
   ```
   If error disappears with Webpack, it's likely a Turbopack issue or dependency interaction

2. Check stack trace for:
   - First stack frame in your code or third-party library (not Next/Turbopack internals)
   - Libraries using Performance API: logging (Pino, transports), monitoring, custom performance wrappers

**Known Turbopack Issues:**
- Several open issues with packages like Pino worker, real-require, transport-stream
- Performance monitoring libraries may have timing conflicts

### 2. Root Causes

**Common Scenarios:**
- **Missing marks**: Calling `performance.measure()` before required marks are set
- **Reversed marks**: End mark timestamp is earlier than start mark
- **Different time origins**: Marks created in different timing contexts
- **Asynchronous timing issues**: Race conditions between mark creation and measurement

**Safe Pattern:**
```typescript
performance.mark('my-start');
// ... work ...
performance.mark('my-end');
performance.measure('my-measure', 'my-start', 'my-end');
```

### 3. Performance.measure() Exceptions (MDN Documentation)

According to MDN, `performance.measure()` can throw several exceptions:

**TypeError:**
- Both `endMark` and `measureOptions` are specified
- `measureOptions` has `duration` but not `start` or `end`
- `measureOptions` specifies all of `start`, `end`, and `duration`

**SyntaxError DOMException:**
- Named mark doesn't exist
- Mark name cannot be converted to PerformanceTiming interface

**RangeError:**
- Negative timestamp (the error you're experiencing)

### 4. Payload CMS 3.x Context

**Research Result:**
- No specific documented issues found for Payload CMS 3.x admin panel with this error
- Payload CMS documentation focuses on:
  - Custom component performance optimization
  - React best practices (memoization, lazy loading)
  - Admin panel build issues

**Potential Causes in Payload:**
- Custom components using Performance API incorrectly
- Lexical editor performance tracking
- Admin panel timing measurements during load

**Payload-Specific Recommendations:**
- Clear Payload cache: `pnpm --filter payload cache:clear`
- Check for stale Turbopack builds affecting timing
- Review custom components for Performance API usage

### 5. Workarounds and Solutions

#### Immediate Solutions:

**1. Fallback to Webpack (Temporary)**
```json
// package.json
{
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack"
  }
}
```

**2. Enable Turbopack Tracing (Debugging)**
```bash
NEXT_TURBOPACK_TRACING=1 next dev
```
Produces `.next/dev/trace-turbopack` for GitHub issue reporting

**3. Guard Performance.measure Calls**
```typescript
try {
  performance.mark('start');
  // ... work ...
  performance.mark('end');
  
  // Verify marks exist before measuring
  const startMark = performance.getEntriesByName('start', 'mark')[0];
  const endMark = performance.getEntriesByName('end', 'mark')[0];
  
  if (startMark && endMark && endMark.startTime >= startMark.startTime) {
    performance.measure('my-measure', 'start', 'end');
  }
} catch (error) {
  console.error('Performance measurement failed:', error);
}
```

**4. Clear Performance Marks Regularly**
```typescript
// Memory leak prevention and timing cleanup
performance.clearMarks();
performance.clearMeasures();
```

**5. Use performance.now() Instead (Simpler Alternative)**
```typescript
const start = performance.now();
// ... work ...
const end = performance.now();
const duration = end - start;
console.log(`Operation took ${duration}ms`);
```

#### Long-term Solutions:

**1. Audit Third-Party Dependencies**
- Use tools like `pkg-size` to identify heavy dependencies
- Check if dependencies use Performance API internally
- Update to latest versions (may have Turbopack fixes)

**2. Review Application Performance Tracking**
- Search codebase for `performance.mark()` and `performance.measure()` calls
- Ensure marks are always created before measurement
- Add error handling around all Performance API usage

**3. Context-Specific Timing**
```typescript
// Better pattern for async operations
async function trackOperation() {
  const startTime = performance.now();
  
  try {
    await doWork();
  } finally {
    const duration = performance.now() - startTime;
    // Send to analytics
  }
}
```

### 6. Memory Leak Warning

**Important Note from Research:**
Performance marks and measures are retained in memory until explicitly cleared. This can cause:
- Memory leaks in long-running applications
- Increased memory pressure
- Garbage collection issues
- Slower performance over time

**Best Practice:**
```typescript
performance.mark('start');
// ... work ...
performance.mark('end');
performance.measure('operation', 'start', 'end');

// Get the measurement result
const measure = performance.getEntriesByName('operation', 'measure')[0];
console.log(`Duration: ${measure.duration}ms`);

// Clean up immediately
performance.clearMarks('start');
performance.clearMarks('end');
performance.clearMeasures('operation');
```

### 7. Firefox Compatibility Note

Firefox has a key implementation difference:
- `performance.measure()` returns `undefined` (not a `PerformanceMeasure` object)
- Must explicitly retrieve from performance buffer

**Firefox-Compatible Code:**
```typescript
let measure = performance.measure('Measure1', 'Start', 'End');

if (!measure) {
  // Firefox case
  measure = performance.getEntriesByName('Measure1', 'measure')[0];
}

console.log(`Duration: ${measure.duration}ms`);
```

## Sources & Citations

1. **Next.js Turbopack Documentation**
   - https://nextjs.org/docs/app/api-reference/turbopack
   - Turbopack is now default bundler in Next.js 16
   - Supports `--webpack` fallback flag

2. **MDN Performance.measure() API Reference**
   - https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure
   - Comprehensive exception documentation
   - Parameter and return value specifications

3. **MDN User Timing API Guide**
   - https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/User_timing
   - Best practices for performance marks and measures
   - Browser compatibility information

4. **Performance Timing Markers Guide**
   - https://webperf.tips/tip/performance-timing-markers/
   - Practical examples of mark/measure usage
   - Visualization in Chrome DevTools

5. **Payload CMS Performance Documentation**
   - https://payloadcms.com/docs/performance/overview
   - Admin panel optimization strategies
   - Custom component performance tips

6. **Be Careful with Performance.measure (Memory Leak Analysis)**
   - https://blog.tentaclelabs.com/posts/2023/05/be-careful-with-performance-measure
   - Detailed analysis of memory leak issues
   - Heap snapshot debugging techniques

7. **W3C User Timing Level 2 Specification**
   - https://www.w3.org/TR/user-timing-2/
   - Official specification for Performance API
   - Mark and measure lifecycle documentation

## Key Takeaways

1. **Root Cause**: Negative timestamps occur when end mark is earlier than start mark
2. **Turbopack Factor**: Next.js 16 Turbopack enforces stricter Performance API validation
3. **Quick Test**: Try `--webpack` flag to isolate if it's Turbopack-specific
4. **Memory Management**: Always clear marks and measures to prevent memory leaks
5. **Error Handling**: Wrap Performance API calls in try-catch blocks
6. **Alternative**: Consider using `performance.now()` for simpler timing needs
7. **Debugging**: Enable `NEXT_TURBOPACK_TRACING=1` for detailed trace files

## Recommended Next Steps

1. **Immediate**: Test with Webpack fallback to confirm Turbopack involvement
2. **Search Codebase**: Grep for `performance.mark` and `performance.measure` usage
3. **Add Guards**: Verify marks exist and timestamps are valid before measuring
4. **Check Dependencies**: Audit third-party libraries for Performance API usage
5. **Monitor**: Add error tracking around Performance API calls
6. **Report**: If confirmed Turbopack bug, create GitHub issue with trace file

## Related Searches for Future Research

- Specific error stack trace analysis (once full trace is available)
- Payload CMS Lexical editor performance tracking
- Next.js 16 Turbopack known issues and workarounds
- Performance API timing in React Server Components
- Turbopack vs Webpack bundler compatibility matrix
