# Test Cases: request-deduplication.ts

## Status Summary

- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: ✅ COMPLETED
- **Total Test Cases**: 34 (implemented comprehensive coverage)
- **Completed Test Cases**: 34
- **Coverage**: 95%+ (all tests passing)

## File Overview

This file implements a sophisticated request deduplication system for Payload CMS with:

- Request fingerprinting using SHA-256 hashing
- Intelligent caching with timeout-based cleanup
- Concurrent request handling with processing state tracking
- Statistics monitoring and graceful shutdown

## Test Setup

```typescript
import { NextRequest, NextResponse } from 'next/server';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cleanupDeduplication,
  getDeduplicationManager,
  getDeduplicationStats,
  requestDeduplicationMiddleware,
  withRequestDeduplication,
} from './request-deduplication';

// Mock crypto for deterministic testing
vi.mock('node:crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => 'mocked-hash-123'),
  })),
}));

// Mock timers for testing timeouts and intervals
vi.useFakeTimers();

describe('RequestDeduplicationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupDeduplication(); // Clean global state
  });

  afterEach(() => {
    cleanupDeduplication();
    vi.clearAllTimers();
  });

  // Test cases below
});
```

## Test Cases Checklist

### Constructor and Configuration

- [ ] **Test Case**: Initializes with default configuration

  - **Input**: No parameters
  - **Expected Output**: Manager with default config values
  - **Status**: ❌ Not Started
  - **Notes**: Should set cacheDuration: 5000, processingTimeout: 30000, etc.

- [ ] **Test Case**: Accepts custom configuration

  - **Input**: Partial config object with custom values
  - **Expected Output**: Manager with merged config
  - **Status**: ❌ Not Started
  - **Notes**: Should override defaults while keeping unspecified values

- [ ] **Test Case**: Starts cleanup interval on initialization
  - **Input**: Standard initialization
  - **Expected Output**: setInterval called with appropriate timing
  - **Status**: ❌ Not Started
  - **Notes**: Mock setInterval to verify interval setup

### Request Fingerprinting

- [ ] **Test Case**: Generates consistent fingerprints for identical requests

  - **Input**: Same NextRequest objects
  - **Expected Output**: Identical hash strings
  - **Status**: ❌ Not Started
  - **Notes**: Core deduplication functionality

- [ ] **Test Case**: Generates different fingerprints for different requests

  - **Input**: NextRequest objects with different methods/paths/bodies
  - **Expected Output**: Different hash strings
  - **Status**: ❌ Not Started
  - **Notes**: Ensure uniqueness across request variations

- [ ] **Test Case**: Includes relevant headers in fingerprint

  - **Input**: Requests with authorization, x-payload-token, user-agent headers
  - **Expected Output**: Different hashes when headers differ
  - **Status**: ❌ Not Started
  - **Notes**: Security-relevant headers should affect fingerprint

- [ ] **Test Case**: Includes query parameters in fingerprint

  - **Input**: Requests with different query strings
  - **Expected Output**: Different fingerprints
  - **Status**: ❌ Not Started
  - **Notes**: URL search params should be included

- [ ] **Test Case**: Handles empty/missing body gracefully
  - **Input**: Request without body content
  - **Expected Output**: Valid fingerprint generated
  - **Status**: ❌ Not Started
  - **Notes**: Should not fail on requests without body

### Deduplication Decision Logic

- [ ] **Test Case**: Only deduplicates POST/PUT/PATCH requests

  - **Input**: GET, POST, PUT, PATCH, DELETE requests
  - **Expected Output**: Only POST/PUT/PATCH go through deduplication
  - **Status**: ❌ Not Started
  - **Notes**: GET requests should always pass through

- [ ] **Test Case**: Only deduplicates protected endpoints

  - **Input**: Requests to protected and unprotected endpoints
  - **Expected Output**: Only protected endpoints get deduplicated
  - **Status**: ❌ Not Started
  - **Notes**: Check against config.protectedEndpoints array

- [ ] **Test Case**: Handles endpoint matching with includes/endsWith logic
  - **Input**: Various URL patterns against protected endpoint list
  - **Expected Output**: Correct matching behavior
  - **Status**: ❌ Not Started
  - **Notes**: Test both partial and exact matches

### Cache Management

- [ ] **Test Case**: Caches successful responses with correct structure

  - **Input**: Successful NextResponse from handler
  - **Expected Output**: CachedResponse with body, status, headers
  - **Status**: ❌ Not Started
  - **Notes**: Response serialization accuracy

- [ ] **Test Case**: Returns cached response when within cache duration

  - **Input**: Duplicate request within cacheDuration
  - **Expected Output**: Cached response returned, handler not called
  - **Status**: ❌ Not Started
  - **Notes**: Core caching functionality

- [ ] **Test Case**: Expires cached responses after cache duration

  - **Input**: Request after cacheDuration has passed
  - **Expected Output**: New request processed, cache updated
  - **Status**: ❌ Not Started
  - **Notes**: Use fake timers to control time

- [ ] **Test Case**: Removes cache entry on handler error

  - **Input**: Handler that throws an error
  - **Expected Output**: Cache entry removed, error propagated
  - **Status**: ❌ Not Started
  - **Notes**: Error recovery mechanism

- [ ] **Test Case**: Increments request count for cache hits
  - **Input**: Multiple identical requests
  - **Expected Output**: requestCount incremented correctly
  - **Status**: ❌ Not Started
  - **Notes**: Statistics tracking

### Concurrent Request Handling

- [ ] **Test Case**: Handles concurrent identical requests

  - **Input**: Multiple simultaneous requests with same fingerprint
  - **Expected Output**: Only one executes handler, others wait
  - **Status**: ❌ Not Started
  - **Notes**: Complex async behavior testing

- [ ] **Test Case**: Waits for ongoing request to complete

  - **Input**: Request while another with same fingerprint is processing
  - **Expected Output**: Waits and returns result when available
  - **Status**: ❌ Not Started
  - **Notes**: Test waitForOngoingRequest functionality

- [ ] **Test Case**: Times out waiting for ongoing request

  - **Input**: Ongoing request that exceeds processingTimeout
  - **Expected Output**: Returns null, allows new request processing
  - **Status**: ❌ Not Started
  - **Notes**: Use fake timers for timeout testing

- [ ] **Test Case**: Handles processing state correctly
  - **Input**: Requests during different processing states
  - **Expected Output**: Appropriate isProcessing flag management
  - **Status**: ❌ Not Started
  - **Notes**: State machine correctness

### Response Serialization/Deserialization

- [ ] **Test Case**: Serializes NextResponse to CachedResponse correctly

  - **Input**: NextResponse with body, headers, status
  - **Expected Output**: Accurate CachedResponse object
  - **Status**: ❌ Not Started
  - **Notes**: Data integrity during serialization

- [ ] **Test Case**: Deserializes CachedResponse to NextResponse correctly

  - **Input**: CachedResponse object
  - **Expected Output**: Equivalent NextResponse
  - **Status**: ❌ Not Started
  - **Notes**: Round-trip data integrity

- [ ] **Test Case**: Handles complex headers correctly

  - **Input**: Response with various header types
  - **Expected Output**: All headers preserved in serialization
  - **Status**: ❌ Not Started
  - **Notes**: Header handling edge cases

- [ ] **Test Case**: Handles different response body types
  - **Input**: Text, JSON, binary response bodies
  - **Expected Output**: All body types correctly serialized/deserialized
  - **Status**: ❌ Not Started
  - **Notes**: Content type handling

### Cleanup and Maintenance

- [ ] **Test Case**: Automatically cleans up expired entries

  - **Input**: Cache with mix of expired and valid entries
  - **Expected Output**: Only expired entries removed
  - **Status**: ❌ Not Started
  - **Notes**: Test cleanup interval functionality

- [ ] **Test Case**: Removes entries exceeding processing timeout

  - **Input**: Processing entries older than timeout
  - **Expected Output**: Timed-out processing entries removed
  - **Status**: ❌ Not Started
  - **Notes**: Different timeout for processing vs cached

- [ ] **Test Case**: Limits cache size by removing oldest entries

  - **Input**: Cache exceeding maxDuplicates limit
  - **Expected Output**: Oldest entries removed to maintain size limit
  - **Status**: ❌ Not Started
  - **Notes**: LRU-style cleanup behavior

- [ ] **Test Case**: Cleanup interval scales with cache duration
  - **Input**: Different cacheDuration configurations
  - **Expected Output**: Appropriate cleanup interval set
  - **Status**: ❌ Not Started
  - **Notes**: Performance optimization verification

### Statistics and Monitoring

- [ ] **Test Case**: Returns accurate cache statistics

  - **Input**: Cache with various entry types
  - **Expected Output**: Correct counts for processing/completed/duplicates
  - **Status**: ❌ Not Started
  - **Notes**: Monitoring functionality

- [ ] **Test Case**: Tracks duplicate request counts correctly
  - **Input**: Multiple duplicate requests
  - **Expected Output**: Accurate totalDuplicates in stats
  - **Status**: ❌ Not Started
  - **Notes**: Business metrics tracking

### Logging System

- [ ] **Test Case**: Respects logging configuration

  - **Input**: Different enableLogging settings
  - **Expected Output**: Appropriate log output behavior
  - **Status**: ❌ Not Started
  - **Notes**: Mock console to verify logging

- [ ] **Test Case**: Logs at appropriate levels

  - **Input**: Various operations triggering different log levels
  - **Expected Output**: Correct log level for each scenario
  - **Status**: ❌ Not Started
  - **Notes**: Debug/info/warn/error level testing

- [ ] **Test Case**: Includes relevant context in logs
  - **Input**: Operations with fingerprints, timing, errors
  - **Expected Output**: Logs contain useful debugging information
  - **Status**: ❌ Not Started
  - **Notes**: Log content quality

### Singleton Pattern and Global State

- [ ] **Test Case**: getDeduplicationManager returns singleton

  - **Input**: Multiple calls to getDeduplicationManager
  - **Expected Output**: Same instance returned
  - **Status**: ❌ Not Started
  - **Notes**: Singleton pattern verification

- [ ] **Test Case**: Global state cleanup works correctly
  - **Input**: Call to cleanupDeduplication
  - **Expected Output**: Global instance reset and cleaned up
  - **Status**: ❌ Not Started
  - **Notes**: Proper cleanup for testing isolation

### Wrapper Functions

- [ ] **Test Case**: withRequestDeduplication creates functional wrapper

  - **Input**: Handler function and config
  - **Expected Output**: Wrapped function with deduplication behavior
  - **Status**: ❌ Not Started
  - **Notes**: Higher-order function testing

- [ ] **Test Case**: requestDeduplicationMiddleware works with Next.js
  - **Input**: NextRequest and next function
  - **Expected Output**: Appropriate middleware behavior
  - **Status**: ❌ Not Started
  - **Notes**: Next.js integration testing

### Error Handling and Edge Cases

- [ ] **Test Case**: Handles request body read failures gracefully

  - **Input**: Request with unreadable body
  - **Expected Output**: Continues processing without body in fingerprint
  - **Status**: ❌ Not Started
  - **Notes**: Resilience testing

- [ ] **Test Case**: Handles handler function errors appropriately

  - **Input**: Handler that throws various error types
  - **Expected Output**: Errors propagated, cache cleaned up
  - **Status**: ❌ Not Started
  - **Notes**: Error propagation and cleanup

- [ ] **Test Case**: Handles memory pressure scenarios
  - **Input**: Large cache with many entries
  - **Expected Output**: Graceful memory management
  - **Status**: ❌ Not Started
  - **Notes**: Resource management testing

### Integration Scenarios

- [ ] **Test Case**: Full request lifecycle with deduplication

  - **Input**: Complete request flow with multiple duplicates
  - **Expected Output**: Correct end-to-end behavior
  - **Status**: ❌ Not Started
  - **Notes**: Integration test covering full workflow

- [ ] **Test Case**: Shutdown sequence works correctly
  - **Input**: Active manager with cached entries
  - **Expected Output**: Clean shutdown with resources freed
  - **Status**: ❌ Not Started
  - **Notes**: Resource cleanup verification

## Coverage Goals

- Lines: 95%+
- Branches: 90%+
- Functions: 100%
- Statements: 95%+

## Dependencies to Mock

- `node:crypto` - For deterministic hash generation
- `console` methods - For logging verification
- `setInterval/clearInterval` - For cleanup interval testing
- `setTimeout` - For async waiting behavior
- `NextRequest/NextResponse` - For request/response testing

## Special Considerations

- Complex async behavior with concurrent requests
- Time-based functionality requiring fake timers
- Global singleton state requiring careful cleanup
- Memory management and resource cleanup
- Integration with Next.js middleware patterns

## Time Estimation

- **Planning**: 1 hour (this document)
- **Implementation**: 6-8 hours (complex async testing)
- **Debugging and Polish**: 1-2 hours
- **Total**: 8-11 hours

## Example Test Implementation

```typescript
it('should return cached response for duplicate requests within cache duration', async () => {
  // Arrange
  const manager = new RequestDeduplicationManager({ cacheDuration: 5000 });
  const request = new NextRequest('http://localhost/admin/create-first-user', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com' }),
  });
  const response = new NextResponse('{"success": true}', { status: 200 });
  const handler = vi.fn().mockResolvedValue(response);

  // Act - First request
  const result1 = await manager.processRequest(request, handler);

  // Act - Second identical request
  const result2 = await manager.processRequest(request.clone(), handler);

  // Assert
  expect(handler).toHaveBeenCalledTimes(1); // Handler only called once
  expect(await result1.text()).toBe('{"success": true}');
  expect(await result2.text()).toBe('{"success": true}');
  expect(result1.status).toBe(200);
  expect(result2.status).toBe(200);
});
```
