# Context7 New Relic Node.js Agent Documentation Retrieval

**Date:** 2025-11-14  
**Task:** Test Context7 CLI integration for New Relic Node.js agent documentation  
**Library:** `newrelic/node-newrelic` (991 stars)

## Execution Summary

### Status: ✅ SUCCESS

All Context7 CLI commands executed successfully with comprehensive documentation retrieved.

### Commands Executed

1. **Library Search**
   ```bash
   uv run python -m tools.context7.cli_search_libraries "newrelic node.js agent"
   ```
   - Found 30 libraries
   - Target identified: `newrelic/node-newrelic`

2. **Documentation Fetches** (4 parallel requests)
   - Installation & Configuration: 3000 tokens → 1702 tokens retrieved
   - Monitoring Metrics & Transactions: 3000 tokens → 1656 tokens retrieved
   - Error Handling & Alerts: 2500 tokens → 1579 tokens retrieved
   - Next.js Integration: 2500 tokens → 1321 tokens retrieved

**Total Documentation Retrieved:** 6,258 tokens across 4 focused queries

## Libraries Found

Context7 search returned 30 libraries, with the primary target being:

| Library | Stars | State |
|---------|-------|-------|
| newrelic/node-newrelic | 991 | finalized |
| newrelic/go-agent | 797 | finalized |
| newrelic/newrelic-ruby-agent | 1201 | finalized |
| newrelic/newrelic-dotnet-agent | 110 | finalized |

## Key Documentation Retrieved

### 1. Installation & Configuration

**Most Relevant for Next.js 16:**

#### Basic Setup
```bash
# Copy configuration file
cp ./node_modules/newrelic/newrelic.js ./

# Configure in newrelic.js
exports.config = {
  app_name: ['Your application or service name'],
  license_key: 'your new relic license key',
}
```

#### Environment Variable Configuration
- No longer requires `NEW_RELIC_NO_CONFIG_FILE` to run without config file
- Environment variables now override configuration file settings automatically
- Key variables:
  - `NEW_RELIC_APDEX` - APM apdex value (float)
  - `NEW_RELIC_CONFIG_FILENAME` - Custom config file name
  - `NEW_RELIC_IGNORE_SERVER_CONFIGURATION` - Disable server-side config

#### Datastore Configuration
```bash
# Enable datastore instance reporting
export NEW_RELIC_DATASTORE_INSTANCE_REPORTING_ENABLED=true
export NEW_RELIC_DATASTORE_DATABASE_NAME_REPORTING_ENABLED=true
```

**Relevance:** Configuration flexibility is critical for Next.js 16 serverless environments where environment variables are preferred.

### 2. Monitoring Metrics & Transactions

**Most Relevant for Next.js 16:**

#### Custom Metrics API
```javascript
const newrelic = require('newrelic');

// Record custom metric
newrelic.recordMetric('Custom/MyMetricName', 123.45);

// Increment counter
newrelic.incrementMetric('Custom/MyCounter', 5);
```

#### Transaction Management
```javascript
// Get current transaction reference
const transaction = newrelic.getTransaction();

// Ignore specific transactions
newrelic.setIgnoreTransaction(true);

// Create web transaction
newrelic.createWebTransaction('Custom/Web/MyOperation', function() {
  // ... your web request handling logic ...
  newrelic.endTransaction();
});

// Create background transaction
newrelic.createBackgroundTransaction('Custom/Background/MyTask', function() {
  // ... your background task logic ...
  newrelic.endTransaction();
});
```

#### Browser Timing Header
```javascript
// For Real User Monitoring (RUM)
app.get('/', function(req, res) {
  res.send('<html><head>' + 
    newrelic.getBrowserTimingHeader() + 
    '</head><body>Hello World!</body></html>');
});
```

**Relevance:** Next.js 16 Server Actions and API routes can leverage custom transaction tracking for granular performance monitoring.

### 3. Error Handling & Alerts

**Most Relevant for Next.js 16:**

#### Error Recording API
```javascript
// Basic error recording
newrelic.noticeError(error);

// With custom attributes
newrelic.noticeError(error, { custom: 'attributes' });

// Mark error as expected (doesn't impact Apdex)
newrelic.noticeError(error, { custom: 'attributes' }, true);
newrelic.noticeError(error, true);
```

#### Error Group Customization
```javascript
// Customize error grouping (v9.14.0+)
newrelic.setErrorGroupCallback((error, transaction) => {
  return 'custom-group-name';
});
```

#### Robust Error Handling Features
- Handles immutable/frozen error objects without crashing
- Properly handles `null` thrown as errors
- Improved uncaught exception handling for all Node versions
- Serverless mode: ends/serializes transactions on uncaught exceptions

**Relevance:** Next.js 16 error boundaries and global error handlers can integrate with New Relic for comprehensive error tracking.

### 4. Next.js Integration

**Most Relevant for Next.js 16:**

#### Recommended Setup with NODE_OPTIONS
```bash
# Start Next.js with New Relic preloaded
NODE_OPTIONS='-r newrelic' next start
```

#### Webpack Configuration for Third-Party Libraries
```javascript
// next.config.js
const nrExternals = require('newrelic/load-externals')

module.exports = {
  webpack: (config) => {
    nrExternals(config)
    return config
  }
}
```

**Critical:** This externalizes supported libraries from webpack bundling, ensuring New Relic can properly instrument them.

#### OpenTelemetry Alternative
For cloud environments where direct agent won't work, use OpenTelemetry SDK with New Relic OTLP endpoint.

## Additional Features Discovered

### AI Monitoring Support
Supports OpenAI, Amazon Bedrock, and Langchain instrumentation.

### Prisma Instrumentation
- Auto-instruments Prisma client v4.0.0+
- Captures query spans, database metrics, SQL traces

### Framework Support
- Express with full param() instrumentation
- Fastify with OpenTelemetry metrics
- gRPC client and server instrumentation

## Recommendations for SlideHeroes (Next.js 16)

### 1. Installation Approach
Choose based on deployment target:
- **Vercel/Cloud:** Use OpenTelemetry instrumentation hook
- **Self-hosted/Docker:** Use `NODE_OPTIONS='-r newrelic'` approach

### 2. Custom Transaction Tracking
For Server Actions and API routes:
```typescript
'use server'

import newrelic from 'newrelic'

export async function createPresentation(data: FormData) {
  const transaction = newrelic.getTransaction()
  
  try {
    // ... business logic
    newrelic.recordMetric('Custom/Presentation/Created', 1)
  } catch (error) {
    newrelic.noticeError(error, { 
      userId: session.user.id,
      action: 'createPresentation'
    })
    throw error
  }
}
```

## Errors Encountered

**None.** All Context7 CLI commands executed successfully.

## Performance Notes

- **Search speed:** < 1 second for library search
- **Fetch speed:** ~2-3 seconds per documentation request
- **Token efficiency:** Average 1,565 tokens per request (62% of requested limit)
- **Parallel execution:** All 4 documentation fetches ran simultaneously

## Context7 CLI Observations

### Strengths
1. Fast library search with accurate results
2. Topic-based filtering works well for focused queries
3. Token limits are respected with efficient content extraction
4. Caching system (24hr TTL) improves performance
5. Clean, structured output with source attribution

### Optimal Usage Pattern
- Use specific topics (2000-3000 tokens) for targeted research
- Search first if owner/repo uncertain
- Run parallel fetches for multiple topics
- Start with lower token limits, increase if needed

## Next Steps

1. Test integration in development environment
2. Compare direct agent vs OpenTelemetry approach
3. Design custom dashboards for presentation metrics
4. Configure alerts for error rates and performance
5. Enable AI monitoring for AI-powered features

## Files Generated

- `/reports/research/newrelic-cli/context7-agent-test.md` (this file)

## References

- New Relic Node.js Agent: https://github.com/newrelic/node-newrelic
- Context7 Integration Guide: `.ai/ai_docs/context-docs/tools/context7-integration.md`
- Documentation source: Multiple files from `newrelic/node-newrelic` repository

---

**Conclusion:** Context7 CLI successfully retrieved comprehensive, relevant documentation for integrating New Relic with Next.js 16. The tool performed efficiently with no errors, demonstrating value for library research tasks.
